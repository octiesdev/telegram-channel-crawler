// runner.js
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const { CONFIG } = require("./config.js");

async function run(startUrl) {
  await fs.ensureFile(CONFIG.RESULT_FILE);
  await fs.ensureFile(CONFIG.VISITED_FILE);

  const visited = await fs.readJson(CONFIG.VISITED_FILE).catch(() => []);
  const results = await fs.readJson(CONFIG.RESULT_FILE).catch(() => []);

  const sessionFiles = await fs.readdir(CONFIG.SESSIONS_DIR);
  if (sessionFiles.length === 0) {
    throw new Error("❌ Нет доступных сессий Telegram. Загрузите хотя бы одну .json сессию через бота.");
  }

  // Выбираем случайную сессию
  const sessionPath = path.join(CONFIG.SESSIONS_DIR, sessionFiles[Math.floor(Math.random() * sessionFiles.length)]);
  const localStorageData = await fs.readJson(sessionPath);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  // Устанавливаем localStorage
  await page.goto("https://web.telegram.org/k/", { waitUntil: "domcontentloaded" });
  for (const [key, value] of Object.entries(localStorageData)) {
    await page.evaluate((k, v) => localStorage.setItem(k, v), key, value);
  }
  await page.reload({ waitUntil: "domcontentloaded" });

  const queue = [startUrl];

  while (queue.length > 0) {
    const url = queue.shift();
    if (visited.includes(url)) continue;

    console.log(`🔍 Парсим: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null);
    await new Promise(resolve => setTimeout(resolve, 3000));

    const data = await page.evaluate(() => {
      const similar = Array.from(document.querySelectorAll("a.tgme_channel_related"))
        .map(a => a.href)
        .filter(href => href.startsWith("https://t.me/"));
      return similar;
    });

    if (data.length > 0) {
      console.log(`➕ Найдено похожих каналов: ${data.length}`);
    }

    results.push({ parent: url, similar: data });
    visited.push(url);

    for (const link of data) {
      if (!visited.includes(link)) queue.push(link);
    }

    await fs.writeJson(CONFIG.RESULT_FILE, results, { spaces: 2 });
    await fs.writeJson(CONFIG.VISITED_FILE, visited, { spaces: 2 });
  }

  await browser.close();
  console.log("✅ Парсинг завершён.");
}

module.exports = { run };