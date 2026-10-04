async (page) => {
  const results = [];
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    const context = await page.context().browser().newContext({ viewport });
    const probe = await context.newPage();
    const errors = [];
    probe.on("pageerror", error => errors.push(error.message));
    for (const cache of ["cold", "warm"]) {
      await probe.goto(page.url(), { waitUntil: "domcontentloaded" });
      await probe.getByRole("button", { name: "Voir le détail de Access database design and programming", exact: true }).waitFor();
      await probe.waitForFunction(() => [...document.images].filter(i => i.getBoundingClientRect().top < innerHeight).every(i => i.complete), null, { timeout: 30000 });
      results.push({ viewport, cache, errors, ...await probe.evaluate(() => ({
        images: [...document.images].filter(i => i.getBoundingClientRect().top < innerHeight).map(i => ({ url: i.currentSrc, loaded: i.complete && i.naturalWidth > 0 })),
        timings: performance.getEntriesByType("resource").filter(e => e.initiatorType === "img").map(e => ({ url: e.name, ms: Math.round(e.duration), bytes: e.transferSize, doneMs: Math.round(e.responseEnd) })),
      })) });
    }
    await context.close();
  }
  return results;
}
