# DATEV Kanzlei-Rechnungswesen (Schulungsumgebung)

An interactive educational simulation web application replicating the German accounting software **DATEV Kanzlei-Rechnungswesen**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/ahmedmabrouk222a/DATEV-.git
cd DATEV-

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🔑 Login Credentials

### Administrator (`admin`)
- **Username:** `admin`
- **Password:** `admin123`
- *Features:* View & switch between student workspaces, live monitoring, JSON backup import/export, reset workspaces.

### Students (`user1` to `user10`)
- **Usernames:** `user1` through `user10`
- **Passwords:** `1001` through `1010` (e.g., `user1` / `1001`)
- *Features:* Isolated private workspace for accounting exercises.

---

## 💼 Modules & Capabilities

1. **Arbeitsplatz:** Company & branch switcher, financial year (`Wirtschaftsjahr`) overview.
2. **Inventar & Inventur:** Asset inventory management (laptops, furniture, vehicles) with opening balance integration (`EB-Wert`).
3. **Belege buchen / Journal:** Complete batch journal entry posting (`Buchungstapel`), live debit/credit balance indicator (`Live Saldo`), automatic tax keys (`BU` 1571, 1576, 1771, 1776).
4. **Kontenplan (SKR03):** German standard chart of accounts with pedagogical explanations (`Erklärung`) for every account, plus quick search popup.
5. **Kontoblatt:** Detailed general ledger per account with running balances (`Saldo`) and opening balances.
6. **Jahresabschluss / Bilanz:** German HGB compliant balance sheet structure (Aktiva vs. Passiva) with live automatic totals.

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router + Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Desktop Windows DATEV theme)
- **Icons:** Lucide React
- **Storage:** Hybrid Sync (Supabase PostgreSQL + local offline storage fallback)
