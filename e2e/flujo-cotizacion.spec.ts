import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * E2E: wizard de cotización (TEA-only según indicación docente,
 * residual por defecto, costos IB).
 */

function fieldByLabel(page: Page, labelText: string | RegExp): Locator {
  return page.locator("label").filter({ hasText: labelText }).locator("input, select").first();
}

test("Registrar cotización completa con valor residual", async ({ page }) => {
  await page.goto("http://localhost:3000/sign-in");

  await page.getByRole("button", { name: "Preparar data sintética demo" }).click();
  await page
    .getByText(/Seed|regenerado|ejecutado/i)
    .first()
    .waitFor({ state: "visible", timeout: 120_000 });

  await page.getByRole("button", { name: /ASESOR|ADMIN/i }).first().click();
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("http://localhost:3000/dashboard/cotizaciones/nueva");
  await expect(page).toHaveURL(/\/dashboard\/cotizaciones\/nueva/);

  // ─── Paso 1: Cliente ───────────────────────────────────────────────────────
  await fieldByLabel(page, /N° documento/).fill("12345678");
  await fieldByLabel(page, /^Nombres/).fill("Juan Carlos");
  await fieldByLabel(page, /Apellido paterno/).fill("García");
  await fieldByLabel(page, /Apellido materno/).fill("López");
  await fieldByLabel(page, /^Celular/).fill("987654321");
  await fieldByLabel(page, /^Correo/).fill("juan.garcia@email.com");
  await fieldByLabel(page, /Dirección/).fill("Av. Los Olivos 123, Lima");
  await page.getByRole("button", { name: "Siguiente" }).click();

  // ─── Paso 2: Vehículo ──────────────────────────────────────────────────────
  await page.locator("label").filter({ hasText: /^Marca/ }).locator("select").selectOption("Toyota");
  await page.locator("label").filter({ hasText: /^Modelo/ }).locator("select").selectOption("Yaris");
  await fieldByLabel(page, /Versión/).fill("1.5");
  await fieldByLabel(page, /^Año/).fill("2026");
  await fieldByLabel(page, /Precio lista/).fill("67290");
  await fieldByLabel(page, /Concesionario/).fill("Toyota del Perú S.A.");
  await page.getByRole("button", { name: "Siguiente" }).click();

  // ─── Paso 3: Parámetros (solo TEA) ─────────────────────────────────────────
  await expect(fieldByLabel(page, /Moneda operación/)).toHaveValue("PEN");
  await fieldByLabel(page, /Tasa Efectiva Anual|TEA %/).fill("16.1798");
  await expect(fieldByLabel(page, /Precio vehículo/)).toHaveValue("67290");
  await expect(fieldByLabel(page, /Plazo \(meses\)/)).toHaveValue("36");

  const residualCheck = page.getByRole("checkbox", {
    name: /Incluir valor residual/i,
  });
  if (!(await residualCheck.isChecked())) {
    await residualCheck.check();
  }
  const pctFinal = fieldByLabel(page, /% Cuota final/);
  if (await pctFinal.isVisible()) {
    await pctFinal.fill("40");
  }

  await page.getByRole("button", { name: "Siguiente" }).click();

  // ─── Paso 4: Confirmación ──────────────────────────────────────────────────
  await expect(page.getByText(/Juan Carlos/)).toBeVisible();
  await expect(page.getByText(/García/)).toBeVisible();
  await expect(page.getByText(/Toyota Yaris/)).toBeVisible();
  await expect(page.getByText(/Plazo:\s*36 meses/i)).toBeVisible();
  await expect(page.getByText(/Tipo de tasa:\s*TEA/i)).toBeVisible();

  await page.getByRole("button", { name: "Guardar cotización" }).click();

  await expect(page).toHaveURL(/\/dashboard\/cotizaciones\/\d+/, { timeout: 60_000 });
  await expect(page.getByText(/Estado:\s*SIMULADA/i)).toBeVisible();
  await expect(page.getByText(/TCEA:/i)).toBeVisible();
  await expect(page.getByText(/VAN:/i)).toBeVisible();
  await expect(page.getByText(/TIR anual:/i)).toBeVisible();
  await expect(page.locator("table").first()).toBeVisible();
  await expect(page.getByText(/Control de versionado/i)).toBeVisible();
});
