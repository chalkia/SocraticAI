import { updateUI } from './i18n.js';

let currentLang = localStorage.getItem('lang') || 'gr';

// Αρχικοποίηση γλώσσας
document.getElementById('lang-selector').value = currentLang;
updateUI(currentLang);

// Αλλαγή γλώσσας
document.getElementById('lang-selector').addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('lang', currentLang);
    updateUI(currentLang);
});

// Register Service Worker για PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("SocraticAI: Service Worker Registered"));
}
