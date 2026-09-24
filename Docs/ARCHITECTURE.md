# TradeJournal — Architecture

## 1. Architecture Overview

TradeJournal uses a simple full-stack architecture:

Browser
↓
HTML/CSS/JavaScript
↓
FastAPI REST API
↓
PyMongo
↓
MongoDB Atlas

---

# 2. Technology Stack

## Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API
- Chart.js

No frontend framework is required.

---

## Backend

- Python 3
- FastAPI
- Pydantic
- PyMongo
- JWT
- bcrypt or Argon2

---

## Database

MongoDB Atlas.

---

# 3. Project Structure

TradeJournal/

frontend/
- HTML pages
- CSS
- JavaScript

backend/
- FastAPI application
- authentication
- routes
- validation
- database connection
- file handling

docs/
- project documentation

uploads/
- uploaded screenshots

---

# 4. Frontend Architecture

Frontend responsibilities:

- Render UI
- Collect user input
- Validate basic client-side input
- Send API requests
- Display API responses
- Render charts
- Manage modals
- Display loading states
- Display errors

Frontend must never contain:

- MongoDB credentials
- JWT secret
- backend secrets

---

# 5. Backend Architecture

FastAPI handles:

- Authentication
- Authorization
- Input validation
- Database operations
- P&L calculations
- Analytics
- File upload validation
- Report generation

Suggested backend modules:

backend/
    main.py
    config.py
    database.py
    security.py
    auth.py
    models.py
    validation.py
    uploads.py

    routes/
        auth_routes.py
        daily_routes.py
        trade_routes.py
        analytics_routes.py
        upload_routes.py
        report_routes.py

---

# 6. Authentication Flow

Registration:

Browser
↓
POST /api/auth/register
↓
Validate input
↓
Hash password
↓
Save user
↓
Return success

Login:

Browser
↓
POST /api/auth/login
↓
Verify password
↓
Generate JWT
↓
Return token

Protected request:

Browser
↓
Authorization: Bearer JWT
↓
FastAPI verifies JWT
↓
Identify user
↓
Check ownership
↓
Execute operation

---

# 7. Authorization

Every protected resource must belong to the authenticated user.

For example:

User A requests Trade #123.

Backend must verify:

trade.user_id == current_user.id

If false:

Return:

403 Forbidden

---

# 8. Trading Data Architecture

User
|
| one-to-many
v
Trading Days
|
| one-to-many
v
Trades
|
| one-to-many
v
Screenshots

User
|
| one-to-many
v
Strategies

---

# 9. File Upload Architecture

Browser
↓
Multipart upload
↓
FastAPI
↓
Validate MIME type
↓
Validate extension
↓
Validate file size
↓
Generate safe filename
↓
Save file
↓
Create screenshot document
↓
Return file information

---

# 10. Analytics Architecture

Analytics should be calculated from trade records.

Example:

Trades
↓
Filter by user/date
↓
Aggregate MongoDB data
↓
Calculate statistics
↓
Return JSON
↓
Chart.js
↓
Display chart

Avoid calculating large datasets entirely in the browser.

---

# 11. Error Handling

Backend should return consistent errors.

Example:

{
    "detail": "Trade not found"
}

Frontend converts these into user-friendly notifications.

---

# 12. Security Architecture

Security layers:

1. Password hashing
2. JWT authentication
3. Protected routes
4. Ownership validation
5. Pydantic validation
6. File validation
7. Environment variables
8. CORS restrictions

---

# 13. Deployment Architecture

Frontend can be deployed separately from backend.

Recommended architecture:

Browser
↓
Frontend hosting
↓
FastAPI backend
↓
MongoDB Atlas

Uploaded files should eventually use dedicated object storage rather than local disk for production deployments.

---

# 14. Production File Storage

Development:

Local uploads/

Production:

Use an object storage service such as:

- Cloudinary
- AWS S3
- Cloudflare R2

The application should keep only the file URL/reference in MongoDB.

---

# 15. Scalability

Use:

- MongoDB indexes
- Pagination
- Lazy image loading
- Efficient aggregation pipelines
- API pagination
- Debounced search
- Cached analytics where useful
