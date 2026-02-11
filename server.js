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

  await bot.sendMessage(chatId, "🎬 Generating AI video... please wait (60–120s)");

  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    // Load Puter in browser
    await page.setContent(`
      <html>
      <head>
        <script src="https://js.puter.com/v2/"></script>
      </head>
      <body></body>
      </html>
    `);

    // Wait until Puter is fully loaded
    await page.waitForFunction(() => typeof puter !== "undefined", {
      timeout: 30000
    });

    const videoBase64 = await Promise.race([
      page.evaluate(
        async (userPrompt) => {
          try {
            const videoEl = await puter.ai.txt2vid(userPrompt, {
              model: "Wan-AI/Wan2.2-T2V-A14B"
            });

            const response = await fetch(videoEl.src);
            const blob = await response.blob();

            return await new Promise((resolve) => {
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => resolve(reader.result);
            });
          } catch (e) {
            return "WAN_ERROR:" + e.message;
          }
        },
        prompt
      ),

      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("WAN_TIMEOUT")), 150000)
      )
    ]);

    // If Wan returned an error, stop here
    if (typeof videoBase64 === "string" && videoBase64.startsWith("WAN_ERROR")) {
      throw new Error(videoBase64);
    }

    const videoBuffer = Buffer.from(
      videoBase64.split(",")[1],
      "base64"
    );

    await bot.sendVideo(chatId, videoBuffer, {
      caption: `🎥 AI Video for:\n"${prompt}"`
    });

  } catch (err) {
    console.error("FINAL ERROR:", err);
    await bot.sendMessage(
      chatId,
      "❌ Wan AI failed this time. Try a simpler prompt."
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
