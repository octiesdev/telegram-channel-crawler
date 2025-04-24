const fs = require("fs-extra");
const puppeteer = require("puppeteer");

async function parseSimilarChannels(url) {
  console.log("[runner] Запущен парсинг для:", url);

  await fs.appendFile(
    "./logs/runner.log",
    `[${new Date().toISOString()}] RUNNER STARTED FOR: ${url}\n`
  );

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000); // пауза на загрузку

  const similarChannels = await page.evaluate(() => {
    const links = [...document.querySelectorAll("a")].filter((el) =>
      el.href.includes("/s/")
    );

    return links.map((el) => ({
      name: el.innerText.trim(),
      link: el.href,
    }));
  });

  console.log("[runner] Найдено похожих:", similarChannels.length);

  const resultFile = "./results/results.json";
  await fs.ensureFile(resultFile);

  const prev = (await fs.readJson(resultFile).catch(() => [])) || [];
  const merged = [...prev, ...similarChannels];

  await fs.writeJson(resultFile, merged, { spaces: 2 });
  await browser.close();

  console.log("[runner] Парсинг завершён для:", url);
}

module.exports = {
  parseSimilarChannels,
};