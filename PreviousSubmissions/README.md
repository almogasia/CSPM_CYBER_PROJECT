# CSPM Web Application

This is a Cloud Security Posture Management (CSPM) web application with a React frontend and Python Flask backend.

## Project Structure

- `client/` - React/TypeScript frontend application
- `server/` - Python Flask backend API

## Getting Started

### Prerequisites

- Node.js (for frontend)
- Python 3.8+ (for backend)
- Supabase account and credentials

### Installation

1. **Setup Backend (Server)**

   ```bash
   cd server
   pip install -r requirements.txt
   python app.py
   ```

2. **Setup Frontend (Client)**
   ```bash
   cd client
   npm install
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the server directory:
