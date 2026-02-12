export const translations = {
    gr: {
        title: "SocraticAI",
        welcome: "Καλώς ήρθατε στο SocraticAI",
        teacher_btn: "Είσοδος Εκπαιδευτικού",
        student_btn: "Είσοδος Μαθητή",
        research_consent: "Συμφωνώ στη χρήση ανώνυμων δεδομένων για έρευνα",
        api_key_label: "Gemini API Key (Power User Mode)"
    },
    en: {
        title: "SocraticAI",
        welcome: "Welcome to SocraticAI",
        teacher_btn: "Teacher Login",
        student_btn: "Student Login",
        research_consent: "I consent to the use of anonymous data for research",
        api_key_label: "Gemini API Key (Power User Mode)"
    }
};

export function updateUI(lang) {
    document.getElementById('app-title').innerText = translations[lang].title;
    document.getElementById('btn-teacher').innerText = translations[lang].teacher_btn;
    document.getElementById('btn-student').innerText = translations[lang].student_btn;
}
