export const translations = {
    gr: {
        title: "SocraticAI",
        app_description: "Το SocraticAI είναι μια PWA εφαρμογή που επιτρέπει στους εκπαιδευτικούς να δημιουργούν εικονικές τάξεις όπου οι μαθητές (ατομικά ή σε ομάδες) συνομιλούν με έναν AI Tutor. Ο εκπαιδευτικός ορίζει τους κανόνες, το ύφος και τον στόχο της διδασκαλίας, ενώ παρακολουθεί ζωντανά (Live Monitoring) την πρόοδο όλων των ομάδων.",
        welcome: "Καλώς ήρθατε στο SocraticAI",
        teacher_btn: "Είσοδος Εκπαιδευτικού",
        student_btn: "Είσοδος Μαθητή",
        teacher_dashboard: "Πίνακας Ελέγχου Εκπαιδευτικού",
        research_consent: "Συμφωνώ στη χρήση ανώνυμων δεδομένων για έρευνα",
        
        // --- TEACHER PROMPT FIELDS ---
        lbl_context: "1. Θέμα & Ρόλος:",
        ph_context: "π.χ. Σεισμολογία. Είσαι ένας σοβαρός επιστήμονας.",
        lbl_grade: "2. Τάξη / Επίπεδο:",
        ph_grade: "π.χ. Γ' Γυμνασίου. Χρήση απλής γλώσσας.",
        lbl_goal: "3. Παιδαγωγικός Στόχος:",
        ph_goal: "π.χ. Να κατανοήσουν τα ρήγματα και να αναπτύξουν κριτική σκέψη.",
        lbl_method: "4. Μέθοδος & Ύφος:",
        ph_method: "π.χ. Σωκρατική μέθοδος. ΜΗΝ δίνεις έτοιμες απαντήσεις. Να είσαι ενθαρρυντικός.",
        lbl_rules: "5. Κανόνες & Περιορισμοί:",
        ph_rules: "π.χ. Max 3-4 ερωτήσεις ανά θέμα. Μην πλατιάζεις. Ζήτα διευκρινίσεις.",
        
        // --- SIDEBAR & MONITORING ---
        settings_and_launch: "Ρυθμίσεις & Έναρξη",
        max_questions_lbl: "Μέγιστες ερωτήσεις / Ομάδα",
        option_a_title: "Επιλογή Α: Προσωπικό Key",
        option_b_title: "Επιλογή Β: Workshop Mode",
        resume_session_title: "Συνέχιση Συνεδρίας",
        api_key_placeholder: "Επικολλήστε το API Key",
        btn_save_local: "Αποθήκευση τοπικά",
        or_text: "Ή",
        no_key_loaded: "Δεν έχει φορτωθεί Key",
        btn_start_class: "ΕΝΑΡΞΗ ΤΑΞΗΣ",
        prompt_updated: "Οι οδηγίες του AI ενημερώθηκαν!",
        broadcast_placeholder: "Μήνυμα προς όλες τις ομάδες...",
        btn_send_all: "Αποστολή σε όλους",
        dashboard_monitor_title: "Ζωντανή Παρακολούθηση Τάξης",
        dashboard_active_teams: "Ενεργές Ομάδες",
        dashboard_waiting: "Αναμονή για σύνδεση μαθητών...",
        dashboard_select_team: "Επιλέξτε μια ομάδα για να δείτε τη συνομιλία",

        // --- STUDENT KEYS ---
        student_name_placeholder: "Όνομα ή Ομάδα (π.χ. Ομάδα 1)",
        room_code_placeholder: "Κωδικός Δωματίου",
        join_room: "Είσοδος στο Δωμάτιο",
        searching: "🔍 Αναζήτηση...",
        room_not_found: "❌ Το δωμάτιο δεν βρέθηκε.",
        connection_error: "❌ Σφάλμα σύνδεσης.",
        questions_left: "απομένουν",
        no_questions: "Τέλος ερωτήσεων.",
        write_question: "Γράψε την ερώτησή σου...",
        thinking: "🤔 Σκέφτομαι...",
        welcome_ai: "Γεια σας! Είμαι έτοιμος να βοηθήσω.",
        enter_name_alert: "Παρακαλώ εισάγετε όνομα ή ομάδα."
    },
    en: {
        title: "SocraticAI",
        app_description: "SocraticAI is a PWA that allows educators to create virtual classrooms where students chat with an AI Tutor. The teacher defines the rules, tone, and goal while monitoring progress live.",
        welcome: "Welcome to SocraticAI",
        teacher_btn: "Teacher Login",
        student_btn: "Student Login",
        teacher_dashboard: "Teacher Dashboard",
        research_consent: "I consent to the use of anonymous data for research",
        
        // --- TEACHER PROMPT FIELDS ---
        lbl_context: "1. Topic & Role:",
        ph_context: "e.g. Seismology. You are a serious scientist.",
        lbl_grade: "2. Student Level:",
        ph_grade: "e.g. 9th Grade. Use simple language.",
        lbl_goal: "3. Pedagogical Goal:",
        ph_goal: "e.g. Understand fault lines and develop critical thinking.",
        lbl_method: "4. Method & Tone:",
        ph_method: "e.g. Socratic method. Do NOT give direct answers. Be encouraging.",
        lbl_rules: "5. Rules & Constraints:",
        ph_rules: "e.g. Max 3-4 turns per topic. Do not ramble. Ask for specifics.",
        
        // --- SIDEBAR & MONITORING ---
        settings_and_launch: "Settings & Launch",
        max_questions_lbl: "Max Questions / Group",
        option_a_title: "Option A: Personal Key",
        option_b_title: "Option B: Workshop Mode",
        resume_session_title: "Resume Session",
        api_key_placeholder: "Paste API Key",
        btn_save_local: "Save Locally",
        or_text: "OR",
        no_key_loaded: "No Key Loaded",
        btn_start_class: "START CLASS",
        prompt_updated: "AI instructions updated!",
        broadcast_placeholder: "Message to all teams...",
        btn_send_all: "Send to all",
        dashboard_monitor_title: "Live Class Monitoring",
        dashboard_active_teams: "Active Teams",
        dashboard_waiting: "Waiting for students to connect...",
        dashboard_select_team: "Select a team to see the chat",

        // --- STUDENT KEYS ---
        student_name_placeholder: "Name or Team (e.g. Team 1)",
        room_code_placeholder: "Room Code",
        join_room: "Join Room",
        searching: "🔍 Searching...",
        room_not_found: "❌ Room not found.",
        connection_error: "❌ Connection Error.",
        questions_left: "left",
        no_questions: "No questions left.",
        write_question: "Type your question...",
        thinking: "🤔 Thinking...",
        welcome_ai: "Hello! I am ready to help.",
        enter_name_alert: "Please enter a name or team."
    }
};

export function getTranslation(lang, key) {
    return translations[lang]?.[key] || key;
}

export function updateUI(lang) {
    const titleEl = document.getElementById('app-title');
    const teacherBtn = document.getElementById('btn-teacher');
    const studentBtn = document.getElementById('btn-student');

    if (titleEl) titleEl.innerText = getTranslation(lang, 'title');
    if (teacherBtn) teacherBtn.innerText = getTranslation(lang, 'teacher_btn');
    if (studentBtn) studentBtn.innerText = getTranslation(lang, 'student_btn');
}
