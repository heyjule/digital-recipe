const GROQ_API_KEY = "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"; 

/**
 * Fungsi untuk generate detail resep sekaligus menentukan kategori secara otomatis
 * @param nama - Nama menu
 * @param deskripsi - Deskripsi awal (jika ada)
 * @param bahanRaw - Daftar bahan
 * @param alatRaw - Daftar alat
 * @param listKategori - String berisi daftar kategori (misal: "Nasi, Mie, Minuman, Snack")
 */
export const mintaResepKeAI = async (
  nama: string, 
  deskripsi: string, 
  bahanRaw: any, 
  alatRaw: any, 
  listKategori: string = ""
) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Anda adalah asisten koki profesional. 
            Tugas Anda: 
            1. Buat deskripsi menarik. 
            2. Buat langkah memasak yang logis berdasarkan bahan dan alat. 
            3. Pilih satu kategori yang paling cocok dari daftar kategori yang disediakan user.
            Berikan respon HANYA dalam format JSON murni.`
          },
          {
            role: "user",
            content: `Menu: ${nama}. 
            Bahan: ${bahanRaw}. 
            Alat: ${alatRaw}. 
            Daftar Kategori Tersedia: [${listKategori}].

            Format JSON yang diminta: 
            {
              "deskripsi": "...", 
              "langkah": ["langkah 1", "langkah 2", "..."],
              "kategori_disarankan": "pilih salah satu dari daftar kategori di atas"
            }`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Terjadi kesalahan pada server AI");
    }

    const content = JSON.parse(data.choices[0].message.content);
    
    return {
      deskripsi: content.deskripsi || `Resep lezat ${nama}`,
      langkah: Array.isArray(content.langkah) ? content.langkah : [],
      kategori_disarankan: content.kategori_disarankan || ""
    };

  } catch (error: any) {
    console.error("ERROR AI:", error.message);
    return { 
      deskripsi: "", 
      langkah: ["Maaf, terjadi kesalahan saat menyusun resep."],
      kategori_disarankan: "",
      error: error.message 
    };
  }
};