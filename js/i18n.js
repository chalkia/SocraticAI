export const translations = {
    gr: {
        title: "SocraticAI",
        welcome: "Καλώς ήρθατε στο SocraticAI",
        teacher_btn: "Είσοδος Εκπαιδευτικού",
        student_btn: "Είσοδος Μαθητή",
        teacher_dashboard: "Πίνακας Ελέγχου Εκπαιδευτικού",
        research_consent: "Συμφωνώ στη χρήση ανώνυμων δεδομένων για έρευνα",
        api_key_label: "Gemini API Key (Power User Mode)",
        start_session: "Εκκίνηση Μαθήματος",
        room_created: "Το δωμάτιο δημιουργήθηκε!"
    },
    en: {
        title: "SocraticAI",
        welcome: "Welcome to SocraticAI",
        teacher_btn: "Teacher Login",
        student_btn: "Student Login",
        teacher_dashboard: "Teacher Dashboard",
        research_consent: "I consent to the use of anonymous data for research",
        api_key_label: "Gemini API Key (Power User Mode)",
        start_session: "Start Session",
        room_created: "Room created!"
    }
};

// Αυτή είναι η συνάρτηση που έλειπε!
export function getTranslation(lang, key) {
    return translations[lang]?.[key] || key;
}

export function updateUI(lang) {
    // Ενημέρωση τίτλων στην αρχική σελίδα
    const titleEl = document.getElementById('app-title');
    const teacherBtn = document.getElementById('btn-teacher');
    const studentBtn = document.getElementById('btn-student');

    if (titleEl) titleEl.innerText = getTranslation(lang, 'title');
    if (teacherBtn) teacherBtn.innerText = getTranslation(lang, 'teacher_btn');
    if (studentBtn) studentBtn.innerText = getTranslation(lang, 'student_btn');
}
