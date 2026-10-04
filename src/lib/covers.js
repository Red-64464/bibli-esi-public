export function coverUrl(livre) {
  if (!livre.couverture_url) return "";
  try {
    const url = new URL(livre.couverture_url);
    let match = url.pathname.match(/^\/b\/id\/(\d{1,12})-[LMS]\.jpg$/);
    if (url.hostname === "covers.openlibrary.org" && match) return `/covers/v1/ol/${match[1]}.webp`;
    match = (url.searchParams.get("idArk") || "").match(/^ark:\/12148\/(cb[a-zA-Z0-9]{1,20})$/);
    if (url.hostname === "catalogue.bnf.fr" && url.pathname === "/couverture" && match) {
      const isbn = (livre.isbn || "").replace(/[^0-9]/g, "");
      return `/covers/v1/bnf/${match[1]}.webp${/^(?:\d{10}|\d{13})$/.test(isbn) ? `?isbn=${isbn}` : ""}`;
    }
    match = url.pathname.match(/^\/storage\/v1\/object\/public\/bibli-covers\/([a-zA-Z0-9_-]{1,120}\.(?:jpg|jpeg|png|webp))$/);
    if (url.hostname === "supabase.75.119.140.201.nip.io" && match) return `/covers/v1/storage/${match[1]}.webp`;
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}
