async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 } });
  const probe = await context.newPage();
  const errors = [];
  let stage = "grid";
  probe.on("pageerror", error => errors.push(error.message));
  const title = "Access database design and programming";
  const card = () => probe.getByRole("button", { name: `Voir le détail de ${title}`, exact: true });
  const checkImage = async () => {
    const image = probe.locator('img[src*="/covers/v1/ol/388613.webp"]').last();
    await image.waitFor({ state: "attached" });
    await image.scrollIntoViewIfNeeded();
    await probe.waitForFunction(() => [...document.images].filter(i => i.src.includes("/covers/v1/ol/388613.webp")).every(i => i.complete && i.naturalWidth > 0));
  };
  try {
    await probe.goto(page.url());
    await card().waitFor();
    await checkImage();
    stage = "detail";
    await card().click();
    await probe.getByRole("heading", { name: title, exact: true, level: 2 }).waitFor();
    await checkImage();
    await probe.getByRole("button", { name: "Fermer", exact: true }).click();
    stage = "list";
    await probe.getByRole("button", { name: "Vue liste", exact: true }).click();
    await checkImage();
    stage = "pagination";
    await probe.getByRole("button", { name: "Page suivante", exact: true }).click();
    await card().waitFor({ state: "hidden" });
    await probe.getByRole("button", { name: "Page précédente", exact: true }).click();
    await card().waitFor();
    await probe.getByRole("button", { name: "Vue grille", exact: true }).click();
    stage = "online reload";
    await probe.evaluate(() => navigator.serviceWorker.ready);
    await probe.reload();
    await card().waitFor();
    await checkImage();
    stage = "offline reload";
    await context.setOffline(true);
    await probe.reload();
    await card().waitFor({ timeout: 40000 });
    await checkImage();
    const offlineText = await probe.getByRole("status").innerText();
    return { detail: true, list: true, pagination: true, offlineCatalogueAndCover: true, offlineText, errors };
  } catch (error) {
    return { stage, error: error.message, text: await probe.locator("body").innerText(), errors };
  } finally {
    await context.setOffline(false);
    await context.close();
  }
}
