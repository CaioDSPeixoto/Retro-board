import { expect, test } from "@playwright/test";

test("pagina inicial localizada carrega", async ({ page }) => {
  await page.goto("/pt");

  await expect(page).toHaveURL(/\/pt$/);
  await expect(page.locator("body")).toBeVisible();
});

test("login normaliza email para minusculo", async ({ page }) => {
  await page.goto("/pt/tools/finance/login");

  const email = page.locator('input[type="email"]');
  const password = page.locator('input[type="password"]');

  await expect(email).toBeVisible();
  await expect(password).toBeVisible();

  await email.fill("USUARIO@EXEMPLO.COM");
  await expect(email).toHaveValue("usuario@exemplo.com");
});

test("cadastro normaliza email e exibe campos de senha", async ({ page }) => {
  await page.goto("/pt/tools/finance/register");

  const email = page.locator('input[type="email"]');
  const passwords = page.locator('input[type="password"]');

  await expect(email).toBeVisible();
  await expect(passwords).toHaveCount(2);

  await email.fill("NOVO@EXEMPLO.COM");
  await expect(email).toHaveValue("novo@exemplo.com");
});
