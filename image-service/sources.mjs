// The URL is derived from a provider identifier, never supplied by the caller.
export function sourceFor(path) {
  const url = new URL(path, "http://localhost");
  if ([...url.searchParams.keys()].some(k => k !== "isbn")) return null;
  const isbn = url.searchParams.get("isbn") || "";
  if (isbn && !/^(?:\d{10}|\d{13})$/.test(isbn)) return null;
  let match = url.pathname.match(/^\/covers\/v1\/ol\/(\d{1,12})\.webp$/);
  if (match) return { key: `ol-${match[1]}`, urls: [`https://covers.openlibrary.org/b/id/${match[1]}-L.jpg?default=false`] };
  match = url.pathname.match(/^\/covers\/v1\/bnf\/(cb[a-zA-Z0-9]{1,20})\.webp$/);
  if (match) return {
    key: `bnf-${match[1]}${isbn ? `-${isbn}` : ""}`,
    urls: [
      `https://catalogue.bnf.fr/couverture?appName=NE&idArk=ark:/12148/${match[1]}&couverture=1`,
      ...(isbn ? [`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`] : []),
    ],
  };
  match = url.pathname.match(/^\/covers\/v1\/storage\/([a-zA-Z0-9_-]{1,120}\.(?:jpg|jpeg|png|webp))\.webp$/);
  if (match) return { key: `storage-${match[1]}`, urls: [`https://supabase.75.119.140.201.nip.io/storage/v1/object/public/bibli-covers/${match[1]}`] };
  return null;
}

export function allowedSource(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return false;
  return ["covers.openlibrary.org", "catalogue.bnf.fr", "archive.org", "supabase.75.119.140.201.nip.io"].includes(url.hostname)
    || /^ia\d+\.(?:us\.)?archive\.org$/.test(url.hostname);
}
