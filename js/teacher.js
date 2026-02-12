import { getTranslation } from './i18n.js';

export function renderTeacherScreen(container, lang) {
    container.innerHTML = `
        <h2>${getTranslation(lang, 'teacher_dashboard')}</h2>
        
        <div class="setup-card">
            <h3>1. Ρυθμίσεις Agent (Prompt)</h3>
            <textarea id="system-prompt" placeholder="Π.χ. Λειτούργησε ως Σωκρατικός δάσκαλος..."></textarea>
            
            <h3>2. Περιορισμοί</h3>
            <label>Μέγιστος αριθμός ερωτήσεων ανά ομάδα:</label>
            <input type="number" id="max-messages" value="15" min="1">
            
            <div class="research-section">
                <input type="checkbox" id="research-consent-check">
                <label for="research-consent-check">${getTranslation(lang, 'research_consent')}</label>
            </div>
        </div>

        <div class="power-user-section">
            <h3>3. Power User Mode</h3>
            <p>Το API Key σας θα χρησιμοποιηθεί για να διευκολύνει άλλους συναδέλφους.</p>
            <input type="password" id="power-api-key" placeholder="Εισάγετε το Gemini API Key">
            <button id="save-config-btn" class="role-btn">Αποθήκευση & Δημιουργία Δωματίου</button>
        </div>

        <div id="active-rooms" class="monitoring-grid">
            </div>
    `;

    document.getElementById('save-config-btn').addEventListener('click', () => {
        saveTeacherConfig();
    });
}

function saveTeacherConfig() {
    // Εδώ θα μπει η λογική αποθήκευσης στη Firebase
    const prompt = document.getElementById('system-prompt').value;
    const maxMsgs = document.getElementById('max-messages').value;
    const consent = document.getElementById('research-consent-check').checked;
    
    console.log("Config Saved:", { prompt, maxMsgs, consent });
    alert("Το δωμάτιο δημιουργήθηκε! Μπορείτε να μοιραστείτε τον κωδικό.");
}
