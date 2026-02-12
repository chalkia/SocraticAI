export async function askGemini(prompt, apiKey, imageData = null) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-lite:generateContent?key=${apiKey}`;
    
    let contents = [{
        parts: [{ text: prompt }]
    }];

    // Αν υπάρχει εικόνα (Base64), την προσθέτουμε στο request
    if (imageData) {
        contents[0].parts.push({
            inline_data: {
                mime_type: "image/jpeg",
                data: imageData
            }
        });
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
