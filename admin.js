import { db } from "./firebase.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let adminEmails = [];

export async function loadAdmins() {
  try {
    const snap = await getDoc(doc(db, "settings", "admins"));

    if (snap.exists()) {
      adminEmails = snap.data().emails || [];
    }
  } catch (e) {
    console.error("管理者取得失敗", e);
  }
}

export function isAdmin(email) {
  return adminEmails.includes(email);
}
