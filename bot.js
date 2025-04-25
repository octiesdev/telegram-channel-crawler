// Новый рабочий bot.js
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs-extra");
const { exec } = require("child_process");
const path = require("path");
const { CONFIG } = require("./config.js");
const { run } = require("./runner.js");

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const bot = new TelegramBot(CONFIG.TELEGRAM_BOT_TOKEN, { polling: true });

let pendingAuth = {}; // Для номера и кода

// Проверка доступа
bot.use(async (msg, next) => {
  if (msg.chat && msg.chat.id.toString() !== CONFIG.ADMIN_CHAT_ID) {
    await bot.sendMessage(msg.chat.id, "⛔️ У тебя нет доступа к этому боту.");
    return;
  }
  next();
});

// /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "✅ Бот готов! Доступные команды: /upload_session, /parse <ссылка>, /results, /reset");
});

// /upload_session - загрузка localStorage
bot.on("document", async (msg) => {
  if (!msg.document) return;

  const chatId = msg.chat.id;
  const fileId = msg.document.file_id;
  const fileName = msg.document.file_name || `session_${Date.now()}.json`;

  if (!fileName.endsWith(".json")) {
    return bot.sendMessage(chatId, "⛔️ Только .json файлы принимаются.");
  }

  try {
    const fileLink = await bot.getFileLink(fileId);
    const response = await fetch(fileLink);
    const sessionData = await response.text();

    JSON.parse(sessionData); // Проверка на валидный JSON

    const savePath = path.join(CONFIG.SESSIONS_DIR, fileName);
    await fs.outputFile(savePath, sessionData);

    await bot.sendMessage(chatId, `✅ Сессия сохранена: ${fileName}`);
  } catch (err) {
    console.error("Ошибка загрузки сессии:", err);
    await bot.sendMessage(chatId, "❌ Ошибка при загрузке. Проверь формат файла.");
  }
});

// /parse
bot.onText(/\/parse (.+)/, async (msg, match) => {
  const url = match[1];

  try {
    if (!(await fs.pathExists(CONFIG.SESSIONS_DIR))) {
      return bot.sendMessage(msg.chat.id, `❌ Папка сессий ${CONFIG.SESSIONS_DIR} не найдена.`);
    }

    const sessions = await fs.readdir(CONFIG.SESSIONS_DIR);
    if (!sessions.length) {
      return bot.sendMessage(msg.chat.id, `❌ Нет доступных сессий в ${CONFIG.SESSIONS_DIR}`);
    }

    await fs.ensureDir("./logs");
    await fs.appendFile("./logs/log.txt", `[${new Date().toISOString()}] START PARSE: ${url}\n`);

    await bot.sendMessage(msg.chat.id, `🔍 Парсинг запущен: ${url}`);
    await run(url);
    await bot.sendMessage(msg.chat.id, `✅ Парсинг завершён! Используй /results для получения файла.`);
  } catch (err) {
    console.error("Ошибка парсинга:", err);
    await bot.sendMessage(msg.chat.id, `❌ Ошибка парсинга: ${err.message}`);
  }
});

// /results
bot.onText(/\/results/, async (msg) => {
  const file = CONFIG.RESULT_FILE;
  if (await fs.pathExists(file)) {
    await bot.sendDocument(msg.chat.id, file);
  } else {
    await bot.sendMessage(msg.chat.id, "⛔️ Файл результатов пуст или отсутствует.");
  }
});

// /reset
bot.onText(/\/reset/, async (msg) => {
  await fs.writeJson(CONFIG.QUEUE_FILE, []);
  await fs.writeJson(CONFIG.VISITED_FILE, []);
  await fs.writeJson(CONFIG.RESULT_FILE, []);
  await bot.sendMessage(msg.chat.id, "♻️ Очередь и результаты сброшены!");
});

// /add_account - пока в разработке (будем через браузер сохранять localStorage)
bot.onText(/\/add_account/, async (msg) => {
  await bot.sendMessage(msg.chat.id, "⚙️ Пока добавление аккаунтов доступно только через загрузку сессий!");
});