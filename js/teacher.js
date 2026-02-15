import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-logic.js';
import { getTranslation } from './i18n.js';

let dashboardListener = null;

export function renderTeacherScreen(container, lang) {
    container.innerHTML = `
        <div id="setup-panel" class="dashboard-container">
            <div class="header-section" style="margin-bottom:20px;">
                <h2>${getTranslation(lang, 'teacher_dashboard')}</h2>
                <p class="subtitle">Ρυθμίστε τον AI Βοηθό σας και ξεκινήστε τη συνεδρία.</p>
            </div>
            
            <div class="teacher-grid">
                
                <div class="card prompt-card">
                    <h3><i class="fa-solid fa-robot"></i> 1. AI Instructions</h3>
                    
                    <div class="form-group">
                        <label><strong>${getTranslation(lang, 'lbl_context')} (Θέμα)</strong></label>
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
        <h3><i class="fa-solid fa-sliders"></i> 2. ${getTranslation(lang, 'settings_and_launch')}</h3>
        
        <div class="settings-box" style="margin-bottom:15px;">
            <label>${getTranslation(lang, 'max_questions_lbl')}:</label>
            <input type="number" id="max-messages" value="15" style="font-size:1.1em; padding:8px;">
        </div>

        <div class="settings-box" style="margin-bottom:20px;">
            <input type="checkbox" id="research-consent-check">
            <label for="research-consent-check" style="display:inline; font-weight:normal;">${getTranslation(lang, 'research_consent')}</label>
        </div>

        <hr style="margin: 15px 0; border-top:1px dashed #ccc;">

        <div class="api-box">
            <label><i class="fa-solid fa-key"></i> <strong>${getTranslation(lang, 'option_a_title')}</strong></label>
            <input type="password" id="personal-api-key" placeholder="${getTranslation(lang, 'api_key_placeholder')}" style="margin-bottom:5px;">
            <button id="save-personal-key-btn" class="secondary-btn" style="width:100%;">${getTranslation(lang, 'btn_save_local')}</button>
        </div>

        <div style="text-align:center; margin: 10px 0; font-size:0.8em; color:#999;">- ${getTranslation(lang, 'or_text')} -</div>

        <div class="api-box" style="background:#f9f9f9; padding:10px; border-radius:8px;">
            <label style="font-size:0.9em;"><i class="fa-solid fa-bolt"></i> <strong>${getTranslation(lang, 'option_b_title')}</strong></label>
            <div style="display:flex; gap:5px;">
                <input type="text" id="power-user-id" placeholder="ID" style="width:50%;">
                <input type="password" id="power-user-pin" placeholder="PIN" style="width:30%;">
                <button id="load-config-btn" style="width:20%; padding:0;"><i class="fa-solid fa-download"></i></button>
            </div>
        </div>

        <div class="api-box" style="margin-top:15px; border: 1px dashed var(--brand-cyan); padding:10px; border-radius:8px;">
            <label style="font-size:0.9em;"><i class="fa-solid fa-clock-rotate-left"></i> <strong>${getTranslation(lang, 'resume_session_title')}</strong></label>
            <div style="display:flex; gap:5px;">
                <input type="text" id="resume-room-id" placeholder="Document ID" style="font-size:0.8em;">
                <button id="resume-btn" class="secondary-btn" style="padding:5px 10px;"><i class="fa-solid fa-right-to-bracket"></i></button>
            </div>
        </div>

        <p id="key-status-text" class="status-text" style="text-align:center; margin-top:10px; font-weight:bold; color:#666;">${getTranslation(lang, 'no_key_loaded')}</p>

        <button id="start-session-btn" class="primary-btn big-start-btn" style="margin-top:20px;">
            ${getTranslation(lang, 'btn_start_class')} <i class="fa-solid fa-play"></i>
        </button>
    </div>
</div>
                
            </div>
        </div>

        <div id="monitor-panel" style="display:none; height:90vh; padding:10px;">
            <div class="monitor-header">
                <h2 style="margin:0; color:white;"><i class="fa-solid fa-desktop"></i> ${getTranslation(lang, 'dashboard_monitor_title')}</h2>
                <div class="room-code-badge">Code: <span id="monitor-room-code">---</span></div>
            </div>

            <div class="monitor-controls" style="background:#fff; padding:15px; border-bottom:2px solid #ddd; display:flex; gap:20px;">
                <div style="flex:1;">
                    <label style="font-size:0.8em; font-weight:bold;"><i class="fa-solid fa-pen-to-square"></i> LIVE PROMPT UPDATE</label>
                    <div style="display:flex; gap:10px;">
                        <textarea id="live-prompt-input" placeholder="Change AI behavior instructions..." style="height:40px; margin:0; font-size:0.9em;"></textarea>
                        <button id="update-prompt-btn" class="secondary-btn" style="background:var(--brand-cyan); color:white; border:none;"><i class="fa-solid fa-sync"></i> Update</button>
                    </div>
                </div>
                <div style="flex:1;">
                    <label style="font-size:0.8em; font-weight:bold;"><i class="fa-solid fa-bullhorn"></i> BROADCAST TO ALL TEAMS</label>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="broadcast-input" placeholder="Type a message to all students..." style="margin:0;">
                        <button id="broadcast-btn" class="secondary-btn" style="background:var(--brand-success); color:white; border:none;"><i class="fa-solid fa-paper-plane"></i> Send</button>
                    </div>
                </div>
            </div>

            <div class="monitor-grid" style="height: calc(100% - 120px);">
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
    let activeTeamsList = {};

    // 1. Save Personal Key
    document.getElementById('save-personal-key-btn').addEventListener('click', () => {
        const personalKey = document.getElementById('personal-api-key').value.trim();
        if (personalKey) {
            localStorage.setItem('gemini_api_key', personalKey);
            statusEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> Personal Key Saved!`;
            statusEl.style.color = "var(--brand-success)";
        }
    });

    // 2. Load Workshop Key
    document.getElementById('load-config-btn').addEventListener('click', async () => {
        const powerId = document.getElementById('power-user-id').value.trim();
        const pin = document.getElementById('power-user-pin').value.trim();
        if (!powerId || !pin) return;

        statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying...`;
        try {
            const docRef = doc(db, "configs", powerId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().pin === pin) {
                localStorage.setItem('gemini_api_key', docSnap.data().geminiKey);
                statusEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> Shared Key Loaded`;
                statusEl.style.color = "var(--brand-success)";
            } else {
                statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Invalid ID/PIN`;
                statusEl.style.color = "var(--brand-danger)";
            }
        } catch (e) { statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Error`; }
    });

    // 3. Resume Session
    document.getElementById('resume-btn').onclick = async () => {
        const roomId = document.getElementById('resume-room-id').value.trim();
        if (!roomId) return alert("Please enter a Room Document ID.");
        
        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (roomSnap.exists()) {
            localStorage.setItem('gemini_api_key', roomSnap.data().apiKey);
            document.getElementById('setup-panel').style.display = 'none';
            document.getElementById('monitor-panel').style.display = 'block';
            document.getElementById('monitor-room-code').innerText = roomSnap.data().code;
            startLiveMonitoring(roomId);
        } else {
            alert("Room not found!");
        }
    };

    // 4. Start New Session
    document.getElementById('start-session-btn').addEventListener('click', async () => {
        const apiKey = localStorage.getItem('gemini_api_key');
        const consent = document.getElementById('research-consent-check').checked;
        if (!consent || !apiKey) return alert("Check Consent and API Key!");

        const context = document.getElementById('setup-context').value.trim() || "General Learning";
        
        // --- UPGRADED COMPILED PROMPT ---
        const compiledPrompt = `
ROLE & CONTEXT: ${context}
TARGET AUDIENCE: ${document.getElementById('setup-grade').value.trim()}
GOALS: ${document.getElementById('setup-goal').value.trim()}
METHOD: ${document.getElementById('setup-method').value.trim()}
RULES: ${document.getElementById('setup-rules').value.trim()}

STRICT AI BEHAVIOR:
1. Your FIRST message MUST be a greeting in Greek/English stating: "I am your AI Tutor for ${context}. I will only answer questions related to this topic."
2. POLITELY REFUSE any questions that are irrelevant to "${context}".
3. Use Socratic Method: Ask questions, don't give answers.
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
            
            document.getElementById('setup-panel').style.display = 'none';
            document.getElementById('monitor-panel').style.display = 'block';
            document.getElementById('monitor-room-code').innerText = roomCode;
            startLiveMonitoring(docRef.id);
        } catch (e) { alert("Error launching class."); }
    });

    function startLiveMonitoring(roomDocId) {
        const teamsListEl = document.getElementById('teams-list');
        const chatAreaEl = document.getElementById('monitor-chat-area');
        const chatHeaderEl = document.getElementById('chat-header');
        
        let allMessages = [];
        let selectedStudentId = null;

        // --- BROADCAST LOGIC ---
        document.getElementById('broadcast-btn').onclick = async () => {
            const text = document.getElementById('broadcast-input').value.trim();
            if (!text) return;
            
            for (let sId in activeTeamsList) {
                await addDoc(collection(db, "rooms", roomDocId, "messages"), {
                    text: "[TEACHER BROADCAST]: " + text,
                    sender: "teacher",
                    studentId: sId,
                    timestamp: serverTimestamp()
                });
            }
            document.getElementById('broadcast-input').value = '';
            alert("Broadcast sent!");
        };

        // --- LIVE PROMPT UPDATE LOGIC ---
        document.getElementById('update-prompt-btn').onclick = async () => {
            const newPrompt = document.getElementById('live-prompt-input').value.trim();
            if (!newPrompt) return;
            await updateDoc(doc(db, "rooms", roomDocId), { teacherPrompt: newPrompt });
            alert("AI Instructions updated for this room!");
            document.getElementById('live-prompt-input').value = '';
        };

        const q = query(collection(db, "rooms", roomDocId, "messages"), orderBy("timestamp", "asc"));
        dashboardListener = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const msg = change.doc.data();
                    allMessages.push(msg);

                    if (msg.studentId && !activeTeamsList[msg.studentId]) {
                        activeTeamsList[msg.studentId] = msg.studentName;
                        renderTeamList();
                    }
                    if (selectedStudentId === msg.studentId) appendMessageToChat(msg);
                }
            });
        });

        function renderTeamList() {
            teamsListEl.innerHTML = '';
            Object.keys(activeTeamsList).forEach(sId => {
                const div = document.createElement('div');
                div.className = `team-item ${selectedStudentId === sId ? 'active' : ''}`;
                div.innerText = activeTeamsList[sId];
                div.onclick = () => {
                    selectedStudentId = sId;
                    chatHeaderEl.innerText = `Team: ${activeTeamsList[sId]}`;
                    renderTeamList();
                    loadChatForStudent(sId);
                };
                teamsListEl.appendChild(div);
            });
        }

        function loadChatForStudent(sId) {
            chatAreaEl.innerHTML = '';
            allMessages.filter(m => m.studentId === sId).forEach(msg => appendMessageToChat(msg));
        }

        function appendMessageToChat(msg) {
            const div = document.createElement('div');
            div.className = `msg-bubble ${msg.sender}`;
            const icon = msg.sender === 'student' ? 'fa-user' : (msg.sender === 'ai' ? 'fa-brain' : 'fa-chalkboard-user');
            const name = msg.sender === 'student' ? msg.studentName : (msg.sender === 'ai' ? 'AI' : 'Teacher');
            
            div.innerHTML = `<strong><i class="fa-solid ${icon}"></i> ${name}:</strong> ${msg.text}`;
            chatAreaEl.appendChild(div);
            chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
        }
    }
}
