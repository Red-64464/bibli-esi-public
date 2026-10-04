import test from "node:test";
import assert from "node:assert/strict";
import { sourceFor, allowedSource } from "./sources.mjs";
import { coverUrl } from "../src/lib/covers.js";

test("catalogue sources use the same restricted service routes", () => {
  for (const book of [
    { couverture_url: "https://covers.openlibrary.org/b/id/388613-L.jpg" },
    { couverture_url: "https://catalogue.bnf.fr/couverture?appName=NE&idArk=ark:/12148/cb34842631j&couverture=1", isbn: "978-2-07-036002-4" },
    { couverture_url: "https://supabase.75.119.140.201.nip.io/storage/v1/object/public/bibli-covers/cover_1787947535108.jpg" },
  ]) {
    const source = sourceFor(coverUrl(book));
    assert.ok(source);
    assert.ok(source.urls.every(allowedSource));
  }
});
test("caller cannot supply an arbitrary URL, path traversal or oversized identifier", () => {
  for (const path of [
    "/covers/v1/ol/1.webp?url=http://169.254.169.254/",
    "/covers/v1/ol/9999999999999999.webp",
    "/covers/v1/bnf/cb1.webp?isbn=../../etc/passwd",
    "/covers/v1/storage/../../etc/passwd.webp",
    "/covers/v1/storage/%2e%2e.webp",
  ]) assert.equal(sourceFor(path), null);
});
test("redirects are limited to HTTPS on actual image providers", () => {
  for (const url of ["http://archive.org/a", "https://archive.org.evil.test/a", "https://127.0.0.1/a", "https://archive.org:8443/a", "https://user:password@archive.org/a"]) assert.equal(allowedSource(url), false);
  assert.equal(allowedSource("https://ia801507.us.archive.org/view_archive.php"), true);
  assert.equal(allowedSource("https://archive.org/download/olcovers38/olcovers38-L.zip/388613-L.jpg"), true);
});
