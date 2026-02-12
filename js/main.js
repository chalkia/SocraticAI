// 1. ΟΛΑ ΤΑ IMPORTS ΣΤΗΝ ΚΟΡΥΦΗ
import { updateUI, translations } from './i18n.js';
import { renderTeacherScreen } from './teacher.js';
import { renderStudentScreen } from './student.js'; // <--- Τώρα είναι σωστά εδώ πάνω!

let currentLang = localStorage.getItem('lang') || 'gr';

// Αρχικοποίηση γλώσσας στο UI
document.getElementById('lang-selector').value = currentLang;
updateUI(currentLang);

// Listener για αλλαγή γλώσσας
document.getElementById('lang-selector').addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('lang', currentLang);
    updateUI(currentLang);
    
    // Αν είμαστε ήδη σε κάποια οθόνη, την ξανασχεδιάζουμε στη νέα γλώσσα
    const teacherScreen = document.getElementById('teacher-screen');
    const studentScreen = document.getElementById('student-screen');

    if (teacherScreen.style.display === 'block') {
        renderTeacherScreen(teacherScreen, currentLang);
    } else if (studentScreen.style.display === 'block') {
        renderStudentScreen(studentScreen, currentLang);
    }
});

// Χειρισμός κουμπιού ΕΚΠΑΙΔΕΥΤΙΚΟΥ
document.getElementById('btn-teacher').addEventListener('click', () => {
    switchScreen('teacher-screen');
    renderTeacherScreen(document.getElementById('teacher-screen'), currentLang);
});

// Χειρισμός κουμπιού ΜΑΘΗΤΗ (Καθαρό και σωστό)
document.getElementById('btn-student').addEventListener('click', () => {
    switchScreen('student-screen');
    renderStudentScreen(document.getElementById('student-screen'), currentLang);
});

// Βοηθητική συνάρτηση εναλλαγής οθονών
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}

// Register Service Worker για PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("SocraticAI: Service Worker Registered"));
}
