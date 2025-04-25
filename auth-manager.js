// auth-manager.js
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs-extra");
const path = require("path");

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://web.telegram.org/k/", { waitUntil: "domcontentloaded" });

  console.log("⏳ Ожидаем ручную авторизацию через Telegram Web...");
  console.log("✅ После входа нажмите ENTER в консоли.");

  process.stdin.resume();
  process.stdin.on("data", async () => {
    const localStorageData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });

    const savePath = path.join(__dirname, "sessions", `localstorage-${Date.now()}.json`);
    await fs.ensureDir(path.join(__dirname, "sessions"));
    await fs.writeJson(savePath, localStorageData, { spaces: 2 });

    console.log(`✅ localStorage Telegram сохранён в ${savePath}`);
    await browser.close();
    process.exit(0);
  });
})();