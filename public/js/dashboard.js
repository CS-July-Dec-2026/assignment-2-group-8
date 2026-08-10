document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('emp_id');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    const payrollCard = document.getElementById('payroll-card');
    const profileCard = document.getElementById('profile-card');

    if (!empId) {
        loadingDiv.classList.add('hidden');
        errorDiv.textContent = 'No Employee ID provided in URL parameters.';
        errorDiv.classList.remove('hidden');
        return;
    }

    // Set PDF download link dynamically
    document.getElementById('btn-download-pdf').href = `/api/pdf/payroll?emp_id=${empId}`;

    try {
        const response = await fetch(`/api/payroll?emp_id=${empId}`);
        const data = await response.json();

        loadingDiv.classList.add('hidden');

        if (response.ok) {
            document.getElementById('emp-id').textContent = data.id;
            document.getElementById('emp-name').textContent = data.username.charAt(0).toUpperCase() + data.username.slice(1);
            document.getElementById('emp-role').textContent = data.role;
            document.getElementById('emp-salary').textContent = data.salary;
            document.getElementById('emp-ssn').textContent = data.ssn;
            document.getElementById('emp-phone').textContent = data.phone || 'N/A';
            document.getElementById('emp-address').textContent = data.address || 'N/A';
            
            // Populate Update Form
            document.getElementById('form-emp-id').value = data.id;
            document.getElementById('form-phone').value = data.phone || '';
            document.getElementById('form-address').value = data.address || '';
            
            payrollCard.classList.remove('hidden');
            profileCard.classList.remove('hidden');
        } else {
            errorDiv.textContent = data.error || 'Failed to fetch data';
            errorDiv.classList.remove('hidden');
            if (response.status === 401) {
                setTimeout(() => window.location.href = '/', 2000);
            }
        }
    } catch (err) {
        loadingDiv.classList.add('hidden');
        errorDiv.textContent = 'An error occurred while fetching payroll data.';
        errorDiv.classList.remove('hidden');
    }

    // Handle Update Profile
    document.getElementById('updateProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
        
        const payload = {
            emp_id: document.getElementById('form-emp-id').value,
            phone: document.getElementById('form-phone').value,
            address: document.getElementById('form-address').value
        };

        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (res.ok) {
            successDiv.textContent = 'Profile successfully updated!';
            successDiv.classList.remove('hidden');
            setTimeout(() => window.location.reload(), 1200);
        } else {
            errorDiv.textContent = result.error || 'Update failed';
            errorDiv.classList.remove('hidden');
        }
    });

    // Handle Delete Account
    document.getElementById('btn-delete-account').addEventListener('click', async () => {
        if (!confirm("Are you sure you want to delete this account?")) return;
        
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
        
        const payload = { emp_id: document.getElementById('form-emp-id').value };

        const res = await fetch('/api/profile', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (res.ok) {
            successDiv.textContent = 'Account successfully deleted!';
            successDiv.classList.remove('hidden');
            setTimeout(() => window.location.href = '/', 1500);
        } else {
            errorDiv.textContent = result.error || 'Delete failed';
            errorDiv.classList.remove('hidden');
        }
    });
});
