const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ANSHAPI_URL = "https://anshapi-3ejk.onrender.com/anshapi/chat";

// Telegram webhook endpoint
app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
    try {
        const message = req.body.message;

        if (!message || !message.text) {
            return res.sendStatus(200);
        }

        const chatId = message.chat.id;
        const userText = message.text;

        // Call AnshAPI
        const apiResponse = await axios.get(ANSHAPI_URL, {
            params: { question: userText }
        });

        const botReply = apiResponse.data.response || "AI chup hai bkl 😶";

        // Send reply to Telegram
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: botReply
        });

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

// Simple home route
app.get("/", (req, res) => {
    res.send("Telegram Bot is Running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
