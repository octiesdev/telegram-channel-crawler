// config.js

module.exports = {
    CONFIG: {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID,
      RESULT_FILE: "./results/results.json",
      QUEUE_FILE: "./queue.json"
    }
  };