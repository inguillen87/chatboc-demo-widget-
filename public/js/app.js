let chartInstances = {};

// --- INITIALIZATION ---
window.onload = () => {
    // Override Default
    window.db.config.region = 'es';

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
    // Mock Data for display (Dynamic based on region to look realistic)
    const vals = {
        es: { in: 2450000, out: 850000, ggr: 1550000, active: 1245, ticket: 450 },
        us: { in: 125000, out: 42000, ggr: 83000, active: 312, ticket: 45 },
        br: { in: 520000, out: 180000, ggr: 340000, active: 890, ticket: 120 }
    };
    const v = vals[window.db.config.region] || vals.es;

    // KPIs
    const kpiIn = document.getElementById('kpi-in-val');
    const kpiOut = document.getElementById('kpi-out-val');
    const kpiGgr = document.getElementById('kpi-ggr-val');
    const headerProfit = document.getElementById('header-profit');
    const kpiUsers = document.getElementById('kpi-users-val');
    const kpiTicket = document.getElementById('kpi-ticket-val');

    if(kpiIn) kpiIn.innerText = formatMoney(v.in);
    if(kpiOut) kpiOut.innerText = formatMoney(v.out);
    if(kpiGgr) kpiGgr.innerText = formatMoney(v.ggr);
    if(headerProfit) headerProfit.innerText = formatMoney(v.ggr);
    if(kpiUsers) kpiUsers.innerText = v.active;
    if(kpiTicket) kpiTicket.innerText = formatMoney(v.ticket);
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

// --- NLP ENGINE ---
function detectIntent(text) {
    const lower = text.toLowerCase();

    const intents = {
        'REGISTER': ['crear usuario', 'crear cuenta', 'registrarme', 'registro', 'nuevo usuario', 'alta', 'sign up', 'register', 'cadastrar', 'conta nova'],
        'RECHARGE': ['cargar saldo', 'recargar', 'depositar', 'ingresar dinero', 'transferir', 'deposit', 'add funds', 'recharge', 'depósito'],
        'WITHDRAW': ['retirar', 'sacar plata', 'sacar dinero', 'cobrar', 'retiro', 'withdraw', 'cash out', 'sacar'],
        'BALANCE': ['saldo', 'cuánto tengo', 'mi cuenta', 'ver plata', 'balance', 'money'],
        'HELP': ['ayuda', 'no entiendo', 'soporte', 'help', 'ajuda']
    };

    for (const [key, keywords] of Object.entries(intents)) {
        if (keywords.some(k => lower.includes(k))) {
            return key;
        }
    }
    return null;
}

async function processLogic(text) {
    const t = regions[window.db.config.region].bot;
    const lower = text.toLowerCase();

    // 1. Check for Reset/Menu commands
    if (['menu', 'hola', 'hi', 'olá', 'inicio', 'home', 'volver'].some(w => lower.includes(w))) {
        window.db.user.step = 'MENU';
        window.db.user.intent = 'MENU';
        showMenu();
        window.api.saveState();
        return;
    }

    // 2. Logic based on current step
    switch (window.db.user.step) {
        case 'MENU':
            // Try NLP detection
            const intent = detectIntent(text);
            if (intent) {
                handleOption(intent);
            } else {
                // Smart Fallback
                botMessage("🤖 Entiendo que querés operar, pero soy una IA en entrenamiento. \n\nPodés escribir:\n🔹 *\"Quiero cargar saldo\"*\n🔹 *\"Necesito registrarme\"*\n🔹 *\"Retirar dinero\"*\n\nO usá el menú de abajo. 👇");
            }
            break;

        case 'WAIT_PROOF':
            if (text.includes('foto') || text.includes('.jpg') || lower.includes('listo') || lower.includes('ya envie')) {
                botMessage("✅ OK. Validando comprobante...");
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
            if (text.includes('.jpg') || lower.includes('adjunto') || lower.includes('listo')) {
                botMessage(t.kyc_selfie);
                window.db.user.step = 'WAIT_KYC_SELFIE';
            } else { botMessage("📷 Por favor, subí la foto de tu **DNI / ID**."); }
            break;

        case 'WAIT_KYC_SELFIE':
            if (text.includes('.jpg') || lower.includes('listo')) {
                botMessage("Scanning...");
                openVisionModal();
            } else { botMessage("📷 Ahora necesito una **Selfie** tuya."); }
            break;

        case 'WAIT_KYC_EMAIL':
            if (text.includes('@')) {
                window.db.user.kycEmail = text;
                botMessage(t.kyc_pin);
                window.db.user.step = 'WAIT_KYC_PIN';
            } else { botMessage("📧 Necesito un **Email** válido."); }
            break;

        case 'WAIT_KYC_PIN':
            if (text.length === 4) {
                botMessage(t.kyc_done);
                // USE MOCK API
                await window.api.registerPlayer(window.db.user.kycEmail, text);

                renderCRM();
                resetToMenu(2000);
            } else { botMessage("🔒 El PIN debe tener **4 dígitos**."); }
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
    html = html.replace(/\n/g, '<br>'); // Handle newlines
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
    const ctx2 = document.getElementById('chart-pie');
    if (!ctx1 || !ctx2) return;
    if (chartInstances.c1) chartInstances.c1.destroy();
    if (chartInstances.c2) chartInstances.c2.destroy();

    const color = window.db.config.theme === 'dark' ? '#94a3b8' : '#475569';

    // Financial Chart
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

    // Pie Chart (New)
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
    // Generate PDF with jsPDF-AutoTable
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const region = window.db.config.region.toUpperCase();
    const date = new Date().toLocaleDateString();

    // HEADER
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(`INTEGRALTEK CASINO REPORT (${region})`, 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${date}`, 15, 26);

    // SUMMARY
    doc.setDrawColor(200);
    doc.line(15, 30, 195, 30);

    const kpiY = 40;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("FINANCIAL SUMMARY", 15, kpiY);

    // Retrieve vals for PDF
    const vals = {
        es: { in: 2450000, out: 850000, ggr: 1550000 },
        us: { in: 125000, out: 42000, ggr: 83000 },
        br: { in: 520000, out: 180000, ggr: 340000 }
    }[window.db.config.region];

    doc.setFontSize(10);
    doc.text(`Total Cash-In: ${formatMoney(vals.in)}`, 15, kpiY + 8);
    doc.text(`Total Cash-Out: ${formatMoney(vals.out)}`, 15, kpiY + 14);
    doc.text(`Net Profit (GGR): ${formatMoney(vals.ggr)}`, 15, kpiY + 20);
    doc.text(`Active Players: ${window.db.players.length}`, 100, kpiY + 8);

    // PLAYERS TABLE
    doc.text("PLAYER ACTIVITY LOG", 15, kpiY + 35);

    const tableBody = window.db.players.map(p => [
        p.id,
        p.name,
        p.email,
        p.status,
        formatMoney(p.balance)
    ]);

    // Ensure AutoTable is available
    if (doc.autoTable) {
        doc.autoTable({
            startY: kpiY + 40,
            head: [['ID', 'Name', 'Email', 'Status', 'Balance']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 8 }
        });
    } else {
        doc.text("Error: AutoTable plugin not loaded.", 15, kpiY + 50);
    }

    // FOOTER
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Integraltek AI System v7.3 - Confidential', 105, 290, null, null, "center");
    }

    doc.save(`Integraltek_Report_${region}_${Date.now()}.pdf`);
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
