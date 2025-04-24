const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs-extra");
const { CONFIG } = require("./config.js");
const { run } = require("./runner");


const bot = new TelegramBot(CONFIG.TELEGRAM_BOT_TOKEN, { polling: true });

// Проверка: только админ может использовать бота
bot.on("message", (msg) => {
    if (msg.chat.id.toString() !== CONFIG.ADMIN_CHAT_ID) {
      bot.sendMessage(msg.chat.id, "⛔️ У тебя нет доступа к этому боту.");
    }
  });

// /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "✅ Бот готов к работе! Напиши /parse <ссылка>");
});

// /parse
bot.onText(/\/parse (.+)/, async (msg, match) => {
  const url = match[1];
  bot.sendMessage(msg.chat.id, `🔍 Запускаю парсинг от: ${url}`);

  await fs.ensureDir("./logs");
  await fs.appendFile("./logs/log.txt", `[${new Date().toISOString()}] START PARSE: ${url}\n`);

  try {
    const { run } = require("./runner");
    await run(url);
    bot.sendMessage(msg.chat.id, "✅ Парсинг завершён. Данные добавлены в results.json");
  } catch (err) {
    console.error("Ошибка при запуске парсера:", err);
    bot.sendMessage(msg.chat.id, "❌ Ошибка при запуске парсинга. Подробности в логах.");
  }
});

// /status
bot.onText(/\/status/, async (msg) => {
  // В будущем покажем статус из очереди
  bot.sendMessage(msg.chat.id, "📊 Статус: пока нечего показать (логика runner.js будет позже)");
});

// /reset
bot.onText(/\/reset/, async (msg) => {
  await fs.writeJson(CONFIG.QUEUE_FILE, []);
  bot.sendMessage(msg.chat.id, "♻️ Очередь очищена. visited и results не тронуты.");
});

// /results
bot.onText(/\/results/, async (msg) => {
  const file = CONFIG.RESULT_FILE;
  if (await fs.exists(file)) {
    bot.sendDocument(msg.chat.id, file);
  } else {
    bot.sendMessage(msg.chat.id, "⛔️ Файл results.json пока пуст или не найден.");
  }
});