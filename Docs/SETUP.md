# TradeJournal — Setup Guide

## 1. Requirements

Install:

- Python 3
- Git
- A modern browser
- MongoDB Atlas account

---

# 2. Clone Project

git clone <repository-url>

cd TradeJournal

---

# 3. Create Python Virtual Environment

Windows:

python -m venv venv

Activate:

venv\Scripts\activate

Linux/macOS:

python3 -m venv venv

source venv/bin/activate

---

# 4. Install Dependencies

pip install -r requirements.txt

---

# 5. MongoDB Atlas

Create a MongoDB Atlas cluster.

Create a database:

tradejournal

Create a database user.

Allow your development IP address in Atlas Network Access.

Copy the MongoDB connection string.

---

# 6. Environment Variables

Create:

.env

Example:

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=tradejournal

JWT_SECRET=replace-with-a-secure-random-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

MAX_UPLOAD_SIZE=5242880

Never commit .env.

---

# 7. Start Backend

Activate virtual environment.

Run:

uvicorn backend.main:app --reload

Backend:

http://127.0.0.1:8000

---

# 8. API Documentation

FastAPI automatically provides:

/docs

Example:

http://127.0.0.1:8000/docs

Alternative:

/redoc

---

# 9. Start Frontend

For development, serve the frontend using a local HTTP server.

Example:

python -m http.server 5500 --directory frontend

Open:

http://127.0.0.1:5500

---

# 10. Frontend API Configuration

Configure the API base URL in JavaScript.

Development:

http://127.0.0.1:8000/api

Production:

https://your-api-domain.com/api

Do not hardcode production secrets.

---

# 11. MongoDB Test

After starting the backend, verify:

GET /health

Expected:

{
    "status": "ok"
}

---

# 12. Authentication Test

Register:

POST /api/auth/register

Then login:

POST /api/auth/login

Copy the returned JWT.

Use it for protected requests.

---

# 13. Test Trading Day

Create a date:

23 September 2026

Then add multiple trades.

Verify:

- Multiple trades can belong to one day
- Each trade has a unique ID
- P&L is calculated
- Duration is calculated

---

# 14. Test Screenshot Upload

Upload:

PNG/JPG/WEBP

Verify:

- Invalid files are rejected
- Large files are rejected
- Screenshot is linked to correct trade
- User cannot access another user's screenshot

---

# 15. Production Setup

Before deployment:

- Change JWT secret
- Restrict CORS
- Configure production MongoDB
- Configure cloud file storage
- Disable debug mode
- Configure HTTPS
- Configure secure environment variables
- Test authentication
- Test uploads
- Test database access

---

# 16. Security Checklist

Before production:

- [ ] Strong JWT secret
- [ ] Password hashing
- [ ] HTTPS
- [ ] Restricted CORS
- [ ] File validation
- [ ] File size limit
- [ ] Ownership validation
- [ ] Environment variables
- [ ] MongoDB credentials protected
- [ ] Debug mode disabled

