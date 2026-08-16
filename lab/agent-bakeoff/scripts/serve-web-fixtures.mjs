#!/usr/bin/env node
import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { arenaRoot, loadJson } from "./lib.mjs";

const HOST = "127.0.0.1";
const PORT = Number(process.env.T5_PORT || 8765);
const webRoot = path.join(arenaRoot(), "fixtures", "web");
const pages = loadJson(path.join(webRoot, "pages.json"));

function safeJoin(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const rel = decoded.replace(/^\/+/, "");
  const full = path.resolve(webRoot, rel);
  if (!full.startsWith(path.resolve(webRoot))) return null;
  return full;
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET") {
    res.writeHead(405);
    res.end("method not allowed");
    return;
  }
  const urlPath = req.url === "/" ? "/pages.json" : req.url;
  const filePath = safeJoin(urlPath);
  if (!filePath || !existsSync(filePath)) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { "content-type": TYPES[ext] || "text/plain; charset=utf-8" });
  res.end(readFileSync(filePath));
});

function listen() {
  return new Promise((resolve) => {
    server.listen(PORT, HOST, () => {
      const origin = `http://${HOST}:${PORT}`;
      console.log(`T5 fixture server: ${origin}/`);
      console.log("localhost only. No internet required.");
      for (const page of pages.pages) {
        console.log(`  ${origin}${page.path}`);
      }
      resolve(origin);
    });
  });
}

const origin = await listen();

if (process.argv.includes("--self-check")) {
  const failures = [];
  for (const page of pages.pages) {
    const url = `${origin}${page.path}`;
    const res = await fetch(url);
    const body = await res.text();
    if (!res.ok) failures.push(`${url} status ${res.status}`);
    else if (page.fact && !body.includes(page.fact)) {
      failures.push(`${url} missing fact ${page.fact}`);
    } else {
      console.log(`fetched ${url} (${body.length} bytes)`);
    }
  }
  server.close();
  if (failures.length) {
    console.error("T5 self-check FAIL");
    for (const line of failures) console.error(`  ${line}`);
    process.exit(1);
  }
  console.log("T5 self-check PASS");
}
