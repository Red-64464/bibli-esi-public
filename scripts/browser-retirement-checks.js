async (page) => {
  const results = [];
  for (const [name, url] of [
    ["local", "http://localhost:5184/"],
    ["production", "https://bibliesi-public.75.119.140.201.nip.io/"],
  ]) {
    const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 } });
    const probe = await context.newPage();
    const errors = [];
    probe.on("pageerror", error => errors.push(error.message));
    try {
      await probe.goto(url);
      await probe.getByRole("button", { name: "Voir le détail de Access database design and programming", exact: true }).waitFor();
      for (const text of ["Bibliothèque complète", "Places disponibles", "Trouver la bibliothèque", "Comment venir à la bibliothèque"]) {
        if (await probe.getByText(text, { exact: true }).count()) throw new Error(`${name}: retired text remains: ${text}`);
      }
      await probe.getByPlaceholder(/Titre, auteur, ISBN/).fill("Access database");
      await probe.getByRole("button", { name: "Voir le détail de Access database design and programming", exact: true }).click();
      await probe.getByRole("heading", { name: "Access database design and programming", level: 2, exact: true }).waitFor();
      await probe.keyboard.press("Escape");
      await probe.getByPlaceholder(/Titre, auteur, ISBN/).fill("");
      await probe.getByRole("button", { name: "Voir les horaires", exact: true }).click();
      await probe.getByRole("heading", { name: "Horaires d'ouverture", exact: true }).waitFor();
      if (errors.length) throw new Error(JSON.stringify(errors));
      results.push({ name, removedFeaturesAbsent: true, searchAndBookDetails: "pass", hours: "pass", jsErrors: errors });
    } finally { await context.close(); }
  }
  return results;
}
