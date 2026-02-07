# Integraltek AI - Global Casino Command Suite v7.3

This is the professional, Vercel-ready version of the Integraltek Casino Management System.
It features a complete frontend structure with simulated backend logic, designed for easy migration to real Serverless Functions.

## 🚀 Features

*   **Multi-Region Support:** Mexico (MX), USA (US), Brazil (BR) with localized currency and language.
*   **AI Chat Console:** Conversational interface for players (Deposits, KYC, Support).
*   **Vision Core (Simulation):** Advanced KYC flow with OCR and Liveness detection simulation.
*   **CRM Dashboard:** Real-time player management (Approve/Reject/Ban).
*   **Financial Analytics:** KPI Cards and Charts for GGR, Cash-In/Out.
*   **Vercel Ready:** Structured for immediate deployment.

## 📂 Project Structure

*   `public/index.html`: Main application entry point.
*   `public/css/main.css`: Custom styling (Tailwind is loaded via CDN).
*   `public/js/app.js`: Frontend UI logic and Event Handling.
*   `public/js/db.js`: Data Layer and Mock API (Backend Simulation).
*   `vercel.json`: Deployment configuration.

## 🛠️ How to Run / Deploy

### Local Development
Simply open `public/index.html` in any modern browser. No build step required.

### Deploy to Vercel
1.  Push this repository to GitHub/GitLab/Bitbucket.
2.  Import the project into Vercel.
3.  Vercel will automatically detect the `public` directory as the static site root.
4.  Deploy!

## 🔗 API Integration
The `window.api` object in `public/js/db.js` mimics a real backend API.
To connect a real database (Postgres/Firebase/Supabase), simply replace the methods inside `api` to fetch data from your endpoints (e.g., `await fetch('/api/players')`).
