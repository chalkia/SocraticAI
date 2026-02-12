import { collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-logic.js';
import { askGemini } from './gemini-api.js';
import { getTranslation } from './i18n.js';

export function renderStudentScreen(container, lang) {
    container.innerHTML = `
        <div id="student-login" style="text-align:center; padding:20px;">
            <h2>${getTranslation(lang, 'student_btn')}</h2>
            
            <div style="margin-bottom:15px;">
                <input type="text" id="student-name" placeholder="Όνομα ή Ομάδα (πχ Ομάδα 1)" style="padding:10px; font-size:1.1em; width:200px; margin-bottom:5px;">
            </div>
            
            <input type="text" id="room-code-input" placeholder="ROOM-CODE" style="padding:10px; font-size:1.2em; text-transform:uppercase; width:200px;">
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

                <textarea id="user-input" rows="1" placeholder="..." style="flex:1; padding:10px;"></textarea>
                <button id="send-btn" style="background:#27ae60; color:white; border:none; padding:10px 15px; border-radius:5px;">➤</button>
            </div>
        </div>
    `;

    // --- METABLHTES ---
    let currentRoomData = null; // Τα δεδομένα του δωματίου (prompt, maxMessages)
    let currentRoomDocId = null; // Το ID του εγγράφου στη Firebase (για να ξέρουμε πού να σώσουμε)
    let questionsLeft = 0;
    let selectedImageBase64 = null;
    let studentId = null; // Μοναδικό ID για τον μαθητή
    let studentName = "Anonymous";
    let chatHistory = []; // Τοπική μνήμη για το AI context

    // 1. JOIN ROOM LOGIC
    document.getElementById('join-room-btn').addEventListener('click', async () => {
        const code = document.getElementById('room-code-input').value.trim().toUpperCase();
        const nameInput = document.getElementById('student-name').value.trim();
        const errorEl = document.getElementById('login-error');
        
        if (!nameInput) {
            errorEl.innerText = "Please enter your name.";
            return;
        }

        errorEl.innerText = "Searching...";
        studentName = nameInput;

        try {
            // Ψάχνουμε το δωμάτιο με βάση τον κωδικό
            const q = query(collection(db, "rooms"), where("code", "==", code));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                errorEl.innerText = "❌ Room not found.";
            } else {
                const docSnap = querySnapshot.docs[0];
                currentRoomData = docSnap.data();
                currentRoomDocId = docSnap.id; // ΚΡΑΤΑΜΕ ΤΟ ID ΓΙΑ ΤΗ ΒΑΣΗ
                questionsLeft = currentRoomData.maxMessages;
                
                // Δημιουργία unique ID για τον μαθητή
                studentId = studentName + '_' + Date.now(); 

                // Καθαρισμός & UI
                chatHistory = []; 
                document.getElementById('student-login').style.display = 'none';
                document.getElementById('student-chat-ui').style.display = 'flex';
                document.getElementById('room-display').innerText = `Room: ${code} | ${studentName}`;
                updateCounter();

                // (Προαιρετικά) Καταγραφή εισόδου μαθητή στη βάση
                logMessageToDB("SYSTEM", `${studentName} joined the room.`);
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

        // --- ΒΗΜΑ 1: UI & LOCAL STATE ---
        addMessageUI(text, 'user', selectedImageBase64);
        inputEl.value = '';
        const imageToSend = selectedImageBase64;
        selectedImageBase64 = null;
        document.getElementById('img-preview').style.display = 'none';
        document.getElementById('image-upload').value = '';
        
        questionsLeft--;
        updateCounter();

        // --- ΒΗΜΑ 2: DB LOGGING (ΓΙΑ ΤΟΝ ΚΑΘΗΓΗΤΗ) ---
        // Σώζουμε τι είπε ο μαθητής στη βάση
        await logMessageToDB("student", text);

        // --- ΒΗΜΑ 3: AI GENERATION ---
        
        // Κατασκευή Prompt (με ιστορικό)
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

        // Update local history
        chatHistory.push({ role: 'user', text: text });

        // Loading Indicator
        const loadingId = addMessageUI("Thinking...", 'ai-loading');

        // Call Gemini
        const response = await askGemini(fullPrompt, currentRoomData.apiKey, imageToSend);

        // Update UI
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.innerText = response;
            loadingEl.classList.remove('ai-loading');
        }

        // --- ΒΗΜΑ 4: DB LOGGING (AI RESPONSE) ---
        // Σώζουμε τι απάντησε το AI στη βάση
        await logMessageToDB("ai", response);

        // Update local history
        chatHistory.push({ role: 'ai', text: response });
    });

    // --- ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ---

    // Νέα συνάρτηση: Στέλνει το μήνυμα στη Firebase
    async function logMessageToDB(senderRole, messageText) {
        if (!currentRoomDocId) return;

        try {
            // Αποθηκεύουμε στη διαδρομή: rooms/{roomID}/messages/{messageID}
            await addDoc(collection(db, "rooms", currentRoomDocId, "messages"), {
                studentId: studentId,      // Ποιος μαθητής (ID)
                studentName: studentName,  // Ποιος μαθητής (Όνομα - για ευκολία)
                sender: senderRole,        // 'student', 'ai', 'SYSTEM'
                text: messageText,
                timestamp: serverTimestamp() // Ώρα Server (για σωστή σειρά)
            });
        } catch (error) {
            console.error("Error logging to DB:", error);
        }
    }

    function updateCounter() {
        const badge = document.getElementById('questions-left');
        badge.innerText = `${questionsLeft} left`;
        if (questionsLeft === 0) {
            badge.style.background = 'gray';
            document.getElementById('user-input').disabled = true;
            document.getElementById('user-input').placeholder = "No questions left.";
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
            div.style.background = '#dcedc8'; 
        } else {
            div.style.alignSelf = 'flex-start';
            div.style.background = '#e3f2fd'; 
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
