export async function askGemini(prompt, apiKey, base64Image = null) {
    // Χρησιμοποιούμε το 2.5 Flash που επιβεβαιώσαμε ότι έχεις
    const modelName = "gemini-2.5-flash"; 
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    // Προσθήκη εικόνας (αν υπάρχει)
    if (base64Image) {
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        requestBody.contents[0].parts.push({
            inline_data: {
                mime_type: "image/jpeg",
                data: cleanBase64
            }
        });
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini API Error:", data.error);
            // Αν αποτύχει το 2.5, δοκιμάζουμε το γενικό 'gemini-pro'
            return `⚠️ Error: ${data.error.message}`;
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Network Error:", error);
        return "⚠️ Σφάλμα δικτύου ή κώδικα.";
    }
}
