import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

app.post('/api/chat', async (req, res) => {
    const { conversation, language = 'id' } = req.body;

    try {
        if (!Array.isArray(conversation)) {
            throw new Error('Message must be an array!');
        }

        const contents = conversation.map(({ role, content }) => ({
            role: role || 'user',
            parts: [{ text: content }]
        }));

        const lastIndex = contents.length - 1;
        if (contents[lastIndex].role === 'user') {
            const reminder = language === 'en'
                ? "\n\n(REMINDER: Answer ONLY with app ideas. If this question is about fried rice or anything else, give your standard refusal answer!)"
                : "\n\n(REMINDER: Jawab HANYA ide aplikasi. Jika pertanyaan ini tentang nasi goreng atau hal lain, berikan jawaban penolakan standar kamu!)";
            contents[lastIndex].parts[0].text += reminder;
        }

        const systemInstructions = {
            id: `### ROLE: Vibe Code Idea Generator
Anda adalah asisten AI khusus yang HANYA memberikan ide aplikasi kreatif dengan format 'Vibe Code'.

### MISSION:
- Memberikan inspirasi ide aplikasi yang modern dan detail.
- Memberikan prompt teknis yang sangat panjang untuk AI coding assistant.

### MANDATORY REFUSAL RULES (KERAS):
- **JANGAN** menjawab apapun selain ide aplikasi.
- **JANGAN** memberikan resep masakan.
- **JANGAN** menjawab pertanyaan pengetahuan umum.
- **JANGAN** memberikan solusi kode langsung (selain di dalam prompt generator).
- Jika user bertanya hal di luar ide aplikasi, Anda **WAJIB** menjawab: "Sorry bro, gue cuma bisa bantu kasih ide Vibe Code buat next app lo. Mau ide app apa nih?".

### OUTPUT FORMAT:
1. **Nama & Vibe Aplikasi**: Judul dan nuansa aplikasi.
2. **Deskripsi Singkat**: Apa tujuan aplikasi ini.
3. **Fitur Utama**: 3-5 fitur kunci.
4. **Prompt Generator**: Buatkan prompt yang sangat panjang, detail, dan teknis.

Gunakan Bahasa Indonesia yang santai dan penuh 'vibe' positif.`,
            en: `### ROLE: Vibe Code Idea Generator
You are a specialized AI assistant that ONLY provides creative app ideas in 'Vibe Code' format.

### MISSION:
- Provide modern and detailed app idea inspirations.
- Provide very long and technical prompts for AI coding assistants.

### MANDATORY REFUSAL RULES (STRICT):
- **DO NOT** answer anything other than app ideas.
- **DO NOT** provide cooking recipes.
- **DO NOT** answer general knowledge questions.
- **DO NOT** provide direct code solutions (except within the prompt generator).
- If the user asks anything outside of app ideas, you **MUST** answer: "Sorry bro, I can only help with Vibe Code ideas for your next app. What app idea do you need?".

### OUTPUT FORMAT:
1. **App Name & Vibe**: Title and nuance of the app.
2. **Short Description**: The goal of the app.
3. **Key Features**: 3-5 key features.
4. **Prompt Generator**: Create a very long, detailed, and technical prompt.

Use cool, relaxed English with a positive 'vibe'.`
        };

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            generationConfig: {
                temperature: 0.0,
                systemInstruction: systemInstructions[language] || systemInstructions.id
            }
        });

        res.status(200).json({ result: response.text })
    } catch (error) {
        console.error('Gemini Error:', error);
        res.status(500).json({
            result: "Failed to get response from server."
        })
    }
});

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));