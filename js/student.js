import { doc, collection, query, where, getDocs, limit, addDoc, serverTimestamp, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-logic.js';
import { askGemini } from './gemini-api.js';
import { getTranslation } from './i18n.js';

export function renderStudentScreen(container, lang) {
    if (!localStorage.getItem('socratic_lang')) {
        localStorage.setItem('socratic_lang', 'gr');
        lang = 'gr';
    }

    container.innerHTML = `
        <div id="student-setup" class="dashboard-container">
            <div class="header-section">
                <h2><i class="fa-solid fa-graduation-cap"></i> ${getTranslation(lang, 'student_btn')}</h2>
                <p class="subtitle">Εισάγετε τα στοιχεία σας για να ξεκινήσετε.</p>
            </div>
            
            <div class="card auth-card">
                <div class="form-group">
                    <label><strong>${getTranslation(lang, 'student_name_placeholder')}</strong></label>
                    <input type="text" id="student-name" placeholder="π.χ. Μαρία ή Ομάδα Α">
                </div>
                
                <div class="form-group">
                    <label><strong>${getTranslation(lang, 'room_code_placeholder')}</strong></label>
                    <div style="display:flex; align-items:center; border:1px solid #ccc; border-radius:5px; padding:5px; background:white;">
                        <span style="padding:5px 10px; background:#eee; color:#555; font-weight:bold; border-radius:3px; margin-right:10px;">ROOM-</span>
                        <input type="number" id="room-code-input" placeholder="1234" style="border:none; outline:none; font-size:1.2em; width:100%; letter-spacing: 2px;">
                    </div>
                </div>

                <div class="form-group" style="text-align:center; margin-bottom:20px;">
                    <label style="font-size:0.9em; color:#666;">Language / Γλώσσα</label>
                    <select id="card-lang-selector" style="padding:8px; border-radius:5px; border:1px solid #ccc; width:100%; font-size:1em;">
                        <option value="gr" ${lang === 'gr' ? 'selected' : ''}>🇬🇷 Ελληνικά</option>
                        <option value="en" ${lang === 'en' ? 'selected' : ''}>🇬🇧 English</option>
                    </select>
                </div>

                <button id="join-room-btn" class="primary-btn big-start-btn">
                    ${getTranslation(lang, 'join_room')} <i class="fa-solid fa-right-to-bracket"></i>
                </button>
                <p id="login-error" style="color:var(--brand-danger); margin-top:10px; font-weight:bold;"></p>
            </div>
        </div>

        <div id="student-chat-ui" style="display:none; height:90vh; flex-direction:column;">
            <div class="chat-header-bar">
                <span id="room-display" class="room-code-badge"></span>
                <span id="questions-left" class="msg-count-badge"></span>
            </div>

            <div id="chat-messages" class="chat-window"></div>

            <div class="chat-input-area">
                <label for="image-upload" class="secondary-btn" style="padding:10px; margin-right:5px; cursor:pointer;">
                    <i class="fa-solid fa-camera"></i>
                </label>
                <input type="file" id="image-upload" accept="image/*" capture="environment" style="display:none;">
                
                <div id="img-preview-container" style="display:none; position:relative; margin-right:5px;">
                    <div id="img-preview" style="width:40px; height:40px; border-radius:5px; background-size:cover; border:1px solid #ccc;"></div>
                    <button id="clear-img" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:15px; height:15px; font-size:10px; cursor:pointer;">x</button>
                </div>

                <textarea id="user-input" rows="1" placeholder="${getTranslation(lang, 'write_question')}" style="flex:1;"></textarea>
                <button id="send-btn" class="send-btn"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
    `;

    document.getElementById('card-lang-selector').addEventListener('change', (e) => {
        const newLang = e.target.value;
        localStorage.setItem('socratic_lang', newLang);
        location.reload(); 
    });

    let currentRoomData = null;
    let currentRoomDocId = null;
    let questionsLeft = 0;
    let selectedImageBase64 = null;
    let studentId = null;
    let studentName = "Anonymous";
    let chatHistory = []; 

    // 1. JOIN ROOM LOGIC
    document.getElementById('join-room-btn').addEventListener('click', async () => {
        const codeNum = document.getElementById('room-code-input').value.trim();
        const code = 'ROOM-' + codeNum;
        
        const nameInput = document.getElementById('student-name').value.trim();
        const errorEl = document.getElementById('login-error');
        
        if (!nameInput || !codeNum) {
            errorEl.innerText = "Please enter Name and Room Number.";
            return;
        }

        errorEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${getTranslation(lang, 'searching')}`;
        studentName = nameInput;

        try {
            const q = query(collection(db, "rooms"), where("code", "==", code));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                errorEl.innerText = getTranslation(lang, 'room_not_found');
            } else {
                const docSnap = querySnapshot.docs[0];
                if (docSnap.data().status !== 'active') {
                    errorEl.innerText = "Το δωμάτιο δεν είναι ενεργό.";
                    return;
                }

                currentRoomData = docSnap.data();
                currentRoomDocId = docSnap.id;
                questionsLeft = currentRoomData.maxMessages; 

                // --- SMART RESUME CHECK ---
                const existingStudentQuery = query(
                    collection(db, "rooms", currentRoomDocId, "messages"),
                    where("studentName", "==", studentName),
                    limit(1)
                );
                const existingSnap = await getDocs(existingStudentQuery);

                let isResuming = false;
                if (!existingSnap.empty) {
                    studentId = existingSnap.docs[0].data().studentId;
                    console.log("Resuming session for:", studentName, studentId);
                    isResuming = true;
                } else {
                    studentId = 'std-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                }
                
                chatHistory = []; 

                // --- UI SETUP ---
                document.getElementById('student-setup').style.display = 'none';
                document.getElementById('student-chat-ui').style.display = 'flex';
                document.getElementById('room-display').innerHTML = `<i class="fa-solid fa-door-open"></i> ${code}`;
                
                const globalLangBtn = document.getElementById('language-selector'); 
                if (globalLangBtn) globalLangBtn.style.display = 'none';

                startRealtimeListener(currentRoomDocId);

                onSnapshot(doc(db, "rooms", currentRoomDocId), (docSnap) => {
                    if (docSnap.exists()) {
                        currentRoomData.teacherPrompt = docSnap.data().teacherPrompt;
                    }
                });

                if (!isResuming) {
                    triggerSystemGreeting();
                } else {
                    recalculateQuestionsLeft(currentRoomDocId);
                }
                
                updateCounter();
            }
        } catch (err) {
            console.error(err);
            errorEl.innerText = getTranslation(lang, 'connection_error');
        }
    });

    async function recalculateQuestionsLeft(roomId) {
        const q = query(collection(db, "rooms", roomId, "messages"), where("studentId", "==", studentId), where("sender", "==", "student"));
        const snap = await getDocs(q);
        const used = snap.size;
        questionsLeft = currentRoomData.maxMessages - used;
        updateCounter();
    }

    // 2. REALTIME LISTENER
    function startRealtimeListener(roomId) {
        const q = query(collection(db, "rooms", roomId, "messages"), orderBy("timestamp", "asc"));
        
        onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const msg = change.doc.data();
                    if (msg.studentId === studentId || msg.sender === 'teacher' || (msg.sender === 'ai' && msg.studentId === studentId)) {
                        const existingMsg = document.getElementById(`msg-${msg.timestamp?.toMillis ? msg.timestamp.toMillis() : 'temp'}`);
                        if (!existingMsg) {
                            addMessageUI(msg.text, msg.sender, msg.image || null, false);
                            
                            if (msg.sender === 'student') chatHistory.push({ role: 'user', text: msg.text });
                            if (msg.sender === 'ai') chatHistory.push({ role: 'ai', text: msg.text });
                        }
                    }
                }
            });
        });
    }

    // 3. IMAGE HANDLING & SEND
    document.getElementById('image-upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                selectedImageBase64 = evt.target.result;
                document.getElementById('img-preview-container').style.display = 'block';
                document.getElementById('img-preview').style.backgroundImage = `url(${selectedImageBase64})`;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('clear-img').onclick = () => {
        selectedImageBase64 = null;
        document.getElementById('img-preview-container').style.display = 'none';
        document.getElementById('image-upload').value = '';
    };

    document.getElementById('send-btn').onclick = handleSendMessage;
    document.getElementById('user-input').onkeypress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    async function handleSendMessage() {
        const inputEl = document.getElementById('user-input');
        const text = inputEl.value.trim();

        if ((!text && !selectedImageBase64) || questionsLeft <= 0) return;

        const imageToSend = selectedImageBase64;
        const msgText = text;

        inputEl.value = '';
        selectedImageBase64 = null;
        document.getElementById('img-preview-container').style.display = 'none';
        document.getElementById('image-upload').value = '';
        
        questionsLeft--;
        updateCounter();

        await logMessageToDB("student", msgText, imageToSend);

        let fullPrompt = `
        === SYSTEM AUTHORITY ===
        The following instructions are the CURRENT, LIVE MANDATE from the teacher.
        OVERRIDE RULE: If these instructions conflict with any previous context, YOU MUST FOLLOW THESE NEW INSTRUCTIONS.
        
        === CURRENT INSTRUCTIONS ===
        ${currentRoomData.teacherPrompt}
        
        === END OF INSTRUCTIONS ===
        \n`;
        
        const recentHistory = chatHistory.slice(-6); 
        if (recentHistory.length > 0) {
            fullPrompt += "--- Chat History ---\n";
            recentHistory.forEach(msg => {
                fullPrompt += `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.text}\n`;
            });
            fullPrompt += "--- End of History ---\n\n";
        }
        fullPrompt += `Student: ${msgText}\n`;
        fullPrompt += `Tutor:`;

        chatHistory.push({ role: 'user', text: msgText });

        const loadingId = addMessageUI(getTranslation(lang, 'thinking'), 'ai-loading', null, true);

        try {
            const response = await askGemini(fullPrompt, currentRoomData.apiKey, imageToSend);
            
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            await logMessageToDB("ai", response);
            chatHistory.push({ role: 'ai', text: response });
            
        } catch (error) {
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) {
                loadingEl.innerText = "Error: " + error.message;
                loadingEl.style.color = "red";
            }
        }
    }

    // --- HELPERS ---
    async function triggerSystemGreeting() {
        const targetLanguage = lang === 'gr' ? 'Greek' : 'English';
        
        const greetingPrompt = `
        System Instruction: ${currentRoomData.teacherPrompt}
        
        IMMEDIATE TASK:
        1. Introduce yourself to the student named "${studentName}".
        2. IF a specific topic is defined in the instructions, mention it clearly.
        3. IF NO specific topic is defined (Open Mode), just offer your help generally.
        4. EXTREMELY IMPORTANT: Your output must be STRICTLY in ${targetLanguage}.
        `;
        
        const loadingId = addMessageUI(getTranslation(lang, 'thinking'), 'ai-loading', null, true);
        
        try {
            const response = await askGemini(greetingPrompt, currentRoomData.apiKey);
            document.getElementById(loadingId).remove();
            await logMessageToDB("ai", response);
            chatHistory.push({ role: 'ai', text: response });
        } catch (e) {
            document.getElementById(loadingId).remove();
        }
    }

    async function logMessageToDB(senderRole, messageText, image = null) {
        if (!currentRoomDocId) return;
        try {
            await addDoc(collection(db, "rooms", currentRoomDocId, "messages"), {
                studentId: studentId,
                studentName: studentName,
                sender: senderRole,
                text: messageText,
                image: image,
                timestamp: serverTimestamp()
            });
        } catch (error) { console.error("Error logging:", error); }
    }

    function updateCounter() {
        const badge = document.getElementById('questions-left');
        badge.innerText = `${questionsLeft} ${getTranslation(lang, 'questions_left')}`;
        if (questionsLeft === 0) {
            badge.style.background = 'gray';
            document.getElementById('user-input').disabled = true;
            document.getElementById('user-input').placeholder = getTranslation(lang, 'no_questions');
        }
    }

    function addMessageUI(text, type, img = null, isLocal = false) {
        const chatBox = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.id = 'msg-' + Date.now();
        div.className = `msg-bubble ${type}`;

        let iconClass = 'fa-brain';
        let senderName = 'AI';
        
        if (type === 'student' || type === 'user') {
            iconClass = 'fa-user';
            senderName = studentName;
        } else if (type === 'teacher') {
            iconClass = 'fa-chalkboard-user';
            senderName = 'Teacher';
        } else if (type === 'ai-loading') {
            iconClass = 'fa-spinner fa-spin';
            senderName = 'AI';
        }

        let contentHtml = `<strong><i class="fa-solid ${iconClass}"></i> ${senderName}:</strong> `;
        if (img) contentHtml += `<br><img src="${img}" style="max-width:200px; border-radius:8px; margin-top:5px; border:1px solid #ccc;"><br>`;
        contentHtml += text;
        div.innerHTML = contentHtml;

        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        return div.id;
    }
}
