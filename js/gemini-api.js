export async function askGemini(prompt, apiKey, base64Image = null, maxRetries = 3) {
    const modelName = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }]
    };

    if (base64Image) {
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        requestBody.contents[0].parts.push({
            inline_data: { mime_type: "image/jpeg", data: cleanBase64 }
        });
    }

    let delay = 1000; // Αρχική καθυστέρηση 1 δευτερόλεπτο

    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`[Gemini API] Προσπάθεια ${i + 1} από ${maxRetries}...`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            // Αν το API επιστρέψει δικό του αντικείμενο error
            if (data.error) {
                const errorCode = data.error.code;
                if (errorCode === 429 || errorCode === 503) {
                    console.warn(`[Gemini API] Φόρτος δικτύου (Code: ${errorCode}). Αποτυχία προσπάθειας ${i+1}.`);
                    
                    if (i < maxRetries - 1) {
                        console.log(`[Gemini API] Αναμονή ${delay}ms πριν την επόμενη προσπάθεια...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2; // Διπλασιασμός χρόνου
                        continue; // Πάμε στην επόμενη επανάληψη του for loop
                    }
                }
                // Αν είναι άλλο λάθος (π.χ. λάθος API key) ή εξαντλήθηκαν οι προσπάθειες
                throw new Error(data.error.message || "Άγνωστο σφάλμα από το API.");
            }

            console.log(`[Gemini API] Επιτυχής απάντηση!`);
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            // Αυτό πιάνει σφάλματα επιπέδου δικτύου (π.χ. κόπηκε το ίντερνετ) ή το throw από πάνω
            if (i === maxRetries - 1) {
                console.error("[Gemini API CRITICAL] Το API απέτυχε οριστικά:", error);
                throw error; // Το πετάμε στο student.js για να διαχειριστεί την αποτυχία
            }
        }
    }
}