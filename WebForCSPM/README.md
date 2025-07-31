# 🛡️ CSPM Web Interface – Full Stack Setup Guide

Welcome to **CSPM Web Interface**, a modern Cloud Security Posture Management application featuring:

- 🎨 **Frontend:** React + TypeScript + Tailwind CSS
- 🔧 **Backend:** Python + Flask + Supabase
- 🤖 **AI Models:** Multi-Model Anomaly Detection (Isolation Forest + Random Forest + Autoencoder)

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

Before you begin, make sure you have these tools installed on your computer:

### Required Software

- ✅ [Node.js](https://nodejs.org/) (v16+ recommended) - Download and install from the website
- ✅ [Python](https://www.python.org/) (v3.8+ recommended) - Download and install from the website
- ✅ Internet connection for API services

> 💡 **Tip:** When installing Python, make sure to check "Add Python to PATH" during installation.

---

## 🔐 Required API Keys

You'll need to create accounts and get API keys from these services:

| Service         | Purpose              | Get Key From                              |
| --------------- | -------------------- | ----------------------------------------- |
| Supabase        | Database & Auth      | [Supabase Console](https://supabase.com/) |
| Additional APIs | Security assessments | Configure as needed                       |

---

## 📦 Project Installation

### 1. Download the Project

1. Open your web browser and go to the project repository
2. Click the green "Code" button and select "Download ZIP"
3. Extract the ZIP file to a folder on your computer (e.g., Desktop)
4. Open Command Prompt (Windows) or Terminal (Mac/Linux)

**To open Command Prompt on Windows:**

- Press `Windows + R`, type `cmd`, and press Enter
- OR search for "Command Prompt" in the Start menu

**To open Terminal on Mac:**

- Press `Command + Space`, type "Terminal", and press Enter

### 2. Navigate to the Project Folder

In your command prompt/terminal, type:

```bash
cd Desktop/WebForCSPM
```

> 💡 **Note:** Replace "Desktop" with wherever you extracted the project folder.

---

## 🛠️ Server Setup (Backend)

### Step 1: Open Command Prompt/Terminal

If you don't have it open already, open Command Prompt (Windows) or Terminal (Mac/Linux).

### Step 2: Navigate to Server Folder

```bash
cd server
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

> ⚠️ **If you get an error:** Make sure Python is installed and added to PATH.

### Step 4: Create Environment File

1. In the server folder, create a new file called `.env`
2. Open the file with any text editor (Notepad, VS Code, etc.)
3. Add the following content:

```env
FLASK_APP=app.py
FLASK_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_super_secret_key
```

> 💡 **Important:** Replace `your_supabase_url`, `your_supabase_key`, `your_mongodb_uri`, and `your_super_secret_key` with your actual values from Supabase and MongoDB.

### Step 5: Start the Server

```bash
python app.py
```

You should see a message like: "Running on http://0.0.0.0:5000"

> ✅ **Success!** Your server is now running at: [http://localhost:5000](http://localhost:5000)

---

## 💻 Client Setup (Frontend)

### Step 1: Open a New Command Prompt/Terminal

Keep the server running, and open a **new** Command Prompt or Terminal window.

### Step 2: Navigate to Client Folder

```bash
cd Desktop/WebForCSPM/client
```

### Step 3: Install Dependencies

```bash
npm install
```

> ⚠️ **If you get an error:** Make sure Node.js is installed properly.

### Step 4: Start the Client

```bash
npm run dev
```

You should see a message with a local URL.

> ✅ **Success!** Your client is now running at: [http://localhost:5173](http://localhost:5173)

---

## 🎉 You're All Set!

Now you have both parts running:

- **Backend Server:** http://localhost:5000
- **Frontend Client:** http://localhost:5173

Open your web browser and go to `http://localhost:5173` to use the application!

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

### Model Evaluation Routes (`/api/`)

- `POST /api/model-evaluate` – Evaluate log using multi-model system
- `POST /api/process-random-log` – Process random log from aws_logs.txt

**Input Format:** Pipe-separated string with 18 features:
```
eventID|eventTime|sourceIPAddress|userAgent|eventName|eventSource|awsRegion|eventVersion|userIdentitytype|eventType|userIdentityaccountId|userIdentityprincipalId|userIdentityarn|userIdentityaccessKeyId|userIdentityuserName|errorCode|errorMessage|requestParametersinstanceType
```

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
- Joblib

### AI/ML Models

- **Isolation Forest:** Unsupervised anomaly detection
- **Random Forest:** Supervised risk classification
- **Autoencoder:** Deep learning anomaly detection
- **Rule-based Engine:** Domain-specific security rules

---

## 📚 Useful Docs

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Flask](https://flask.palletsprojects.com/)
- [Supabase](https://supabase.com/)
- [Python](https://www.python.org/)

## 🤖 Multi-Model AI System

The CSPM system now uses a sophisticated multi-model approach for anomaly detection:

### Models Used

1. **Isolation Forest** (40 points)
   - Unsupervised anomaly detection
   - Detects outliers in the feature space

2. **Random Forest** (30 points)
   - Supervised classification
   - Identifies risky patterns based on training data

3. **Autoencoder** (20 points)
   - Deep learning reconstruction error
   - Detects anomalies through reconstruction failure

4. **Rule-based Engine** (10 points each rule)
   - Domain-specific security rules
   - Root user actions, error codes, suspicious IPs

### Risk Scoring

- **HIGH:** 80-100 points
- **MEDIUM:** 50-79 points  
- **LOW:** 0-49 points

### Model Files Required

Place these files in the `server/` directory:
- `model_isolation_forest.pkl`
- `model_random_forest.pkl`
- `model_autoencoder.pkl`
- `preprocessor.pkl`

> ℹ️ **Note:** Both the server and client have `.env.example` files. Copy them to `.env` and fill in your actual values before running the app.
