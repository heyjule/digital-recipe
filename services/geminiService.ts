const GROQ_API_KEY = "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"; 

// --- 1. Fungsi untuk Generate SATU Menu ---
export const generateRecipeDetails = async (nama: string, deskripsi: string, bahanRaw: any, alatRaw: any) => {
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
            content: "Anda adalah asisten koki profesional. Berikan respon HANYA dalam format JSON murni."
          },
          {
            role: "user",
            content: `Buat resep mendetail untuk menu: ${nama}. Bahan: ${bahanRaw}. Alat: ${alatRaw}. 
            Format JSON: {"deskripsi": "...", "langkah": ["langkah 1", "langkah 2", "..."]}`
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
      langkah: content.langkah || ["Gagal memuat langkah."]
    };

  } catch (error: any) {
    console.error("ERROR AI:", error.message);
    return { 
      error: `Gagal: ${error.message}`,
      langkah: ["Maaf, silakan coba lagi beberapa saat lagi."] 
    };
  }
};

// --- 2. Fungsi untuk Generate SEMUA Menu Secara Otomatis (BULK) ---
export const bulkGenerateRecipes = async (menus: any[]) => {
  const updatedMenus = [];

  for (const menu of menus) {
    // Cek jika deskripsi atau langkah masih kosong/default
    const isStepEmpty = !menu.langkah || menu.langkah.length === 0 || menu.langkah[0].includes("Gagal");
    
    if (isStepEmpty) {
      try {
        console.log(`🤖 AI sedang memproses menu: ${menu.nama}...`);
        
        // Panggil fungsi generate satuan
        const aiResult = await generateRecipeDetails(menu.nama, "", menu.bahan, menu.alat);
        
        updatedMenus.push({
          ...menu,
          deskripsi: aiResult.deskripsi,
          langkah: aiResult.langkah
        });

        // Jeda 1.5 detik agar API Groq tidak overload (Rate Limit)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error(`Gagal otomatisasi ${menu.nama}:`, error);
        updatedMenus.push(menu);
      }
    } else {
      // Jika sudah ada isinya, lewatkan saja (skip)
      updatedMenus.push(menu);
    }
  }
  return updatedMenus;
};

export const generateRecipeSteps = generateRecipeDetails;