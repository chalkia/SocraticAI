import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-logic.js';
import { askGemini } from './gemini-api.js';
import { getTranslation } from './i18n.js';

export function renderStudentScreen(container, lang) {
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
                    <input type="text" id="room-code-input" placeholder="ROOM-XXXX" style="text-transform:uppercase;">
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
                <input type="file" id="image-upload" accept="image/*" style="display:none;">
                
                <div id="img-preview-container" style="display:none; position:relative; margin-right:5px;">
                    <div id="img-preview" style="width:40px; height:40px; border-radius:5px; background-size:cover; border:1px solid #ccc;"></div>
                    <button id="clear-img" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:15px; height:15px; font-size:10px; cursor:pointer;">x</button>
                </div>

                <textarea id="user-input" rows="1" placeholder="${getTranslation(lang, 'write_question')}" style="flex:1;"></textarea>
                <button id="send-btn" class="send-btn"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
    `;

    // --- LOGIC VARIABLES ---
    let currentRoomData = null;
    let currentRoomDocId = null;
    let questionsLeft = 0;
    let selectedImageBase64 = null;
    let studentId = null;
    let studentName = "Anonymous";
    let chatHistory = []; 

    // 1. JOIN ROOM LOGIC
    document.getElementById('join-room-btn').addEventListener('click', async () => {
        const code = document.getElementById('room-code-input').value.trim().toUpperCase();
        const nameInput = document.getElementById('student-name').value.trim();
        const errorEl = document.getElementById('login-error');
        
        if (!nameInput) {
            errorEl.innerText = getTranslation(lang, 'enter_name_alert');
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
                // Έλεγχος αν το δωμάτιο είναι ενεργό
                if (docSnap.data().status !== 'active') {
                    errorEl.innerText = "Το δωμάτιο δεν είναι ενεργό.";
                    return;
                }

                currentRoomData = docSnap.data();
                currentRoomDocId = docSnap.id;
                questionsLeft = currentRoomData.maxMessages;
                
                studentId = 'std-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                chatHistory = []; 

                // UI Switch
                document.getElementById('student-setup').style.display = 'none';
                document.getElementById('student-chat-ui').style.display = 'flex';
                document.getElementById('room-display').innerHTML = `<i class="fa-solid fa-door-open"></i> ${code}`;
                updateCounter();

                // Listen for Broadcasts & Teacher Messages
                startRealtimeListener(currentRoomDocId);

                // Send Greeting Trigger to AI (Invisible System Prompt)
                triggerSystemGreeting();
            }
        } catch (err) {
            console.error(err);
            errorEl.innerText = getTranslation(lang, 'connection_error');
        }
    });

    // 2. REALTIME LISTENER (Για Broadcasts & History)
    function startRealtimeListener(roomId) {
        const q = query(collection(db, "rooms", roomId, "messages"), orderBy("timestamp", "asc"));
        
        onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const msg = change.doc.data();
                    
                    // Εμφανίζουμε: 
                    // 1. Τα δικά μας μηνύματα (studentId)
                    // 2. Μηνύματα καθηγητή (Broadcast ή Direct)
                    // 3. Απαντήσεις AI που αφορούν εμάς
                    if (msg.studentId === studentId || msg.sender === 'teacher' || (msg.sender === 'ai' && msg.studentId === studentId)) {
                        
                        // Αν το μήνυμα δεν υπάρχει ήδη στο UI (αποφυγή διπλοτύπων από το local addMessageUI)
                        const existingMsg = document.getElementById(`msg-${msg.timestamp?.toMillis ? msg.timestamp.toMillis() : 'temp'}`);
                        if (!existingMsg) {
                            addMessageUI(msg.text, msg.sender, msg.image || null, false); // false = not local instant render
                        }
                    }
                }
            });
        });
    }

    // 3. IMAGE HANDLING
    document.getElementById('image-upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                selectedImageBase64 = evt.target.result;
                const preview = document.getElementById('img-preview');
                document.getElementById('img-preview-container').style.display = 'block';
                preview.style.backgroundImage = `url(${selectedImageBase64})`;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('clear-img').addEventListener('click', () => {
        selectedImageBase64 = null;
        document.getElementById('img-preview-container').style.display = 'none';
        document.getElementById('image-upload').value = '';
    });

    // 4. SEND MESSAGE LOGIC
    document.getElementById('send-btn').addEventListener('click', handleSendMessage);
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    async function handleSendMessage() {
        const inputEl = document.getElementById('user-input');
        const text = inputEl.value.trim();

        if ((!text && !selectedImageBase64) || questionsLeft <= 0) return;

        // 1. Εμφάνισε το άμεσα στον χρήστη (Optimistic UI)
        addMessageUI(text, 'student', selectedImageBase64, true);
        
        const imageToSend = selectedImageBase64;
        const msgText = text; // Κρατάμε το κείμενο πριν καθαρίσουμε

        // Reset inputs
        inputEl.value = '';
        selectedImageBase64 = null;
        document.getElementById('img-preview-container').style.display = 'none';
        document.getElementById('image-upload').value = '';
        
        questionsLeft--;
        updateCounter();

        // 2. Log to Firestore
        await logMessageToDB("student", msgText, imageToSend);

        // 3. Prepare Gemini Prompt
        let fullPrompt = `System Instruction: ${currentRoomData.teacherPrompt}\n\n`;
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

        // 4. Show Loading Indicator
        const loadingId = addMessageUI(getTranslation(lang, 'thinking'), 'ai-loading');

        // 5. Call Gemini API
        try {
            const response = await askGemini(fullPrompt, currentRoomData.apiKey, imageToSend);
            
            // Remove loading and show real response
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            await logMessageToDB("ai", response);
            chatHistory.push({ role: 'ai', text: response });
            
            // Το UI θα ενημερωθεί αυτόματα από τον Realtime Listener ή μπορούμε να το κάνουμε manual αν θέλουμε πιο γρήγορα
            // Εδώ αφήνουμε τον listener να το κάνει για συνέπεια, ή το προσθέτουμε manual αν καθυστερεί η βάση.
            // Για τώρα, αφήνουμε τον listener να το πιάσει από το "added" event.

        } catch (error) {
            console.error(error);
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) {
                loadingEl.innerText = "Error: " + error.message;
                loadingEl.style.color = "red";
            }
        }
    }

    // --- HELPER FUNCTIONS ---

    async function triggerSystemGreeting() {
        // Καλούμε το AI να χαιρετήσει με βάση το Prompt
        const greetingPrompt = `
        System Instruction: ${currentRoomData.teacherPrompt}
        Task: Introduce yourself to the student named "${studentName}" based on the role and topic above. Keep it brief and welcoming.
        `;
        
        const loadingId = addMessageUI(getTranslation(lang, 'thinking'), 'ai-loading');
        
        try {
            const response = await askGemini(greetingPrompt, currentRoomData.apiKey);
            document.getElementById(loadingId).remove();
            
            await logMessageToDB("ai", response);
            chatHistory.push({ role: 'ai', text: response });
        } catch (e) {
            console.error("Greeting Error", e);
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
                image: image, // Αποθηκεύουμε και την εικόνα αν υπάρχει
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error logging:", error);
        }
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
        const id = 'msg-' + Date.now();
        div.id = id;
        div.className = `msg-bubble ${type}`; // Χρήση των CSS classes που φτιάξαμε

        // Icon Selection
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
        
        if (img) {
            contentHtml += `<br><img src="${img}" style="max-width:200px; border-radius:8px; margin-top:5px; border:1px solid #ccc;"><br>`;
        }
        
        contentHtml += text;
        div.innerHTML = contentHtml;

        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        return id;
    }
}
