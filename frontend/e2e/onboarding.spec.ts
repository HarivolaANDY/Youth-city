import { expect, test } from '@playwright/test';

/**
 * Parcours complet d'un nouveau citoyen (TST-04) :
 * visite en lecture seule ➔ inscription ➔ création du personnage ➔ formation payante au Campus
 * ➔ entretien d'embauche ➔ premier shift de travail.
 *
 * Données de départ (archétype « Autodidacte ») : 280 000 MGA, JavaScript 30 %, Git 25 %.
 * La formation Web (50 000 MGA) apporte JavaScript +20 et Git +15 : le poste « Développeur Web Junior »
 * (JavaScript 50 %, Git 40 %) devient accessible, salaire journalier 450 000 / 20 = 22 500 MGA.
 */
test('onboarding : inscription ➔ personnage ➔ cours ➔ premier shift', async ({ page }) => {
  const username = `e2e${Date.now()}`;

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();

  // 1. Visiteur : lecture seule, toute action propose la connexion.
  await page.getByRole('button', { name: /Temps \+|Avancer au créneau/ }).first().click();
  const authDialog = page.getByRole('dialog');
  await expect(authDialog.getByRole('button', { name: 'Créer un compte' })).toBeVisible();

  // 2. Inscription.
  await authDialog.getByRole('button', { name: 'Créer un compte' }).click();
  await authDialog.getByLabel(/Nom d.utilisateur|Identifiant/i).fill(username);
  await authDialog.locator('#auth-citizen-name').fill('Rado');
  await authDialog.locator('#auth-password').fill('MotDePasse!2026');
  await authDialog.locator('#auth-birth-year').fill('2000');
  await authDialog.getByRole('checkbox').first().check();
  await authDialog.getByRole('button', { name: 'Valider mon inscription' }).click();

  // 3. Création guidée du personnage (3 étapes).
  const creation = page.getByRole('dialog', { name: /citoyen|personnage|Profil/i });
  await expect(creation.locator('#char-name-input')).toBeVisible();
  await creation.getByRole('button', { name: 'Continuer' }).click();
  await creation.getByRole('button', { name: /Autodidacte/ }).click();
  await creation.getByRole('button', { name: 'Continuer' }).click();
  await creation.getByRole('button', { name: /Valider & Entrer dans la Ville/ }).click();
  await expect(creation).toBeHidden();

  const nav = page.getByRole('navigation', { name: 'Sections de Youth City' }).first();

  // 4. Campus : inscription payante puis validation des deux quiz.
  await nav.getByRole('button', { name: 'Campus' }).click();
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Développement Web Fondamental' })
    .getByRole('button', { name: /S.inscrire à la formation/ })
    .click();
  await expect(page.getByRole('heading', { name: /Développement Web Fondamental/ })).toBeVisible();

  // Réponses justes du jeu de données : module 1 = « const » (index 2), module 2 = index 1.
  for (const answerIndex of [2, 1]) {
    await page.getByRole('button', { name: /Passer à l.exercice d.application/ }).click();
    await page.getByRole('button', { name: /Passer au quiz de validation/ }).click();
    await page.getByRole('radio').nth(answerIndex).check({ force: true });
    await page.getByRole('button', { name: 'Valider ma réponse' }).click();
    await expect(page.getByText('Bonne réponse !').first()).toBeVisible();
    await page.getByRole('button', { name: /Passer à la mission terrain/ }).click();
    // « Module suivant (2/2) » au premier tour, puis l'accès à la certification au second (bouton « Délivrer ma certification »).
    await page.getByRole('button', { name: /Module suivant|Délivrer ma certification/ }).click();
  }
  await expect(page.getByText('Cursus Validé avec Succès')).toBeVisible();
  await page.getByRole('button', { name: /Retour au catalogue/ }).click();

  // 5. Carrière : entretien réussi, puis première journée de travail.
  await nav.getByRole('button', { name: 'Carrière' }).click();
  await page
    .getByRole('listitem')
    .or(page.locator('article'))
    .filter({ hasText: 'Développeur Web Junior' })
    .getByRole('button', { name: /Passer l.entretien/ })
    .first()
    .click();
  await page.getByRole('radio').first().check({ force: true });
  await page.getByRole('button', { name: 'Soumettre ma réponse au recruteur' }).click();
  await page.getByRole('button', { name: 'Accéder à mon poste' }).click();

  await page.getByRole('button', { name: 'Valider ma journée de travail' }).click();
  await expect(page.getByText('Journée de travail accomplie').first()).toBeVisible();
});
