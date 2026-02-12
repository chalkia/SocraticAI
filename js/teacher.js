import { doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-logic.js'; // Βεβαιώσου ότι αυτό το αρχείο υπάρχει
import { getTranslation } from './i18n.js';

export function renderTeacherScreen(container, lang) {
    // 1. Δημιουργία του HTML Template
    container.innerHTML = `
        <div class="dashboard-container">
            <h2>${getTranslation(lang, 'teacher_dashboard') || 'Teacher Dashboard'}</h2>
            
            <div class="card setup-card">
                <h3>🛠️ Setup Agent</h3>
                
                <label><strong>System Prompt:</strong></label>
                <textarea id="system-prompt" rows="4" placeholder="Π.χ. Είσαι ένας βοηθός φυσικής...">Είσαι ένας Σωκρατικός βοηθός. Μην δίνεις έτοιμες απαντήσεις, κάνε ερωτήσεις για να βοηθήσεις τον μαθητή να σκεφτεί.</textarea>
                
                <div class="row">
                    <div class="col">
                        <label><strong>Max Questions / Group:</strong></label>
                        <input type="number" id="max-messages" value="15" min="1">
                    </div>
                </div>

                <div class="research-box">
                    <input type="checkbox" id="research-consent-check">
                    <label for="research-consent-check">${getTranslation(lang, 'research_consent') || 'Συμφωνώ στη χρήση ανώνυμων δεδομένων για έρευνα'}</label>
                </div>
            </div>

            <div class="card power-card">
                <h3>🔑 Power User Access</h3>
                <p>Εισάγετε το ID σας για να φορτώσετε το κεντρικό API Key.</p>
                <div class="input-group">
                    <input type="text" id="power-user-id" placeholder="ID (π.χ. chalkia)">
                    <button id="load-config-btn" class="secondary-btn">Load Key</button>
                </div>
                <p id="key-status" class="status-msg"></p>
            </div>

            <button id="start-session-btn" class="primary-btn">🚀 Δημιουργία Δωματίου / Start Room</button>
            
            <div id="room-info" style="display:none; margin-top:20px;">
                <h3>Active Room Code: <span id="display-room-code" style="color:blue;"></span></h3>
                <div id="groups-grid" class="grid"></div>
            </div>
        </div>
    `;

    // 2. Event Listeners

    // A. Φόρτωση Κλειδιού από Firebase
    document.getElementById('load-config-btn').addEventListener('click', async () => {
        const powerId = document.getElementById('power-user-id').value.trim();
        const statusEl = document.getElementById('key-status');
        
        if (!powerId) {
            statusEl.innerText = "❌ Παρακαλώ εισάγετε ID.";
            return;
        }

        statusEl.innerText = "⏳ Αναζήτηση...";
        
        try {
            // Ψάχνουμε στη συλλογή 'configs' το έγγραφο με το ID που έδωσε ο χρήστης
            const docRef = doc(db, "configs", powerId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Αποθηκεύουμε το κλειδί στο localStorage για να το βρει το gemini-api.js αργότερα
                localStorage.setItem('gemini_api_key', data.geminiKey);
                statusEl.innerHTML = `✅ Επιτυχία! Κλειδί φορτώθηκε. <br><small>(Μην το μοιραστείτε)</small>`;
                statusEl.style.color = "green";
            } else {
                statusEl.innerText = "❌ Δεν βρέθηκε κλειδί με αυτό το ID.";
                statusEl.style.color = "red";
            }
        } catch (error) {
            console.error("Firebase Error:", error);
            statusEl.innerText = "❌ Σφάλμα σύνδεσης: " + error.message;
        }
    });

    // B. Εκκίνηση Συνεδρίας (Δημιουργία Δωματίου)
    document.getElementById('start-session-btn').addEventListener('click', async () => {
        const consent = document.getElementById('research-consent-check').checked;
        const prompt = document.getElementById('system-prompt').value;
        const maxMsgs = document.getElementById('max-messages').value;
        const apiKey = localStorage.getItem('gemini_api_key');

        // Έλεγχοι
        if (!consent) {
            alert("⚠️ Απαιτείται συγκατάθεση για την έρευνα.");
            return;
        }
        if (!apiKey) {
            alert("⚠️ Δεν βρέθηκε API Key. Χρησιμοποιήστε το Power User ID πρώτα.");
            return;
        }

        // Δημιουργία μοναδικού κωδικού δωματίου (π.χ. "ROOM-1234")
        const roomCode = 'ROOM-' + Math.floor(1000 + Math.random() * 9000);

        try {
            // Αποθηκεύουμε το δωμάτιο στη Firebase για να μπορούν να συνδεθούν οι μαθητές
            await addDoc(collection(db, "rooms"), {
                code: roomCode,
                teacherPrompt: prompt,
                maxMessages: parseInt(maxMsgs),
                createdAt: serverTimestamp(),
                status: 'active'
            });

            // Ενημέρωση UI
            document.getElementById('room-info').style.display = 'block';
            document.getElementById('display-room-code').innerText = roomCode;
            
            // Αποθήκευση τοπικά για να θυμόμαστε πού είμαστε
            localStorage.setItem('current_room_code', roomCode);
            
            alert(`Το δωμάτιο ${roomCode} δημιουργήθηκε!`);

        } catch (error) {
            console.error("Error creating room:", error);
            alert("Σφάλμα κατά τη δημιουργία δωματίου.");
        }
    });
}
