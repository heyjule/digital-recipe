import Groq from "groq-sdk";

// Perbaikan pengambilan API Key agar lebih standar di Vite
const apiKey = (import.meta as any).env.VITE_GROQ_API_KEY;
const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

export const generateRecipeDetails = async (resep: any) => {
  try {
    /** * PERBAIKAN REGEX: 
     * Menghapus karakter aneh dari Postgres dan mengganti pipa (|) 
     * menjadi spasi agar AI lebih mudah membaca takarannya.
     */
    const bahan = String(resep.bahan || '')
      .replace(/[{}"]/g, '') 
      .replace(/\|/g, ' '); // Nasi|150|gr menjadi Nasi 150 gr

    const alat = String(resep.alat || '')
      .replace(/[{}"]/g, '')
      .replace(/[|;]/g, ', ');

    const prompt = `
      Buat SOP profesional Balista Sushi & Tea dalam format JSON untuk menu: "${resep.nama}".
      Bahan: ${bahan}. 
      Alat: ${alat}.

      INSTRUKSI WAJIB:
      1. Pecah menjadi 7-10 langkah kerja detail, teknis, dan berurutan.
      2. Gunakan pola: "Siapkan [bahan] menggunakan [alat]...".
      3. Pastikan langkah menyebutkan takaran yang ada di daftar bahan (misal: 150 gr Nasi).
      4. Kirim sebagai array langkah terpisah.

      FORMAT JSON WAJIB:
      {
        "description": "1 kalimat promosi singkat Balista.",
        "steps": ["Langkah 1", "Langkah 2", "dst"]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // Rendah agar konsisten
      response_format: { type: "json_object" }
    });

    // Parsing hasil dari AI
    const content = chatCompletion.choices[0]?.message?.content || "{}";
    return JSON.parse(content);

  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};