import { coverUrl } from "../src/lib/covers.js";
const origin = "https://bibliesi-public.75.119.140.201.nip.io";
const result = await fetch("https://supabase.75.119.140.201.nip.io/rest/v1/bibli_public_livres?select=id,isbn,couverture_url&order=titre.asc", { headers: { apikey: process.env.SUPABASE_ANON_KEY } });
if (!result.ok) throw new Error(`Catalogue ${result.status}`);
const books = await result.json();
const baseline = process.argv.includes("--baseline");
const sample = baseline || process.argv.includes("--sample");
const rows = [...new Map(books.filter(b => b.couverture_url).map(b => [coverUrl(b), b])).values()]
  .filter(b => !sample || new URL(b.couverture_url).hostname === "covers.openlibrary.org");
const queue = sample ? rows.slice(0, 8) : rows;
const timings = [];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const book = queue.shift();
    const url = baseline ? book.couverture_url : new URL(coverUrl(book), origin).href;
    const start = performance.now();
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(40000) });
      const body = await r.arrayBuffer();
      timings.push({ path: new URL(url).pathname, status: r.status, ms: Math.round(performance.now() - start), bytes: body.byteLength, cache: r.headers.get("x-cover-cache") });
    } catch { timings.push({ path: new URL(url).pathname, status: "timeout", ms: Math.round(performance.now() - start), bytes: 0 }); }
  }
}));
const good = timings.filter(r => r.status === 200).sort((a, b) => a.ms - b.ms);
console.log(JSON.stringify({ baseline, total: timings.length, available: good.length, missing: timings.filter(r => r.status === 404).length, failures: timings.filter(r => ![200, 404].includes(r.status)), medianMs: good[Math.floor(good.length / 2)]?.ms, p95Ms: good[Math.floor(good.length * .95)]?.ms, totalBytes: good.reduce((sum, r) => sum + r.bytes, 0), timings }, null, 2));
