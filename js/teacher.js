import { doc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-logic.js';
import { getTranslation } from './i18n.js';

let dashboardListener = null;

export function renderTeacherScreen(container, lang) {
    container.innerHTML = `
        <div id="setup-panel" class="dashboard-container">
            <div class="header-section" style="margin-bottom:20px;">
                <h2>${getTranslation(lang, 'teacher_dashboard')}</h2>
                <p class="subtitle">Ρυθμίστε τον AI Βοηθό σας με ακρίβεια.</p>
            </div>
            
            <div class="teacher-grid">
                
                <div class="card prompt-card">
                    <h3>🛠️ 1. AI Instructions</h3>
                    
                    <div class="form-group">
                        <label><strong>${getTranslation(lang, 'lbl_context')}</strong></label>
                        <textarea id="setup-context" class="input-lg" placeholder="${getTranslation(lang, 'ph_context')}"></textarea>
                    </div>

                    <div class="grid-2-col">
                        <div class="form-group">
                            <label><strong>${getTranslation(lang, 'lbl_grade')}</strong></label>
                            <input type="text" id="setup-grade" placeholder="${getTranslation(lang, 'ph_grade')}">
                        </div>
                        <div class="form-group">
                            <label><strong>${getTranslation(lang, 'lbl_goal')}</strong></label>
                            <input type="text" id="setup-goal" placeholder="${getTranslation(lang, 'ph_goal')}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label><strong>${getTranslation(lang, 'lbl_method')}</strong></label>
                        <textarea id="setup-method" class="input-lg" placeholder="${getTranslation(lang, 'ph_method')}"></textarea>
                    </div>

                    <div class="form-group">
                        <label><strong>${getTranslation(lang, 'lbl_rules')}</strong></label>
                        <textarea id="setup-rules" class="input-lg" placeholder="${getTranslation(lang, 'ph_rules')}"></textarea>
                    </div>
                </div>

                <div class="sidebar-col">
                    <div class="card auth-card sticky-card">
                        <h3>⚙️ 2. Settings & Launch</h3>
                        
                        <div class="settings-box" style="margin-bottom:15px;">
                            <label>Max Questions / Group:</label>
                            <input type="number" id="max-messages" value="15" style="font-size:1.1em; padding:8px;">
                        </div>

                        <div class="settings-box" style="margin-bottom:20px;">
                            <input type="checkbox" id="research-consent-check">
                            <label for="research-consent-check" style="display:inline; font-weight:normal;">${getTranslation(lang, 'research_consent')}</label>
                        </div>

                        <hr style="margin: 15px 0; border-top:1px dashed #ccc;">

                        <div class="api-box">
                            <label>🔑 <strong>Option A: Personal Key</strong></label>
                            <input type="password" id="personal-api-key" placeholder="Paste Gemini API Key" style="margin-bottom:5px;">
                            <button id="save-personal-key-btn" class="secondary-btn" style="width:100%;">Save Locally</button>
                        </div>

                        <div style="text-align:center; margin: 10px 0; font-size:0.8em; color:#999;">- OR -</div>

                        <div class="api-box" style="background:#f9f9f9; padding:10px; border-radius:8px;">
                            <label style="font-size:0.9em;">⚡ <strong>Option B: Workshop ID</strong></label>
                            <div style="display:flex; gap:5px;">
                                <input type="text" id="power-user-id" placeholder="ID" style="width:50%;">
                                <input type="password" id="power-user-pin" placeholder="PIN" style="width:30%;">
                                <button id="load-config-btn" style="width:20%; padding:0;">📥</button>
                            </div>
                        </div>

                        <p id="key-status-text" class="status-text" style="text-align:center; margin-top:10px; font-weight:bold; color:#666;">No Key Loaded</p>

                        <button id="start-session-btn" class="primary-btn big-start-btn" style="margin-top:20px;">
                            START CLASS 🚀
                        </button>
                    </div>
                </div>

            </div> </div>

        <div id="monitor-panel" style="display:none; height:85vh; padding:10px;">
            <div class="monitor-header">
                <h2 style="margin:0; color:white;">${getTranslation(lang, 'dashboard_monitor_title')}</h2>
                <div class="room-code-badge">Code: <span id="monitor-room-code">---</span></div>
            </div>

            <div class="monitor-grid">
                <div class="monitor-sidebar">
                    <div class="sidebar-header">${getTranslation(lang, 'dashboard_active_teams')}</div>
                    <div id="teams-list">
                        <p class="empty-state">${getTranslation(lang, 'dashboard_waiting')}</p>
                    </div>
                </div>

                <div class="monitor-main">
                    <div id="chat-header" class="chat-header">${getTranslation(lang, 'dashboard_select_team')}</div>
                    <div id="monitor-chat-area"></div>
                </div>
            </div>
        </div>
    `;

    // ---------------- LOGIC ---------------- //

    const statusEl = document.getElementById('key-status-text');

    // 1. Save Personal Key Logic
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

    // 2. Load Shared Key Logic (Power User)
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
                statusEl.innerText = "❌ Invalid ID/PIN";
                statusEl.style.color = "red";
                localStorage.removeItem('gemini_api_key');
            }
        } catch (error) {
            console.error(error);
            statusEl.innerText = "❌ Error";
        }
    });

    // 3. Start Session Logic
    document.getElementById('start-session-btn').addEventListener('click', async () => {
        const apiKey = localStorage.getItem('gemini_api_key');
        const consent = document.getElementById('research-consent-check').checked;

        if (!consent) return alert("Please agree to the research consent.");
        if (!apiKey) return alert("Please load an API Key first.");

        const context = document.getElementById('setup-context').value.trim() || "General Tutor";
        const grade = document.getElementById('setup-grade').value.trim() || "General Audience";
        const goal = document.getElementById('setup-goal').value.trim() || "Help the student learn.";
        const method = document.getElementById('setup-method').value.trim() || "Helpful and polite.";
        const rules = document.getElementById('setup-rules').value.trim() || "No specific limits.";

        const compiledPrompt = `
ROLE & CONTEXT: ${context}
TARGET AUDIENCE: ${grade}
GOALS: ${goal}
METHOD: ${method}
RULES: ${rules}
        `.trim();

        const roomCode = 'ROOM-' + Math.floor(1000 + Math.random() * 9000);

        try {
            const docRef = await addDoc(collection(db, "rooms"), {
                code: roomCode,
                teacherPrompt: compiledPrompt,
                maxMessages: parseInt(document.getElementById('max-messages').value),
                apiKey: apiKey,
                createdAt: serverTimestamp(),
                status: 'active'
            });

            // Switch to Monitor Mode
            document.getElementById('setup-panel').style.display = 'none';
            document.getElementById('monitor-panel').style.display = 'block';
            document.getElementById('monitor-room-code').innerText = roomCode;

            startLiveMonitoring(docRef.id);

        } catch (error) {
            console.error("Error creating room:", error);
            alert("Error creating room.");
        }
    });

    // --- LIVE MONITORING FUNCTION ---
    function startLiveMonitoring(roomDocId) {
        const teamsListEl = document.getElementById('teams-list');
        const chatAreaEl = document.getElementById('monitor-chat-area');
        const chatHeaderEl = document.getElementById('chat-header');
        
        let allMessages = [];
        let teams = {}; 
        let selectedStudentId = null;

        const q = query(collection(db, "rooms", roomDocId, "messages"), orderBy("timestamp", "asc"));
        
        dashboardListener = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const msg = change.doc.data();
                    allMessages.push(msg);

                    if (msg.studentId && !teams[msg.studentId]) {
                        teams[msg.studentId] = msg.studentName;
                        renderTeamList();
                    }

                    if (selectedStudentId === msg.studentId) {
                        appendMessageToChat(msg);
                    }
                }
            });
        });

        function renderTeamList() {
            teamsListEl.innerHTML = '';
            Object.keys(teams).forEach(sId => {
                const div = document.createElement('div');
                div.className = 'team-item';
                div.innerText = teams[sId];
                if (selectedStudentId === sId) div.classList.add('active');

                div.onclick = () => {
                    selectedStudentId = sId;
                    chatHeaderEl.innerText = `Chat: ${teams[sId]}`;
                    renderTeamList();
                    loadChatForStudent(sId);
                };
                teamsListEl.appendChild(div);
            });
        }

        function loadChatForStudent(sId) {
            chatAreaEl.innerHTML = '';
            const studentMsgs = allMessages.filter(m => m.studentId === sId);
            studentMsgs.forEach(msg => appendMessageToChat(msg));
            chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
        }

        function appendMessageToChat(msg) {
            const div = document.createElement('div');
            div.className = `msg-bubble ${msg.sender}`;
            
            if (msg.sender === 'student') {
                div.innerHTML = `<strong>${msg.studentName}:</strong> ${msg.text}`;
            } else if (msg.sender === 'ai') {
                div.innerHTML = `<strong>🤖 AI:</strong> ${msg.text}`;
            } else {
                div.innerHTML = `<em>${msg.text}</em>`;
            }
            chatAreaEl.appendChild(div);
            chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
        }
    }
}
