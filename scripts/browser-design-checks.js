async (page) => {
  const results = [];
  const title = "Access database design and programming";
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    const context = await page.context().browser().newContext({ viewport });
    const probe = await context.newPage();
    const audit = async (tags) => {
      if (!await probe.evaluate(() => Boolean(window.axe))) {
        await probe.addScriptTag({ url: new URL("/node_modules/axe-core/axe.min.js", page.url()).href });
      }
      return probe.evaluate(async tags => (await window.axe.run(document, { runOnly: { type: "tag", values: tags }, resultTypes: ["violations"] })).violations, tags);
    };
    const errors = [];
    probe.on("pageerror", e => errors.push(e.message));
    probe.on("console", m => { if (m.type() === "error" && m.text().includes("Maximum update")) errors.push(m.text()); });
    try {
      await probe.goto(page.url());
      const card = probe.getByRole("button", { name: `Voir le détail de ${title}`, exact: true });
      await card.waitFor();
      for (const retiredText of ["Bibliothèque complète", "Places disponibles", "Trouver la bibliothèque"]) {
        if (await probe.getByText(retiredText, { exact: true }).count()) throw new Error(`Retired feature still visible: ${retiredText}`);
      }
      await probe.evaluate(() => document.fonts.ready);
      for (const theme of ["light", "dark"]) {
        await probe.waitForFunction(theme => getComputedStyle(document.body).color === (theme === "light" ? "rgb(32, 44, 40)" : "rgb(238, 238, 229)"), theme);
        // Avoid measuring transient text colours halfway through a theme change.
        await probe.waitForFunction(theme => getComputedStyle(document.querySelector(".public-category-chip")).color === (theme === "light" ? "rgb(32, 44, 40)" : "rgb(238, 238, 229)"), theme);
        const violations = await audit(["wcag2a", "wcag2aa", "wcag21aa"]);
        results.push({ viewport, theme, overflow: await probe.evaluate(() => document.documentElement.scrollWidth > innerWidth), accessibility: violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) });
        await probe.screenshot({ path: `output/playwright/public-design-${viewport.width}-${theme}.png`, fullPage: false });
        if (theme === "light") await probe.getByRole("button", { name: "Basculer le thème", exact: true }).click();
      }
      await probe.getByRole("button", { name: "Basculer le thème", exact: true }).click();
      await probe.waitForFunction(() => getComputedStyle(document.body).color === "rgb(32, 44, 40)");
      await probe.waitForFunction(() => getComputedStyle(document.querySelector('.public-nav button[aria-current="page"]')).color === "rgb(32, 44, 40)");
      await probe.waitForFunction(() => getComputedStyle(document.querySelector('.public-category-chip')).color === "rgb(32, 44, 40)");
      await probe.getByRole("textbox", { name: "Rechercher un livre", exact: true }).fill("Access database");
      await card.click();
      await probe.getByRole("dialog").waitFor();
      const dialogAxe = await audit(["wcag2a", "wcag2aa"]);
      const focusInside = await probe.evaluate(() => document.querySelector('[role="dialog"]').contains(document.activeElement));
      await probe.screenshot({ path: `output/playwright/public-dialog-${viewport.width}.png` });
      await probe.keyboard.press("Escape");
      await probe.getByRole("dialog").waitFor({ state: "hidden" });
      await probe.getByRole("textbox", { name: "Rechercher un livre", exact: true }).fill("");
      await probe.getByRole("button", { name: "Vue liste", exact: true }).click();
      await card.waitFor();
      await probe.getByRole("button", { name: "Vue grille", exact: true }).click();
      await probe.getByRole("button", { name: "Filtres", exact: true }).click();
      await probe.getByLabel("Catégorie", { exact: true }).selectOption("Bases de données");
      await probe.getByRole("heading", { name: "Votre recherche", exact: true }).waitFor();
      await probe.getByRole("button", { name: "Effacer le filtre", exact: true }).click();
      await probe.getByRole("button", { name: viewport.width < 640 ? "Voir les horaires" : "Horaires", exact: true }).click();
      await probe.getByRole("heading", { name: "Horaires d'ouverture", exact: true, level: 1 }).waitFor();
      const hoursAxe = await audit(["wcag2a", "wcag2aa"]);
      results.push({ viewport, navigation: "search, dialog, Escape, list, grid, filters, hours", focusInside, dialogAccessibility: dialogAxe.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), hoursAccessibility: hoursAxe.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), errors });
    } finally { await context.close(); }
  }
  if (results.some(result => result.overflow || result.accessibility?.length || result.dialogAccessibility?.length || result.hoursAccessibility?.length || result.errors?.length || result.focusInside === false)) {
    throw new Error(JSON.stringify(results));
  }
  return results;
}
