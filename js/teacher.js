import { doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-logic.js';
import { getTranslation } from './i18n.js';

export function renderTeacherScreen(container, lang) {
    container.innerHTML = `
        <div class="dashboard-container">
            <h2>${getTranslation(lang, 'teacher_dashboard')}</h2>
            
            <div class="card setup-card">
                <h3>🛠️ Setup Agent</h3>
                <label><strong>System Prompt:</strong></label>
                <textarea id="system-prompt" rows="3">Είσαι ένας Σωκρατικός βοηθός...</textarea>
                
                <div class="row">
                    <label>Max Questions:</label>
                    <input type="number" id="max-messages" value="15" style="width:60px;">
                </div>
                
                <div style="margin-top:10px;">
                    <input type="checkbox" id="research-consent-check">
                    <label for="research-consent-check">${getTranslation(lang, 'research_consent')}</label>
                </div>
            </div>

            <div class="card power-card" style="background:#f0f4c3; padding:15px; margin-top:15px; border-radius:8px;">
                <h3>🔐 Power User Login</h3>
                <div class="input-group" style="display:flex; gap:10px; align-items:center;">
                    <input type="text" id="power-user-id" placeholder="User ID" style="padding:8px;">
                    <input type="password" id="power-user-pin" placeholder="PIN" style="padding:8px; width:80px;">
                    <button id="load-config-btn" style="padding:8px 15px; background:#333; color:white; border:none; cursor:pointer;">Load</button>
                </div>
                <p id="key-status" style="margin-top:5px; font-weight:bold;"></p>
            </div>

            <button id="start-session-btn" class="primary-btn" style="margin-top:20px; padding:15px; width:100%; background:#4CAF50; color:white; font-size:1.2em; border:none; cursor:pointer;">Start Class</button>
            
            <div id="room-info" style="display:none; margin-top:20px; text-align:center;">
                <h3>Code: <span id="display-room-code" style="color:blue; font-size:1.5em;"></span></h3>
            </div>
        </div>
    `;

    // Logic: Φόρτωση με ID + PIN
    document.getElementById('load-config-btn').addEventListener('click', async () => {
        const powerId = document.getElementById('power-user-id').value.trim();
        const pin = document.getElementById('power-user-pin').value.trim();
        const statusEl = document.getElementById('key-status');

        if (!powerId || !pin) {
            statusEl.innerText = "⚠️ ID and PIN required.";
            return;
        }

        statusEl.innerText = "⏳ Verifying...";

        try {
            const docRef = doc(db, "configs", powerId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // ΕΔΩ ΓΙΝΕΤΑΙ Ο ΕΛΕΓΧΟΣ ΤΟΥ PIN
                if (data.pin === pin) {
                    localStorage.setItem('gemini_api_key', data.geminiKey);
                    statusEl.innerHTML = `<span style="color:green">✅ Verified! Key Loaded.</span>`;
                } else {
                    statusEl.innerHTML = `<span style="color:red">❌ Invalid PIN.</span>`;
                    localStorage.removeItem('gemini_api_key'); // Καθαρισμός για ασφάλεια
                }
            } else {
                statusEl.innerHTML = `<span style="color:red">❌ User ID not found.</span>`;
            }
        } catch (error) {
            console.error(error);
            statusEl.innerText = "❌ Connection Error";
        }
    });

    // Start Session Logic (ίδιο με πριν)
    document.getElementById('start-session-btn').addEventListener('click', async () => {
        // ... (Ο υπόλοιπος κώδικας παραμένει ίδιος)
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            alert("⚠️ Please load Power User Key first!");
            return;
        }
        
        // ... Δημιουργία δωματίου ...
        alert("Session Created! (Simulation)");
    });
}
