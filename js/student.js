import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-logic.js';
import { askGemini } from './gemini-api.js';
import { getTranslation } from './i18n.js';

export function renderStudentScreen(container, lang) {
    container.innerHTML = `
        <div id="student-login" style="text-align:center; padding:20px;">
            <h2>${getTranslation(lang, 'student_btn')}</h2>
            <input type="text" id="room-code-input" placeholder="ROOM-XXXX" style="padding:10px; font-size:1.2em; text-transform:uppercase; width:200px;">
            <br><br>
            <button id="join-room-btn" class="primary-btn" style="background:#4A90E2; color:white; padding:10px 20px;">Join Room</button>
            <p id="login-error" style="color:red; margin-top:10px;"></p>
        </div>

        <div id="student-chat-ui" style="display:none; height:80vh; flex-direction:column;">
            <div style="background:#eee; padding:10px; display:flex; justify-content:space-between; align-items:center;">
                <span id="room-display" style="font-weight:bold;"></span>
                <span id="questions-left" style="background:#ff5722; color:white; padding:5px 10px; border-radius:15px; font-size:0.9em;"></span>
            </div>

            <div id="chat-messages" style="flex:1; overflow-y:auto; padding:10px; background:#f9f9f9; display:flex; flex-direction:column; gap:10px;">
                <div class="ai-msg" style="background:#e3f2fd; padding:10px; border-radius:10px; align-self:flex-start; max-width:80%;">
                    Γεια σου! Είμαι έτοιμος να σε βοηθήσω.
                </div>
            </div>

            <div style="padding:10px; background:white; border-top:1px solid #ddd; display:flex; gap:10px; align-items:center;">
                
                <label for="image-upload" style="cursor:pointer; font-size:1.5em;">📷</label>
                <input type="file" id="image-upload" accept="image/*" style="display:none;">
                
                <div id="img-preview" style="display:none; width:40px; height:40px; border:1px solid #ccc; background-size:cover;"></div>

                <textarea id="user-input" rows="1" placeholder="Γράψε την ερώτησή σου..." style="flex:1; padding:10px;"></textarea>
                
                <button id="send-btn" style="background:#27ae60; color:white; border:none; padding:10px 15px; border-radius:5px;">➤</button>
            </div>
        </div>
    `;

    // --- LOGIC ---
    let currentRoom = null;
    let questionsLeft = 0;
    let selectedImageBase64 = null;

    // 1. JOIN ROOM
    document.getElementById('join-room-btn').addEventListener('click', async () => {
        const code = document.getElementById('room-code-input').value.trim().toUpperCase();
        const errorEl = document.getElementById('login-error');
        errorEl.innerText = "Searching...";

        try {
            const q = query(collection(db, "rooms"), where("code", "==", code));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                errorEl.innerText = "❌ Room not found.";
            } else {
                // Βρήκαμε το δωμάτιο!
                const doc = querySnapshot.docs[0];
                currentRoom = doc.data();
                questionsLeft = currentRoom.maxMessages;

                // Εμφάνιση Chat UI
                document.getElementById('student-login').style.display = 'none';
                document.getElementById('student-chat-ui').style.display = 'flex';
                document.getElementById('room-display').innerText = `Room: ${code}`;
                updateCounter();
            }
        } catch (err) {
            console.error(err);
            errorEl.innerText = "❌ Connection Error";
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

        // Προσθήκη μηνύματος χρήστη στο UI
        addMessage(text, 'user', selectedImageBase64);
        inputEl.value = '';
        
        // Καθαρισμός εικόνας
        const imageToSend = selectedImageBase64;
        selectedImageBase64 = null;
        document.getElementById('img-preview').style.display = 'none';
        document.getElementById('image-upload').value = ''; // Reset file input

        // Μείωση ορίου
        questionsLeft--;
        updateCounter();

        // Προετοιμασία Prompt (Συνδυασμός Οδηγίας Καθηγητή + Ερώτησης Μαθητή)
        const fullPrompt = `${currentRoom.teacherPrompt}\n\nStudent Question: ${text}`;

        // Ένδειξη ότι το AI σκέφτεται...
        const loadingId = addMessage("Thinking...", 'ai-loading');

        // Κλήση στο Gemini
        const response = await askGemini(fullPrompt, currentRoom.apiKey, imageToSend);

        // Αντικατάσταση του "Thinking..." με την απάντηση
        document.getElementById(loadingId).innerText = response;
        document.getElementById(loadingId).classList.remove('ai-loading');
    });

    function updateCounter() {
        const badge = document.getElementById('questions-left');
        badge.innerText = `${questionsLeft} left`;
        if (questionsLeft === 0) {
            badge.style.background = 'gray';
            document.getElementById('user-input').disabled = true;
            document.getElementById('user-input').placeholder = "No questions left.";
        }
    }

    function addMessage(text, type, img = null) {
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
            div.style.background = '#dcedc8'; // Light green
        } else {
            div.style.alignSelf = 'flex-start';
            div.style.background = '#e3f2fd'; // Light blue
        }

        // Αν υπάρχει εικόνα, βάλτην πριν το κείμενο
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
