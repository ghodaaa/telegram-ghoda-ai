const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const HUGGINGFACE_API_KEY = process.env.HF_API_KEY;

// You can change model later if you want
const HF_URL = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-1B-Instruct";

app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
    try {
        const message = req.body.message;

        if (!message || !message.text) {
            return res.sendStatus(200);
        }

        const chatId = message.chat.id;
        const userText = message.text;

        // Call Hugging Face API
        const apiResponse = await axios.post(
            HF_URL,
            {
                inputs: userText,
                parameters: {
                    max_new_tokens: 250,
                    temperature: 0.7
                }
            },
            {
                headers: {
                    "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let botReply = "🤖 Hmm... samajh nahi aaya, dobara bol.";

        if (apiResponse.data && apiResponse.data[0] && apiResponse.data[0].generated_text) {
            botReply = apiResponse.data[0].generated_text;
        }

        // Send response back to Telegram
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: botReply
        });

        res.sendStatus(200);

    } catch (error) {
        console.error("Error:", error.message);

        // Fallback message if AI fails
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: message.chat.id,
            text: "⚠️ AI busy hai abhi, thodi der baad try kar!"
        });

        res.sendStatus(500);
    }
});

app.get("/", (req, res) => {
    res.send("GHODA AI running with Hugging Face 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
