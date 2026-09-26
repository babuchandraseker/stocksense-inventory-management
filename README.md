# StockSense — Modern Inventory & Warehouse Management System

StockSense is an enterprise-grade Inventory Management System designed with a warm, modern chocolate & caramel brown visual identity. Built for high-throughput warehouse logistics and supply-chain operations with tailored workflows for both **Inventory Managers** and **Warehouse Staff**.

---

## ✨ Features

### 👑 Inventory Manager Portal
- **Executive Dashboard**: Real-time KPI cards (Valuation, Total SKUs, Low/Out-of-Stock warnings) and interactive Recharts analytics (Movement trends, Category distribution).
- **Product Catalog**: Full SKU management, reorder thresholds, category management, and supplier linking.
- **Inventory Overview**: Real-time multi-warehouse stock balances and status filtering.
- **Receipts Management**: Multi-line inbound consignment tracking with supplier PO integration.
- **Delivery Fulfillment**: Multi-stage fulfillment workflow (`Draft` → `Pick` → `Pack` → `Validate`).
- **Inter-Warehouse Transfers**: Seamless stock rebalancing between facilities with automated audit trails.
- **Physical Adjustments**: Cycle count discrepancy audits with reason codes and immediate net recalculations.
- **Immutable Stock Ledger**: Cryptographically traceable transaction history (`RECEIPT`, `TRANSFER_IN`, `TRANSFER_OUT`, `DELIVERY`, `ADJUSTMENT`).
- **Warehouse Facilities**: Real-time capacity and occupancy utilization meters.

### 👷 Warehouse Staff Portal
- **Staff Dashboard**: Touch-optimized interface with 5 prominent quick-action cards.
- **Streamlined Receiving**: 5-step fast intake with live balance projection.
- **Cycle Counting**: Quick physical stock count discrepancy tool.
- **Quick Dispatch & Rebalance**: Fast transfer requests and pick/pack operations.
- **Activity Log**: Operator shift history and operational audit feeds.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Custom StockSense Warm Brown Design System)
- **Icons**: Lucide React
- **Data Visualizations**: Recharts
- **Routing & State**: React Router v6, Context API (`InventoryContext`, `AuthContext`, `ToastContext`)
- **Backend Ready**: Express + Supabase API Service Layer with transparent zero-downtime offline fallback

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/babuchandraseker/stocksense-inventory-management.git
cd stocksense-inventory-management
npm install
```

### 2. Configure Environment
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Manager** | `admin@stocksense.com` | `admin123` | Full Manager Suite (`/manager/*`) |
| **Staff** | `staff@stocksense.com` | `staff123` | Operational Staff Hub (`/staff/*`) |

*One-click quick login buttons are also provided on the Login screen for immediate access.*

---

## 📄 License
MIT License
