// --- LOCAL STORAGE & DATA LAYER ---
const DB_KEY = 'integraltek_casino_v7';

// Initial Data Structure
const defaultData = {
    config: { region: 'es', theme: 'light' },
    user: { step: 'MENU', tempLogin: null, kycEmail: null, withdrawAmount: 0 },
    players: [
        { id: 101, name: "Matias G.", email: "matias@gmail.com", pin: "1234", balance: 45000, status: "VERIFIED", history: { in: 150000, out: 105000 } },
        { id: 102, name: "Carla R.", email: "carla@hotmail.com", pin: "0000", balance: 1200, status: "PENDING_KYC", history: { in: 1200, out: 0 } },
        { id: 103, name: "Lucas P.", email: "lucas@gmail.com", pin: "9999", balance: 0, status: "PENDING_DEPOSIT", history: { in: 0, out: 0 } },
        { id: 104, name: "Pedro S.", email: "pedro@yahoo.com", pin: "5555", balance: 15000, status: "PENDING_WITHDRAWAL", history: { in: 30000, out: 15000 } }
    ],
    chat: [],
    logs: []
};

// Region Configuration
const regions = {
    es: {
        flag: "🇪🇸", currency: "$", locale: "es-AR", // Generic ES (Argentina Locale for Format)
        nav_chat: "Consola Chat", nav_crm: "CRM Jugadores", nav_dash: "Dashboard",
        status_online: "SISTEMA ACTIVO", title_agent: "Agente Operativo AI", ggr_label: "Profit Neto", reset_btn: "Resetear Sistema",
        crm_title: "Gestión de Jugadores", crm_desc: "Control centralizado ES.",
        th_player: "JUGADOR", th_contact: "DATOS", th_status: "ESTADO", th_balance: "BALANCE", th_actions: "ACCIONES",
        kpi_in: "Ingresos", kpi_out: "Retiros", chart_fin: "Flujo Financiero", chart_kyc: "Nuevos Registros",
        drawer_title: "Adjuntar Documentación", lbl_doc: "DNI / ID", lbl_receipt: "Comprobante", btn_cancel: "CANCELAR",
        btn_pdf: "Reporte PDF",
        bot: {
            welcome: "👋 ¡Hola! Soy tu asistente de **Casino**. ¿Qué necesitas?",
            menu_recharge: "💰 Recargar", menu_balance: "📈 Saldo", menu_kyc: "🪪 Registro", menu_withdraw: "📤 Retirar",
            menu_faq: "❓ Ayuda", menu_report: "🚨 Reporte", menu_agent: "👤 Operador", menu_methods: "💳 Métodos",
            ask_method: "📥 **Recarga**\n\nTransferí a la cuenta bancaria o billetera virtual.\n\nSubí tu comprobante.",
            ask_email_bal: "🔒 **Seguridad**\n\nIngresá tu **Email** registrado.",
            ask_pin: "🔑 Ingresá tu **PIN** de 4 dígitos.",
            balance_show: "💰 **Saldo Disponible:**",
            kyc_start: "📝 **Registro**\n\nNecesitamos validar tu **DNI** (Frente).",
            kyc_selfie: "✅ **DNI OK**\n\nAhora una **Selfie** tuya.",
            kyc_email: "✅ **Biometría OK**\n\nIndicame tu **Email**.",
            kyc_pin: "🔐 **PIN**\n\nCreá un PIN de 4 dígitos.",
            kyc_done: "🎉 **¡Cuenta Lista!**\n\nEsperando validación.",
            withdraw_amount: "💸 **Retiro**\n\n¿Cuánto querés retirar? (Mín $500)",
            withdraw_cbu: "🏦 Indicame tu **CBU / Alias**.",
            withdraw_done: "⏳ **Procesando**\n\nTu retiro está en camino.",
            error_pin: "❌ PIN incorrecto.",
            error_email: "❌ Email no existe.",
            fallback: "⚠️ No entendí. Usá el menú."
        }
    },
    us: {
        flag: "🇺🇸", currency: "$", locale: "en-US",
        nav_chat: "Chat Console", nav_crm: "Player CRM", nav_dash: "Dashboard",
        status_online: "SYSTEM ACTIVE", title_agent: "AI Operating Agent", ggr_label: "Net Profit", reset_btn: "Reset System",
        crm_title: "Player Management", crm_desc: "Centralized control US.",
        th_player: "PLAYER", th_contact: "DATA", th_status: "STATUS", th_balance: "BALANCE", th_actions: "ACTIONS",
        kpi_in: "Cash-In", kpi_out: "Cash-Out", chart_fin: "Financial Flow", chart_kyc: "New Signups",
        drawer_title: "Attach Documents", lbl_doc: "ID / License", lbl_receipt: "Receipt", btn_cancel: "CANCEL",
        btn_pdf: "PDF Report",
        bot: {
            welcome: "👋 Hi! I'm your **Casino US** assistant. How can I help?",
            menu_recharge: "💰 Deposit", menu_balance: "📈 Balance", menu_kyc: "🪪 Register", menu_withdraw: "📤 Withdraw",
            menu_faq: "❓ Help", menu_report: "🚨 Report", menu_agent: "👤 Agent", menu_methods: "💳 Methods",
            ask_method: "📥 **Deposit**\n\nSend via CashApp/Venmo/Zelle.\n\nUpload the receipt.",
            ask_email_bal: "🔒 **Security**\n\nEnter your registered **Email**.",
            ask_pin: "🔑 Enter your 4-digit **PIN**.",
            balance_show: "💰 **Balance (USD):**",
            kyc_start: "📝 **Sign Up**\n\nPlease upload your **Driver's License** or **ID**.",
            kyc_selfie: "✅ **ID OK**\n\nNow take a **Selfie**.",
            kyc_email: "✅ **Biometrics OK**\n\nEnter your **Email**.",
            kyc_pin: "🔐 **PIN**\n\nCreate a 4-digit security PIN.",
            kyc_done: "🎉 **Account Ready!**\n\nWaiting for approval.",
            withdraw_amount: "💸 **Withdraw**\n\nAmount to withdraw? (Min $50)",
            withdraw_cbu: "🏦 Enter your **CashApp Tag** or **Zelle**.",
            withdraw_done: "⏳ **Processing**\n\nWithdrawal initiated.",
            error_pin: "❌ Wrong PIN.",
            error_email: "❌ Email not found.",
            fallback: "⚠️ I didn't understand. Use menu."
        }
    },
    br: {
        flag: "🇧🇷", currency: "R$", locale: "pt-BR",
        nav_chat: "Console Chat", nav_crm: "CRM Jogadores", nav_dash: "Painel",
        status_online: "SISTEMA ATIVO", title_agent: "Agente Operacional IA", ggr_label: "Lucro Líquido", reset_btn: "Resetar Sistema",
        crm_title: "Gestão de Jogadores", crm_desc: "Controle centralizado BR.",
        th_player: "JOGADOR", th_contact: "DADOS", th_status: "STATUS", th_balance: "SALDO", th_actions: "AÇÕES",
        kpi_in: "Entradas", kpi_out: "Saídas", chart_fin: "Fluxo Financeiro", chart_kyc: "Novos Cadastros",
        drawer_title: "Anexar Documentos", lbl_doc: "RG / CNH", lbl_receipt: "Comprovante", btn_cancel: "CANCELAR",
        btn_pdf: "Relatório PDF",
        bot: {
            welcome: "👋 Olá! Sou seu assistente **Casino BR**. Como ajudo?",
            menu_recharge: "💰 Depositar", menu_balance: "📈 Saldo", menu_kyc: "🪪 Criar Conta", menu_withdraw: "📤 Sacar",
            menu_faq: "❓ Ajuda", menu_report: "🚨 Reportar", menu_agent: "👤 Suporte", menu_methods: "💳 Métodos",
            ask_method: "📥 **Depósito via PIX**\n\nChave: **pix.casino@pagar.me**\n\nEnvie o comprovante.",
            ask_email_bal: "🔒 **Segurança**\n\nInforme seu **Email** cadastrado.",
            ask_pin: "🔑 Informe seu **PIN** de 4 dígitos.",
            balance_show: "💰 **Saldo (BRL):**",
            kyc_start: "📝 **Cadastro**\n\nEnvie uma foto do **RG** ou **CNH**.",
            kyc_selfie: "✅ **Doc OK**\n\nAgora uma **Selfie** sua.",
            kyc_email: "✅ **Biometria OK**\n\nInforme seu **Email**.",
            kyc_pin: "🔐 **Senha**\n\nCrie um PIN de 4 números.",
            kyc_done: "🎉 **Conta Pronta!**\n\nAguardando aprovação.",
            withdraw_amount: "💸 **Saque**\n\nQuanto quer sacar? (Mín R$50)",
            withdraw_cbu: "🏦 Informe sua **Chave PIX**.",
            withdraw_done: "⏳ **Processando**\n\nPIX enviado em breve.",
            error_pin: "❌ PIN incorreto.",
            error_email: "❌ Email não encontrado.",
            fallback: "⚠️ Não entendi. Use o menu."
        }
    }
};

// Internal Helpers
function loadDB() {
    const s = localStorage.getItem(DB_KEY);
    return s ? JSON.parse(s) : JSON.parse(JSON.stringify(defaultData));
}

function saveDB(d) {
    localStorage.setItem(DB_KEY, JSON.stringify(d));
}

// --- MOCK API (BACKEND SIMULATION) ---
// This structure mimics real API calls, ready for Vercel Serverless
const api = {
    async getPlayers() {
        // Simulate Network Delay
        await new Promise(r => setTimeout(r, 300));
        return window.db.players;
    },

    async registerPlayer(email, pin) {
        await new Promise(r => setTimeout(r, 800));
        const newPlayer = {
            id: Math.floor(Math.random()*9000+1000),
            name: "New User",
            email: email,
            pin: pin,
            balance: 0,
            status: "PENDING_KYC",
            history: {in:0, out:0}
        };
        window.db.players.unshift(newPlayer);
        saveDB(window.db);
        return newPlayer;
    },

    async requestWithdraw(email, amount) {
        await new Promise(r => setTimeout(r, 600));
        const req = {
            id: Math.floor(Math.random()*9000+1000),
            name: "Retiro Pendiente",
            email: email,
            pin: "0000",
            balance: 0,
            status: "PENDING_WITHDRAWAL",
            history: {in:0, out:0}
        };
        window.db.players.unshift(req);
        saveDB(window.db);
        return req;
    },

    async updatePlayerStatus(id, newStatus, details = {}) {
        await new Promise(r => setTimeout(r, 400));
        const p = window.db.players.find(x => x.id === id);
        if(!p) throw new Error("Player not found");

        p.status = newStatus;
        if(details.balanceChange) {
            p.balance += details.balanceChange;
            if(details.balanceChange > 0) p.history.in += details.balanceChange;
            else p.history.out += Math.abs(details.balanceChange);
        }

        saveDB(window.db);
        return p;
    },

    async deletePlayer(id) {
         window.db.players = window.db.players.filter(x => x.id !== id);
         saveDB(window.db);
         return true;
    },

    // For Config/Chat state persistence
    saveState() { saveDB(window.db); }
};

function resetSystem() {
    if(confirm("¿Resetear todo el sistema? / Reset all?")) {
        localStorage.removeItem(DB_KEY);
        location.reload();
    }
}

// Format Money Helper
function formatMoney(amount) {
    const r = window.db ? window.db.config.region : 'es';
    const conf = regions[r];
    return new Intl.NumberFormat(conf.locale, { style: 'currency', currency: conf.currency === '$' ? 'USD' : (conf.currency === 'R$' ? 'BRL' : 'ARS') }).format(amount);
}

// Initialize Global State
window.db = loadDB();
window.api = api;
