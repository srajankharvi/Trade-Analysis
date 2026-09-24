# TradeJournal — Product Requirements Document

## 1. Product Overview

TradeJournal is a personal trading journal and analytics web application.

The application allows users to record multiple trades for each trading day, upload trading screenshots, record entry and exit information, track trade duration, calculate P&L, record trading strategies and mistakes, and analyze historical trading activity.

The product is designed for personal record keeping and historical analysis.

It is NOT a trading signal platform, automated trading platform, or investment recommendation system.

---

# 2. Problem Statement

Traders often maintain their trading records using screenshots, spreadsheets, notes, or multiple applications.

This makes it difficult to:

- Organize trades by date
- Store screenshots with the corresponding trade
- Calculate trade duration
- Review daily performance
- Identify recurring mistakes
- Analyze strategies
- Analyze trading times
- Review historical performance
- Generate reports

TradeJournal solves this by keeping the complete trading journal in one application.

---

# 3. Target User

Primary user:

A person who wants to manually record and analyze their own trading activity.

The user may record:

- Stocks
- Indexes
- Options
- Futures
- Forex
- Crypto
- Other instruments

The application should not depend on a specific broker.

---

# 4. Core Product Principle

The application follows:

Record → Organize → Analyze → Review

The application should focus on historical user-provided information.

---

# 5. Core Features

## 5.1 Authentication

Users can:

- Register
- Login
- Logout
- View profile

Authentication uses JWT.

Passwords are securely hashed.

---

## 5.2 Trading Days

A user can create or access a trading record for a specific date.

Example:

23 September 2026

A trading day can contain unlimited trades.

---

## 5.3 Multiple Trades Per Day

A single trading day can contain multiple independent trade records.

Example:

23 September 2026

- Trade #1
- Trade #2
- Trade #3
- Trade #4
- Trade #5

Each trade is stored separately.

---

# 6. Trade Information

Each trade can contain:

## Basic

- Symbol
- Instrument
- Buy/Sell
- Strategy
- Setup

## Timing

- Entry date
- Entry time
- Exit date
- Exit time
- Automatically calculated duration

## Prices

- Entry price
- Exit price
- Quantity
- Stop loss
- Target
- P&L

## Analysis

- Market condition
- Entry reason
- Exit reason
- Notes

## Psychology Journal

- Emotion before trade
- Emotion after trade

## Mistakes

- Late entry
- Early exit
- FOMO
- Overtrading
- Revenge trading
- Ignored stop loss
- Increased position size
- Other

## Plan

- Followed
- Partially followed
- Not followed

---

# 7. Screenshot Management

Users can upload screenshots for each trade.

Supported:

- JPG
- JPEG
- PNG
- WEBP

Users can:

- Upload
- View
- Replace
- Delete

Uploads must be securely validated.

---

# 8. Dashboard

The dashboard displays:

- Total trades
- Winning trades
- Losing trades
- Win rate
- Net P&L
- Average trade duration
- Total trading time

Charts:

- Daily P&L
- Win/Loss
- Trading activity

---

# 9. Calendar

Users can view trading activity by calendar.

Each date can display:

- Profit
- Loss
- Break-even
- No trading data

Clicking a date opens the daily journal.

---

# 10. Daily Summary

For each date:

- Total trades
- Winning trades
- Losing trades
- Win rate
- Gross profit
- Gross loss
- Net P&L
- Total trading time
- Average trade duration

These values are calculated from trades.

---

# 11. Daily Reflection

Users can record:

- What went well
- What went wrong
- What to improve tomorrow
- Overall day rating

---

# 12. Timeline

Trades are displayed chronologically.

Example:

09:30
Trade #1
+₹800

10:15
Trade #2
-₹250

11:20
Trade #3
+₹1,200

---

# 13. Analytics

Analytics include:

- Overall performance
- Strategy statistics
- Time-of-day analysis
- Mistake frequency
- Emotion statistics
- Trade duration
- Instrument statistics

---

# 14. Trade Search

Users can search by:

- Symbol
- Strategy
- Date
- Trade type
- Result
- Mistake
- Emotion

---

# 15. Reports

Users can generate:

- Daily reports
- Weekly reports
- Monthly reports
- Custom date range reports

Export formats:

- CSV
- JSON
- PDF

---

# 16. Security Requirements

The system must implement:

- JWT authentication
- Password hashing
- Protected API routes
- User ownership checks
- Pydantic validation
- Secure file uploads
- File type validation
- File size limits
- Environment variables
- CORS configuration

---

# 17. Non-Goals

TradeJournal must NOT:

- Give trading signals
- Recommend securities
- Predict prices
- Execute trades
- Copy trades
- Connect to broker accounts initially
- Promise profits
- Provide financial advice

---

# 18. Success Criteria

The product is successful when a user can:

1. Register
2. Login
3. Select a date
4. Add multiple trades
5. Upload screenshots
6. Record trade information
7. Automatically calculate duration
8. View daily summary
9. Review trade history
10. Analyze historical performance
11. Search trades
12. Export records