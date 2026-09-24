# TradeJournal — Technical Decisions

## Decision 001 — Vanilla JavaScript

### Decision

Use HTML, CSS and Vanilla JavaScript for the frontend.

### Reason

The project is intended to demonstrate fundamental frontend development skills without depending on a frontend framework.

Benefits:

- Simple architecture
- Easy deployment
- Less abstraction
- Strong HTML/CSS/JS fundamentals
- Small frontend bundle

---

# Decision 002 — FastAPI

### Decision

Use Python FastAPI as the backend.

### Reason

FastAPI provides:

- High performance
- Automatic OpenAPI documentation
- Pydantic validation
- Python ecosystem
- Easy REST API development
- Good async support

---

# Decision 003 — MongoDB Atlas

### Decision

Use MongoDB Atlas as the database.

### Reason

The trading journal contains flexible document-oriented data.

MongoDB works well for:

- Trade documents
- User-specific records
- Strategy metadata
- Screenshot metadata
- Flexible journal fields

Atlas also provides managed cloud database infrastructure.

---

# Decision 004 — JWT Authentication

### Decision

Use JWT for API authentication.

### Reason

The frontend and backend are separated.

JWT allows the backend to authenticate API requests without maintaining traditional server-side sessions.

---

# Decision 005 — Password Hashing

### Decision

Use bcrypt or Argon2.

### Reason

Passwords must never be stored as plain text.

Password hashing protects stored credentials.

---

# Decision 006 — Pydantic Validation

### Decision

Use Pydantic for API validation.

### Reason

Pydantic integrates directly with FastAPI and provides structured validation.

---

# Decision 007 — Multiple Trade Documents

### Decision

Each trade is stored as an independent MongoDB document.

### Reason

A user can have many trades per day.

This allows:

- Individual editing
- Individual deletion
- Individual screenshots
- Efficient filtering
- Analytics
- Pagination

---

# Decision 008 — Trading Day Reference

### Decision

Each trade references its trading day.

### Reason

This provides a clear relationship:

User → Trading Day → Trade

---

# Decision 009 — Chart.js

### Decision

Use Chart.js.

### Reason

It provides sufficient chart types for:

- P&L
- Win/loss
- Trading activity
- Strategy analysis
- Time analysis

without requiring a frontend framework.

---

# Decision 010 — Screenshot Storage

### Development

Store files locally.

### Production

Use cloud object storage.

MongoDB stores file metadata/reference rather than large binary files.

### Reason

Large files should not unnecessarily increase database size.

---

# Decision 011 — No Trading Recommendations

### Decision

The application will not provide buy/sell recommendations.

### Reason

The product's purpose is journaling and historical analysis.

---

# Decision 012 — Backend Financial Calculations

### Decision

Important calculations should be validated/calculated on the backend.

### Reason

Frontend calculations can be manipulated.

The backend should be the trusted source for stored derived values.
