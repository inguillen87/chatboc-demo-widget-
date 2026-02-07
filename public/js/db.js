// --- LOCAL STORAGE & DATA LAYER ---
const DB_KEY = 'integraltek_casino_v9';

// Initial Data Structure
const defaultData = {
    config: { region: 'es', theme: 'light' },
    session: {
        phoneNumber: "5491155556666",
        userId: null
    },
    flowState: {
        step: 'MENU',
        tempData: {}
    },
    players: [
        {
            id: 101,
            firstName: "Matias",
            lastName: "G.",
            username: "matiasg",
            phone: "5491112345678",
            email: "matias@gmail.com",
            pin: "1234",
            balance: 45000,
            status: "VERIFIED",
            history: { in: 150000, out: 105000 },
            kyc: { dni: true, selfie: true }
        },
        {
            id: 102,
            firstName: "Carla",
            lastName: "R.",
            username: "carlar88",
            phone: "5491187654321",
            email: "carla@hotmail.com",
            pin: "0000",
            balance: 1200,
            status: "PENDING_KYC",
            history: { in: 1200, out: 0 },
            kyc: { dni: false, selfie: false }
        }
    ],
    chat: [],
    logs: []
};

// Region Configuration
const regions = {
    es: {
        flag: "🇪🇸", currency: "$", locale: "es-AR",
        bot: {
            welcome: "👋 ¡Hola! Soy tu asistente de **Casino**. ¿Qué necesitas?",
            welcome_known: "👋 ¡Hola **{name}**! ¿En qué te ayudo hoy?",
            menu_recharge: "💰 Cargar", menu_balance: "📈 Saldo", menu_kyc: "🪪 Registro", menu_withdraw: "📤 Retirar",
            menu_faq: "❓ Ayuda", menu_report: "🚨 Reporte", menu_agent: "👤 Operador", menu_methods: "💳 Métodos",

            reg_start: "📝 **Nuevo Usuario**\n\nPor normativa, necesito tu **Nombre** real.",
            reg_surname: "Perfecto. Ahora tu **Apellido**.",
            reg_user: "Creá un **Nombre de Usuario** para la plataforma.",
            reg_email: "📧 Ingresá tu **Email** personal.",
            reg_pin: "🔒 Creá un **PIN de Seguridad** (4 dígitos).",
            reg_kyc: "📷 Para activar la cuenta, subí una foto de tu **DNI**.",
            reg_selfie: "🤳 Ahora una **Selfie** sosteniendo el DNI.",
            reg_done: "🎉 **¡Registro Exitoso!**\n\nTu cuenta está siendo validada por el equipo.",

            dep_amount: "💰 **Cargar Saldo**\n\n¿Qué monto vas a ingresar?\n\n🔥 **Promo:** > 5,000 obtenés **10% EXTRA**.",
            dep_receipt: "🏦 **Transferencia**\n\nAlias: *casino.integraltek*\n\nSubí el **comprobante** para acreditarte.",
            dep_wait: "⏳ **Procesando...**\n\nValidando comprobante con Vision IA...",
            dep_done: "✅ **Solicitud Recibida**\n\nSe acreditará en breve tras la aprobación del CRM.",

            with_amount: "💸 **Retiro de Fondos**\n\n¿Cuánto querés retirar?",
            with_pin: "🔐 Ingresá tu **PIN** para confirmar.",
            with_done: "⏳ **Procesando Retiro**\n\nEl dinero se enviará a tu cuenta bancaria asociada.",

            err_amount: "⚠️ Monto inválido.",
            err_pin: "❌ PIN Incorrecto.",
            err_bal: "⚠️ Saldo insuficiente.",
            fallback: "🤖 No entendí. Usá el menú.",
            smart_fallback: "🤖 Entiendo que querés operar, pero soy una IA en entrenamiento. \n\nPodés escribir:\n🔹 *\"Quiero cargar saldo\"*\n🔹 *\"Necesito registrarme\"*\n🔹 *\"Retirar dinero\"*\n\nO usá el menú de abajo. 👇"
        }
    },
    us: {
        flag: "🇺🇸", currency: "$", locale: "en-US",
        bot: {
            welcome: "👋 Hi! I'm your **Casino** assistant. How can I help?",
            welcome_known: "👋 Hi **{name}**! How can I help you today?",
            menu_recharge: "💰 Deposit", menu_balance: "📈 Balance", menu_kyc: "🪪 Register", menu_withdraw: "📤 Withdraw",
            menu_faq: "❓ Help", menu_report: "🚨 Report", menu_agent: "👤 Agent", menu_methods: "💳 Methods",

            reg_start: "📝 **New User**\n\nI need your real **First Name** for compliance.",
            reg_surname: "Great. Now your **Last Name**.",
            reg_user: "Create a **Username** for the platform.",
            reg_email: "📧 Enter your personal **Email**.",
            reg_pin: "🔒 Create a **Security PIN** (4 digits).",
            reg_kyc: "📷 To activate, please upload a photo of your **ID**.",
            reg_selfie: "🤳 Now a **Selfie** holding your ID.",
            reg_done: "🎉 **Registration Successful!**\n\nYour account is being validated.",

            dep_amount: "💰 **Deposit Funds**\n\nEnter amount?\n\n🔥 **Promo:** > 5,000 get **10% EXTRA**.",
            dep_receipt: "🏦 **Transfer**\n\nTag: *casino.integraltek*\n\nUpload the **receipt** to credit funds.",
            dep_wait: "⏳ **Processing...**\n\nValidating receipt with Vision AI...",
            dep_done: "✅ **Request Received**\n\nFunds will be credited shortly after CRM approval.",

            with_amount: "💸 **Withdraw Funds**\n\nHow much to withdraw?",
            with_pin: "🔐 Enter your **PIN** to confirm.",
            with_done: "⏳ **Processing Withdrawal**\n\nMoney will be sent to your linked bank account.",

            err_amount: "⚠️ Invalid amount.",
            err_pin: "❌ Wrong PIN.",
            err_bal: "⚠️ Insufficient funds.",
            fallback: "🤖 I didn't understand. Use the menu.",
            smart_fallback: "🤖 I'm training AI. \n\nYou can type:\n🔹 *\"I want to deposit\"*\n🔹 *\"Register me\"*\n🔹 *\"Withdraw\"*\n\nOr use the menu below. 👇"
        }
    },
    br: {
        flag: "🇧🇷", currency: "R$", locale: "pt-BR",
        bot: {
            welcome: "👋 Olá! Sou seu assistente **Casino**. Como ajudo?",
            welcome_known: "👋 Olá **{name}**! Como posso ajudar?",
            menu_recharge: "💰 Depositar", menu_balance: "📈 Saldo", menu_kyc: "🪪 Criar Conta", menu_withdraw: "📤 Sacar",
            menu_faq: "❓ Ajuda", menu_report: "🚨 Reportar", menu_agent: "👤 Suporte", menu_methods: "💳 Métodos",

            reg_start: "📝 **Novo Usuário**\n\nPreciso do seu **Nome** real.",
            reg_surname: "Ótimo. Agora seu **Sobrenome**.",
            reg_user: "Crie um **Nome de Usuário**.",
            reg_email: "📧 Digite seu **Email** pessoal.",
            reg_pin: "🔒 Crie um **PIN de Segurança** (4 dígitos).",
            reg_kyc: "📷 Para ativar, envie uma foto do seu **RG/CNH**.",
            reg_selfie: "🤳 Agora uma **Selfie** segurando o documento.",
            reg_done: "🎉 **Cadastro com Sucesso!**\n\nSua conta está sendo validada.",

            dep_amount: "💰 **Depositar**\n\nQual valor?\n\n🔥 **Promo:** > 5.000 ganhe **10% EXTRA**.",
            dep_receipt: "🏦 **PIX**\n\nChave: *casino.integraltek*\n\nEnvie o **comprovante**.",
            dep_wait: "⏳ **Processando...**\n\nValidando com Vision AI...",
            dep_done: "✅ **Solicitação Recebida**\n\nSerá creditado em breve após aprovação.",

            with_amount: "💸 **Saque**\n\nQuanto quer sacar?",
            with_pin: "🔐 Digite seu **PIN** para confirmar.",
            with_done: "⏳ **Processando Saque**\n\nO dinheiro será enviado via PIX.",

            err_amount: "⚠️ Valor inválido.",
            err_pin: "❌ PIN Incorreto.",
            err_bal: "⚠️ Saldo insuficiente.",
            fallback: "🤖 Não entendi. Use o menu.",
            smart_fallback: "🤖 Sou uma IA em treinamento. \n\nVocê pode digitar:\n🔹 *\"Quero depositar\"*\n🔹 *\"Criar conta\"*\n🔹 *\"Sacar\"*\n\nOu use o menu abaixo. 👇"
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
const api = {
    // 1. Session / Identity
    async identifyUser() {
        await new Promise(r => setTimeout(r, 100)); // Latency
        const phone = window.db.session.phoneNumber;
        const user = window.db.players.find(p => p.phone === phone);
        if (user) {
            window.db.session.userId = user.id;
            saveDB(window.db);
            return user;
        }
        return null;
    },

    // 2. Registration
    async registerUser(data) {
        await new Promise(r => setTimeout(r, 800));
        const newId = Math.floor(Math.random() * 90000) + 10000;
        const newUser = {
            id: newId,
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            email: data.email,
            phone: window.db.session.phoneNumber, // Bind to current session
            pin: data.pin,
            balance: 0,
            status: "PENDING_KYC",
            history: { in: 0, out: 0 },
            kyc: { dni: false, selfie: false },
            pendingAction: null
        };
        window.db.players.unshift(newUser);
        window.db.session.userId = newId; // Auto-login
        saveDB(window.db);
        return newUser;
    },

    // 3. Financials
    async createDepositRequest(amount) {
        await new Promise(r => setTimeout(r, 500));
        const user = window.db.players.find(p => p.id === window.db.session.userId);
        if (!user) throw new Error("No user");

        const bonus = amount > 5000 ? amount * 0.10 : 0;

        user.status = "PENDING_DEPOSIT";
        user.pendingAction = {
            type: "DEPOSIT",
            amount: amount,
            bonus: bonus,
            total: amount + bonus,
            timestamp: new Date().toISOString()
        };
        saveDB(window.db);
        return user;
    },

    async createWithdrawRequest(amount) {
        await new Promise(r => setTimeout(r, 500));
        const user = window.db.players.find(p => p.id === window.db.session.userId);
        if (!user) throw new Error("No user");
        if (user.balance < amount) throw new Error("Insufficient funds");

        user.status = "PENDING_WITHDRAWAL";
        user.pendingAction = {
            type: "WITHDRAW",
            amount: amount,
            timestamp: new Date().toISOString()
        };
        saveDB(window.db);
        return user;
    },

    // 4. CRM Actions (Admin)
    async approveAction(userId) {
        await new Promise(r => setTimeout(r, 300));
        const user = window.db.players.find(p => p.id === userId);
        if (!user || !user.pendingAction) return;

        const action = user.pendingAction;

        if (action.type === "DEPOSIT") {
            user.balance += action.total;
            user.history.in += action.amount;
            user.status = "VERIFIED";
        } else if (action.type === "WITHDRAW") {
            user.balance -= action.amount;
            user.history.out += action.amount;
            user.status = "VERIFIED";
        }

        user.pendingAction = null;
        saveDB(window.db);
    },

    async rejectAction(userId) {
        await new Promise(r => setTimeout(r, 300));
        const user = window.db.players.find(p => p.id === userId);
        if (user) {
            user.status = "VERIFIED";
            user.pendingAction = null;
            saveDB(window.db);
        }
    },

    saveState() { saveDB(window.db); }
};

// Security Helper (XSS Prevention)
function escapeHTML(str) {
    if(typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
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
window.escapeHTML = escapeHTML; // Expose for app.js
