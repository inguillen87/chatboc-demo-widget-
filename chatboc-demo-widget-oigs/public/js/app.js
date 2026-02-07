let chartInstances = {};

// --- INITIALIZATION ---
window.onload = () => {
    applyTheme();
    setRegion(window.db.config.region || 'es');

    // Check Identity
    identifyUser();

    // Event Listeners
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Live Loop (Simulate Real-time updates)
    setInterval(() => {
        renderCRM();
        updateFinancials();
    }, 5000);
};

// --- IDENTITY & SESSION ---
let currentUser = null;

async function identifyUser() {
    currentUser = await window.api.identifyUser();
    if(currentUser) {
        const r = window.db.config.region;
        const t = regions[r].bot;
        const feed = document.getElementById('chat-feed');
        if(feed && feed.children.length === 0) {
            // XSS Safe: sanitize name
            const safeName = window.escapeHTML(currentUser.firstName);
            botMessage(t.welcome_known.replace("{name}", safeName));
            showMenu();
        }
    } else {
        showMenu();
    }
}

// --- REGION & THEME ---
function setRegion(r) {
    window.db.config.region = r;
    window.api.saveState();

    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('lang-'+r);
    if(btn) btn.classList.add('active');

    // Text Replacement
    const dict = regions[r];
    document.querySelectorAll('[data-t]').forEach(el => {
        const k = el.getAttribute('data-t');
        if(dict[k]) el.innerText = dict[k];
    });

    updateFinancials();
    renderCRM();
    initCharts();

    // Refresh Menu text if visible
    const feed = document.getElementById('chat-feed');
    if(feed && window.db.flowState.step === 'MENU') {
        feed.innerHTML = '';
        showMenu();
    }
}

function updateFinancials() {
    let totalIn = 0, totalOut = 0;
    let activeCount = window.db.players.length;

    window.db.players.forEach(p => {
        totalIn += p.history.in;
        totalOut += p.history.out;
    });
    const ggr = totalIn - totalOut;

    const kpiIn = document.getElementById('kpi-in-val');
    const kpiOut = document.getElementById('kpi-out-val');
    const kpiGgr = document.getElementById('kpi-ggr-val');
    const headerProfit = document.getElementById('header-profit');
    const kpiUsers = document.getElementById('kpi-users-val');

    if(kpiIn) kpiIn.innerText = formatMoney(totalIn);
    if(kpiOut) kpiOut.innerText = formatMoney(totalOut);
    if(kpiGgr) kpiGgr.innerText = formatMoney(ggr);
    if(headerProfit) headerProfit.innerText = formatMoney(ggr);
    if(kpiUsers) kpiUsers.innerText = activeCount;
}

function toggleTheme() {
    window.db.config.theme = window.db.config.theme === 'light' ? 'dark' : 'light';
    window.api.saveState();
    applyTheme();
}

function applyTheme() {
    if(window.db.config.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    initCharts();
}

// --- BOT LOGIC ---
function showMenu() {
    const r = window.db.config.region;
    const t = regions[r].bot;

    const html = `
        <div class="wa-options">
            <div class="grid grid-cols-2 gap-2">
                <button onclick="handleOption('RECHARGE')" class="wa-btn">${t.menu_recharge}</button>
                <button onclick="handleOption('BALANCE')" class="wa-btn">${t.menu_balance}</button>
                <button onclick="handleOption('REGISTER')" class="wa-btn">${t.menu_kyc}</button>
                <button onclick="handleOption('WITHDRAW')" class="wa-btn">${t.menu_withdraw}</button>
            </div>
            <button onclick="handleOption('METHODS')" class="wa-btn text-xs text-slate-500 font-normal">${t.menu_methods}</button>
            <div class="grid grid-cols-3 gap-2 mt-1">
                <button onclick="handleOption('FAQ')" class="wa-btn text-[10px]">${t.menu_faq}</button>
                <button onclick="handleOption('REPORT')" class="wa-btn text-[10px]">${t.menu_report}</button>
                <button onclick="handleOption('AGENT')" class="wa-btn text-[10px]">${t.menu_agent}</button>
            </div>
        </div>
    `;
    addBotBubble(html, true);
}

function handleOption(opt) {
    const r = window.db.config.region;
    const t = regions[r].bot;
    window.db.flowState.step = opt;

    if (['RECHARGE', 'WITHDRAW', 'BALANCE'].includes(opt) && !currentUser) {
        // Fallback to Spanish default if translation missing (safety)
        const msg = (r === 'es') ? "⚠️ No estás registrado." : (r === 'br' ? "⚠️ Não registrado." : "⚠️ Not registered.");
        botMessage(msg);
        window.db.flowState.step = 'REGISTER';
        handleOption('REGISTER');
        return;
    }

    if (opt === 'REGISTER') {
        if(currentUser) {
            const safeUser = window.escapeHTML(currentUser.username);
            const msg = (r === 'es') ? `✅ Ya estás registrado como **${safeUser}**.` : (r === 'br' ? `✅ Registrado como **${safeUser}**.` : `✅ Registered as **${safeUser}**.`);
            botMessage(msg);
            resetToMenu();
        } else {
            window.db.flowState.step = 'REG_NAME';
            window.db.flowState.tempData = {};
            addBotBubble(t.reg_start);
        }
    }
    else if (opt === 'RECHARGE') {
        window.db.flowState.step = 'DEPO_AMOUNT';
        addBotBubble(t.dep_amount);
    }
    else if (opt === 'BALANCE') {
        // Safe formatting handled by formatMoney
        botMessage(`${t.balance_show} **${formatMoney(currentUser.balance)}**`);
        resetToMenu();
    }
    else if (opt === 'WITHDRAW') {
        window.db.flowState.step = 'WITH_AMOUNT';
        addBotBubble(t.with_amount);
    }
    else {
        addBotBubble("ℹ️ " + opt);
        resetToMenu();
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // Sanitize user input before displaying
    const safeText = window.escapeHTML(text);
    addBubble(safeText, 'user');

    input.value = '';
    showTyping();
    setTimeout(() => { hideTyping(); processLogic(text); }, 800); // Pass raw text to logic
}

// --- NLP & STATE MACHINE ---
function detectIntent(text) {
    const lower = text.toLowerCase();
    const intents = {
        'REGISTER': ['crear usuario', 'registrarme', 'registro', 'nuevo', 'sign up', 'register', 'cadastrar'],
        'RECHARGE': ['cargar', 'depositar', 'ingresar', 'transferir', 'deposit', 'deposito'],
        'WITHDRAW': ['retirar', 'sacar', 'cobrar', 'retiro', 'withdraw', 'cash out', 'saque'],
        'BALANCE': ['saldo', 'cuánto tengo', 'mi cuenta', 'balance']
    };
    for (const [key, keywords] of Object.entries(intents)) {
        if (keywords.some(k => lower.includes(k))) return key;
    }
    return null;
}

async function processLogic(text) {
    const r = window.db.config.region;
    const t = regions[r].bot;
    const step = window.db.flowState.step;
    const lower = text.toLowerCase();

    if (['menu', 'inicio', 'cancelar', 'home', 'cancel'].includes(lower)) {
        resetToMenu();
        return;
    }

    switch (step) {
        case 'MENU':
            const intent = detectIntent(text);
            if (intent) handleOption(intent);
            else botMessage(t.smart_fallback || t.fallback);
            break;

        // --- REGISTRATION FLOW ---
        case 'REG_NAME':
            window.db.flowState.tempData.firstName = text; // Keep raw for DB
            window.db.flowState.step = 'REG_SURNAME';
            botMessage(t.reg_surname);
            break;
        case 'REG_SURNAME':
            window.db.flowState.tempData.lastName = text;
            window.db.flowState.step = 'REG_USER';
            botMessage(t.reg_user);
            break;
        case 'REG_USER':
            window.db.flowState.tempData.username = text;
            window.db.flowState.step = 'REG_EMAIL';
            botMessage(t.reg_email);
            break;
        case 'REG_EMAIL':
            if(text.includes('@')) {
                window.db.flowState.tempData.email = text;
                window.db.flowState.step = 'REG_PIN';
                botMessage(t.reg_pin);
            } else botMessage("⚠️ Email invalid.");
            break;
        case 'REG_PIN':
            if(text.length === 4) {
                window.db.flowState.tempData.pin = text;
                currentUser = await window.api.registerUser(window.db.flowState.tempData);
                botMessage(t.reg_done);
                setTimeout(() => {
                    botMessage(t.reg_kyc);
                    window.db.flowState.step = 'REG_KYC_DNI';
                }, 1500);
            } else botMessage("⚠️ 4 digits.");
            break;

        case 'REG_KYC_DNI':
            if(text.includes('.jpg')) handleAttachment('doc');
            else botMessage("📎 Upload Photo.");
            break;

        case 'REG_KYC_SELFIE':
             if(text.includes('.jpg')) handleAttachment('camera');
            else botMessage("📎 Upload Selfie.");
            break;

        // --- DEPOSIT FLOW ---
        case 'DEPO_AMOUNT':
            const amount = parseFloat(text.replace(/[^0-9.]/g, ''));
            if(amount > 0) {
                window.db.flowState.tempData.amount = amount;
                const bonus = amount > 5000 ? (amount * 0.10) : 0;
                let msg = t.dep_receipt;
                if(bonus > 0) {
                    const bonusMsg = (r === 'es') ? `🔥 **¡Bonus Detectado!**` : (r === 'br' ? `🔥 **Bônus Detectado!**` : `🔥 **Bonus Detected!**`);
                    msg = `${bonusMsg}\n\nTotal: ${formatMoney(amount + bonus)}\n\n` + msg;
                }
                botMessage(msg);
                window.db.flowState.step = 'DEPO_RECEIPT';
            } else botMessage(t.err_amount);
            break;

        case 'DEPO_RECEIPT':
             botMessage("📎 Clip -> Photo");
             break;

        // --- WITHDRAW FLOW ---
        case 'WITH_AMOUNT':
            const wAmount = parseFloat(text.replace(/[^0-9.]/g, ''));
            if(wAmount > 0 && wAmount <= currentUser.balance) {
                window.db.flowState.tempData.wAmount = wAmount;
                botMessage(t.with_pin);
                window.db.flowState.step = 'WITH_PIN';
            } else botMessage(t.err_bal);
            break;

        case 'WITH_PIN':
            if(text === currentUser.pin) {
                botMessage(t.with_done);
                await window.api.createWithdrawRequest(window.db.flowState.tempData.wAmount);
                renderCRM();
                resetToMenu(2500);
            } else botMessage(t.err_pin);
            break;
    }
}

// --- ATTACHMENT HANDLER ---
function handleAttachment(type) {
    toggleDrawer();
    const text = type === 'doc' ? '📄 ID.jpg' : (type === 'camera' ? '📷 Selfie.jpg' : '🖼️ Proof.jpg');
    addBubble(text, 'user');
    showTyping();

    setTimeout(async () => {
        hideTyping();
        const step = window.db.flowState.step;
        const r = window.db.config.region;
        const t = regions[r].bot;

        if (step === 'REG_KYC_DNI' && type === 'doc') {
            botMessage("🔍 OCR Scan...");
            openVisionModal();
        }
        else if (step === 'REG_KYC_SELFIE' && type === 'camera') {
            botMessage("🔍 Liveness Check...");
            openVisionModal();
        }
        else if (step === 'DEPO_RECEIPT' && type === 'gallery') {
            botMessage(t.dep_wait);
            setTimeout(async () => {
                const amt = window.db.flowState.tempData.amount;
                await window.api.createDepositRequest(amt);
                botMessage(t.dep_done);
                renderCRM();
                resetToMenu(2000);
            }, 2000);
        }
        else {
            botMessage("⚠️ Error.");
        }
    }, 1000);
}

// --- VISION CORE UI ---
function openVisionModal() {
    const m = document.getElementById('vision-modal');
    m.classList.remove('hidden'); m.classList.add('flex');
    const p = document.getElementById('vision-progress');
    const b = document.getElementById('btn-vision-done');

    p.style.width = '10%'; b.disabled = true; b.classList.add('opacity-50');
    setTimeout(() => p.style.width = '100%', 3500);
    setTimeout(() => { b.disabled = false; b.classList.remove('opacity-50'); b.innerText = "CONFIRM"; }, 4000);
}

function finishVision() {
    document.getElementById('vision-modal').classList.replace('flex', 'hidden');
    const step = window.db.flowState.step;
    const r = window.db.config.region;

    if(step === 'REG_KYC_DNI') {
        botMessage(regions[r].bot.reg_selfie);
        window.db.flowState.step = 'REG_KYC_SELFIE';
    }
    else if(step === 'REG_KYC_SELFIE') {
        const msg = (r === 'es') ? "✅ **Identidad Validada**" : "✅ **Identity Verified**";
        botMessage(msg);
        if(currentUser) currentUser.status = 'VERIFIED';
        renderCRM();
        resetToMenu(1500);
    }
}

// --- UI HELPERS ---
function botMessage(text) {
    // Sanitize message content but allow specific formatting tags we insert
    // Actually, bot messages are trusted internal strings, but user data inside them (like name) is sanitized before insertion.
    let html = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    addBotBubble(html);
}
function addBotBubble(html) { addBubble(html, 'bot', true); }
function addBubble(content, type, isHtml = false) {
    const feed = document.getElementById('chat-feed');
    if(!feed) return;
    const div = document.createElement('div');
    div.className = `chat-bubble ${type === 'bot' ? 'bubble-in' : 'bubble-out'}`;
    if (isHtml) div.innerHTML = content; else div.innerText = content;
    div.innerHTML += `<div class="wa-time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>`;
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
}
function showTyping() {
    const feed = document.getElementById('chat-feed');
    const div = document.createElement('div');
    div.id = 'typing-anim';
    div.className = 'chat-bubble bubble-in typing-indicator';
    div.innerHTML = '...';
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
}
function hideTyping() { const el = document.getElementById('typing-anim'); if(el) el.remove(); }
function resetToMenu(delay = 1000) {
    window.db.flowState.step = 'MENU';
    setTimeout(showMenu, delay);
}
function toggleDrawer() { document.getElementById('drawer').classList.toggle('open'); }

// --- CRM & CHARTS ---
function renderCRM() {
    const tb = document.getElementById('crm-body');
    if(!tb) return;
    tb.innerHTML = '';

    window.db.players.forEach(p => {
        // Sanitize Outputs
        const safeName = window.escapeHTML(p.firstName + " " + p.lastName);
        const safeUser = window.escapeHTML(p.username);
        const safeEmail = window.escapeHTML(p.email);

        let badge = '';
        let actions = '';
        let statusText = p.status;

        if (p.pendingAction) {
            if (p.pendingAction.type === 'DEPOSIT') {
                statusText = `⏳ DEP: ${formatMoney(p.pendingAction.amount)}`;
                badge = `<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold animate-pulse">PENDING</span>`;
                actions = `
                    <button onclick="crmAction(${p.id}, 'APPROVE_DEP')" class="bg-emerald-500 text-white px-2 py-1 rounded text-xs font-bold mr-1">OK</button>
                    <button onclick="crmAction(${p.id}, 'REJECT')" class="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">X</button>
                `;
            } else if (p.pendingAction.type === 'WITHDRAW') {
                statusText = `⏳ RET: ${formatMoney(p.pendingAction.amount)}`;
                badge = `<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold animate-pulse">REVIEW</span>`;
                actions = `
                    <button onclick="crmAction(${p.id}, 'APPROVE_WITH')" class="bg-emerald-500 text-white px-2 py-1 rounded text-xs font-bold mr-1">PAY</button>
                    <button onclick="crmAction(${p.id}, 'REJECT')" class="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">X</button>
                `;
            }
        } else {
            badge = `<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">${p.status}</span>`;
        }

        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50";
        tr.innerHTML = `
            <td class="p-6 font-bold text-slate-800 dark:text-white text-sm">
                ${safeName}<br>
                <span class="text-[10px] text-slate-400">@${safeUser || 'user'}</span>
            </td>
            <td class="p-6 text-xs text-slate-500">${safeEmail}<br>${p.phone}</td>
            <td class="p-6 text-center text-xs font-bold text-slate-500">${statusText}<br>${badge}</td>
            <td class="p-6 text-right font-black text-slate-900 dark:text-white">${formatMoney(p.balance)}</td>
            <td class="p-6 text-right">${actions}</td>
        `;
        tb.appendChild(tr);
    });
}

async function crmAction(id, type) {
    if (type === 'APPROVE_DEP') {
        await window.api.approveAction(id);
        log(`Depósito Acreditado: User #${id}`, 'FINANCE');
    } else if (type === 'APPROVE_WITH') {
        await window.api.approveAction(id);
        log(`Retiro Pagado: User #${id}`, 'FINANCE');
    } else if (type === 'REJECT') {
        await window.api.rejectAction(id);
        log(`Acción Rechazada: User #${id}`, 'ALERT');
    }
    renderCRM();
    updateFinancials();
}

function log(msg, type) {
    const box = document.getElementById('audit-log');
    if(!box) return;
    const p = document.createElement('div');
    let color = "text-slate-400";
    if(type === 'FINANCE') color = "text-emerald-400";
    if(type === 'ALERT') color = "text-red-400";
    p.className = `text-[10px] border-l-2 pl-2 border-slate-600 ${color} font-mono mb-1`;
    p.innerText = msg;
    box.prepend(p);
}

function initCharts() {
    const ctx1 = document.getElementById('chart-fin');
    const ctx2 = document.getElementById('chart-pie');
    if (!ctx1 || !ctx2) return;
    if (chartInstances.c1) chartInstances.c1.destroy();
    if (chartInstances.c2) chartInstances.c2.destroy();

    chartInstances.c1 = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Lun','Mar','Mie','Jue','Vie','Sab','Dom'],
            datasets: [
                { label: 'In', data: [120, 190, 300, 500, 200, 300, 450], backgroundColor: '#10b981', borderRadius: 6 },
                { label: 'Out', data: [80, 50, 100, 120, 80, 50, 20], backgroundColor: '#f43f5e', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { display:false }, y: { display:false } },
            plugins: { legend: { display: false } }
        }
    });

    chartInstances.c2 = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Slots', 'Live', 'Sports'],
            datasets: [{
                data: [65, 25, 10],
                backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
            cutout: '70%'
        }
    });
}

async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const region = window.db.config.region.toUpperCase();
    doc.text(`INTEGRALTEK CASINO REPORT (${region})`, 15, 20);

    let y = 40;
    window.db.players.forEach(p => {
        doc.text(`${p.username} - Balance: ${formatMoney(p.balance)}`, 15, y);
        y += 10;
    });
    doc.save("Report.pdf");
}

window.setView = function(view) {
    ['agent', 'crm', 'dashboard'].forEach(v => {
        const el = document.getElementById('view-'+v);
        const nav = document.getElementById('nav-'+v);
        if(el) el.classList.add('hidden');
        if(nav) nav.classList.remove('active');
    });
    const el = document.getElementById('view-'+view);
    const nav = document.getElementById('nav-'+view);
    if(el) el.classList.remove('hidden');
    if(nav) nav.classList.add('active');
    if(view === 'dashboard') initCharts();
};
