import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Αρχικοποίηση Firebase
const app = initializeApp(firebaseConfig);

// ΠΡΟΣΟΧΗ: Προσθέσαμε το "export" εδώ για να τη βλέπει το teacher.js
export const db = getFirestore(app);

// Συνάρτηση για να τραβάμε το API Key (Power User Logic)
export async function getPowerUserKey(teacherId) {
    try {
        const docRef = doc(db, "configs", teacherId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data().geminiKey; 
        } else {
            console.error("No API key found for this teacher ID:", teacherId);
            return null;
        }
    } catch (error) {
        console.error("Error fetching Power User Key:", error);
        return null;
    }
}
