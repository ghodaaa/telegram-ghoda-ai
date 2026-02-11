import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { chromium } from "playwright";

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

app.get("/", (req, res) => {
  res.send("Wan AI Telegram Bot Running 🚀");
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🔥 Wan AI Video Bot Ready!\n\nUse:\n/video <your prompt>"
  );
});

bot.onText(/\/video (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const prompt = match[1];

  bot.sendMessage(chatId, "🎬 Generating AI video... please wait (60–120s)");

  try {
    // 1️⃣ Launch headless browser
    const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

    const page = await browser.newPage();

    // 2️⃣ Load Puter.js inside browser
    await page.setContent(`
      <html>
      <head>
        <script src="https://js.puter.com/v2/"></script>
      </head>
      <body></body>
      </html>
    `);

    // 3️⃣ Run Wan AI inside browser
    const videoBase64 = await Promise.race([
  page.evaluate(async (userPrompt) => {

      const videoEl = await puter.ai.txt2vid(userPrompt, {
        model: "Wan-AI/Wan2.2-T2V-A14B"
      });

      const response = await fetch(videoEl.src);
      const blob = await response.blob();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
      });
    }, prompt);

      }),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Wan AI timeout")), 150000)
  )
]);

    await browser.close();

    // 4️⃣ Convert Base64 → Buffer
    const videoBuffer = Buffer.from(
      videoBase64.split(",")[1],
      "base64"
    );

    // 5️⃣ Send video to Telegram
    await bot.sendVideo(chatId, videoBuffer, {
      caption: `🎥 AI Video for:\n"${prompt}"`
    });

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Failed to generate video. Try again.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

