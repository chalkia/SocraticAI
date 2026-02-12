export async function askGemini(prompt, apiKey, base64Image = null) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    // Αν υπάρχει εικόνα, την προσθέτουμε στο αίτημα
    if (base64Image) {
        // Καθαρίζουμε το header του base64 (π.χ. data:image/jpeg;base64,)
        const cleanBase64 = base64Image.split(',')[1]; 
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
            throw new Error(data.error.message);
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "⚠️ Error: " + error.message;
    }
}
