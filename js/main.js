import { translations, getTranslation } from './i18n.js';
import { renderTeacherScreen } from './teacher.js';
import { renderStudentScreen } from './student.js';

// Ανάκτηση γλώσσας από τη μνήμη ή προεπιλογή 'gr'
let currentLang = localStorage.getItem('socratic_lang') || 'gr';

document.addEventListener('DOMContentLoaded', () => {
    // Ρύθμιση γλώσσας στο HTML tag
    document.documentElement.lang = currentLang;

    // Διαχείριση του Language Selector (αν υπάρχει στο HTML)
    const langSelector = document.getElementById('language-selector');
    if (langSelector) {
        langSelector.value = currentLang;
        langSelector.addEventListener('change', (e) => {
            currentLang = e.target.value;
            localStorage.setItem('socratic_lang', currentLang);
            document.documentElement.lang = currentLang;
            
            // Ανανέωση της οθόνης ανάλογα με το πού βρισκόμαστε
            // (Προς το παρόν κάνουμε reload την αρχική για απλότητα)
            renderWelcomeScreen();
        });
    }

    // Φόρτωση της Αρχικής Οθόνης
    renderWelcomeScreen();
});

function renderWelcomeScreen() {
    const appContainer = document.getElementById('app-container');
    
    // ΚΑΘΑΡΙΣΜΟΣ & ΝΕΟ HTML (Με Λογότυπο & Icons)
    appContainer.innerHTML = `
        <div class="welcome-container">
            <img src="assets/icon-512.png" alt="SocraticAI Logo" class="welcome-logo">
            
            <h1 class="welcome-title">${getTranslation(currentLang, 'title')}</h1>
            
            <p class="welcome-description">
                ${getTranslation(currentLang, 'app_description')}
            </p>
            
            <div class="role-selection">
                <button id="btn-teacher" class="role-btn teacher-role">
                    <i class="fa-solid fa-chalkboard-user"></i> ${getTranslation(currentLang, 'teacher_btn')}
                </button>
                <button id="btn-student" class="role-btn student-role">
                    <i class="fa-solid fa-graduation-cap"></i> ${getTranslation(currentLang, 'student_btn')}
                </button>
            </div>
        </div>
    `;

    // --- Event Listeners για τα Κουμπιά ---

    document.getElementById('btn-teacher').addEventListener('click', () => {
        renderTeacherScreen(appContainer, currentLang);
    });

    document.getElementById('btn-student').addEventListener('click', () => {
        renderStudentScreen(appContainer, currentLang);
    });
}
