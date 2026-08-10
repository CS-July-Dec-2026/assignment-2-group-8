document.addEventListener('DOMContentLoaded', () => {
    
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    let currentUser = null;

    // Auth State Check
    checkAuth();

    async function checkAuth() {
        try {
            const res = await fetch('/api/v2/profile/me');
            if (res.ok) {
                const json = await res.json();
                currentUser = json.data;
                populateDashboard(currentUser);
                showDashboard();
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Login Handler
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        errorDiv.classList.add('hidden');

        try {
            const res = await fetch('/api/v2/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                checkAuth();
            } else {
                errorDiv.textContent = data.error || 'Authentication failed';
                errorDiv.classList.remove('hidden');
            }
        } catch (err) {
            errorDiv.textContent = 'Network error occurred.';
            errorDiv.classList.remove('hidden');
        }
    });

    // Logout Handler
    document.getElementById('btn-logout').addEventListener('click', async () => {
        await fetch('/api/v2/auth/logout', { method: 'POST' });
        window.location.reload();
    });

    function showDashboard() {
        loginView.classList.remove('active');
        dashboardView.classList.remove('hidden');
        dashboardView.classList.add('active');
        loadDirectory();
        initChart();
    }

    function populateDashboard(user) {
        document.getElementById('nav-username').textContent = user.username;
        document.getElementById('nav-role').textContent = user.role;
        document.getElementById('avatar-initial').textContent = user.username.charAt(0).toUpperCase();
        document.getElementById('dash-salary').textContent = user.salary;
    }

    // Tab Switching
    document.querySelectorAll('.nav-menu li').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const targetId = e.currentTarget.getAttribute('data-target');
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
                tab.classList.add('hidden');
            });
            const target = document.getElementById(targetId);
            if (target) {
                target.classList.remove('hidden');
                target.classList.add('active');
            }
        });
    });

    let directoryData = [];

    // Load Company Directory
    async function loadDirectory() {
        try {
            const res = await fetch('/api/v2/directory');
            if (res.ok) {
                const json = await res.json();
                directoryData = json.data || [];
                renderDirectory(directoryData);
            }
        } catch (e) {
            console.error("Directory fetch failed", e);
        }
    }

    function renderDirectory(data) {
        const tbody = document.getElementById('directory-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        data.forEach(emp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${emp.username.charAt(0).toUpperCase() + emp.username.slice(1)}</strong></td>
                <td>${emp.role}</td>
                <td>${emp.department}</td>
                <td><span class="status-dot"></span>Active</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Directory Search Filter
    const searchInput = document.getElementById('directory-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = directoryData.filter(emp => 
                emp.username.toLowerCase().includes(query) ||
                emp.role.toLowerCase().includes(query) ||
                emp.department.toLowerCase().includes(query)
            );
            renderDirectory(filtered);
        });
    }

    // Handle PDF Generation (IDOR: explicitly sends target_ref in JSON payload - visible ONLY in Network tab)
    document.getElementById('btn-generate-pdf').addEventListener('click', async () => {
        const btn = document.getElementById('btn-generate-pdf');
        const originalText = btn.textContent;
        btn.textContent = "Generating...";
        btn.disabled = true;

        try {
            const payload = {
                report_type: "W2_TAX",
                target_ref: currentUser ? currentUser.target_ref : ""
            };

            const res = await fetch('/api/v2/documents/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                
                const contentDisposition = res.headers.get('content-disposition');
                let filename = 'tax_document.pdf';
                if (contentDisposition && contentDisposition.includes('filename=')) {
                    filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
                }
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert("Failed to generate document.");
            }
        } catch (e) {
            console.error(e);
            alert("Network error generating document.");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    // Handle View Stub Modal (IDOR: explicitly sends target_ref in JSON payload - visible ONLY in Network tab)
    const stubModal = document.getElementById('paystub-modal');
    const stubContent = document.getElementById('paystub-content');
    const modalClose = document.getElementById('modal-close');

    if (modalClose) {
        modalClose.addEventListener('click', () => stubModal.classList.add('hidden'));
    }

    const btnViewStub = document.getElementById('btn-view-stub');
    if (btnViewStub) {
        btnViewStub.addEventListener('click', async () => {
            try {
                const payload = {
                    target_ref: currentUser ? currentUser.target_ref : ""
                };

                const res = await fetch('/api/v2/paystub/details', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const data = await res.json();
                    const stub = data.paystub;
                    
                    stubContent.innerHTML = `
                        <p class="text-muted" style="margin-bottom: 1rem;">Pay Period: ${stub.period}</p>
                        <div class="stub-grid">
                            <div class="stub-item">
                                <label>Employee</label>
                                <div class="val">${stub.employeeName}</div>
                            </div>
                            <div class="stub-item">
                                <label>Role & Dept</label>
                                <div class="val">${stub.role}</div>
                            </div>
                            <div class="stub-item">
                                <label>Gross Earnings</label>
                                <div class="val">${stub.grossPay}</div>
                            </div>
                            <div class="stub-item">
                                <label>Federal Tax Withheld</label>
                                <div class="val">${stub.fedTax}</div>
                            </div>
                            <div class="stub-item">
                                <label>State Tax Withheld</label>
                                <div class="val">${stub.stateTax}</div>
                            </div>
                            <div class="stub-item">
                                <label>Net Pay Disbursed</label>
                                <div class="val highlight">${stub.netPay}</div>
                            </div>
                        </div>
                        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-glass); font-size: 0.85rem;" class="text-muted">
                            Disbursed To: ${stub.bankAccount}
                        </div>
                    `;
                    stubModal.classList.remove('hidden');
                } else {
                    alert("Failed to load statement.");
                }
            } catch (e) {
                console.error(e);
                alert("Network error loading statement.");
            }
        });
    }

    // Chart
    function initChart() {
        const ctx = document.getElementById('compChart');
        if (!ctx || ctx.hasAttribute('data-initialized')) return;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['2021', '2022', '2023', '2024', '2025', '2026'],
                datasets: [{
                    label: 'Base Compensation',
                    data: [60000, 65000, 68000, 72000, 80000, 85000],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false },
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
        ctx.setAttribute('data-initialized', 'true');
    }
});
