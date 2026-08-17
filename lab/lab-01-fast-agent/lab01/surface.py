from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import urlopen
import time

from lab01.paths import (
    CURRENT_ROOT_FILE,
    FORBIDDEN_NAME_PARTS,
    POLICY_FILE,
)
from lab01.traces import append_trace


class Refused(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def _posix(rel: str) -> str:
    return rel.replace("\\", "/").lstrip("/")


def _load_policy() -> dict[str, Any]:
    if not POLICY_FILE.exists():
        return {"writableRelPaths": [], "localhost": None, "overlays": {}}
    return json.loads(POLICY_FILE.read_text(encoding="utf-8"))


def current_root() -> Path:
    if not CURRENT_ROOT_FILE.exists():
        raise Refused("no candidate surface is active")
    return Path(CURRENT_ROOT_FILE.read_text(encoding="utf-8").strip()).resolve()


def _inside(root: Path, candidate: Path) -> bool:
    try:
        candidate.relative_to(root)
        return True
    except ValueError:
        return False


class SurfaceTools:
    """Candidate tools. Jailed to the active surface. Traces are harness-owned."""

    def _policy(self) -> dict[str, Any]:
        return _load_policy()

    def _requested_rel(self, raw: str) -> str:
        rel = _posix(raw or ".")
        if rel in ("", "."):
            return ""
        if Path(raw).is_absolute() or rel.startswith("/") or ":" in Path(raw).anchor:
            raise Refused(f"absolute paths are refused: {raw}")
        parts = [p for p in rel.split("/") if p not in ("", ".")]
        if any(p == ".." for p in parts):
            raise Refused("path traversal is refused")
        if any(p in FORBIDDEN_NAME_PARTS for p in parts):
            raise Refused(f"forbidden path: {rel}")
        return "/".join(parts)

    def resolve(self, raw: str) -> tuple[Path, str]:
        rel = self._requested_rel(raw)
        policy = self._policy()
        overlays: dict[str, str] = policy.get("overlays") or {}
        for prefix, target in overlays.items():
            prefix_n = prefix.rstrip("/")
            if rel == prefix_n or rel.startswith(prefix_n + "/"):
                rest = rel[len(prefix_n) :].lstrip("/")
                mapped = (Path(target) / rest).resolve() if rest else Path(target).resolve()
                overlay_root = Path(target).resolve()
                if not _inside(overlay_root, mapped):
                    raise Refused(f"path escapes overlay: {rel}")
                return mapped, rel
        root = current_root()
        mapped = (root / rel).resolve() if rel else root
        if not _inside(root, mapped):
            raise Refused(f"path escapes candidate surface: {rel or '.'}")
        return mapped, rel or "."

    def list_dir(self, path: str = ".") -> str:
        target = path or "."
        try:
            mapped, rel = self.resolve(target)
            if not mapped.exists():
                append_trace("repo.inspect", "local.repo", rel, "failure")
                return json.dumps({"ok": False, "error": "missing"})
            if mapped.is_file():
                entries = [rel]
            else:
                entries = []
                for item in sorted(mapped.rglob("*")):
                    if not item.is_file():
                        continue
                    child = _posix(str(item.relative_to(mapped)))
                    if rel in ("", "."):
                        entries.append(child)
                    else:
                        entries.append(f"{rel}/{child}")
            append_trace("repo.inspect", "local.repo", rel, "success")
            return json.dumps({"ok": True, "entries": entries})
        except Refused as error:
            append_trace("repo.inspect", "local.repo", target, "refused")
            return json.dumps({"ok": False, "refused": True, "error": error.message})

    def read_file(self, path: str) -> str:
        try:
            mapped, rel = self.resolve(path)
            if not mapped.is_file():
                append_trace("evidence.read", "local.evidence", rel, "failure")
                return json.dumps({"ok": False, "error": "not a file"})
            body = mapped.read_text(encoding="utf-8")
            append_trace("evidence.read", "local.evidence", rel, "success")
            return json.dumps({"ok": True, "path": rel, "body": body})
        except Refused as error:
            append_trace("evidence.read", "local.evidence", path, "refused")
            return json.dumps({"ok": False, "refused": True, "error": error.message, "body": None})

    def write_file(self, path: str, contents: str) -> str:
        try:
            mapped, rel = self.resolve(path)
            allowed = set(self._policy().get("writableRelPaths") or [])
            if rel not in allowed:
                append_trace("fs.write", "local.repo", rel, "refused")
                return json.dumps({"ok": False, "refused": True, "error": "write not in writable grant"})
            mapped.parent.mkdir(parents=True, exist_ok=True)
            mapped.write_text(contents, encoding="utf-8")
            append_trace("fs.write", "local.repo", rel, "success")
            return json.dumps({"ok": True, "path": rel})
        except Refused as error:
            append_trace("fs.write", "local.repo", path, "refused")
            return json.dumps({"ok": False, "refused": True, "error": error.message})

    def localhost_get(self, url_path: str) -> str:
        policy = self._policy()
        loc = policy.get("localhost") or {}
        host = loc.get("host")
        port = loc.get("port")
        if host not in ("127.0.0.1", "localhost") or not port:
            append_trace("localhost.get", "localhost.http", url_path, "refused")
            return json.dumps({"ok": False, "refused": True, "error": "localhost is not granted"})
        path = url_path or "/"
        if not path.startswith("/"):
            path = "/" + path
        if "://" in path or ".." in path:
            append_trace("localhost.get", "localhost.http", url_path, "refused")
            return json.dumps({"ok": False, "refused": True, "error": "invalid localhost path"})
        target = f"http://127.0.0.1:{int(port)}{path}"
        last_error = None
        for _ in range(4):
            try:
                with urlopen(target, timeout=5) as response:  # noqa: S310 - loopback only
                    body = response.read().decode("utf-8")
                append_trace("localhost.get", "localhost.http", target, "success")
                return json.dumps({"ok": True, "body": body})
            except (URLError, OSError, TimeoutError) as error:
                last_error = error
                time.sleep(0.25)
        append_trace("localhost.get", "localhost.http", target, "failure")
        return json.dumps({"ok": False, "error": str(last_error)})
