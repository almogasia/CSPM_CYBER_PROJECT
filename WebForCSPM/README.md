# 🛡️ CSPM Web Interface – Full Stack Setup Guide

Welcome to **CSPM Web Interface**, a modern Cloud Security Posture Management application featuring:

- 🎨 **Frontend:** React + TypeScript + Tailwind CSS
- 🔧 **Backend:** Python + Flask + Supabase

> ⚡️ _May the security assessments be thorough, the logs be clean, and the deployments be secure._

---

## 🗂️ Project Structure

```
WebForCSPM/
├── client/       # React frontend
├── server/       # Python Flask backend
└── README.md     # You're here.
```

---

## ⚙️ Prerequisites

Ensure the following tools are installed on your system:

- ✅ [Node.js](https://nodejs.org/) (v16+ recommended)
- ✅ npm (comes with Node.js)
- ✅ [Python](https://www.python.org/) (v3.8+ recommended)
- ✅ pip (comes with Python)
- ✅ Internet connection for API services

---

## 🔐 Required API Keys

You must register and obtain **API keys** from the following services:

| Service         | Purpose              | Get Key From                              |
| --------------- | -------------------- | ----------------------------------------- |
| Supabase        | Database & Auth      | [Supabase Console](https://supabase.com/) |
| Additional APIs | Security assessments | Configure as needed                       |

---

## 📦 Project Installation

### 1. Clone the Project

```bash
git clone <repository-url>
cd WebForCSPM
```

---

## 🛠️ Server Setup (Backend)

### Navigate and install:

```bash
cd server
pip install -r requirements.txt
```

### Create `.env` in `/server` with the following:

```env
FLASK_APP=app.py
FLASK_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_super_secret_key
```

### Start the server:

```bash
python app.py
```

Server runs by default at: [http://localhost:5000](http://localhost:5000)

---

## 💻 Client Setup (Frontend)

### Navigate and install:

```bash
cd ../client
npm install
```

### Start the client:

```bash
npm run dev
```

Client runs at: [http://localhost:5173](http://localhost:5173)

---

## 📚 API Overview

### Auth Routes (`/api/`)

- `POST /api/register` – Create a new user
- `POST /api/login` – Log in and get JWT
- `GET /api/me` – Get current user (JWT required)

### Assessment Routes (`/api/`)

- `POST /api/assessment` – Run security assessment
- `GET /api/logs` – Get security logs
- `POST /api/deploy` – Deploy security configurations

> 🔐 All protected routes require the header:  
> `Authorization: Bearer <your_token>`

---

## 🛠️ Available Scripts

### Frontend (client directory)

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Backend (server directory)

- `python app.py` - Start Flask development server

---

## 📚 Tech Stack

### Frontend

- React 18
- TypeScript
- Tailwind CSS
- Headless UI
- React Query
- React Router
- Vite

### Backend

- Python 3.8+
- Flask
- Flask-CORS
- Supabase
- Scikit-learn
- Pandas
- NumPy
- PyJWT
- bcrypt
- PyMongo

---

## 📚 Useful Docs

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Flask](https://flask.palletsprojects.com/)
- [Supabase](https://supabase.com/)
- [Python](https://www.python.org/)
