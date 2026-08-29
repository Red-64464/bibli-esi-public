import Dexie from "dexie";

// Cache uniquement les données publiques : aucune donnée admin ou personnelle.
const db = new Dexie("bibliesi-public-cache");
db.version(1).stores({
  catalog: "key",
  practical: "key",
});

const CATALOG_KEY = "catalogue";
const PRACTICAL_KEY = "informations";

export async function readPublicCatalogue() {
  const entry = await db.catalog.get(CATALOG_KEY);
  return entry?.data || null;
}

export async function writePublicCatalogue(data) {
  await db.catalog.put({ key: CATALOG_KEY, data, savedAt: Date.now() });
}

export async function readPracticalInfo() {
  const entry = await db.practical.get(PRACTICAL_KEY);
  return entry?.data || null;
}

export async function writePracticalInfo(data) {
  await db.practical.put({ key: PRACTICAL_KEY, data, savedAt: Date.now() });
}
