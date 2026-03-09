# 🏦 FinVault: Full-Stack Personal Finance & Investment Management Platform

FinVault is a premium, high-fidelity financial dashboard built for modern asset management. It features a stunning **Glassmorphism HUD aesthetic**, real-time data visualizations, and a robust microservices-ready architecture.

## ✨ Key Features

- **📊 Intelligent Analytics**: Real-time spending breakdown (Pie Charts) and monthly cash flow velocity (Bar Charts).
- **💸 Vault Ledger**: Advanced activity tracking with search, category filtering, and paginated transaction history.
- **💳 Virtual Asset Cards**: 3D-styled virtual card interface for secure asset management and bank transfers.
- **🛡️ Protocol Budgets**: Configure monthly limits per sector with immediate "Incursion" alerts on overspending.
- **📈 Live Index Feed**: Synchronized market tracker for key indices (AAPL, TSLA, BTC, etc.).
- **🔐 Enterprise Security**: JWT-based authentication with protected route architecture.
- **📱 Fluid Design**: Fully responsive across mobile, tablet, and desktop viewports.

---

## 🛠️ Technical Stack

- **Frontend**: React.js 19, Redux Toolkit, Tailwind CSS 4, Chart.js, Lucide Icons, Vite.
- **Backend**: Node.js, Express.js, PostgreSQL, Redis (Caching), Python (Stock Microservice).
- **Environment**: Docker, Nginx (API Proxy & SPA Server).

---

## 🚀 Quick Start (Docker)

Ensure you have **Docker** and **Docker Compose** installed.

### 1. Clone & Setup
```bash
git clone https://github.com/vish4lsharma/FinVault-Full-Stack-Personal-Finance-Investment-Management-Platform.git
cd FinVault-Full-Stack-Personal-Finance-Investment-Management-Platform
```

### 2. Launch Platform
```bash
docker-compose up -d --build
```
This starts the database, backend, stock-microservice, and the Nginx-proxied frontend.

### 3. Seed Demo Data
Once the containers are running, populate the platform with 7 months of realistic financial data:
```bash
docker exec finvault-backend node seed.js
```

---

## 👤 Access Credentials

After seeding, access the dashboard at **[http://localhost](http://localhost)**:
- **Identifier**: `admin@finvault.com`
- **Secret**: `password123`

---

## 📐 Architecture

- **Nginx Proxy**: Acts as the single entry point (Port 80), routing `/api/*` to the Node.js backend while serving the React SPA.
- **Finance Engine**: Handles complex aggregations for analytics and budget status checks.
- **Banking Service**: Manages atomic balance operations and P2P transfers.
- **Stock Service**: Python-based worker for fetching market data via Alpha Vantage API.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Developed by Vishal Sharma**