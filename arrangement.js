import { db } from "./firebase.js";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const docRef = doc(db, "arrangements", "current");

const teamData = {};

/*export { teamData };*/

let teamOrder = [];

const result = document.getElementById("teamResult");

let memberPositions = {};
let checkedTeams = {};
let draggedName = null;

const orderedMemberList = [];

async function loadTeamsAndMembers(){

  const teamSnap = await getDoc(
    doc(db,"settings","teams")
  );

  teamOrder = teamSnap.data().names || [];

  const memberSnap = await getDocs(
    collection(db,"members")
  );

  memberSnap.forEach(docSnap=>{

    const name = docSnap.id;
    const team = docSnap.data().team;

    if(!teamData[team]){
      teamData[team] = [];
    }

    teamData[team].push(name);

  });

  orderedMemberList.length = 0;

teamOrder.forEach(team=>{

  if(!teamData[team]) return;

  teamData[team].forEach(name=>{

    orderedMemberList.push(
      team + " " + name
    );

  });

});

}

moveAbsenceBox();

window.addEventListener("resize", ()=>{
  moveAbsenceBox();
});

/* =========================
   初期ドキュメント作成
========================= */
async function ensureDocExists(){

  const snap = await getDoc(docRef);

  if(!snap.exists()){

    const initialMembers = {};
    const initialChecks = {};

    teamOrder.forEach(team=>{
      initialChecks[team] = false;
      teamData[team].forEach(name=>{
        initialMembers[team + " " + name] = "waiting";
      });
    });

    await setDoc(docRef,{
      members: initialMembers,
      checkedTeams: initialChecks
    });

  }
}

/* =========================
   チェック変更
========================= */
document.querySelectorAll(".left-panel input")
.forEach(box=>{

  box.addEventListener("change", async ()=>{

    checkedTeams[box.value] = box.checked;

    await setDoc(docRef,{
      checkedTeams: checkedTeams
    },{ merge:true });

  });

});

/* =========================
   ドラッグイベント
========================= */
function addDragEvent(element){

  element.addEventListener("dragstart",()=>{
    draggedName = element.textContent;
  });

}

/* =========================
   教室ドロップ
========================= */
document.querySelectorAll(".class-box")
.forEach(box=>{

  box.addEventListener("dragover",e=>e.preventDefault());

  box.addEventListener("drop",async e=>{

    e.preventDefault();
    if(!draggedName) return;

    memberPositions[draggedName] = box.dataset.room;

    await setDoc(docRef,{
      members: memberPositions
    },{ merge:true });

  });

});

/* =========================
   待機へ戻す
========================= */
result.addEventListener("dragover",e=>e.preventDefault());

result.addEventListener("drop",async e=>{

  e.preventDefault();
  if(!draggedName) return;

  memberPositions[draggedName] = "waiting";

  await setDoc(docRef,{
    members: memberPositions
  },{ merge:true });

});

/* =========================
   リアルタイム監視
========================= */
onSnapshot(docRef,snap=>{

  if(!snap.exists()) return;

  const data = snap.data();

  memberPositions = data.members || {};
  checkedTeams = data.checkedTeams || {};

  // チェック状態反映
  document.querySelectorAll(".left-panel input")
    .forEach(cb=>{
      cb.checked = checkedTeams[cb.value] || false;
    });

  renderAll();

});

/* =========================
   描画処理（DB基準）
========================= */
function renderAll(){

  // 教室初期化
  document.querySelectorAll(".class-box")
    .forEach(box=>{
      box.innerHTML = box.dataset.room;
    });

  // 左側初期化
  result.innerHTML = "";

  // 左側表示（チェックされたチームのみ）
  teamOrder.forEach(team=>{

    if(!checkedTeams[team]) return;

    teamData[team].forEach(name=>{

      const fullName = team + " " + name;

      if(memberPositions[fullName] &&
         memberPositions[fullName] !== "waiting"){
        return;
      }

      createMember(fullName,result);

    });

  });

  // 教室反映
  orderedMemberList.forEach(name=>{

    const room = memberPositions[name];
    if(!room || room === "waiting") return;

    const box = document.querySelector(
      `.class-box[data-room='${room}']`
    );

    if(box){
      createMember(name, box);
    }

  });

}

function moveAbsenceBox(){

  const absence = document.querySelector(
    ".class-box[data-room='欠席']"
  );

  const classArea  = document.querySelector(".class-area");
  const classArea2 = document.querySelector(".class-area2");

  /*
  if(window.innerWidth <= 1000){
      // 📱 スマホ → class-areaの中
      classArea.appendChild(absence);
  }else{
      // 💻 PC → class-area2へ移動
      classArea2.appendChild(absence);
  }
      */

}



function createMember(name,parent){

  const div = document.createElement("div");
  div.className = "member";
  div.textContent = name;
  div.draggable = true;

  // 🔥 チーム判定（先頭1文字）
  const team = name.charAt(0);

  if(teamOrder.includes(team)){
    div.classList.add("team-" + team);
  }

  addDragEvent(div);
  parent.appendChild(div);
}

/* =========================
   起動
========================= */

(async ()=>{

  await loadTeamsAndMembers();

  await ensureDocExists();

})();