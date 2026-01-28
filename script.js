/* =========================================
   1. الإعدادات الأساسية (الدوريات)
   ========================================= */
const DEFAULT_ROSTER = {
    "1": Array(7).fill({ s1: ["Youness", "Said"], s2: "Mohamed", s3: "Youssef" }),
    "2": Array(7).fill({ s1: ["Mohamed", "Youssef"], s2: "Said", s3: "Youness" }),
    "3": Array(7).fill({ s1: ["Said", "Youness"], s2: "Youssef", s3: "Mohamed" }),
    "4": Array(7).fill({ s1: ["Youssef", "Mohamed"], s2: "Youness", s3: "Said" })
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
    ar: { days: ["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"], edit: "تعديل", save: "حفظ", now: "الحالي", next: "التالي", off: "العطلة", w: "الأسبوع", day: "اليوم" },
    fr: { days: ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"], edit: "Modifier", save: "Sauver", now: "Actuel", next: "Suivant", off: "Repos", w: "Semaine", day: "Jour" }
};

/* =========================================
   2. حالة التطبيق (State Management)
   ========================================= */
let lang = localStorage.getItem('g_lang') || 'ar';
let theme = localStorage.getItem('g_theme') || 'dark';
let isEdit = false;
let currentActualWeek = "1";
let viewingWeek = "1";

/* =========================================
   3. المنطق البرمجي الرئيسي
   ========================================= */

// حساب أسبوع النظام تلقائياً
function getCurrentSystemWeek() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    return ((weekNumber - 1) % SCHEDULE_CONFIG.totalWeeks) + 1;
}

// تهيئة البيانات عند أول تشغيل
function initData() {
    currentActualWeek = getCurrentSystemWeek().toString();
    viewingWeek = currentActualWeek;
    if(!localStorage.getItem('g_data')) {
        localStorage.setItem('g_data', JSON.stringify(DEFAULT_ROSTER));
    }
}

// تحديث الواجهة بالكامل
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
    document.getElementById('thShift1').innerText = SCHEDULE_CONFIG.shifts.s1.label;
    document.getElementById('thShift2').innerText = SCHEDULE_CONFIG.shifts.s2.label;
    document.getElementById('thShift3').innerText = SCHEDULE_CONFIG.shifts.s3.label;

    const data = JSON.parse(localStorage.getItem('g_data'))[viewingWeek];
    document.getElementById('tableBody').innerHTML = data.map((d, i) => `
        <tr>
            <td class="glass-card"><div class="cell-content"><span class="day-name">${t.days[i]}</span></div></td>
            <td class="glass-card">
                <div class="cell-content gap-1">
                    <select ${!isEdit?'disabled':''} class="text-sky-400" onchange="saveData(${i},'s1',0,this.value)">${staffNames.concat("None").map(s=>`<option ${s==d.s1[0]?'selected':''}>${s}</option>`).join('')}</select>
                    <div class="w-2/3 h-[1px] bg-white/10"></div>
                    <select ${!isEdit?'disabled':''} class="text-sky-400" onchange="saveData(${i},'s1',1,this.value)">${staffNames.concat("None").map(s=>`<option ${s==d.s1[1]?'selected':''}>${s}</option>`).join('')}</select>
                </div>
            </td>
            <td class="glass-card"><div class="cell-content"><select ${!isEdit?'disabled':''} class="text-orange-400" onchange="saveData(${i},'s2',null,this.value)">${staffNames.concat("None").map(s=>`<option ${s==d.s2?'selected':''}>${s}</option>`).join('')}</select></div></td>
            <td class="glass-card"><div class="cell-content"><select ${!isEdit?'disabled':''} class="text-purple-400" onchange="saveData(${i},'s3',null,this.value)">${staffNames.concat("None").map(s=>`<option ${s==d.s3?'selected':''}>${s}</option>`).join('')}</select></div></td>
        </tr>
    `).join('');
    refreshLiveInfo();
}

// تحديث معلومات المداوم الحالي والمستقبلي
function refreshLiveInfo() {
    const now = new Date();
    const hour = now.getHours();
    const dayIdx = (now.getDay() + 6) % 7;
    const data = JSON.parse(localStorage.getItem('g_data'))[currentActualWeek][dayIdx];
    const conf = SCHEDULE_CONFIG.shifts;
    let cur = "", nxt = "";

    if(hour >= conf.s1.start && hour < conf.s1.end) { cur = data.s1.join(" & "); nxt = data.s2; }
    else if(hour >= conf.s2.start || hour < conf.s2.end) { cur = data.s2; nxt = data.s3; }
    else { cur = data.s3; nxt = data.s1.join(" & "); }

    const clean = (s) => s.replace(/None| & None|None & /g, "").trim() || "...";
    document.getElementById('activeStaff').innerText = clean(cur);
    document.getElementById('nextStaff').innerText = clean(nxt);
    const off = staffNames.filter(s => ![...data.s1, data.s2, data.s3].includes(s));
    document.getElementById('offStaff').innerText = off.join(" & ") || "None";
    
    const callIcon = (n) => `<button onclick="handleAction('${n.trim()}')" class="call-btn"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg></button>`;
    document.getElementById('callNow').innerHTML = clean(cur).split("&").map(n => phoneBook[n.trim()] ? callIcon(n) : "").join("");
    document.getElementById('callNext').innerHTML = clean(nxt).split("&").map(n => phoneBook[n.trim()] ? callIcon(n) : "").join("");
}

// التحقق من كلمة السر
function checkPass() {
    const inp = document.getElementById('passInput');
    const card = document.getElementById('passCard');
    if(inp.value === "1990") { isEdit = true; closeModal(); updateUI(); } 
    else {
        card.classList.add('error-shake');
        document.getElementById('errorIcon').classList.remove('hidden');
        document.getElementById('passTitle').classList.add('text-rose-500');
        setTimeout(() => { 
            inp.value = ""; 
            card.classList.remove('error-shake'); 
        }, 600);
    }
}

// التعامل مع النقر على الأسماء (اتصال أو واتساب)
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

// حفظ التعديلات
function saveData(day, shift, sub, val) {
    let all = JSON.parse(localStorage.getItem('g_data'));
    if(sub === null) all[viewingWeek][day][shift] = val; 
    else all[viewingWeek][day][shift][sub] = val;
    localStorage.setItem('g_data', JSON.stringify(all));
    refreshLiveInfo();
}

// وظائف التحكم المساعدة
function changeWeekManually() { viewingWeek = document.getElementById('weekSelect').value; updateUI(); }
function handleEdit() { if(isEdit) { isEdit = false; updateUI(); } else { document.getElementById('passModal').classList.remove('hidden'); document.getElementById('passInput').focus(); } }
function closeModal() { document.getElementById('passModal').classList.add('hidden'); document.getElementById('passInput').value = ""; }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function toggleLang() { lang = lang === 'ar' ? 'fr' : 'ar'; localStorage.setItem('g_lang', lang); updateUI(); }
function toggleTheme() { theme = theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('g_theme', theme); updateUI(); }
function closeContactModal() { document.getElementById('contactModal').classList.add('hidden'); }
function showToast() { const toast = document.getElementById('copyToast'); toast.style.display = 'block'; setTimeout(() => { toast.style.display = 'none'; }, 2000); }

// التشغيل عند تحميل الصفحة
window.onload = () => {
    initData();
    updateUI();
    setInterval(() => {
        const n = new Date();
        document.getElementById('clock').innerText = `${n.toLocaleDateString(lang==='ar'?'ar-MA':'fr-FR',{weekday:'long'})} | ${n.toLocaleTimeString('en-GB')}`;
        if(n.getMinutes() === 0 && n.getSeconds() === 0) {
            currentActualWeek = getCurrentSystemWeek().toString();
            refreshLiveInfo();
        }
    }, 1000);
};
