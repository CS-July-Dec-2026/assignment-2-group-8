const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 3000;

const db = new sqlite3.Database('./database.db');

const ADMIN_REF = 'e2b349ca-403d-4c31-97b7-6f8d227b2049';
const ALEX_REF = '9b422a55-2d3b-4861-8cf2-4752b57e795a';
const SAM_REF = '3d964f43-34dc-43c3-8fba-7cf7e0f80e92';

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        target_ref TEXT PRIMARY KEY,
        username TEXT,
        password TEXT,
        role TEXT,
        salary TEXT,
        ssn TEXT,
        phone TEXT,
        address TEXT,
        department TEXT
    )`);

    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (!row || row.count === 0) {
            const stmt = db.prepare("INSERT INTO users (target_ref, username, password, role, salary, ssn, phone, address, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            stmt.run(ADMIN_REF, 'admin', 'adminpass', 'Executive Admin', '$250,000', 'XXX-XX-9999', '555-0101', '1 Admin Way, Tech City', 'Executive');
            stmt.run(ALEX_REF, 'alex', 'password123', 'Software Engineer', '$85,000', 'XXX-XX-2222', '555-0102', '42 Dev Lane, Codeville', 'Engineering');
            stmt.run(SAM_REF, 'sam', 'password123', 'Product Manager', '$90,000', 'XXX-XX-3333', '555-0103', '7 Null St, Databurg', 'Product');
            stmt.finalize();
        }
    });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'super-secret-key-for-assignment',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

const requireAuth = (req, res, next) => {
    if (!req.session.targetRef) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    next();
};

// LOGIN
app.post('/api/v2/auth/login', (req, res) => {
    const username = (req.body.username || '').trim().toLowerCase();
    const password = (req.body.password || '').trim();
    
    db.get("SELECT target_ref, username, role FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (user) {
            req.session.targetRef = user.target_ref;
            res.json({ success: true, user: { username: user.username, role: user.role, target_ref: user.target_ref } });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    });
});

app.post('/api/v2/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// GET PROFILE ME
app.get('/api/v2/profile/me', requireAuth, (req, res) => {
    db.get("SELECT target_ref, username, role, salary, ssn, phone, address, department FROM users WHERE target_ref = ?", [req.session.targetRef], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Profile not found' });
        res.json({ success: true, data: user });
    });
});

// GET DIRECTORY (Shows target_ref for each user)
app.get('/api/v2/directory', requireAuth, (req, res) => {
    db.all("SELECT target_ref, username, role, department FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, data: rows });
    });
});

// GENERATE PDF (Vulnerable IDOR: blindly trusts req.body.target_ref)
app.post('/api/v2/documents/generate', requireAuth, (req, res) => {
    const reportType = req.body.report_type;
    
    // VULNERABILITY: Takes target_ref directly from client JSON request without checking authorization
    const requestedTargetRef = req.body.target_ref || req.session.targetRef;

    if (reportType !== 'W2_TAX') {
        return res.status(400).json({ error: 'Invalid report type' });
    }

    db.get("SELECT * FROM users WHERE target_ref = ?", [requestedTargetRef], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Target reference not found' });
        
        const doc = new PDFDocument({ margin: 50 });
        let filename = `TAX_W2_${user.username.toUpperCase()}_2026.pdf`;
        
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');
        
        doc.pipe(res);
        doc.fontSize(28).fillColor('#0f172a').text('LuminaCorp Enterprise', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).fillColor('#64748b').text('OFFICIAL W-2 WAGE AND TAX STATEMENT 2026', { align: 'center' });
        doc.moveDown(2);
        
        doc.rect(50, doc.y, 500, 160).stroke('#cbd5e1');
        doc.moveDown(0.5);
        
        doc.fontSize(16).fillColor('#0f172a').text(`  Employee: ${user.username.toUpperCase()}`);
        doc.fontSize(10).fillColor('#334155').text(`  Target Ref: ${user.target_ref}`);
        doc.fontSize(12).text(`  Role: ${user.role}`);
        doc.text(`  Department: ${user.department}`);
        doc.moveDown(0.5);
        
        doc.fontSize(14).fillColor('#dc2626').text(`  [CONFIDENTIAL FINANCIAL DATA]`);
        doc.fillColor('#0f172a');
        doc.fontSize(12).text(`  Gross Annual Salary: ${user.salary}`);
        doc.text(`  Social Security Number: ${user.ssn}`);
        
        doc.moveDown(2);
        doc.text(`  Registered Home Address: ${user.address}`);
        doc.text(`  Phone: ${user.phone}`);
        
        doc.end();
    });
});

// PAY STUB DETAILS (Vulnerable IDOR: blindly trusts req.body.target_ref)
app.post('/api/v2/paystub/details', requireAuth, (req, res) => {
    const requestedTargetRef = req.body.target_ref || req.session.targetRef;
    
    db.get("SELECT * FROM users WHERE target_ref = ?", [requestedTargetRef], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Pay stub not found' });
        
        res.json({
            success: true,
            paystub: {
                period: "September 1 - September 30, 2026",
                employeeName: user.username.toUpperCase(),
                targetRef: user.target_ref,
                role: user.role,
                department: user.department,
                grossPay: user.username === 'admin' ? "$20,833.33" : "$7,083.33",
                fedTax: user.username === 'admin' ? "$4,500.00" : "$1,125.00",
                stateTax: user.username === 'admin' ? "$1,800.00" : "$425.00",
                healthIns: "$180.00",
                netPay: user.username === 'admin' ? "$14,353.33" : "$5,353.33",
                bankAccount: "CHASE **** " + (user.ssn ? user.ssn.slice(-4) : "9999"),
                salary: user.salary
            }
        });
    });
});

app.listen(PORT, () => {
    console.log(`LuminaCorp Enterprise server running on http://localhost:${PORT}`);
});
