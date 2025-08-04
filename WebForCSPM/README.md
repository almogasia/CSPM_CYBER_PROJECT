# 🛡️ CSPM - Cloud Security Posture Management Platform

Welcome to **CSPM**, a comprehensive Cloud Security Posture Management platform featuring:

- 🎨 **Frontend:** React + TypeScript + Tailwind CSS
- 🔧 **Backend:** Python + Flask + MongoDB
- 🤖 **AI Models:** Multi-Model Anomaly Detection (Isolation Forest + Random Forest + Autoencoder)

> ⚡️ _Enterprise-grade cloud security monitoring, threat detection, and compliance management._

---

## 🗂️ Project Structure

```
WebForCSPM/
├── client/       # React frontend application
├── server/       # Python Flask backend API
└── README.md     # Project documentation
```

---

## 🚀 Key Features

### Security Monitoring
- **Real-time Security Logs** - Monitor and analyze security events across cloud environments
- **Urgent Issues Management** - Prioritize and respond to critical security incidents
- **Threat Intelligence & Pattern Analysis** - Advanced ML clustering for threat detection
- **Ticket Management System** - Create, manage, and track security tickets with associated logs

### Analytics & Reporting
- **Security Analytics & Reporting** - Comprehensive insights and performance metrics
- **AI Model Evaluation & Testing** - Test and validate the multi-model AI system

### Security Operations
- **Security Assessment & Compliance** - Comprehensive cloud security posture evaluation
- **Configuration Deployment** - Deploy security configurations across cloud environments
- **Security Ticket Workflow** - Streamlined incident response and tracking system

### Administration
- **User Management & Access Control** - Manage user accounts, roles, and permissions
- **System Information & Documentation** - Comprehensive system documentation

---

## ⚙️ Prerequisites

Before you begin, make sure you have these tools installed on your computer:

### Required Software

- ✅ [Node.js](https://nodejs.org/) (v16+ recommended) - Download and install from the website
- ✅ [Python](https://www.python.org/) (v3.11.x required) - Download and install from the website
- ✅ Internet connection for API services

> 💡 **Tip:** When installing Python, make sure to check "Add Python to PATH" during installation.
> ⚠️ **Important:** Python 3.11.x is required for compatibility with the dependencies in requirements.txt.

---

## 🔐 Required API Keys

You'll need to create accounts and get API keys from these services:

| Service         | Purpose              | Get Key From                              |
| --------------- | -------------------- | ----------------------------------------- |
| MongoDB         | Database & Storage   | [MongoDB Atlas](https://www.mongodb.com/atlas) |
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

> ⚠️ **If you get an error:** Make sure Python 3.11.x is installed and added to PATH.

### Step 4: Create Environment File

1. In the server folder, create a new file called `.env`
2. Open the file with any text editor (Notepad, VS Code, etc.)
3. Add the following content:

```env
FLASK_APP=app.py
FLASK_ENV=development
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_super_secret_key
```

> 💡 **Important:** Replace `your_mongodb_uri` and `your_super_secret_key` with your actual values from MongoDB.

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

### Step 3.5: Install Chart Dependencies (if needed)

If you encounter any chart-related errors, install the chart dependencies explicitly:

```bash
npm install chart.js react-chartjs-2
```

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

### Security Monitoring Routes (`/api/`)

- `GET /api/logs` – Get security logs with pagination
- `GET /api/logs/stats` – Get aggregated statistics from logs
- `GET /api/logs/trends` – Get trend data for the last 24 hours
- `GET /api/logs/recent-activity` – Get recent activity for the last 24 hours
- `GET /api/urgent-issues` – Get urgent security issues
- `POST /api/process-random-log` – Process random log from aws_logs.txt

### Analytics Routes (`/api/`)

- `GET /api/analytics` – Get analytics data for visualization
- `GET /api/logs/chart-data` – Get chart data for analytics dashboard

### Security Operations Routes (`/api/`)

- `POST /api/assessments/start` – Start security assessment
- `GET /api/assessments/recent` – Get recent assessments
- `POST /api/deploy` – Deploy security configurations
- `GET /api/deployments` – Get deployment history

### Ticket Management Routes (`/api/`)

- `GET /api/tickets` – Get tickets with pagination and filtering
- `POST /api/tickets` – Create a new ticket
- `GET /api/tickets/<ticket_id>` – Get specific ticket details
- `PUT /api/tickets/<ticket_id>` – Update ticket information
- `DELETE /api/tickets/<ticket_id>` – Delete a ticket
- `GET /api/tickets/stats` – Get ticket statistics
- `GET /api/tickets/all` – Get all tickets for dropdown selection
- `POST /api/tickets/check-existing` – Check if ticket exists for a log
- `POST /api/tickets/<ticket_id>/add-log` – Add a log to an existing ticket
- `DELETE /api/tickets/<ticket_id>/remove-log` – Remove a log from a ticket

### Model Evaluation Routes (`/api/`)

- `POST /api/model-evaluate` – Evaluate log using multi-model system

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
- Chart.js (for analytics visualizations)
- React-Chartjs-2 (React wrapper for Chart.js)

### Backend

- Python 3.11.x
- Flask
- Flask-CORS
- MongoDB
- Scikit-learn
- Pandas
- NumPy
- PyJWT
- bcrypt
- PyMongo
- Joblib

### Database & Storage

- **MongoDB** - Primary database for logs, tickets, and user data
- **MongoDB** - Database and data storage
- **File Storage** - Local storage for AI models and configurations

### AI/ML Models

- **Isolation Forest:** Unsupervised anomaly detection
- **Random Forest:** Supervised risk classification
- **Autoencoder:** Deep learning anomaly detection
- **Rule-based Engine:** Domain-specific security rules

---

## 🤖 Multi-Model AI System

The CSPM system uses a sophisticated multi-model approach for anomaly detection:

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

* **CRITICAL:** 80-100 points
* **HIGH:** 60-79 points
* **MEDIUM:** 40-59 points
* **LOW:** 20-39 points
* **SAFE:** 0-19 points


Let me know if you want it more detailed or formatted differently!


### Model Files Required

Place these files in the `server/` directory:
- `model_isolation_forest.pkl`
- `model_random_forest.pkl`
- `model_autoencoder.pkl`
- `preprocessor.pkl`

> ℹ️ **Note:** Both the server and client have `.env.example` files. Copy them to `.env` and fill in your actual values before running the app.

---

## 📚 Useful Documentation

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Flask](https://flask.palletsprojects.com/)
- [MongoDB](https://www.mongodb.com/)
- [Python](https://www.python.org/)

---

## 🔒 Security Features

- **Multi-Factor Authentication** - Secure user authentication
- **Role-Based Access Control** - Granular permission management
- **Real-time Threat Detection** - AI-powered anomaly detection
- **Compliance Monitoring** - HIPAA, SOX, PCI compliance tracking
- **Audit Logging** - Comprehensive activity tracking
- **Data Encryption** - End-to-end data protection

---

## 🚀 Enterprise Features

- **Scalable Architecture** - Built for enterprise-scale deployments
- **Multi-Cloud Support** - AWS, Azure, GCP compatibility
- **Real-time Monitoring** - 24/7 security posture monitoring
- **Advanced Analytics** - Comprehensive reporting and insights
- **Automated Remediation** - Intelligent threat response
- **Compliance Reporting** - Automated compliance documentation
