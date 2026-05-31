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
  await loadAdmins();

console.log("管理者判定", user.email);
console.log("isAdmin=", isAdmin(user.email));

if(!isAdmin(user.email)){
    location.href = "home.html";
}
});