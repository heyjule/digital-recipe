import Groq from "groq-sdk";

// PERBAIKAN: Menambahkan parameter kedua 'instruksiKhusus' dengan nilai default kosong
export const generateRecipeDetails = async (resep: any, instruksiKhusus: string = "") => {
  // 1. Ambil API Key di DALAM fungsi
  const apiKey = (import.meta as any).env.VITE_GROQ_API_KEY;

  // 2. Validasi API Key
  if (!apiKey) {
    console.error("API Key Groq tidak ditemukan di .env");
    return {
      description: "Gagal memuat deskripsi AI.",
      steps: ["Pastikan API Key sudah terpasang di Environment Variables."]
    };
  }

  // 3. Buat instance Groq
  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  try {
    // Membersihkan data bahan dan alat agar AI mudah membaca
    const bahan = String(resep.bahan || '')
      .replace(/[{}"]/g, '') 
      .replace(/\|/g, ' ');

    const alat = String(resep.alat || '')
      .replace(/[{}"]/g, '')
      .replace(/[|;]/g, ', ');

    // 4. MERAKIT PROMPT (Memasukkan instruksiKhusus ke dalam prompt utama)
    const prompt = `
      Buat SOP profesional Balista Sushi & Tea dalam format JSON untuk menu: "${resep.nama}".
      Bahan: ${bahan}. 
      Alat: ${alat}.

      INSTRUKSI WAJIB:
      1. ${instruksiKhusus || "Pecah menjadi 8 langkah kerja detail, teknis, dan berurutan."}
      2. Gunakan pola: "Siapkan [bahan] menggunakan [alat]...".
      3. Pastikan langkah menyebutkan takaran yang ada di daftar bahan secara spesifik.
      4. Langkah terakhir (ke-8) WAJIB diakhiri dengan kalimat: "Menu siap disajikan."
      5. Kirim sebagai array langkah terpisah.

      FORMAT JSON WAJIB:
      {
        "description": "1 kalimat promosi singkat Balista.",
        "steps": ["Langkah 1", "Langkah 2", "Langkah 3", "Langkah 4", "Langkah 5", "Langkah 6", "Langkah 7", "Langkah 8"]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, 
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    // Pastikan kita selalu mengembalikan maksimal 8 langkah saja
    if (result.steps && result.steps.length > 8) {
        result.steps = result.steps.slice(0, 8);
    }

    return result;

  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};