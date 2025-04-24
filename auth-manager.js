// auth-manager.js
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs-extra");
const path = require("path");

puppeteer.use(StealthPlugin());

(async () => {
  const phone = process.argv[2];
  const code = process.argv[3];

  if (!phone || !code) {
    console.error("❌ Номер телефона и код обязательны. Пример: node auth-manager.js +123456789 12345");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://web.telegram.org/k/", { waitUntil: "domcontentloaded" });

  console.log("⏳ Пытаемся авторизоваться через Telegram Web...");
  console.log("⚠️ ВНИМАНИЕ: Telegram Web требует ручной авторизации.");
  console.log("✅ Авторизуйтесь вручную через браузер Telegram, затем нажмите ENTER в консоли.");

  process.stdin.resume();
  process.stdin.on("data", async () => {
    const cookies = await page.cookies();

    if (!cookies || cookies.length === 0) {
      console.log("⚠️ Похоже, куки не найдены. Проверь, что ты действительно авторизован в Telegram Web.");
    } else {
      console.log(`✅ Найдено ${cookies.length} cookie-файлов.`);
      const filename = `cookies-${phone.replace(/[^\d+]/g, "")}.json`;
      const savePath = path.join(__dirname, "cookies", filename);

      await fs.ensureDir(path.join(__dirname, "cookies"));
      await fs.writeJson(savePath, cookies, { spaces: 2 });

      console.log(`✅ Cookies сохранены в ${savePath}`);
    }

    await browser.close();
    process.exit(0);
  });
})();
