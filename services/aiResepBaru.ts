// @ts-nocheck
// Memasukkan API Key langsung agar fungsi generate berfungsi di website admin
const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const generateRecipeDetails = async (payload: any) => {
  const { namaMenu, bahan, alat } = payload;
  
  // Prompt yang memaksa AI memberikan kalimat utuh dalam array JSON
  const prompt = `Buat SOP detail resep "${namaMenu}". 
  Bahan asli: ${bahan}. Alat asli: ${alat}. 
  WAJIB JSON MURNI: {
    "description": "1 kalimat deskripsi menarik",
    "steps": ["Langkah 1...", "Langkah 2..."],
    "ingredients": [{"nama": "..", "jumlah": "..", "satuan": ".."}],
    "tools": [".."]
  }`;

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", 
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (response.status === 429) return { error: "rate_limit" };
    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};