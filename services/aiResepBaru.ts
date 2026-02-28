import Groq from "groq-sdk";

// @ts-ignore
const apiKey = (import.meta as any).env.VITE_GROQ_API_KEY;
const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

export const generateRecipeDetails = async (resep: any) => {
  try {
    const bahan = String(resep.bahan || '').replace(/[{}"]/g, '').replace(/\|/g, ', ');
    const alat = String(resep.alat || '').replace(/[{}"]/g, '').replace(/\|/g, ', ');

    const prompt = `
      Buat SOP profesional Balista Sushi & Tea dalam format JSON untuk menu: ${resep.nama}.
      Bahan: ${bahan}. Alat: ${alat}.

      INSTRUKSI WAJIB:
      1. Pecah menjadi 7-10 langkah kerja detail dan berurutan.
      2. Gunakan pola: "Siapkan [bahan] menggunakan [alat]...".
      3. Kirim sebagai array langkah terpisah (bukan satu paragraf).

      FORMAT JSON:
      {
        "description": "1 kalimat promosi singkat.",
        "steps": ["Langkah 1", "Langkah 2", "dst"]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};