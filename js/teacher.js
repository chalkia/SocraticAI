import { doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-logic.js';
import { getTranslation } from './i18n.js';

export function renderTeacherScreen(container, lang) {
    container.innerHTML = `
        <div class="dashboard-container">
            <h2>${getTranslation(lang, 'teacher_dashboard')}</h2>
            
            <div class="card setup-card">
                <h3>🛠️ 1. Setup Class Agent</h3>
                <p style="font-size:0.9em; color:#666; margin-bottom:15px;">Define the AI's behavior precisely.</p>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="grid-column: span 2;">
                        <label><strong>${getTranslation(lang, 'lbl_context')}</strong></label>
                        <input type="text" id="setup-context" placeholder="${getTranslation(lang, 'ph_context')}" style="width:100%;">
                    </div>

                    <div>
                        <label><strong>${getTranslation(lang, 'lbl_grade')}</strong></label>
                        <input type="text" id="setup-grade" placeholder="${getTranslation(lang, 'ph_grade')}" style="width:100%;">
                    </div>

                    <div>
                        <label><strong>${getTranslation(lang, 'lbl_goal')}</strong></label>
                        <input type="text" id="setup-goal" placeholder="${getTranslation(lang, 'ph_goal')}" style="width:100%;">
                    </div>

                    <div style="grid-column: span 2;">
                        <label><strong>${getTranslation(lang, 'lbl_method')}</strong></label>
                        <textarea id="setup-method" rows="2" placeholder="${getTranslation(lang, 'ph_method')}" style="width:100%;"></textarea>
                    </div>

                    <div style="grid-column: span 2;">
                        <label><strong>${getTranslation(lang, 'lbl_rules')}</strong></label>
                        <textarea id="setup-rules" rows="2" placeholder="${getTranslation(lang, 'ph_rules')}" style="width:100%;"></textarea>
                    </div>
                </div>

                <hr>

                <div style="margin-top:10px;">
                    <label>Max Questions per Group:</label>
                    <input type="number" id="max-messages" value="15" style="width:60px;">
                </div>
                <div style="margin-top:10px;">
                    <input type="checkbox" id="research-consent-check">
                    <label for="research-consent-check">${getTranslation(lang, 'research_consent')}</label>
                </div>
            </div>

            <div class="card auth-card" style="border: 2px solid #4A90E2; padding: 15px; margin-top: 20px; border-radius: 8px;">
                <h3>🔑 2. API Key Authorization</h3>
                
                <div class="auth-option">
                    <h4>Option A: Use your own Key (Standard)</h4>
                    <input type="password" id="personal-api-key" placeholder="Paste Gemini API Key here" style="width: 100%; padding: 8px;">
                    <button id="save-personal-key-btn" style="margin-top: 5px; background: #4A90E2; color: white; border: none; padding: 8px 15px; cursor: pointer;">Save My Key</button>
                </div>

                <hr style="margin: 20px 0; border: 0; border-top: 1px dashed #ccc;">

                <div class="auth-option" style="opacity: 0.9;">
                    <h4>Option B: Power User Access (Workshop Mode)</h4>
                    <div style="display:flex; gap:5px;">
                        <input type="text" id="power-user-id" placeholder="ID" style="width: 40%;">
                        <input type="password" id="power-user-pin" placeholder="PIN" style="width: 30%;">
                        <button id="load-config-btn" style="width: 30%; background: #333; color: white; border: none; cursor: pointer;">Load Shared Key</button>
                    </div>
                </div>

                <div id="key-status-display" style="margin-top: 15px; padding: 10px; background: #f5f5f5; text-align: center; font-weight: bold;">
                    Status: <span id="key-status-text" style="color: #666;">No Key Loaded</span>
                </div>
            </div>

            <button id="start-session-btn" class="primary-btn" style="margin-top:20px; padding:15px; width:100%; background:#27ae60; color:white; font-size:1.2em; border:none; cursor:pointer;">Start Class 🚀</button>
            
            <div id="room-info" style="display:none; margin-top:20px; text-align:center;">
                <h3>Code: <span id="display-room-code" style="color:blue; font-size:1.5em;"></span></h3>
                <p>Waiting for students...</p>
            </div>
        </div>
    `;

    // ---------------- LOGIC ---------------- //

    const statusEl = document.getElementById('key-status-text');

    // ΛΕΙΤΟΥΡΓΙΑ 1: Αποθήκευση Προσωπικού Κλειδιού
    document.getElementById('save-personal-key-btn').addEventListener('click', () => {
        const personalKey = document.getElementById('personal-api-key').value.trim();
        if (personalKey) {
            localStorage.setItem('gemini_api_key', personalKey);
            statusEl.innerText = "✅ Personal Key Saved!";
            statusEl.style.color = "green";
            alert("Key Saved locally.");
        } else {
            alert("Please enter a key.");
        }
    });

    // ΛΕΙΤΟΥΡΓΙΑ 2: Power User Load
    document.getElementById('load-config-btn').addEventListener('click', async () => {
        const powerId = document.getElementById('power-user-id').value.trim();
        const pin = document.getElementById('power-user-pin').value.trim();

        if (!powerId || !pin) {
            statusEl.innerText = "⚠️ ID & PIN required";
            return;
        }

        statusEl.innerText = "⏳ Verifying...";
        try {
            const docRef = doc(db, "configs", powerId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().pin === pin) {
                localStorage.setItem('gemini_api_key', docSnap.data().geminiKey);
                statusEl.innerText = "✅ Shared Key Loaded";
                statusEl.style.color = "green";
            } else {
                statusEl.innerText = "❌ Invalid ID or PIN";
                statusEl.style.color = "red";
                localStorage.removeItem('gemini_api_key');
            }
        } catch (error) {
            console.error(error);
            statusEl.innerText = "❌ Connection Error";
        }
    });

    // ΛΕΙΤΟΥΡΓΙΑ 3: Start Session (ΣΥΝΘΕΣΗ PROMPT ME NEA ΔΟΜΗ)
    document.getElementById('start-session-btn').addEventListener('click', async () => {
        const apiKey = localStorage.getItem('gemini_api_key');
        const consent = document.getElementById('research-consent-check').checked;

        if (!consent) return alert("Please agree to the research consent.");
        if (!apiKey) return alert("Please load an API Key first.");

        // Λήψη δεδομένων
        const context = document.getElementById('setup-context').value.trim() || "General Tutor";
        const grade = document.getElementById('setup-grade').value.trim() || "General Audience";
        const goal = document.getElementById('setup-goal').value.trim() || "Help the student learn.";
        const method = document.getElementById('setup-method').value.trim() || "Helpful and polite.";
        const rules = document.getElementById('setup-rules').value.trim() || "No specific limits.";

        // --- Η ΜΑΓΕΙΑ: ΣΥΝΘΕΣΗ ΤΟΥ SYSTEM PROMPT ---
        // Αυτό μιμείται τη δομή του παραδείγματος που έστειλες
        const compiledPrompt = `
ROLE & CONTEXT:
You are an AI Tutor.
Topic/Role: ${context}

TARGET AUDIENCE:
Student Level: ${grade} (Adjust language complexity accordingly).

PEDAGOGICAL GOALS:
${goal}

BEHAVIOR & METHOD (The "Socratic" Approach):
${method}
- Do NOT provide direct answers if the method forbids it.
- Guide the student step-by-step.

STRICT CONSTRAINTS & RULES:
${rules}
- If a student asks unrelated questions, strictly adhere to these rules.
        `.trim();

        const roomCode = 'ROOM-' + Math.floor(1000 + Math.random() * 9000);

        try {
            await addDoc(collection(db, "rooms"), {
                code: roomCode,
                teacherPrompt: compiledPrompt, // Το σύνθετο prompt
                maxMessages: parseInt(document.getElementById('max-messages').value),
                apiKey: apiKey,
                createdAt: serverTimestamp(),
                status: 'active'
            });

            document.getElementById('room-info').style.display = 'block';
            document.getElementById('display-room-code').innerText = roomCode;
            localStorage.setItem('current_room_code', roomCode);
            document.getElementById('start-session-btn').style.display = 'none';

        } catch (error) {
            console.error("Error creating room:", error);
            alert("Error creating room.");
        }
    });
}
