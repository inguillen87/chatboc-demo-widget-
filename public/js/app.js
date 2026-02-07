// --- DATA SYSTEM ---
let players = [
    { id: "#8291", name: "Matias S.", email: "m.suarez@gmail.com", status: "APROBADO", balance: 45200, color: "blue", pin: "1234", history: 150000, out: 104800, lastOp: "Depósito" },
    { id: "#7742", name: "Carla L.", email: "carla.juego@yahoo.com", status: "APROBADO", balance: 125000, color: "pink", pin: "0000", history: 300000, out: 175000, lastOp: "Retiro" },
    { id: "#9931", name: "Julián R.", email: "julian@outlook.com", status: "KYC PENDIENTE", balance: 0, color: "indigo", pin: "9999", history: 0, out: 0, lastOp: "Alta KYC" },
    { id: "#6610", name: "Pedro L.", email: "p.lopez@gmail.com", status: "RETIRO SOLICITADO", balance: 15000, color: "slate", pin: "1111", history: 50000, out: 35000, lastOp: "Pedido Retiro" },
    { id: "#5512", name: "Marcelo T.", email: "mt@gmail.com", status: "DEPÓSITO PENDIENTE", balance: 1200, color: "emerald", pin: "2222", history: 1200, out: 0, lastOp: "Ticket Recarga" }
];

// --- BOT CONFIG ---
const botMainMsg = "👋 ¡Hola! Soy tu asistente inteligente de **Integraltek**. Seleccioná una operación rápida para comenzar:";

// --- NAVIGATION ---
function switchTab(tab) {
    ['agent', 'crm', 'dashboard'].forEach(t => {
        const view = document.getElementById('tab-' + t);
        const btnD = document.getElementById('btn-' + t + '-desk');
        const btnM = document.getElementById('btn-' + t + '-mob');
        if (view) view.classList.add('hidden');
        if (btnD) btnD.classList.remove('active', 'bg-blue-600', 'text-white');
        if (btnM) btnM.classList.remove('text-blue-500');
    });
    const activeV = document.getElementById('tab-' + tab);
    const btnD = document.getElementById('btn-' + tab + '-desk');
    const btnM = document.getElementById('btn-' + tab + '-mob');
    if (activeV) activeV.classList.remove('hidden');
    if (btnD) btnD.classList.add('active', 'bg-blue-600', 'text-white');
    if (btnM) btnM.classList.add('text-blue-500');
    const tt = document.getElementById('tab-title');
    if (tt) {
        const titles = { agent: 'Centro Operativo de IA', crm: 'CRM de Jugadores', dashboard: 'Análisis de Rentabilidad' };
        tt.innerText = titles[tab];
    }
    if (tab === 'dashboard') setTimeout(initDashboardCharts, 100);
    if (tab === 'crm') renderCRM();
}

// --- BOT ENGINE ---
let chatContext = 'INIT';
let currentAuthUser = null;
let tempRegUser = { name: "NUEVO JUGADOR", email: "", pin: "" };
const chatBox = document.getElementById('chat-messages');

function addMsg(role, text, type = 'text') {
    const cBox = document.getElementById('chat-messages');
    if (!cBox) return;
    const div = document.createElement('div');
    div.className = `chat-bubble bubble-${role} animate-fade-in flex flex-col shadow-sm`;
    if (type === 'image') {
        div.innerHTML = `<div class="bg-slate-100 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-300 mb-2"><i class="fas fa-id-card text-slate-400 text-5xl"></i></div><p class="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center italic">Validado por Vision Core IA</p>`;
    } else if (type === 'scanning') {
        div.innerHTML = `<div class="scan-line"></div><p class="font-black text-emerald-600 flex items-center italic mb-2 uppercase tracking-tighter leading-none"><i class="fas fa-fingerprint mr-2 animate-pulse"></i> ANALIZANDO...</p><p class="text-[11px] text-slate-500 font-bold">${text}</p>`;
        div.classList.add('overflow-hidden', 'min-h-[110px]', 'bg-emerald-50/20', 'border', 'border-emerald-100');
    } else if (type === 'menu') {
        div.innerHTML = `<p class="font-black text-blue-600 mb-2 uppercase tracking-tighter text-sm italic">Integraltek Intelligence</p><p class="mb-5 font-medium text-slate-700 leading-relaxed">${text}</p>`;
        const buttons = [
            { id: '1', l: '💰 Cargar Saldo' },
            { id: '2', l: '📈 Ver Mi Saldo' },
            { id: '3', l: '🪪 Registrarse' },
            { id: '4', l: '💳 Métodos de Pago' },
            { id: '5', l: '❓ Consultas Frecuentes' },
            { id: '6', l: '📤 Solicitar Retiro' },
            { id: '7', l: '🚨 Reportar Problema' },
            { id: '8', l: '👤 Hablar con Operador' }
        ];

        // Create a grid for buttons
        const btnContainer = document.createElement('div');
        btnContainer.className = "grid grid-cols-1 md:grid-cols-2 gap-2";

        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.className = "wa-btn";
            btn.innerHTML = `<span>${b.l}</span><i class="fas fa-chevron-right opacity-30 text-[9px]"></i>`;
            btn.onclick = () => { addMsg('user', b.l); handleBotAI(b.id); };
            btnContainer.appendChild(btn);
        });
        div.appendChild(btnContainer);
    } else {
        div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-black">$1</strong>').replace(/\n/g, '<br>');
    }
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML += `<span class="text-[8px] opacity-40 self-end mt-4 font-black uppercase tracking-widest leading-none">${time}</span>`;
    cBox.appendChild(div);
    cBox.scrollTop = cBox.scrollHeight;
}

function processInput() {
    const uBox = document.getElementById('user-input');
    if (!uBox) return;
    const val = uBox.value.trim();
    if (!val) return;
    addMsg('user', val);
    uBox.value = '';
    handleBotAI(val);
}

function handleBotAI(input) {
    const clean = input.toLowerCase();
    const ind = document.getElementById('typing-indicator');
    if (ind) ind.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span> bot analizando...';

    setTimeout(() => {
        if (ind) ind.innerText = 'en línea';

        if (clean === 'menu' || clean === 'hola' || clean === 'menú') {
            addMsg('bot', botMainMsg, 'menu');
            chatContext = 'INIT';
            return;
        }

        if (chatContext === 'INIT') {
            if (clean === '1') {
                addMsg('bot', `💰 **SISTEMA DE CARGAS**\n\nTransferí a nuestro Alias oficial:\n🔹 **recargas.juego.mp**\n\nSubí el comprobante con el **Clip 📎** o escribí **LISTO**.`);
                chatContext = 'WAIT_RECHARGE';
            } else if (clean === '2') {
                addMsg('bot', `📈 **CONSULTA DE SALDO SEGURO**\n\nPor favor, indicame tu **Email** para autenticarte.`);
                chatContext = 'SALDO_EMAIL';
            } else if (clean === '3') {
                addMsg('bot', `🪪 **ALTA DE JUGADOR**\n\nVamos a habilitar tu cuenta en 4 pasos.\n\n**Paso 1:** Subí tu **DNI (Frente)** usando el **Clip 📎**.`);
                chatContext = 'KYC_DNI';
            } else if (clean === '4') {
                addMsg('bot', `💳 **MÉTODOS DE PAGO DISPONIBLES**\n\n🔗 **Link de Pago:** (Acreditación Automática)\n🏦 **Transferencia:** Alias 'recargas.juego.mp'\n\n⏰ **Horarios:**\nAutomáticos: 24/7\nManuales: Lunes a Viernes 10-18hs`);
                chatContext = 'INIT';
            } else if (clean === '5') {
                    addMsg('bot', `❓ **PREGUNTAS FRECUENTES**\n\n1. **¿Qué pasa si me equivoco con el alias?**\nContactá soporte inmediatamente.\n\n2. **¿Mínimo de carga?**\n$500 pesos.\n\n3. **¿Retiros?**\nDe Lunes a Viernes.\n\nEscribí **Menú** para volver.`);
                chatContext = 'INIT';
            } else if (clean === '6') {
                addMsg('bot', `📤 **RETIRO DE FICHAS**\n\n¿Qué **monto** deseás retirar? (Mínimo: $2.000)`);
                chatContext = 'RETIRO_MONTO';
            } else if (clean === '7') {
                addMsg('bot', `🚨 **REPORTAR PROBLEMA**\n\nPor favor, describí brevemente tu problema (ej: "No se acreditó mi carga").`);
                chatContext = 'REPORT_ISSUE';
            } else if (clean === '8') {
                addMsg('bot', `👤 **SOLICITUD DE OPERADOR**\n\n🔄 Te estamos derivando a un operador disponible. Por favor, aguardá unos instantes...`);
                setTimeout(() => {
                    addMsg('bot', `⚠️ Todos nuestros operadores están ocupados en este momento. Por favor, dejá tu mensaje y te contactaremos a la brevedad.`);
                    chatContext = 'INIT';
                }, 2000);
            }
        }
        else if (chatContext === 'REPORT_ISSUE') {
            const reportId = Math.floor(Math.random() * 9000) + 1000;
            addMsg('bot', `📝 **REPORTE RECIBIDO**\n\nTu número de seguimiento es **#RPT-${reportId}**. Un operador revisará tu caso.`);
            addLiveLog(`Soporte: Nuevo reporte #${reportId}`, "red");
            chatContext = 'INIT';
        }
        else if (chatContext === 'KYC_EMAIL') {
            tempRegUser.email = input;
            addMsg('bot', `✅ **EMAIL REGISTRADO**\n\n**Paso 4 (Final):** Creá un **PIN de 4 números** para proteger tu saldo.`);
            chatContext = 'KYC_PIN';
        }
        else if (chatContext === 'KYC_PIN') {
            tempRegUser.pin = input;
            addMsg('bot', `🎉 **¡CONFIGURACIÓN EXITOSA!**\n\nTu PIN es **${input}**. Tu cuenta está activa con estado **PENDIENTE DE APROBACIÓN** en el sistema.`, 'menu');
            players.push({ id: "#"+Math.floor(Math.random()*9000+1000), name: tempRegUser.name, email: tempRegUser.email, status: "PENDIENTE KYC", balance: 0, color: "emerald", pin: input, history: 0, out: 0, lastOp: "Alta v4" });
            addLiveLog("CRM: Nueva solicitud de alta detectada", "emerald");
            chatContext = 'INIT';
        }
        else if (chatContext === 'SALDO_EMAIL') {
            const found = players.find(p => p.email.toLowerCase() === clean);
            if (found) { currentAuthUser = found; addMsg('bot', `🆔 Usuario **${found.name}**.\n\nIngresá tu **PIN SECRETO** de 4 dígitos.`); chatContext = 'SALDO_PIN'; }
            else { addMsg('bot', `⚠️ Email no registrado. Escribí **Menú** para registrarte.`); chatContext = 'INIT'; }
        }
        else if (chatContext === 'SALDO_PIN') {
            if (clean === currentAuthUser.pin) { addMsg('bot', `📊 **SALDO CONFIRMADO**\n\nTenés **$${currentAuthUser.balance.toLocaleString()} fichas**.`, 'menu'); chatContext = 'INIT'; }
            else { addMsg('bot', `❌ **PIN INCORRECTO**. Escribí **Menú** para reiniciar.`); }
        }
        else if (chatContext === 'WAIT_RECHARGE' && clean.includes('listo')) {
            addMsg('bot', `⏳ ¡Acreditado! Tenés **$5.000** adicionales disponibles. 🎉`);
            addLiveLog("Bot IA: Depósito procesado", "emerald");
            chatContext = 'INIT';
        }
        else if (chatContext === 'RETIRO_MONTO') {
                // Simple logic for withdrawal simulation
                const amount = parseInt(clean.replace(/\D/g, ''));
                if (amount > 0) {
                    addMsg('bot', `⏳ Estamos procesando tu solicitud de retiro de **$${amount.toLocaleString()}**.\nVas a recibir una confirmación pronto.`);
                    addLiveLog(`Tesorería: Solicitud de retiro ($${amount})`, "emerald");
                    chatContext = 'INIT';
                } else {
                    addMsg('bot', `⚠️ Por favor ingresá un monto válido (sólo números).`);
                }
        }
    }, 1000);
}

// --- ATTACH & MEDIA ---
function toggleAttach() { const m = document.getElementById('attach-menu'); if (m) m.classList.toggle('active'); }
function simulateMedia(type) {
    toggleAttach();
    addMsg('user', type.toUpperCase() + '.JPG', 'image');
    setTimeout(() => {
        if (type === 'dni' && chatContext === 'KYC_DNI') { addMsg('bot', `✅ **DNI RECIBIDO**\nIA detectó: *MARCELO D., 24 Años*.\n\n**Paso 2:** Enviame la **Selfie** sosteniendo el documento.`); chatContext = 'KYC_SELFIE'; }
        else if (type === 'selfie' && chatContext === 'KYC_SELFIE') { addMsg('bot', `Cruzando rasgos faciales con documento...`, 'scanning'); openVisionModal(); }
        else if (type === 'pago') { addMsg('bot', `🧾 **PAGO DETECTADO**\n\nValidando con MercadoPago API... ¡Aprobado! 🎉`); addLiveLog("MercadoPago: Pago Validado", "emerald"); }
    }, 1200);
}

function openVisionModal() {
    const m = document.getElementById('vision-modal');
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
    const pr = document.getElementById('vision-progress');
    const sc = document.getElementById('match-score');
    const bt = document.getElementById('btn-vision-done');
    setTimeout(() => { if (pr) pr.style.width = '100%'; if (sc) sc.innerText = '98.4%'; setTimeout(() => { if (bt) { bt.innerText = "FINALIZAR REGISTRO"; bt.classList.remove('opacity-50', 'cursor-not-allowed'); bt.disabled = false; } }, 2000); }, 200);
}

function finishVision() { document.getElementById('vision-modal').classList.replace('flex', 'hidden'); addMsg('bot', `✨ **MATCH EXITOSO**\n\n**Paso 3:** ¿Cuál es tu **Email** para notificarte premios?`); chatContext = 'KYC_EMAIL'; }

// --- CRM LOGIC ---
function handleCRMAction(id, action) {
    const p = players.find(p => p.id === id);
    if (!p) return;
    if (action === 'approve') { p.status = 'APROBADO'; addLiveLog(`CRM: Alta aprobada para ${id}`, "emerald"); }
    if (action === 'delete') { players = players.filter(x => x.id !== id); addLiveLog(`CRM: Usuario dado de baja`, "red"); }
    if (action === 'pago') { p.balance += 10000; p.history += 10000; p.status = 'APROBADO'; addLiveLog(`MercadoPago: Carga acreditada`, "emerald"); }
    if (action === 'retiro') { p.balance -= 5000; p.out += 5000; p.status = 'APROBADO'; addLiveLog(`Tesorería: Pago enviado a ${p.email}`, "emerald"); }
    renderCRM();
}

function toggleDropdown(id) {
    const el = document.getElementById('drop-' + id);
    document.querySelectorAll('.dropdown-menu').forEach(d => { if (d !== el) d.classList.remove('show'); });
    el.classList.toggle('show');
}

function renderCRM() {
    const tb = document.getElementById('crm-table-body');
    if (!tb) return;
    tb.innerHTML = players.map(p => {
        let stClass = "bg-slate-100 text-slate-500 border-slate-200";
        if (p.status === 'APROBADO') stClass = "bg-emerald-50 text-emerald-600 border-emerald-200";
        if (p.status.includes('RETIRO')) stClass = "bg-rose-50 text-rose-600 border-rose-200 animate-pulse";
        if (p.status.includes('PENDIENTE')) stClass = "bg-amber-50 text-amber-600 border-amber-200";

        return `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition-all group">
            <td class="p-8">
                <div class="flex items-center space-x-5">
                    <div class="w-14 h-14 bg-${p.color}-100 text-${p.color}-600 rounded-2xl flex items-center justify-center font-black shadow-inner">${p.name[0]}</div>
                    <div><p class="font-black text-slate-800 text-lg leading-none">${p.name}</p><p class="text-[9px] text-slate-400 font-bold uppercase mt-1.5 tracking-widest">${p.id} • ${p.lastOp}</p></div>
                </div>
            </td>
            <td class="p-8 leading-tight">
                <p class="text-sm text-slate-600 font-bold italic underline opacity-70">${p.email}</p>
                <p class="text-[9px] text-blue-500 font-black uppercase mt-1 tracking-tighter">PIN: ${p.pin}</p>
            </td>
            <td class="p-8 text-center"><span class="px-5 py-2.5 rounded-xl text-[9px] font-black ${stClass} uppercase flex items-center justify-center w-fit mx-auto shadow-sm border"><i class="fas fa-certificate mr-2"></i>${p.status}</span></td>
            <td class="p-8 text-right font-bold text-xs tracking-tight">
                <p class="text-emerald-500 leading-none">+$${(p.history || 0).toLocaleString()}</p>
                <p class="text-rose-400 leading-none mt-1">-$${(p.out || 0).toLocaleString()}</p>
            </td>
            <td class="p-8 text-right font-black text-3xl text-slate-900 tracking-tighter italic leading-none">$${(p.balance || 0).toLocaleString()}</td>
            <td class="p-8 text-right relative">
                <div class="flex justify-end space-x-2">
                        ${p.status.includes('DEPÓSITO') ? `<button onclick="handleCRMAction('${p.id}', 'pago')" class="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-500/20 active:scale-95">Validar Pago</button>` : ''}
                        ${p.status.includes('RETIRO') ? `<button onclick="handleCRMAction('${p.id}', 'retiro')" class="bg-rose-500 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-rose-500/20 active:scale-95">Pagar Retiro</button>` : ''}
                        ${p.status.includes('KYC') ? `<button onclick="handleCRMAction('${p.id}', 'approve')" class="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95">Aprobar KYC</button>` : ''}
                        <div class="relative">
                        <button onclick="toggleDropdown('${p.id}')" class="w-11 h-11 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><i class="fas fa-ellipsis-h"></i></button>
                        <div id="drop-${p.id}" class="dropdown-menu">
                            <div class="dropdown-item text-rose-500" onclick="handleCRMAction('${p.id}', 'delete')"><i class="fas fa-user-times"></i><span>Dar de baja</span></div>
                            <div class="dropdown-item" onclick="alert('Email enviado a ${p.email}')"><i class="fas fa-envelope"></i><span>Enviar Mail</span></div>
                            <div class="dropdown-item" onclick="alert('SMS enviado')"><i class="fas fa-sms"></i><span>Enviar SMS</span></div>
                            <div class="dropdown-item" onclick="alert('WhatsApp enviado')"><i class="fab fa-whatsapp"></i><span>Enviar WA</span></div>
                        </div>
                        </div>
                </div>
            </td>
        </tr>
    `}).join('');
}

// --- CHARTS ---
let finChart = null; let kycChart = null;
function initDashboardCharts() {
    const ctx1 = document.getElementById('finChart');
    const ctx2 = document.getElementById('kycChart');
    if (!ctx1 || !ctx2) return;
    if (finChart) finChart.destroy(); if (kycChart) kycChart.destroy();
    finChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
            datasets: [
                { label: 'In ($)', data: [450, 720, 980, 1245], backgroundColor: '#10b981', borderRadius: 12 },
                { label: 'Out ($)', data: [120, 310, 450, 412], backgroundColor: '#f43f5e', borderRadius: 12 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
    kycChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
            datasets: [{ label: 'Altas', data: [12, 18, 25, 42, 68, 120, 154], borderColor: '#3b82f6', fill: true, tension: 0.4, borderWidth: 6, pointRadius: 4, backgroundColor: 'rgba(59, 130, 246, 0.05)' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function addLiveLog(text, color) {
    const feed = document.getElementById('security-log');
    if (!feed) return;
    const div = document.createElement('div');
    const colorClass = color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400';
    div.className = `flex items-start space-x-3 p-4 rounded-[1.2rem] border ${colorClass} animate-fade-in mb-3 shadow-sm`;
    div.innerHTML = `<div class="mt-1"><i class="fas fa-bolt text-[8px]"></i></div><div class="flex-1"><p class="font-bold uppercase tracking-tight leading-tight">${text}</p><p class="opacity-50 mt-1 uppercase text-[8px]">Audit: ${new Date().toLocaleTimeString()}</p></div>`;
    feed.prepend(div);
}

// --- PDF EXPORT ---
async function downloadPDF() {
    // Ensure jspdf is loaded
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        alert("Error: jsPDF library not loaded.");
        return;
    }
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("INTEGRALTEK CASINO REPORT (ES)", 15, 20);

    // Subheader
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 30);

    let y = 45;
    doc.setFontSize(10);

    // Simple table using text for now to avoid complexity with AutoTable unless needed
    // But AutoTable is nicer. Let's stick to text for simplicity as requested by previous successful pattern

    players.forEach(p => {
        const line = `${p.id} | ${p.name} | ${p.email} | Bal: $${p.balance.toLocaleString()} | Status: ${p.status}`;
        doc.text(line, 15, y);
        y += 8;
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
    });

    doc.save("Integraltek_Report.pdf");
}

window.onload = () => {
    addMsg('bot', botMainMsg, 'menu');
    const uIn = document.getElementById('user-input');
    if (uIn) uIn.addEventListener('keypress', (e) => { if (e.key === 'Enter') processInput(); });
    addLiveLog("Integraltek Core v4.2 Sincronizado", "emerald");
    renderCRM();
    window.addEventListener('click', (e) => { if (!e.target.closest('.relative')) document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show')); });
};
