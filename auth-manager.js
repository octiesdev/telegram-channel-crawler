// auth-manager.js (ручной режим входа)
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

  console.log("⚠️ Пожалуйста, авторизуйся вручную в Telegram Web.");
  console.log("➡️ После этого нажми ENTER в терминале, чтобы сохранить cookies.");

  process.stdin.resume();
  process.stdin.on("data", async () => {
    const cookies = await page.cookies();
    const savePath = path.join(__dirname, "cookies", `cookies-${Date.now()}.json`);
    await fs.ensureDir(path.join(__dirname, "cookies"));
    await fs.writeJson(savePath, cookies, { spaces: 2 });

    console.log(`✅ Cookies сохранены: ${savePath}`);
    await browser.close();
    process.exit(0);
  });
})();