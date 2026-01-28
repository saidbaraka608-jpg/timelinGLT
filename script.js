/* =========================================
   1. الإعدادات والجدول المعتمد مع التدوير (Rotation)
   ========================================= */

// الأسبوع الأول (الأساسي)
const WEEK_1_BASE = [
    { s1: ["Said", "Mohamed"], s2: "Youness", s3: "Youssef" }, // الاثنين
    { s1: ["Said", "Youness"], s2: "Mohamed", s3: "Youssef" }, // الثلاثاء
    { s1: ["Youness", "Mohamed"], s2: "Said", s3: "Youssef" }, // الأربعاء
    { s1: ["Said", "None"], s2: "Youness", s3: "Youssef" },    // الخميس
    { s1: ["Youness", "None"], s2: "Mohamed", s3: "Youssef" }, // الجمعة
    { s1: ["Mohamed", "None"], s2: "Said", s3: "Youness" },    // السبت
    { s1: ["Said", "None"], s2: "Mohamed", s3: "Youssef" }     // الأحد
];

// وظيفة التبديل بين الأسماء لإنشاء الأسابيع الأخرى
function rotateSchedule(base, nameA, nameB) {
    return base.map(day => {
        const newDay = JSON.parse(JSON.stringify(day));
        // تبديل في النوبة الأولى (المصفوفة)
        newDay.s1 = newDay.s1.map(name => name === nameA ? nameB : (name === nameB ? nameA : name));
        // تبديل في النوبة الثانية والثالثة
        if(newDay.s2 === nameA) newDay.s2 = nameB; else if(newDay.s2 === nameB) newDay.s2 = nameA;
        if(newDay.s3 === nameA) newDay.s3 = nameB; else if(newDay.s3 === nameB) newDay.s3 = nameA;
        return newDay;
    });
}

const DEFAULT_ROSTER = {
    "1": WEEK_1_BASE, // الأسبوع الأول كما هو
    "2": rotateSchedule(WEEK_1_BASE, "Said", "Youness"), // الأسبوع الثاني: بدل سعيد ويونس
    "3": rotateSchedule(WEEK_1_BASE, "Said", "Mohamed"), // الأسبوع الثالث: بدل سعيد ومحمد
    "4": WEEK_1_BASE  // الأسبوع الرابع: عد للأسبوع الأول
};

const SCHEDULE_CONFIG = {
    shifts: { 
        s1: { start: 9, end: 16, label: "09:00-16:00" }, 
        s2: { start: 16, end: 1, label: "16:00-01:00" }, 
        s3: { start: 1, end: 9, label: "01:00-09:00" } 
    },
    totalWeeks: 4
};

const phoneBook = { 
    "Youness": "0697277839", 
    "Said": "https://wa.me/qr/LFD2FXYV7HALL1", 
    "Mohamed": "0668344926", 
    "Youssef": "+212707760899" 
};

const staffNames = ["Youness", "Mohamed", "Said", "Youssef"];

const trans = {
    ar: { days: ["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"], edit: "تعديل", save: "حفظ", now: "الحالي", next: "التالي", off: "العطلة", w: "الأسبوع", day: "اليوم", resetConfirm: "هل تريد حقاً إعادة ضبط كافة البيانات لتطبيق التدوير الجديد؟" },
    fr: { days: ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"], edit: "Modifier", save: "Sauver", now: "Actuel", next: "Suivant", off: "Repos", w: "Semaine", day: "Jour", resetConfirm: "Réinitialiser pour appliquer la rotation ?" }
};

let lang = localStorage.getItem('g_lang') || 'ar', theme = localStorage.getItem('g_theme') || 'dark', isEdit = false;
let currentActualWeek = "1", viewingWeek = "1";

/* =========================================
   2. المنطق الوظيفي (Logic)
   ========================================= */

function getCurrentSystemWeek() {
    const now = new Date(), startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    return ((weekNumber - 1) % SCHEDULE_CONFIG.totalWeeks) + 1;
}

function initData() {
    currentActualWeek = getCurrentSystemWeek().toString();
    viewingWeek = currentActualWeek;
    if(!localStorage.getItem('g_data')) {
        localStorage.setItem('g_data', JSON.stringify(DEFAULT_ROSTER));
    }
}

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

function refreshLiveInfo() {
    const now = new Date(), hour = now.getHours(), dayIdx = (now.getDay() + 6) % 7;
    const allData = JSON.parse(localStorage.getItem('g_data'));
    const data = allData[currentActualWeek][dayIdx];
    const conf = SCHEDULE_CONFIG.shifts;
    let cur = "", nxt = "";

    if(hour >= conf.s1.start && hour < conf.s1.end) { cur = data.s1.join(" & "); nxt = data.s2; }
    else if(hour >= conf.s2.start || hour < conf.s2.end) { cur = data.s2; nxt = data.s3; }
    else { cur = data.s3; nxt = data.s1.join(" & "); }

    const clean = (s) => s.replace(/None| & None|None & /g, "").trim() || "...";
    document.getElementById('activeStaff').innerText = clean(cur);
    document.getElementById('nextStaff').innerText = clean(nxt);
    
    const callIcon = (n) => `<button onclick="handleAction('${n.trim()}')" class="call-btn"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg></button>`;
    document.getElementById('callNow').innerHTML = clean(cur).split("&").map(n => phoneBook[n.trim()] ? callIcon(n) : "").join("");
    document.getElementById('callNext').innerHTML = clean(nxt).split("&").map(n => phoneBook[n.trim()] ? callIcon(n) : "").join("");

    const off = staffNames.filter(s => ![...data.s1, data.s2, data.s3].includes(s));
    document.getElementById('offStaff').innerText = off.join(" & ") || "None";
}

function resetApp() {
    if (confirm(trans[lang].resetConfirm)) {
        localStorage.clear();
        location.reload();
    }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function closeModal() { document.getElementById('passModal').classList.add('hidden'); }
function closeContactModal() { document.getElementById('contactModal').classList.add('hidden'); }
function showToast() { const t = document.getElementById('copyToast'); t.style.display = 'block'; setTimeout(()=>t.style.display='none', 2000); }
function toggleLang() { lang = lang === 'ar' ? 'fr' : 'ar'; localStorage.setItem('g_lang', lang); updateUI(); }
function toggleTheme() { theme = theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('g_theme', theme); updateUI(); }
function changeWeekManually() { viewingWeek = document.getElementById('weekSelect').value; updateUI(); }

function handleEdit() { 
    if(isEdit) { isEdit=false; updateUI(); } 
    else { document.getElementById('passModal').classList.remove('hidden'); document.getElementById('passInput').focus(); } 
}

function checkPass() {
    const inp = document.getElementById('passInput'), card = document.getElementById('passCard');
    if(inp.value === "1990") { isEdit = true; closeModal(); updateUI(); } 
    else {
        card.classList.add('error-shake');
        document.getElementById('errorIcon').classList.remove('hidden');
        document.getElementById('passTitle').classList.add('text-rose-500');
        setTimeout(() => { inp.value = ""; card.classList.remove('error-shake'); }, 600);
    }
}

function handleAction(name) {
    const contact = phoneBook[name.trim()];
    if (!contact) return;
    if (contact.startsWith('http')) { window.open(contact, '_blank'); } 
    else {
        document.getElementById('contactName').innerText = name;
        document.getElementById('contactNumber').innerText = contact;
        document.getElementById('contactModal').classList.remove('hidden');
        document.getElementById('copyActionBtn').onclick = () => {
            navigator.clipboard.writeText(contact).then(() => { showToast(); closeContactModal(); });
        };
    }
}

function saveData(day, shift, sub, val) {
    let all = JSON.parse(localStorage.getItem('g_data'));
    if(sub === null) all[viewingWeek][day][shift] = val; 
    else all[viewingWeek][day][shift][sub] = val;
    localStorage.setItem('g_data', JSON.stringify(all)); 
    refreshLiveInfo();
}

window.onload = () => {
    initData(); 
    updateUI();
    setInterval(() => {
        const n = new Date();
        const locale = lang === 'ar' ? 'ar-MA' : 'fr-FR';
        const dayName = n.toLocaleDateString(locale, { weekday: 'long' });
        const timeStr = n.toLocaleTimeString(locale);
        document.getElementById('clock').innerText = `${dayName} | ${timeStr}`;
    }, 1000);
};
