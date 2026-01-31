/* =========================================
   1. الإعدادات والجداول (Rotation Logic)
   ========================================= */
const WEEK_1_BASE = [
    { s1: ["Said", "Mohamed"], s2: "Youness", s3: "Youssef" }, // 0: الاثنين
    { s1: ["Said", "Youness"], s2: "Mohamed", s3: "Youssef" }, // 1: الثلاثاء
    { s1: ["Youness", "Mohamed"], s2: "Said", s3: "Youssef" }, // 2: الأربعاء
    { s1: ["Said", "None"], s2: "Youness", s3: "Youssef" },    // 3: الخميس
    { s1: ["Youness", "None"], s2: "Mohamed", s3: "Youssef" }, // 4: الجمعة
    { s1: ["Mohamed", "None"], s2: "Said", s3: "Youness" },    // 5: السبت
    { s1: ["Said", "None"], s2: "Mohamed", s3: "Youssef" }     // 6: الأحد
];

function rotateSchedule(base, nameA, nameB) {
    return base.map(day => {
        const newDay = JSON.parse(JSON.stringify(day));
        newDay.s1 = newDay.s1.map(n => n === nameA ? nameB : (n === nameB ? nameA : n));
        if(newDay.s2 === nameA) newDay.s2 = nameB; else if(newDay.s2 === nameB) newDay.s2 = nameA;
        if(newDay.s3 === nameA) newDay.s3 = nameB; else if(newDay.s3 === nameB) newDay.s3 = nameA;
        return newDay;
    });
}

const DEFAULT_ROSTER = {
    "1": WEEK_1_BASE,
    "2": rotateSchedule(WEEK_1_BASE, "Said", "Youness"),
    "3": rotateSchedule(WEEK_1_BASE, "Said", "Mohamed"),
    "4": WEEK_1_BASE
};

const phoneBook = { "Youness": "0697277", "Said": "0663775910", "Mohamed": "0668344", "Youssef": "070760" };
const staffNames = ["Youness", "Mohamed", "Said", "Youssef"];
const trans = {
    ar: { days: ["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"], edit: "تعديل", save: "حفظ", now: "الحالي", next: "التالي", off: "العطلة", w: "الأسبوع", day: "اليوم", resetConfirm: "إعادة ضبط لتصحيح التوقيت؟" },
    fr: { days: ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"], edit: "Modifier", save: "Sauver", now: "Actuel", next: "Suivant", off: "Repos", w: "Semaine", day: "Jour", resetConfirm: "Réinitialiser ?" }
};

let lang = localStorage.getItem('g_lang') || 'ar', theme = localStorage.getItem('g_theme') || 'dark', isEdit = false;
let currentActualWeek = "1", viewingWeek = "1";

/* =========================================
   2. المنطق الزمني المصلح (Corrected Time Logic)
   ========================================= */

function getCurrentSystemWeek() {
    const now = new Date(), startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    return ((weekNumber - 1) % 4) + 1;
}

function initData() {
    currentActualWeek = getCurrentSystemWeek().toString();
    viewingWeek = currentActualWeek;
    if(!localStorage.getItem('g_data')) localStorage.setItem('g_data', JSON.stringify(DEFAULT_ROSTER));
}

function refreshLiveInfo() {
    const now = new Date();
    const hour = now.getHours();
    // تحويل اليوم (0=الأحد إلى 6=السبت) ليتوافق مع مصفوفتنا (0=الاثنين)
    const dayIdx = (now.getDay() + 6) % 7; 
    
    const allData = JSON.parse(localStorage.getItem('g_data'));
    const currentData = allData[currentActualWeek][dayIdx];
    
    let cur = "", nxt = "";

    // حالة الصباح (09:00 إلى 16:00)
    if (hour >= 9 && hour < 16) {
        cur = currentData.s1.join(" & ");
        nxt = currentData.s2;
    } 
    // حالة المساء (16:00 إلى 01:00 ليلاً)
    else if (hour >= 16 || hour < 1) {
        cur = currentData.s2;
        nxt = currentData.s3;
    } 
    // حالة الفجر (01:00 إلى 09:00 صباحاً) - "المشكلة التي ذكرتها"
    else {
        cur = currentData.s3; 
        // الحل: بما أننا بالفعل في يوم الخميس تقويمياً، فصاحب نوبة 09:00 هو في نفس اليوم (currentData)
        nxt = currentData.s1.join(" & ");
    }

    const clean = (s) => s.replace(/None| & None|None & /g, "").trim() || "...";
    document.getElementById('activeStaff').innerText = clean(cur);
    document.getElementById('nextStaff').innerText = clean(nxt);
    
    const callIcon = (n) => `<button onclick="handleAction('${n.trim()}')" class="call-btn"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg></button>`;
    document.getElementById('callNow').innerHTML = clean(cur).split("&").map(n => phoneBook[n.trim()] ? callIcon(n) : "").join("");
    document.getElementById('callNext').innerHTML = clean(nxt).split("&").map(n => phoneBook[n.trim()] ? callIcon(n) : "").join("");

    const off = staffNames.filter(s => ![...currentData.s1, currentData.s2, currentData.s3].includes(s));
    document.getElementById('offStaff').innerText = off.join(" & ") || "None";
}

/* =========================================
   3. إدارة الواجهة (UI Management)
   ========================================= */
function updateUI() {
    const t = trans[lang];
    document.body.className = (lang === 'ar' ? 'rtl ' : 'ltr ') + (theme === 'light' ? 'light-mode' : '');
    document.getElementById('editBtn').innerText = isEdit ? t.save : t.edit;
    document.getElementById('weekSelect').value = viewingWeek;
    document.getElementById('labelW').innerText = t.w;
    document.getElementById('labelNow').innerText = t.now;
    document.getElementById('labelNext').innerText = t.next;
    document.getElementById('labelOff').innerText = t.off;
    document.getElementById('thDay').innerText = t.day;

    const data = JSON.parse(localStorage.getItem('g_data'))[viewingWeek];
    document.getElementById('tableBody').innerHTML = data.map((d, i) => `
        <tr>
            <td class="glass-card"><div class="cell-content"><span class="day-name">${t.days[i]}</span></div></td>
            <td class="glass-card"><div class="cell-content">
                <select ${!isEdit?'disabled':''} class="text-sky-400" onchange="saveData(${i},'s1',0,this.value)">${staffNames.concat("None").map(s=>`<option ${s==d.s1[0]?'selected':''}>${s}</option>`).join('')}</select>
                <div class="w-1/2 h-[1px] bg-white/10 my-1"></div>
                <select ${!isEdit?'disabled':''} class="text-sky-400" onchange="saveData(${i},'s1',1,this.value)">${staffNames.concat("None").map(s=>`<option ${s==d.s1[1]?'selected':''}>${s}</option>`).join('')}</select>
            </div></td>
            <td class="glass-card"><div class="cell-content"><select ${!isEdit?'disabled':''} class="text-orange-400" onchange="saveData(${i},'s2',null,this.value)">${staffNames.concat("None").map(s=>`<option ${s==d.s2?'selected':''}>${s}</option>`).join('')}</select></div></td>
            <td class="glass-card"><div class="cell-content"><select ${!isEdit?'disabled':''} class="text-purple-400" onchange="saveData(${i},'s3',null,this.value)">${staffNames.concat("None").map(s=>`<option ${s==d.s3?'selected':''}>${s}</option>`).join('')}</select></div></td>
        </tr>
    `).join('');
    refreshLiveInfo();
}

function resetApp() { if (confirm(trans[lang].resetConfirm)) { localStorage.clear(); location.reload(); } }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function closeModal() { document.getElementById('passModal').classList.add('hidden'); }
function closeContactModal() { document.getElementById('contactModal').classList.add('hidden'); }
function showToast() { const t = document.getElementById('copyToast'); t.style.display = 'block'; setTimeout(()=>t.style.display='none', 2000); }
function toggleLang() { lang = lang === 'ar' ? 'fr' : 'ar'; localStorage.setItem('g_lang', lang); updateUI(); }
function toggleTheme() { theme = theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('g_theme', theme); updateUI(); }
function changeWeekManually() { viewingWeek = document.getElementById('weekSelect').value; updateUI(); }
function handleEdit() { if(isEdit) { isEdit=false; updateUI(); } else { document.getElementById('passModal').classList.remove('hidden'); document.getElementById('passInput').focus(); } }

function checkPass() {
    const inp = document.getElementById('passInput'), card = document.getElementById('passCard');
    if(inp.value === "2022") { isEdit = true; closeModal(); updateUI(); } 
    else { card.classList.add('error-shake'); setTimeout(() => { inp.value = ""; card.classList.remove('error-shake'); }, 600); }
}

function handleAction(name) {
    const contact = phoneBook[name.trim()];
    if (!contact) return;
    if (contact.startsWith('http')) window.open(contact, '_blank');
    else {
        document.getElementById('contactName').innerText = name;
        document.getElementById('contactNumber').innerText = contact;
        document.getElementById('contactModal').classList.remove('hidden');
        document.getElementById('copyActionBtn').onclick = () => { navigator.clipboard.writeText(contact).then(() => { showToast(); closeContactModal(); }); };
    }
}

function saveData(day, shift, sub, val) {
    let all = JSON.parse(localStorage.getItem('g_data'));
    if(sub === null) all[viewingWeek][day][shift] = val; else all[viewingWeek][day][shift][sub] = val;
    localStorage.setItem('g_data', JSON.stringify(all)); refreshLiveInfo();
}

window.onload = () => {
    initData(); updateUI();
    setInterval(() => {
        const n = new Date();
        const locale = lang === 'ar' ? 'ar-MA' : 'fr-FR';
        document.getElementById('clock').innerText = `${n.toLocaleDateString(locale, { weekday: 'long' })} | ${n.toLocaleTimeString(locale)}`;
    }, 1000);
};
