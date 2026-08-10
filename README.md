# Cyber Security Assignment 2: Web Application Vulnerability Demonstration

* **Group ID:** Group 8 (Section B)
* **Assigned Vulnerability Scenario:** Problem 9 — Insecure Direct Object Reference (IDOR)
<!-- * **Demonstration Video:** [Link to Shared Google Drive Video](TBA_INSERT_YOUR_GOOGLE_DRIVE_VIDEO_LINK_HERE) -->

---

## 📌 Project Overview: LuminaCorp Enterprise

**LuminaCorp Enterprise** is a modern, self-service enterprise payroll and workspace portal built using Node.js, Express, SQLite (`database.db`), and PDFKit.

### Intended Functionality:
1. **Authentication:** Corporate Single Sign-On (SSO) authentication with role-based access.
2. **Overview Dashboard:** Provides employees with a summary of their Year-To-Date (YTD) earnings, annual leave balance, tax verification status, and an interactive compensation growth chart.
3. **Document Center:** A centralized hub where employees can dynamically generate and download official IRS W-2 Tax Statements as PDF files, or view itemized monthly pay stubs in an interactive modal.
4. **Company Directory:** A searchable corporate directory allowing team members to connect across departments.

---

## 🚀 How to Run the Application

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Start the Server
Run the application server:
```bash
node server.js
```
The server will create and connect to the local SQLite database (`database.db`) and start on **`http://localhost:3000`**.

### 3. Demo Credentials
* **Standard Employee:** `alex` / `password123`
* **Executive Admin:** `admin` / `adminpass`

---

## 🔍 Vulnerability Details: Insecure Direct Object Reference (IDOR)

### What is IDOR?
An **Insecure Direct Object Reference (IDOR)** occurs when an application exposes a reference to an internal database object (such as a user ID, file ID, or reference token) in an HTTP request, and the server fails to verify whether the requesting user has permission to access that specific object.

## 📄 Repository Structure
```
├── server.js            # Express server, SQLite DB setup, and API routes
├── database.db          # Physical SQLite database file
├── package.json         # Node.js dependencies (express, express-session, sqlite3, pdfkit)
├── public/
│   ├── index.html       # Single Page Application UI structure
│   ├── css/
│   │   └── style.css    # Premium Dark Mode Glassmorphism styling
│   └── js/
│       └── app.js       # Client-side SPA routing, API fetch handlers, Chart.js setup
└── README.md            # Assignment documentation
```
