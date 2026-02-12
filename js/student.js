import { collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-logic.js';
import { askGemini } from './gemini-api.js';
import { getTranslation } from './i18n.js';

export function renderStudentScreen(container, lang) {
    // Χρησιμοποιούμε τις μεταφράσεις στο HTML
    container.innerHTML = `
        <div id="student-login" style="text-align:center; padding:20px;">
            <h2>${getTranslation(lang, 'student_btn')}</h2>
            
            <div style="margin-bottom:15px;">
                <input type="text" id="student-name" placeholder="${getTranslation(lang, 'student_name_placeholder')}" style="padding:10px; font-size:1.1em; width:250px; margin-bottom:5px;">
            </div>
            
            <input type="text" id="room-code-input" placeholder="${getTranslation(lang, 'room_code_placeholder')}" style="padding:10px; font-size:1.2em; text-transform:uppercase; width:250px;">
            <br><br>
            <button id="join-room-btn" class="primary-btn" style="background:#4A90E2; color:white; padding:10px 20px;">${getTranslation(lang, 'join_room')}</button>
            <p id="login-error" style="color:red; margin-top:10px;"></p>
        </div>

        <div id="student-chat-ui" style="display:none; height:80vh; flex-direction:column;">
            <div style="background:#eee; padding:10px; display:flex; justify-content:space-between; align-items:center;">
                <span id="room-display" style="font-weight:bold;"></span>
                <span id="questions-left" style="background:#ff5722; color:white; padding:5px 10px; border-radius:15px; font-size:0.9em;"></span>
            </div>

            <div id="chat-messages" style="flex:1; overflow-y:auto; padding:10px; background:#f9f9f9; display:flex; flex-direction:column; gap:10px;">
                <div class="ai-msg" style="background:#e3f2fd; padding:10px; border-radius:10px; align-self:flex-start; max-width:80%;">
                    ${getTranslation(lang, 'welcome_ai')}
                </div>
            </div>

            <div style="padding:10px; background:white; border-top:1px solid #ddd; display:flex; gap:10px; align-items:center;">
                <label for="image-upload" style="cursor:pointer; font-size:1.5em;">📷</label>
                <input type="file" id="image-upload" accept="image/*" style="display:none;">
                <div id="img-preview" style="display:none; width:40px; height:40px; border:1px solid #ccc; background-size:cover;"></div>

                <textarea id="user-input" rows="1" placeholder="${getTranslation(lang, 'write_question')}" style="flex:1; padding:10px;"></textarea>
                <button id="send-btn" style="background:#27ae60; color:white; border:none; padding:10px 15px; border-radius:5px;">➤</button>
            </div>
        </div>
    `;

    // --- LOGIC ---
    let currentRoomData = null;
    let currentRoomDocId = null;
    let questionsLeft = 0;
    let selectedImageBase64 = null;
    let studentId = null;
    let studentName = "Anonymous";
    let chatHistory = []; 

    // 1. JOIN ROOM
    document.getElementById('join-room-btn').addEventListener('click', async () => {
        const code = document.getElementById('room-code-input').value.trim().toUpperCase();
        const nameInput = document.getElementById('student-name').value.trim();
        const errorEl = document.getElementById('login-error');
        
        if (!nameInput) {
            errorEl.innerText = getTranslation(lang, 'enter_name_alert');
            return;
        }

        errorEl.innerText = getTranslation(lang, 'searching');
        studentName = nameInput;

        try {
            const q = query(collection(db, "rooms"), where("code", "==", code));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                errorEl.innerText = getTranslation(lang, 'room_not_found');
            } else {
                const docSnap = querySnapshot.docs[0];
                currentRoomData = docSnap.data();
                currentRoomDocId = docSnap.id;
                questionsLeft = currentRoomData.maxMessages;
                
                // Δημιουργία ID
                studentId = studentName + '_' + Date.now(); 

                chatHistory = []; 
                document.getElementById('student-login').style.display = 'none';
                document.getElementById('student-chat-ui').style.display = 'flex';
                document.getElementById('room-display').innerText = `${code} | ${studentName}`;
                updateCounter();

                // Log entry
                logMessageToDB("SYSTEM", `${studentName} joined.`);
            }
        } catch (err) {
            console.error(err);
            errorEl.innerText = getTranslation(lang, 'connection_error');
        }
    });

    // 2. IMAGE HANDLING
    document.getElementById('image-upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                selectedImageBase64 = evt.target.result;
                const preview = document.getElementById('img-preview');
                preview.style.display = 'block';
                preview.style.backgroundImage = `url(${selectedImageBase64})`;
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. SEND MESSAGE
    document.getElementById('send-btn').addEventListener('click', async () => {
        const inputEl = document.getElementById('user-input');
        const text = inputEl.value.trim();

        if ((!text && !selectedImageBase64) || questionsLeft <= 0) return;

        addMessageUI(text, 'user', selectedImageBase64);
        inputEl.value = '';
        const imageToSend = selectedImageBase64;
        selectedImageBase64 = null;
        document.getElementById('img-preview').style.display = 'none';
        document.getElementById('image-upload').value = '';
        
        questionsLeft--;
        updateCounter();

        await logMessageToDB("student", text);

        // Prompt Construction
        let fullPrompt = `System Instruction: ${currentRoomData.teacherPrompt}\n\n`;
        const recentHistory = chatHistory.slice(-6); 
        if (recentHistory.length > 0) {
            fullPrompt += "--- Chat History ---\n";
            recentHistory.forEach(msg => {
                fullPrompt += `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.text}\n`;
            });
            fullPrompt += "--- End of History ---\n\n";
        }
        fullPrompt += `Student: ${text}\n`;
        fullPrompt += `Tutor:`;

        chatHistory.push({ role: 'user', text: text });

        // Loading message translated
        const loadingId = addMessageUI(getTranslation(lang, 'thinking'), 'ai-loading');

        const response = await askGemini(fullPrompt, currentRoomData.apiKey, imageToSend);

        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.innerText = response;
            loadingEl.classList.remove('ai-loading');
        }

        await logMessageToDB("ai", response);
        chatHistory.push({ role: 'ai', text: response });
    });

    async function logMessageToDB(senderRole, messageText) {
        if (!currentRoomDocId) return;
        try {
            await addDoc(collection(db, "rooms", currentRoomDocId, "messages"), {
                studentId: studentId,
                studentName: studentName,
                sender: senderRole,
                text: messageText,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error logging:", error);
        }
    }

    function updateCounter() {
        const badge = document.getElementById('questions-left');
        const countText = getTranslation(lang, 'questions_left');
        badge.innerText = `${questionsLeft} ${countText}`;
        
        if (questionsLeft === 0) {
            badge.style.background = 'gray';
            document.getElementById('user-input').disabled = true;
            document.getElementById('user-input').placeholder = getTranslation(lang, 'no_questions');
        }
    }

    function addMessageUI(text, type, img = null) {
        const chatBox = document.getElementById('chat-messages');
        const div = document.createElement('div');
        const id = 'msg-' + Date.now();
        div.id = id;
        
        div.style.padding = '10px';
        div.style.borderRadius = '10px';
        div.style.maxWidth = '80%';
        div.style.wordWrap = 'break-word';

        if (type === 'user') {
            div.style.alignSelf = 'flex-end';
            div.style.background = '#dcedc8'; // Πράσινο για τον χρήστη
        } else {
            div.style.alignSelf = 'flex-start';
            div.style.background = '#e3f2fd'; // Μπλε για το AI
        }

        if (img) {
            const imgEl = document.createElement('img');
            imgEl.src = img;
            imgEl.style.maxWidth = '100%';
            imgEl.style.borderRadius = '5px';
            imgEl.style.marginBottom = '5px';
            div.appendChild(imgEl);
        }

        const textNode = document.createElement('div');
        textNode.innerText = text;
        div.appendChild(textNode);

        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        return id;
    }
}
