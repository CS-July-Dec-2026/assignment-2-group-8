# Cyber Security Assignment 2: Web Application Vulnerability Demonstration

* **Group ID:** Group 8 (Section B)
* **Assigned Vulnerability Scenario:** Problem 9 — Insecure Direct Object Reference (IDOR)
* **Demonstration Video:** [Link to Shared Google Drive Video]
(https://drive.google.com/file/d/1iiEd-DRENb-oFXeUMO33iX8FWfABnbQm/view?usp=drive_link)

---

## 📌 Project Overview: LuminaCorp Enterprise

**LuminaCorp Enterprise** is a modern, self-service enterprise payroll and workspace portal built using Node.js, Express, SQLite (`database.db`), and PDFKit.

### Intended Functionality:
1. **Authentication & Roles:** Corporate Single Sign-On with Role-Based Access Control (`Executive Admin` vs `Software Engineer`).
2. **Overview Dashboard:** Summarizes YTD earnings, leave balance, tax verification status, and an interactive compensation chart.
3. **Document Center:** 
   * **Standard Employee View:** Generates W-2 Tax PDFs and views pay stubs for the logged-in user.
   * **Executive Admin View:** Features an **Admin Employee Document Generator** panel with a dropdown select, allowing Admins to generate tax PDFs for any employee.
4. **Company Directory:** Searchable internal directory listing employees across departments.

---

## 🚀 How to Run the Application

### 1. Installation
```bash
npm install
```

### 2. Start the Server
```bash
node server.js
```
The server connects to the local SQLite database (`database.db`) and starts on **`http://localhost:3000`**.

### 3. Demo Credentials
* **Executive Admin:** `admin` / `adminpass`
* **Standard Employee:** `alex` / `password123`

---

## 🔍 Vulnerability Details: Insecure Direct Object Reference (IDOR) via Missing Role Check

### What is the Flaw?
To support the Executive Admin feature (generating PDFs for any employee), the backend endpoints `/api/v2/documents/generate` and `/api/v2/paystub/details` accept a `target_ref` parameter in the request payload:
```javascript
const requestedTargetRef = req.body.target_ref || req.session.targetRef;
```

**The Vulnerability:** The developer intended `target_ref` overrides to be restricted to Executive Admins, but **omitted the Admin role check**. Any logged-in standard employee (`alex`) can send a `target_ref` set to another user's identifier (such as the Executive Admin), and the server will process it without checking if the user has an Admin role.

### The Attack Walkthrough:
1. Log in as `alex` (`password123`). Notice that the Admin dropdown panel is hidden from Alex's UI.
2. Inspect the `/api/v2/directory` response in the Network tab to copy the Executive Admin's `target_ref` (`e2b349ca-403d-4c31-97b7-6f8d227b2049`).
3. Click **Generate PDF** or **View Stub**. Intercept/replay the HTTP POST request and pass the Admin's `target_ref`:
   ```json
   {
     "report_type": "W2_TAX",
     "target_ref": "e2b349ca-403d-4c31-97b7-6f8d227b2049"
   }
   ```
4. Because the backend lacks an Admin role check, it returns the Executive Admin's confidential W-2 Tax PDF and pay stub statement to standard employee Alex.

---

## 🛠️ Remediation: Adding the Admin Role Check

To fix this IDOR flaw, the backend must enforce Role-Based Access Control (RBAC) to ensure that `target_ref` overrides are exclusively allowed if the authenticated session user has the `Executive Admin` role:

```javascript
// SECURE REMEDIATION: Enforce Admin Role Check for target_ref overrides
if (req.body.target_ref && req.body.target_ref !== req.session.targetRef && req.session.userRole !== 'Executive Admin') {
    return res.status(403).json({ error: 'Access Denied: Executive Admin role required for target_ref override.' });
}
```

If a non-admin attempts to supply a `target_ref` for another user, the server rejects the request with an **HTTP 403 Forbidden** error.

---

## 📄 Repository Structure
```
├── server.js            # Express server, SQLite DB setup, and vulnerable/secure API routes
├── database.db          # Physical SQLite database file
├── package.json         # Node.js dependencies
├── public/
│   ├── index.html       # Single Page Application UI (with conditional Admin Panel)
│   ├── css/
│   │   └── style.css    # Premium Dark Mode Glassmorphism styling
│   └── js/
│       └── app.js       # Client-side SPA logic and API fetch handlers
└── README.md            # Assignment documentation
```
