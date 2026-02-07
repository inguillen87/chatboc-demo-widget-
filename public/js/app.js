let chartInstances = {};

// --- INITIALIZATION ---
window.onload = () => {
    applyTheme();
    setRegion(window.db.config.region);

    // Event Listeners
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Populate Audit Log
    const logBox = document.getElementById('audit-log');
    if (logBox) {
        const logs = [
            "Bot: Respondido FAQ a user #8821",
            "System: Backup completado",
            "VisionCore: DNI validado 98% match",
            "Payment: Depósito $5000 recibido",
            "System: Server health 99.9%"
        ];
        logs.forEach(l => {
            const p = document.createElement('div');
            p.className = "text-[10px] border-l-2 pl-2 border-slate-600 text-slate-300 font-mono";
            p.innerHTML = `<span class="opacity-50 mr-2">${new Date().toLocaleTimeString()}</span> ${l}`;
            logBox.appendChild(p);
        });
    }
};

// --- REGION & THEME ---
function setRegion(r) {
    window.db.config.region = r;
    window.api.saveState();

    // UI Button State
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('lang-'+r);
    if(btn) btn.classList.add('active');

    // Text Replacement
    const dict = regions[r];
    document.querySelectorAll('[data-t]').forEach(el => {
        const k = el.getAttribute('data-t');
        if(dict[k]) el.innerText = dict[k];
    });

    // Update Formatters
    updateFinancials();

    // Reset Chat Context if at menu
    if(window.db.user.step === 'MENU') {
        const feed = document.getElementById('chat-feed');
        if(feed) feed.innerHTML = '';
        showMenu();
    }
    renderCRM();
    initCharts();
}

function updateFinancials() {
    // Mock Data for display
    const vals = {
        mx: { in: 2450000, out: 850000, ggr: 1550000 },
        us: { in: 125000, out: 42000, ggr: 83000 },
        br: { in: 520000, out: 180000, ggr: 340000 }
    };
    const v = vals[window.db.config.region];
    document.getElementById('kpi-in-val').innerText = formatMoney(v.in);
    document.getElementById('kpi-out-val').innerText = formatMoney(v.out);
    document.getElementById('kpi-ggr-val').innerText = formatMoney(v.ggr);
    document.getElementById('header-profit').innerText = formatMoney(v.ggr);
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
    const t = regions[window.db.config.region].bot;
    const html = `
        <div class="mb-3 font-medium">${t.welcome}</div>
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
    const t = regions[window.db.config.region].bot;
    window.db.user.intent = opt;

    if (opt === 'RECHARGE') {
        window.db.user.step = 'WAIT_PROOF';
        addBotBubble(t.ask_method);
    } else if (opt === 'BALANCE') {
        window.db.user.step = 'WAIT_EMAIL_LOGIN';
        addBotBubble(t.ask_email_bal);
    } else if (opt === 'REGISTER') {
        window.db.user.step = 'WAIT_DNI';
        addBotBubble(t.kyc_start);
    } else if (opt === 'WITHDRAW') {
        window.db.user.step = 'WAIT_WITHDRAW_AMOUNT';
        addBotBubble(t.withdraw_amount);
    } else {
        addBotBubble("ℹ️ " + opt);
        resetToMenu();
    }
    window.api.saveState();
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    addBubble(text, 'user');
    input.value = '';
    showTyping();
    setTimeout(() => { hideTyping(); processLogic(text); }, 800);
}

async function processLogic(text) {
    const t = regions[window.db.config.region].bot;
    const lower = text.toLowerCase();

    if (['menu', 'hola', 'hi', 'olá', 'inicio', 'home'].some(w => lower.includes(w))) {
        window.db.user.step = 'MENU';
        window.db.user.intent = 'MENU';
        showMenu();
        window.api.saveState();
        return;
    }

    switch (window.db.user.step) {
        case 'MENU': botMessage(t.fallback); break;

        case 'WAIT_PROOF':
            if (text.includes('foto') || text.includes('.jpg')) {
                botMessage("✅ OK. Validando...");
                setTimeout(() => {
                    botMessage("🎉 + " + formatMoney(5000));
                    window.db.user.step = 'MENU';
                    setTimeout(showMenu, 1000);
                }, 2000);
            } else { botMessage("📎 " + t.ask_method); }
            break;

        case 'WAIT_EMAIL_LOGIN':
            const u = window.db.players.find(p => p.email.toLowerCase() === text.toLowerCase());
            if(u) {
                window.db.user.tempLogin = u;
                window.db.user.step = 'WAIT_PIN_LOGIN';
                addBotBubble(t.ask_pin);
            } else { addBotBubble(t.error_email); }
            break;

        case 'WAIT_PIN_LOGIN':
            if(window.db.user.tempLogin && window.db.user.tempLogin.pin === text) {
                addBotBubble(`${t.balance_show} **${formatMoney(window.db.user.tempLogin.balance)}**`);
                resetToMenu();
            } else { addBotBubble(t.error_pin); }
            break;

        case 'WAIT_DNI':
            if (text.includes('.jpg')) {
                botMessage(t.kyc_selfie);
                window.db.user.step = 'WAIT_KYC_SELFIE';
            } else { botMessage("📷 ID/DNI?"); }
            break;

        case 'WAIT_KYC_SELFIE':
            if (text.includes('.jpg')) {
                botMessage("Scanning...");
                openVisionModal();
            } else { botMessage("📷 Selfie?"); }
            break;

        case 'WAIT_KYC_EMAIL':
            if (text.includes('@')) {
                window.db.user.kycEmail = text;
                botMessage(t.kyc_pin);
                window.db.user.step = 'WAIT_KYC_PIN';
            } else { botMessage("Email?"); }
            break;

        case 'WAIT_KYC_PIN':
            if (text.length === 4) {
                botMessage(t.kyc_done);
                // USE MOCK API
                await window.api.registerPlayer(window.db.user.kycEmail, text);

                renderCRM();
                resetToMenu(2000);
            } else { botMessage("PIN 4 #?"); }
            break;

         case 'WAIT_WITHDRAW_AMOUNT':
            window.db.user.withdrawAmount = text;
            window.db.user.step = 'WAIT_WITHDRAW_CBU';
            addBotBubble(t.withdraw_cbu);
            break;

        case 'WAIT_WITHDRAW_CBU':
            addBotBubble(t.withdraw_done);
            // USE MOCK API
            await window.api.requestWithdraw("user@withdraw.com", 0);

            renderCRM();
            resetToMenu(2000);
            break;
    }
}

function botMessage(text) {
    let html = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    addBotBubble(html);
}

function addBotBubble(html, isMenu = false) {
    addBubble(html, 'bot', true);
}

function addBubble(content, type, isHtml = false) {
    const feed = document.getElementById('chat-feed');
    if(!feed) return;
    const div = document.createElement('div');
    div.className = `chat-bubble ${type === 'bot' ? 'bubble-in' : 'bubble-out'}`;
    if (isHtml) div.innerHTML = content; else div.innerText = content;
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    div.innerHTML += `<div class="wa-time">${time} ${type === 'user' ? '<i class="fas fa-check-double text-blue-500"></i>' : ''}</div>`;
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;

    // Save Chat
    window.db.chat.push({ type, content, isHtml });
    window.api.saveState();
}

function resetToMenu(delay = 1500) {
    window.db.user.step = 'MENU';
    setTimeout(showMenu, delay);
}

function toggleDrawer() {
    const d = document.getElementById('drawer');
    if(d) d.classList.toggle('open');
}

function handleAttachment(type) {
    toggleDrawer();
    const text = type === 'doc' ? '📄 ID.jpg' : (type === 'camera' ? '📷 Selfie.jpg' : '🖼️ Payment.jpg');
    addBubble(text, 'user');

    // Simulate Upload & Processing
    showTyping();

    setTimeout(() => {
        hideTyping();

        // INTELLIGENT ROUTING
        if (window.db.user.step === 'WAIT_DNI' && type === 'doc') {
            addBotBubble("🔍 **Vision Core:** Escaneando documento...");
            setTimeout(() => openVisionModal(), 1000);
        }
        else if (window.db.user.step === 'WAIT_KYC_SELFIE' && type === 'camera') {
            addBotBubble("👤 **Biometría:** Validando prueba de vida...");
            setTimeout(() => openVisionModal(), 1000);
        }
        else {
            processLogic(text);
        }
    }, 1000);
}

function showTyping() {
    const feed = document.getElementById('chat-feed');
    if(!feed) return;
    const div = document.createElement('div');
    div.id = 'typing-anim';
    div.className = 'chat-bubble bubble-in typing-indicator';
    div.innerHTML = '<span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span>';
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
}
function hideTyping() { const el = document.getElementById('typing-anim'); if (el) el.remove(); }

// --- VISION CORE UI ---
function openVisionModal() {
    const m = document.getElementById('vision-modal');
    if(!m) return;
    m.classList.remove('hidden'); m.classList.add('flex');

    const progress = document.getElementById('vision-progress');
    const status = document.getElementById('vision-status');
    const btn = document.getElementById('btn-vision-done');
    const score = document.getElementById('match-score');
    const integrity = document.getElementById('score-dni');

    progress.style.width = '5%';
    status.innerText = "Iniciando OCR...";
    btn.disabled = true;
    btn.classList.add('opacity-50');

    setTimeout(() => { progress.style.width = '45%'; status.innerText = "Extrayendo datos (OCR)..."; }, 1000);
    setTimeout(() => { progress.style.width = '80%'; status.innerText = "Verificando Hologramas..."; }, 2500);
    setTimeout(() => {
        progress.style.width = '100%';
        status.innerText = "Análisis Completado.";
        score.innerText = "98.4%";
        integrity.innerText = "VALID";
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.innerText = "CONFIRMAR DATOS";
    }, 4000);
}

function finishVision() {
    document.getElementById('vision-modal').classList.replace('flex', 'hidden');

    if (window.db.user.step === 'WAIT_DNI') {
        botMessage(regions[window.db.config.region].bot.kyc_selfie);
        window.db.user.step = 'WAIT_KYC_SELFIE';
    } else if (window.db.user.step === 'WAIT_KYC_SELFIE') {
        botMessage(regions[window.db.config.region].bot.kyc_email);
        window.db.user.step = 'WAIT_KYC_EMAIL';
    }
    window.api.saveState();
}

// --- CRM ACTIONS ---
async function renderCRM() {
    const tb = document.getElementById('crm-body');
    if(!tb) return;
    tb.innerHTML = '';

    // In real app, we would await window.api.getPlayers()
    // but db.js populates window.db.players so we use that for rendering speed
    // Ideally: const players = await window.api.getPlayers();

    window.db.players.forEach(p => {
        let badge = '';
        let actions = '';

        if(p.status === 'VERIFIED' || p.status === 'APROBADO') {
            badge = `<span class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-[10px] font-bold">VERIFIED</span>`;
            actions = `<button onclick="crmAction(${p.id}, 'BAN')" class="text-xs text-red-400 hover:text-red-600 font-bold border border-red-200 px-2 py-1 rounded">BAN</button>`;
        }
        else if(p.status === 'PENDING_KYC') {
            badge = `<span class="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-[10px] font-bold">KYC PEND</span>`;
            actions = `
                <button onclick="crmAction(${p.id}, 'APPROVE_KYC')" class="text-xs bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 font-bold mr-1">OK</button>
                <button onclick="crmAction(${p.id}, 'REJECT')" class="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 font-bold">X</button>
            `;
        }
        else if(p.status === 'PENDING_DEPOSIT') {
            badge = `<span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold">DEP PEND</span>`;
            actions = `
                <button onclick="crmAction(${p.id}, 'APPROVE_DEP')" class="text-xs bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 font-bold mr-1">$$</button>
                <button onclick="crmAction(${p.id}, 'REJECT')" class="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 font-bold">X</button>
            `;
        }
        else if(p.status === 'PENDING_WITHDRAWAL') {
            badge = `<span class="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full text-[10px] font-bold animate-pulse">WITHDRAW</span>`;
            actions = `
                <button onclick="crmAction(${p.id}, 'APPROVE_WITHDRAW')" class="text-xs bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 font-bold mr-1">PAY</button>
                <button onclick="crmAction(${p.id}, 'REJECT')" class="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 font-bold">X</button>
            `;
        }

        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group";
        tr.innerHTML = `
            <td class="p-6 font-bold text-slate-800 dark:text-white text-sm">${p.name}<br><span class="text-[10px] font-normal text-slate-400">${p.id}</span></td>
            <td class="p-6 text-xs text-slate-600 dark:text-slate-300">${p.email}</td>
            <td class="p-6 text-center">${badge}</td>
            <td class="p-6 text-right font-black text-slate-800 dark:text-white text-lg">${formatMoney(p.balance)}</td>
            <td class="p-6 text-right">${actions}</td>
        `;
        tb.appendChild(tr);
    });
}

async function crmAction(id, type) {
    const p = window.db.players.find(x => x.id === id);
    if(!p) return;

    if(type === 'APPROVE_KYC') {
        await window.api.updatePlayerStatus(id, 'VERIFIED');
        addBotBubble(`✅ Tu cuenta ha sido validada, ${p.name}.`);
        log(`KYC Aprobado para ${p.name}`, 'KYC');
    }
    if(type === 'APPROVE_DEP') {
        await window.api.updatePlayerStatus(id, 'VERIFIED', { balanceChange: 5000 });
        addBotBubble(`💰 Se acreditaron ${formatMoney(5000)} a tu cuenta.`);
        log(`Depósito aprobado: ${p.name}`, 'FINANCE');
    }
    if(type === 'APPROVE_WITHDRAW') {
        // Assume deduction happened on request, or deduct now. Let's deduct now for simplicity if not already.
        // Actually history has out.
        await window.api.updatePlayerStatus(id, 'VERIFIED');
        addBotBubble(`💸 Retiro de ${formatMoney(p.history.out)} procesado con éxito.`);
        log(`Retiro enviado a ${p.name}`, 'FINANCE');
    }
    if(type === 'REJECT') {
        await window.api.updatePlayerStatus(id, 'REJECTED');
        addBotBubble(`❌ Solicitud rechazada. Contactá soporte.`);
        log(`Solicitud rechazada para ${p.name}`, 'ALERT');
    }
    if(type === 'BAN') {
        await window.api.deletePlayer(id);
        log(`Usuario ${p.name} eliminado`, 'ALERT');
    }
    renderCRM();
}

function log(msg, type) {
    const box = document.getElementById('audit-log');
    if(!box) return;
    const p = document.createElement('div');
    let color = "text-slate-300";
    if(type === 'FINANCE') color = "text-emerald-400";
    if(type === 'KYC') color = "text-blue-400";
    if(type === 'ALERT') color = "text-red-400";
    p.className = `text-[10px] border-l-2 pl-2 border-slate-600 ${color} font-mono animate-fade-in`;
    p.innerHTML = `<span class="opacity-50 mr-2">${new Date().toLocaleTimeString()}</span> ${msg}`;
    box.prepend(p);
}

function initCharts() {
    const ctx1 = document.getElementById('chart-fin');
    const ctx2 = document.getElementById('chart-users');
    if (!ctx1 || !ctx2) return;
    if (chartInstances.c1) chartInstances.c1.destroy();
    if (chartInstances.c2) chartInstances.c2.destroy();

    const color = window.db.config.theme === 'dark' ? '#94a3b8' : '#475569';
    chartInstances.c1 = new Chart(ctx1, { type: 'bar', data: { labels: ['M','T','W','T','F','S','S'], datasets: [{ label: 'In', data: [12, 19, 3, 5, 2, 3, 9], backgroundColor: '#10b981' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { display:false }, y: { display:false } }, plugins: { legend: { display: false } } } });
    chartInstances.c2 = new Chart(ctx2, { type: 'line', data: { labels: ['W1','W2','W3','W4'], datasets: [{ label: 'Users', data: [5, 15, 10, 25], borderColor: '#3b82f6' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { display:false }, y: { display:false } }, plugins: { legend: { display: false } } } });
}

async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("INTEGRALTEK REPORT - " + window.db.config.region.toUpperCase(), 20, 20);
    doc.save("Report.pdf");
}

// Global View Switcher
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
