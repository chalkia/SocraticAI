import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Αρχικοποίηση Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Συνάρτηση για να τραβάμε το API Key που έχεις ορίσει εσύ στη βάση
export async function getPowerUserKey(teacherId) {
    const docRef = doc(db, "configs", teacherId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return docSnap.data().geminiKey; // Το κλειδί σου αποθηκευμένο στη Firebase
    } else {
        console.error("No API key found for this teacher.");
        return null;
    }
}
