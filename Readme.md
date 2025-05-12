# 🌱 EcoMart – A Circular Economy Progressive Web App (PWA)

**EcoMart** is a sustainability-first Progressive Web App that empowers users to shop eco-friendly products, schedule waste pickups, donate surplus food, and earn rewards for green actions. Built for a greener tomorrow, EcoMart bridges commerce with conscious consumption.

---

## 🚀 Features

- 🛍️ **Eco-Friendly Shopping**: Discover and purchase sustainable everyday items.
- ♻️ **Sell Post-Use Waste**: Schedule pickups of recyclable waste like packaging, bottles, electronics, etc.
- 🍱 **Donate Surplus Food**: Users can request pickup of extra food for NGO delivery.
- 🏆 **EcoPoints System**: Earn GreenPoints for every responsible action.
- 📊 **Community Leaderboard**: Compete and inspire others through impact scores.
- 📱 **PWA-Ready**: Installable as a mobile app with offline access.
- 🔔 **Smart Alerts**: Post-purchase notifications for waste pickup reminders.
- 💬 **Community Chat**: Engage with other eco-warriors.

---

## 🛠 Tech Stack

### Frontend:
- **React + TypeScript**
- **TailwindCSS**
- **React Router**
- **Firebase Authentication**
- **Firestore (Real-Time DB)**
- **Chart.js / Recharts (for analytics)**
- **PWA Support (Service Worker, Manifest)**

### Backend:
- **Node.js + Express**
- **Firebase Admin SDK**
- **MongoDB (optional)**
- **Razorpay (for donations/payments)**

### APIs & Integrations:
- **Google Maps API** – Rider routing
- **Firebase Cloud Messaging (FCM)** – Push notifications
- **(Optional) TensorFlow.js** – Image-based waste classification
- **(Optional) Razorpay API** – Payments for premium/NGO donations

---

## 📁 Project Structure

ecomart/
├── frontend/
│ ├── src/
│ │ ├── pages/
│ │ ├── components/
│ │ └── firebase/
│ └── public/
├── backend/
│ ├── routes/
│ ├── controllers/
│ └── server.js
├── .env.example
└── README.md


💡 Future Improvements

🔌 IoT-based Smart Dustbin Integration (for automatic waste sensing)
🧠 AI-powered waste classification using TensorFlow.js
🏬 EcoMart Marketplace for redeeming GreenPoints
📦 NGO & Recycler onboarding panel (Admin Dashboard)
