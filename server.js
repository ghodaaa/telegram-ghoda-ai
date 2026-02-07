const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const HUGGINGFACE_API_KEY = process.env.HF_API_KEY;

// (Better + more stable free model)
const HF_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";

app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
    try {
        const message = req.body.message;

        if (!message || !message.text) {
            return res.sendStatus(200);
        }

        const chatId = message.chat.id;
        const userText = message.text;

        // Call Hugging Face
        const apiResponse = await axios.post(
            HF_URL,
            {
                inputs: userText,
                parameters: {
                    max_new_tokens: 300,
                    temperature: 0.7,
                    return_full_text: false
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

        if (Array.isArray(apiResponse.data) && apiResponse.data[0]?.generated_text) {
            botReply = apiResponse.data[0].generated_text;
        } 
        else if (typeof apiResponse.data === "string") {
            botReply = apiResponse.data;
        }

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: botReply
        });

        res.sendStatus(200);

    } catch (error) {
        console.error("HF Error:", error.message);

        // Safe fallback (no undefined message bug now)
        if (req.body?.message?.chat?.id) {
            const chatId = req.body.message.chat.id;

            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: "⚠️ AI busy hai abhi (free server sleep). Thodi der baad try kar!"
            });
        }

        res.sendStatus(200); // avoid crashing bot
    }
});

app.get("/", (req, res) => {
    res.send("GHODA AI running with Hugging Face 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

