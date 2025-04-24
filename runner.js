// runner.js — логика парсинга похожих каналов

const fs = require("fs-extra");

async function parseSimilarChannels(url) {
  console.log("[runner] Запущен парсинг для:", url);

  // В будущем тут будет запуск Puppeteer и парсинг похожих каналов
  // Сейчас просто пишем лог
  await fs.appendFile(
    "./logs/runner.log",
    `[${new Date().toISOString()}] RUNNER STARTED FOR: ${url}\n`
  );

  // Заглушка: ждём 2 сек
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("[runner] Заглушка завершена для:", url);
}

module.exports = {
  parseSimilarChannels,
};