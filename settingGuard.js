import { auth } from "./firebase.js";
import { loadAdmins, isAdmin } from "./admin.js";

auth.onAuthStateChanged(async user=>{

  if(!user){
    location.href = "index.html";
    return;
  }

  await loadAdmins();

  if(!isAdmin(user.email)){
    location.href = "home.html";
  }

});