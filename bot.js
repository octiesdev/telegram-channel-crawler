// bot.js
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs-extra");
const { exec } = require("child_process");
const { CONFIG } = require("./config.js");

const bot = new TelegramBot(CONFIG.TELEGRAM_BOT_TOKEN, { polling: true });

let pendingAuth = {}; // для хранения номеров, ожидающих кода

// Проверка доступа
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
  await fs.ensureDir("./logs");
  await fs.appendFile("./logs/log.txt", `[${new Date().toISOString()}] START PARSE: ${url}\n`);
  bot.sendMessage(msg.chat.id, "🛠 Парсинг ещё не запущен — но команда принята. runner.js в разработке.");
});

// /status
bot.onText(/\/status/, async (msg) => {
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

// /add_account
bot.onText(/\/add_account/, async (msg) => {
  bot.sendMessage(msg.chat.id, "📱 Введите номер телефона в формате +123456789:");
  pendingAuth[msg.chat.id] = { step: "awaiting_number" };
});

bot.on("message", async (msg) => {
  const state = pendingAuth[msg.chat.id];
  if (!state) return;

  if (state.step === "awaiting_number") {
    state.phone = msg.text;
    state.step = "awaiting_code";
    bot.sendMessage(msg.chat.id, `📩 Теперь отправьте код, полученный для ${state.phone}`);
  } else if (state.step === "awaiting_code") {
    const code = msg.text;
    const phone = state.phone;
    delete pendingAuth[msg.chat.id];

    bot.sendMessage(msg.chat.id, `⏳ Авторизация для ${phone}...`);

    exec(`node auth-manager.js ${phone} ${code}`, (error, stdout, stderr) => {
      if (error) {
        bot.sendMessage(msg.chat.id, `❌ Ошибка: ${error.message}`);
        return;
      }
      if (stderr) {
        bot.sendMessage(msg.chat.id, `⚠️ STDERR: ${stderr}`);
        return;
      }
      bot.sendMessage(msg.chat.id, `✅ Готово! Аккаунт ${phone} авторизован. Cookies сохранены.`);
    });
  }
});
