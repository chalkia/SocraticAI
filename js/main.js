import { updateUI, translations } from './i18n.js';
import { renderTeacherScreen } from './teacher.js';
// Θα κάνουμε import το student αργότερα
// import { renderStudentScreen } from './student.js';

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
    if (teacherScreen.style.display === 'block') {
        renderTeacherScreen(teacherScreen, currentLang);
    }
});

// Χειρισμός κουμπιών Ρόλων
document.getElementById('btn-teacher').addEventListener('click', () => {
    switchScreen('teacher-screen');
    renderTeacherScreen(document.getElementById('teacher-screen'), currentLang);
});

document.getElementById('btn-student').addEventListener('click', () => {
    switchScreen('student-screen');
  import { renderStudentScreen } from './student.js'; // <--- Πρόσθεσε αυτό πάνω-πάνω


document.getElementById('btn-student').addEventListener('click', () => {
    switchScreen('student-screen');
    renderStudentScreen(document.getElementById('student-screen'), currentLang); // <--- Ενεργοποίησε αυτό
});
    document.getElementById('student-screen').innerHTML = `<h2>${translations[currentLang].student_btn} (Coming Soon)</h2>`;
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
