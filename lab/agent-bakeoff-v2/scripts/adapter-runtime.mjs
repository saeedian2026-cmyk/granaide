#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { arenaRoot, isInsideRoot, nowIso } from "./lib.mjs";

const FORBIDDEN_CLASSES = new Set(["db.production", "deploy", "kilo", "internet.http"]);

function assertAllowed(absPath, allowedAbsRoots) {
  return allowedAbsRoots.some((root) => isInsideRoot(root, absPath));
}

export function createAdapter({ allowedRoots, localhostHost = "127.0.0.1", localhostPort = 8765 }) {
  const traces = [];
  const allowedAbsRoots = (allowedRoots || []).map((p) =>
    path.isAbsolute(p) ? p : path.join(arenaRoot(), p),
  );

  async function record(tool, cls, target, fn) {
    const startedAt = nowIso();
    let result = "success";
    let value;
    try {
      if (FORBIDDEN_CLASSES.has(cls)) {
        result = "refused";
        value = { refused: true };
      } else {
        value = await fn();
        if (value && value.refused) result = "refused";
      }
      return value;
    } catch (error) {
      result = "failure";
      throw error;
    } finally {
      traces.push({
        tool,
        class: cls,
        startedAt,
        completedAt: nowIso(),
        target,
        result,
      });
    }
  }

  return {
    getTraces() {
      return traces.slice();
    },
    async inspectRepo(relPath = ".") {
      const abs = path.resolve(arenaRoot(), relPath);
      return record("repo.inspect", "local.repo", relPath, async () => {
        if (!assertAllowed(abs, allowedAbsRoots)) {
          return { refused: true, entries: [] };
        }
        const entries = [];
        function walk(dir) {
          for (const name of readdirSync(dir)) {
            const full = path.join(dir, name);
            const st = statSync(full);
            entries.push(path.relative(abs, full).split(path.sep).join("/"));
            if (st.isDirectory()) walk(full);
          }
        }
        walk(abs);
        return { entries };
      });
    },
    async readEvidence(relPath) {
      const abs = path.resolve(arenaRoot(), relPath);
      return record("evidence.read", "local.evidence", relPath, async () => {
        if (!assertAllowed(abs, allowedAbsRoots)) {
          return { refused: true, body: null };
        }
        return { body: readFileSync(abs, "utf8") };
      });
    },
    async localhostGet(urlPath) {
      const target = `http://${localhostHost}:${localhostPort}${urlPath}`;
      return record("localhost.get", "localhost.http", target, async () => {
        if (localhostHost !== "127.0.0.1" && localhostHost !== "localhost") {
          return { refused: true };
        }
        const body = await new Promise((resolve, reject) => {
          http
            .get(target, (res) => {
              const chunks = [];
              res.on("data", (c) => chunks.push(c));
              res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
            })
            .on("error", reject);
        });
        return { body };
      });
    },
    async forbidden(tool, cls, target) {
      return record(tool, cls, target, async () => ({ refused: true }));
    },
  };
}
