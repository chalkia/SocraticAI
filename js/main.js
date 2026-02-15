import { getTranslation } from './i18n.js';
import { renderTeacherScreen } from './teacher.js';
import { renderStudentScreen } from './student.js';

let currentLang = localStorage.getItem('socratic_lang') || 'gr';

document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.lang = currentLang;
    const langSelector = document.getElementById('language-selector');
    if (langSelector) {
        langSelector.value = currentLang;
        langSelector.addEventListener('change', (e) => {
            currentLang = e.target.value;
            localStorage.setItem('socratic_lang', currentLang);
            document.documentElement.lang = currentLang;
            // Έξυπνο refresh: Αν είμαστε στην αρχική, ξαναδείξε την.
            if (!document.getElementById('monitor-panel') && !document.getElementById('student-chat-ui')) {
                renderWelcomeScreen();
            } else {
                location.reload(); // Για ασφάλεια στις ενεργές συνεδρίες
            }
        });
    }
    renderWelcomeScreen();
});

function renderWelcomeScreen() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="welcome-container">
            <img src="assets/icon-512.png" alt="Logo" class="welcome-logo">
            <h1 class="welcome-title">${getTranslation(currentLang, 'title')}</h1>
            <p class="welcome-description">${getTranslation(currentLang, 'app_description')}</p>
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
    document.getElementById('btn-teacher').onclick = () => renderTeacherScreen(appContainer, currentLang);
    document.getElementById('btn-student').onclick = () => renderStudentScreen(appContainer, currentLang);
}
