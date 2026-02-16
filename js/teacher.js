import { doc, getDoc, getDocs, collection, addDoc, updateDoc, serverTimestamp, onSnapshot, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
                                <button id="load-config-btn" style="width:20%; padding:0;"><i class="fa-solid fa-unlock"></i></button>
                            </div>
                        </div>

                        <div class="api-box" style="margin-top:15px; border: 1px dashed var(--brand-cyan); padding:10px; border-radius:8px;">
                            <label style="font-size:0.9em;"><i class="fa-solid fa-clock-rotate-left"></i> <strong>${getTranslation(lang, 'resume_session_title')}</strong></label>
                            
                            <div style="display:flex; align-items:center; background:white; border:1px solid #ccc; border-radius:4px;">
                                <span style="padding:5px 8px; background:#eee; color:#555; font-size:0.8em; font-weight:bold; border-right:1px solid #ccc;">ROOM-</span>
                                <input type="number" id="resume-room-id" placeholder="1234" style="border:none; padding:5px; width:100%; outline:none;">
                                <button id="resume-btn" class="secondary-btn" style="padding:5px 10px; margin:2px;"><i class="fa-solid fa-right-to-bracket"></i></button>
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
                        <textarea id="live-prompt-input" placeholder="Update AI instructions..." style="height:40px; margin:0; font-size:0.9em;"></textarea>
                        <button id="update-prompt-btn" class="secondary-btn" style="background:var(--brand-cyan); color:white;"><i class="fa-solid fa-sync"></i></button>
                    </div>
                </div>
                <div style="flex:1;">
                    <label style="font-size:0.8em; font-weight:bold;"><i class="fa-solid fa-bullhorn"></i> ${getTranslation(lang, 'btn_send_all')}</label>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="broadcast-input" placeholder="${getTranslation(lang, 'broadcast_placeholder')}" style="margin:0;">
                        <button id="broadcast-btn" class="secondary-btn" style="background:var(--brand-success); color:white;"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>

            <div class="monitor-grid" style="height: calc(100% - 130px);">
                <div class="monitor-sidebar">
                    <div class="sidebar-header">${getTranslation(lang, 'dashboard_active_teams')}</div>
                    <div id="teams-list">
                        <p class="empty-state">${getTranslation(lang, 'dashboard_waiting')}</p>
                    </div>
                </div>
                <div class="monitor-main" style="display:flex; flex-direction:column; height:100%; overflow:hidden;">
                    <div id="chat-header" class="chat-header">${getTranslation(lang, 'dashboard_select_team')}</div>
                    <div id="monitor-chat-area" style="flex:1; overflow-y:auto; padding:15px; padding-bottom:50px;"></div>
                </div>
            </div>
        </div>
    `;

    // ---------------- LOGIC ---------------- //

    const statusEl = document.getElementById('key-status-text');
    let activeTeamsList = {};

    document.getElementById('save-personal-key-btn').addEventListener('click', () => {
        const personalKey = document.getElementById('personal-api-key').value.trim();
        if (personalKey) {
            localStorage.setItem('gemini_api_key', personalKey);
            statusEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${getTranslation(lang, 'btn_save_local')}!`;
            statusEl.style.color = "var(--brand-success)";
        }
    });

    document.getElementById('load-config-btn').addEventListener('click', async () => {
        const powerId = document.getElementById('power-user-id').value.trim();
        const pin = document.getElementById('power-user-pin').value.trim();
        if (!powerId || !pin) return;
        statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${getTranslation(lang, 'searching')}`;
        try {
            const docRef = doc(db, "configs", powerId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().pin === pin) {
                localStorage.setItem('gemini_api_key', docSnap.data().geminiKey);
                statusEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${getTranslation(lang, 'option_b_title')} OK`;
                statusEl.style.color = "var(--brand-success)";
            } else {
                statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Error`;
                statusEl.style.color = "var(--brand-danger)";
            }
        } catch (e) { console.error(e); }
    });

    // --- RESUME SESSION (FIXED PREFIX) ---
    document.getElementById('resume-btn').onclick = async () => {
        // AUTO PREPEND 'ROOM-'
        const codeNum = document.getElementById('resume-room-id').value.trim();
        const codeInput = 'ROOM-' + codeNum;
        
        if (!codeNum) return alert(getTranslation(lang, 'room_code_placeholder'));
        
        statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>...`;
        try {
            const q = query(collection(db, "rooms"), where("code", "==", codeInput));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const roomDoc = querySnapshot.docs[0];
                const roomData = roomDoc.data();
                localStorage.setItem('gemini_api_key', roomData.apiKey);
                document.getElementById('setup-panel').style.display = 'none';
                document.getElementById('monitor-panel').style.display = 'block';
                document.getElementById('monitor-room-code').innerText = roomData.code;
                statusEl.innerHTML = "";
                startLiveMonitoring(roomDoc.id);
            } else {
                statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Not Found`;
                statusEl.style.color = "var(--brand-danger)";
            }
        } catch (e) { console.error(e); }
    };

    // --- START NEW SESSION ---
    document.getElementById('start-session-btn').addEventListener('click', async () => {
        const apiKey = localStorage.getItem('gemini_api_key');
        const consent = document.getElementById('research-consent-check').checked;
        if (!consent || !apiKey) return alert("Check API Key & Consent");

        const rawContext = document.getElementById('setup-context').value.trim();
        const contextVal = rawContext || "General Assistance"; 

        // Logic: Empty Context = Open Mode / Filled Context = Strict Mode
        let behaviorInstructions = "";
        if (rawContext) {
            behaviorInstructions = `
            STRICT TOPIC ENFORCEMENT:
            1. The specific topic is: "${rawContext}".
            2. You must POLITELY REFUSE questions that are completely unrelated to "${rawContext}".
            3. Your goal is to guide students back to this topic.
            `;
        } else {
            behaviorInstructions = `
            OPEN MODE:
            1. There is NO specific topic restriction.
            2. You are free to answer any educational or general knowledge question.
            3. Be helpful, polite, and safe.
            `;
        }

        const compiledPrompt = `
ROLE: AI Tutor
CONTEXT: ${contextVal}
TARGET AUDIENCE: ${document.getElementById('setup-grade').value.trim()}
GOALS: ${document.getElementById('setup-goal').value.trim()}
METHOD: ${document.getElementById('setup-method').value.trim()}
RULES: ${document.getElementById('setup-rules').value.trim()}

${behaviorInstructions}

GENERAL INSTRUCTION:
Use the Socratic method where appropriate.
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
        } catch (e) { console.error(e); }
    });

    function startLiveMonitoring(roomDocId) {
        const teamsListEl = document.getElementById('teams-list');
        const chatAreaEl = document.getElementById('monitor-chat-area');
        const chatHeaderEl = document.getElementById('chat-header');
        let allMessages = [];
        let selectedStudentId = null;

        document.getElementById('broadcast-btn').onclick = async () => {
            const text = document.getElementById('broadcast-input').value.trim();
            if (!text) return;
            for (let sId in activeTeamsList) {
                await addDoc(collection(db, "rooms", roomDocId, "messages"), {
                    text: "[TEACHER]: " + text,
                    sender: "teacher",
                    studentId: sId,
                    timestamp: serverTimestamp()
                });
            }
            document.getElementById('broadcast-input').value = '';
        };

        document.getElementById('update-prompt-btn').onclick = async () => {
            const newPrompt = document.getElementById('live-prompt-input').value.trim();
            if (!newPrompt) return;
            await updateDoc(doc(db, "rooms", roomDocId), { teacherPrompt: newPrompt });
            alert(getTranslation(lang, 'prompt_updated'));
        };

        const q = query(collection(db, "rooms", roomDocId, "messages"), orderBy("timestamp", "asc"));
        onSnapshot(q, (snapshot) => {
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
                    chatHeaderEl.innerText = activeTeamsList[sId];
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
            div.innerHTML = `<strong><i class="fa-solid ${icon}"></i>:</strong> ${msg.text}`;
            chatAreaEl.appendChild(div);
            chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
        }
    }
}
