const { chromium } = require(process.env.PLAYWRIGHT_MODULE);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  const pageErrors = [];
  const consoleErrors = [];
  const displayStates = [];
  const captureDisplayState = async (label) => {
    displayStates.push(
      await page.evaluate((stateLabel) => {
        const stage = document.querySelector("#stage");
        const rect = stage.getBoundingClientRect();
        return {
          label: stateLabel,
          fullscreen: Boolean(document.fullscreenElement),
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          stageScale: getComputedStyle(stage).getPropertyValue("--stage-scale").trim(),
          stageRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };
      }, label),
    );
  };

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("http://127.0.0.1:4173");
  await page.locator("#mainVideo").evaluate((video) => {
    video.currentTime = 36;
  });
  await page.waitForTimeout(500);

  await page.locator(".svg-utility--01").click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: "C:/Users/diego/AppData/Local/Temp/totem-madridarena2-payment/payment-cards.png",
  });

  await page.locator("#paymentNext").click();
  const selectedPlan = await page.locator("#paymentPlanCredit").textContent();
  if (selectedPlan !== "72.04") throw new Error(`Unexpected plan: ${selectedPlan}`);

  await page.locator("#paymentCardConfirm").click();
  for (const key of ["1", "2", "3", "4"]) {
    await page.locator(`[data-payment-key="${key}"]`).click();
  }
  if (await page.locator("#paymentPinConfirm").isDisabled()) {
    throw new Error("PIN confirmation stayed disabled.");
  }
  await page.screenshot({
    path: "C:/Users/diego/AppData/Local/Temp/totem-madridarena2-payment/payment-pin.png",
  });
  await captureDisplayState("pin");

  await page.locator("#paymentPinConfirm").click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: "C:/Users/diego/AppData/Local/Temp/totem-madridarena2-payment/payment-fingerprint.png",
  });
  await captureDisplayState("fingerprint");
  await page.locator("#paymentFingerprint").click();
  await page.waitForTimeout(700);
  await page.screenshot({
    path: "C:/Users/diego/AppData/Local/Temp/totem-madridarena2-payment/payment-scanning.png",
  });
  await captureDisplayState("scanning");
  await page.waitForTimeout(1700);
  await page.screenshot({
    path: "C:/Users/diego/AppData/Local/Temp/totem-madridarena2-payment/payment-success.png",
  });
  await captureDisplayState("success");

  const successVisible = await page.locator('[data-payment-screen="success"]').evaluate(
    (screen) => !screen.hidden && screen.classList.contains("is-active"),
  );
  const transaction = await page.locator("#paymentTransaction").textContent();
  if (!successVisible || !transaction.startsWith("EZ-")) {
    throw new Error(`Success state failed: ${successVisible}, ${transaction}`);
  }

  await page.waitForTimeout(3100);
  const autoClosed = await page.locator("#paymentFlow").evaluate(
    (flow) => !flow.classList.contains("is-open") && flow.getAttribute("aria-hidden") === "true" && flow.inert,
  );
  if (!autoClosed) throw new Error("Payment flow did not close automatically.");

  await page.locator(".svg-utility--02").click();
  const secondButtonOpened = await page.locator("#paymentFlow").evaluate(
    (flow) => flow.classList.contains("is-open"),
  );
  if (!secondButtonOpened) throw new Error("Second utility button did not open payment.");
  await page.locator("#paymentClose").click();

  const result = await page.evaluate(() => ({
    locatorCount: document.querySelectorAll('[class*="map-"]').length,
    videoWidth: document.querySelector("#mainVideo").videoWidth,
    videoHeight: document.querySelector("#mainVideo").videoHeight,
  }));

  await browser.close();
  if (pageErrors.length || consoleErrors.length) {
    throw new Error(JSON.stringify({ pageErrors, consoleErrors }));
  }
  process.stdout.write(
    `${JSON.stringify({ ...result, selectedPlan, successVisible, autoClosed, secondButtonOpened, displayStates, pageErrors, consoleErrors })}\n`,
  );
})().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
