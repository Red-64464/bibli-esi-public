import http from "node:http";
import { mkdir, readFile, writeFile, rename, stat, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { sourceFor, allowedSource } from "./sources.mjs";

const dir = process.env.CACHE_DIR || "/cache";
const maxBytes = 8 * 1024 * 1024;
const maxCache = 128 * 1024 * 1024;
const positiveTTL = 30 * 86400000;
const negativeTTL = 6 * 3600000;
const pending = new Map();
const waiters = [];
let active = 0;
async function acquire() {
  if (active < 4) { active++; return; }
  await new Promise(resolve => waiters.push(resolve));
}
function release() {
  if (waiters.length) waiters.shift()();
  else active--;
}
sharp.concurrency(1);
sharp.cache({ memory: 16, files: 0, items: 32 });
await mkdir(dir, { recursive: true });

async function download(value) {
  const signal = AbortSignal.timeout(12000);
  for (let redirects = 0; redirects < 5; redirects++) {
    if (!allowedSource(value)) throw new Error("Untrusted redirect");
    const response = await fetch(value, { redirect: "manual", signal });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error("Missing redirect");
      value = new URL(location, value).href;
      continue;
    }
    if (!response.ok || !/^image\/(jpeg|png|webp|gif|avif)\b/i.test(response.headers.get("content-type") || "") || Number(response.headers.get("content-length")) > maxBytes) {
      await response.body?.cancel();
      throw new Error("Cover unavailable");
    }
    const chunks = [];
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > maxBytes) throw new Error("Image too large");
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  throw new Error("Too many redirects");
}

async function cached(file, ttl) {
  try {
    const info = await stat(file);
    if (Date.now() - info.mtimeMs < ttl) return await readFile(file);
  } catch { /* Cache miss. */ }
  return null;
}

async function load(source) {
  const file = path.join(dir, `${source.key}.webp`);
  const hit = await cached(file, positiveTTL);
  if (hit) return { data: hit, cache: "HIT" };
  if (await cached(`${file}.missing`, negativeTTL)) return { cache: "NEGATIVE" };
  if (pending.has(source.key)) return pending.get(source.key);
  if (pending.size >= 32) throw new Error("BUSY");
  const promise = (async () => {
    await acquire();
    try {
      for (const url of source.urls) {
        try {
          const input = await download(url);
          const image = sharp(input, { limitInputPixels: 25_000_000 });
          const meta = await image.metadata();
          if (meta.width < 20 || meta.height < 20) continue;
          const data = await image.rotate().resize({ width: 480, height: 720, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
          await writeFile(`${file}.tmp`, data);
          await rename(`${file}.tmp`, file);
          return { data, cache: "MISS" };
        } catch { /* A known provider may lack a cover; try ISBN fallback. */ }
      }
      // Keep a previous good copy if the provider becomes temporarily unavailable.
      const stale = await readFile(file).catch(() => null);
      if (stale) return { data: stale, cache: "STALE" };
      await writeFile(`${file}.missing`, "unavailable");
      return { cache: "MISS" };
    } finally { release(); }
  })();
  pending.set(source.key, promise);
  try { return await promise; } finally { pending.delete(source.key); }
}

async function prune() {
  const files = await Promise.all((await readdir(dir)).map(async name => ({ file: path.join(dir, name), info: await stat(path.join(dir, name)).catch(() => null) })));
  let total = files.reduce((sum, f) => sum + (f.info?.size || 0), 0);
  for (const f of files.sort((a, b) => (a.info?.mtimeMs || 0) - (b.info?.mtimeMs || 0))) {
    if (!f.info || f.file.endsWith(".tmp")) continue;
    if (total > maxCache || (f.file.endsWith(".missing") && Date.now() - f.info.mtimeMs > negativeTTL)) {
      await unlink(f.file).catch(() => {});
      total -= f.info.size;
    }
  }
}
setInterval(() => prune().catch(() => {}), 60000).unref();

http.createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (request.url === "/health") { response.writeHead(200); response.end("ok"); return; }
  if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405); response.end(); return; }
  const source = sourceFor(request.url);
  if (!source) { response.writeHead(404); response.end(); return; }
  try {
    const { data, cache } = await load(source);
    response.setHeader("X-Cover-Cache", cache);
    if (!data) { response.writeHead(404, { "Cache-Control": "public, max-age=3600" }); response.end(); return; }
    response.writeHead(200, { "Content-Type": "image/webp", "Content-Length": data.length, "Cache-Control": "public, max-age=2592000, stale-while-revalidate=86400" });
    response.end(request.method === "HEAD" ? undefined : data);
  } catch {
    response.writeHead(503, { "Retry-After": "2", "Cache-Control": "no-store" });
    response.end();
  }
}).listen(3000, "0.0.0.0", () => console.log("Cover service listening on 3000"));
