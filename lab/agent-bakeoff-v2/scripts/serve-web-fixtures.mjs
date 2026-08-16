#!/usr/bin/env node
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { DEFAULT_WEB_PORT, LOCALHOST_HOST, arenaRoot, evaluatorDir } from "./lib.mjs";

const WEB_ROOT = path.join(arenaRoot(), "fixtures", "web");
const PORT = Number(process.env.T5_PORT || DEFAULT_WEB_PORT);

function contentType(filePath) {
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  return "application/octet-stream";
}

function safeJoin(urlPath) {
  const rel = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  if (rel.toLowerCase().includes("t5-pages-registry")) return null;
  const root = path.resolve(WEB_ROOT);
  const resolved = path.resolve(WEB_ROOT, rel === "" ? "index.html" : rel);
  const relToRoot = path.relative(root, resolved);
  if (relToRoot.startsWith("..") || path.isAbsolute(relToRoot)) return null;
  if (resolved.startsWith(path.resolve(evaluatorDir()))) return null;
  return resolved;
}

export function createServer() {
  return http.createServer((req, res) => {
    const filePath = safeJoin(req.url || "/");
    if (!filePath || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": contentType(filePath) });
    createReadStream(filePath).pipe(res);
  });
}

export function listen(server, port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, LOCALHOST_HOST, () => {
      const addr = `http://${LOCALHOST_HOST}:${port}/`;
      resolve(addr);
    });
  });
}

async function selfCheck() {
  const server = createServer();
  const addr = await listen(server);
  const pages = ["/", "/p1.html", "/p2.html", "/p3.html", "/p4.html", "/p5.html", "/p6.html", "/t4/token.json"];
  const results = [];
  for (const page of pages) {
    const body = await new Promise((resolve, reject) => {
      http
        .get(new URL(page, addr), (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") }));
        })
        .on("error", reject);
    });
    results.push({ page, status: body.status, bytes: body.body.length });
    if (body.status !== 200) throw new Error(`${page} -> ${body.status}`);
    if (page === "/" && (body.body.includes("correctPage") || body.body.includes("correctFact"))) {
      throw new Error("entrypoint served T5 pages registry fields");
    }
  }
  const forbidden = ["/t5-pages-registry.json", "/../evaluator/private/t5-pages-registry.json"];
  for (const page of forbidden) {
    const body = await new Promise((resolve, reject) => {
      http
        .get(new URL(page, addr), (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") }));
        })
        .on("error", reject);
    });
    if (body.status !== 404) throw new Error(`${page} should 404, got ${body.status}`);
    if (body.body.includes("teal-47") && page.includes("registry")) {
      throw new Error("registry leaked over HTTP");
    }
  }
  server.close();
  console.log(JSON.stringify({ addr, results }, null, 2));
  console.log("serve-web-fixtures: self-check PASS");
}

const invoked = process.argv[1] && path.basename(process.argv[1]).includes("serve-web-fixtures");
if (invoked) {
  if (process.argv.includes("--self-check")) {
    selfCheck().catch((error) => {
      console.error(`serve-web-fixtures: ${error.message}`);
      process.exit(1);
    });
  } else {
    const server = createServer();
    listen(server).then((addr) => {
      console.log(addr);
      console.log("entrypoint: /  discoverable pages: /p1.html /p2.html /p3.html /p4.html /p5.html /p6.html");
    });
  }
}
