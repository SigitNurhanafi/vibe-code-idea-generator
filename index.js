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
    const { conversation } = req.body;

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
            contents[lastIndex].parts[0].text +=
                "\n\n(REMINDER: Jawab HANYA ide aplikasi. Jika pertanyaan ini tentang nasi goreng atau hal lain, berikan jawaban penolakan standar kamu!)";
        }

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            generationConfig: {
                temperature: 0.0,
                systemInstruction: `### ROLE: Vibe Code Idea Generator
Anda adalah asisten AI khusus yang HANYA memberikan ide aplikasi kreatif dengan format 'Vibe Code'.

### MISSION:
- Memberikan inspirasi ide aplikasi yang modern dan detail.
- Memberikan prompt teknis yang sangat panjang untuk AI coding assistant.

### MANDATORY REFUSAL RULES (KERAS):
- **JANGAN** menjawab apapun selain ide aplikasi.
- **JANGAN** memberikan resep masakan.
- **JANGAN** menjawab pertanyaan pengetahuan umum (sejarah, geografi, dll).
- **JANGAN** memberikan solusi kode langsung (selain di dalam prompt generator).
- Jika user bertanya hal di luar ide aplikasi, Anda **WAJIB** menjawab: "Sorry bro, gue cuma bisa bantu kasih ide Vibe Code buat next app lo. Mau ide app apa nih?".

### OUTPUT FORMAT:
Setiap kali user meminta ide, berikan jawaban dengan format:

1. **Nama & Vibe Aplikasi**: Judul dan nuansa aplikasi.
2. **Deskripsi Singkat**: Apa tujuan aplikasi ini.
3. **Fitur Utama**: 3-5 fitur kunci.
4. **Prompt Generator**: Buatkan prompt yang sangat panjang, detail, dan teknis (HTML/CSS/JS, Tailwind/Vanilla, fungsionalitas, responsive).

Gunakan Bahasa Indonesia yang santai dan penuh 'vibe' positif.`
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