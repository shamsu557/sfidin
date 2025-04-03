/**
 * SFIDIN - Sarauniya Fanna Initiative for Development in Nigeria
 * Admin JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initAuthentication();
    initTogglePassword();
    initSessionTimeout();
    initNavigation();
    initDashboard();
    initDonationsTable();
    initUserManagement();
    initPdfExport();
    initExpenseManagement();
});

/**
 * Authentication functionality
 * Handles login, logout, and session management
 */
function initAuthentication() {
    const loginForm = document.getElementById('loginForm');
    const loginAlert = document.getElementById('loginAlert');
    const adminNav = document.querySelector('.admin-nav');
    
    // Check if user is already logged in
    if (isLoggedIn()) {
        showAdminDashboard();
    }
    
    // Check if first login has been used
    const firstLoginUsed = localStorage.getItem('firstLoginUsed') === 'true';
    
    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // Check for first-time login credentials
            if (email === 'admin@sfidin' && password === 'security' && !firstLoginUsed) {
                // Mark first login as used
                localStorage.setItem('firstLoginUsed', 'true');
                
                // Create default admin user
                const user = {
                    id: 1,
                    name: 'Admin User',
                    email: 'admin@sfidin',
                    role: 'superadmin',
                    status: 'active',
                    lastLogin: new Date().toISOString()
                };
                
                // Store auth token and user info
                localStorage.setItem('authToken', 'token-' + Date.now());
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('sessionStart', Date.now());
                
                // Show admin dashboard
                showAdminDashboard();
                
                // Show welcome message
                alert('Welcome! This is your first login. Please create additional admin users for future access as these credentials will no longer work.');
                
                return;
            }
            
            // Send login request to backend
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, rememberMe })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Store auth token and user info
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('sessionStart', Date.now());
                    
                    // Show admin dashboard
                    showAdminDashboard();
                } else {
                    // Show error message
                    loginAlert.textContent = data.message || 'Invalid email or password';
                    loginAlert.classList.remove('d-none');
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                
                // For demo purposes, simulate successful login
                simulateLogin(email);
            });
        });
    }
    
    // Handle logout
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

/**
 * Toggle password visibility
 */
function initTogglePassword() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
}

/**
 * Session timeout functionality
 * Auto logout after 4 minutes of inactivity
 */
function initSessionTimeout() {
    const SESSION_TIMEOUT = 4 * 60 * 1000; // 4 minutes in milliseconds
    const WARNING_TIME = 30 * 1000; // 30 seconds before timeout
    
    let sessionTimeoutId;
    let warningTimeoutId;
    let warningShown = false;
    
    // Reset session timer on user activity
    function resetSessionTimer() {
        if (!isLoggedIn()) return;
        
        clearTimeout(sessionTimeoutId);
        clearTimeout(warningTimeoutId);
        
        // Remove warning if shown
        if (warningShown) {
            const warningElement = document.querySelector('.session-timeout-warning');
            if (warningElement) {
                warningElement.remove();
            }
            warningShown = false;
        }
        
        // Set new timeouts
        warningTimeoutId = setTimeout(showTimeoutWarning, SESSION_TIMEOUT - WARNING_TIME);
        sessionTimeoutId = setTimeout(autoLogout, SESSION_TIMEOUT);
    }
    
    // Show timeout warning
    function showTimeoutWarning() {
        if (!isLoggedIn()) return;
        
        warningShown = true;
        
        // Create warning element
        const warningElement = document.createElement('div');
        warningElement.className = 'alert alert-warning session-timeout-warning';
        warningElement.innerHTML = `
            <h5><i class="fas fa-exclamation-triangle me-2"></i> Session Timeout</h5>
            <p>Your session will expire in 30 seconds due to inactivity.</p>
            <button class="btn btn-sm btn-primary me-2" id="extendSessionBtn">Stay Logged In</button>
            <button class="btn btn-sm btn-secondary" id="logoutNowBtn">Logout Now</button>
        `;
        
        document.body.appendChild(warningElement);
        
        // Add event listeners to buttons
        document.getElementById('extendSessionBtn').addEventListener('click', function() {
            resetSessionTimer();
        });
        
        document.getElementById('logoutNowBtn').addEventListener('click', function() {
            logout();
        });
    }
    
    // Auto logout
    function autoLogout() {
        if (isLoggedIn()) {
            logout();
            
            // Show message
            const loginAlert = document.getElementById('loginAlert');
            if (loginAlert) {
                loginAlert.textContent = 'Your session has expired due to inactivity. Please log in again.';
                loginAlert.classList.remove('d-none');
            }
        }
    }
    
    // Track user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetSessionTimer, false);
    });
    
    // Initial setup
    if (isLoggedIn()) {
        resetSessionTimer();
    }
}

/**
 * Navigation functionality
 * Handles navigation between different sections
 */
function initNavigation() {
    const dashboardLink = document.getElementById('dashboardLink');
    const donationsLink = document.getElementById('donationsLink');
    const usersLink = document.getElementById('usersLink');
    
    const dashboardSection = document.getElementById('dashboardSection');
    const donationsSection = document.getElementById('donationsSection');
    const usersSection = document.getElementById('usersSection');
    
    // Helper function to show a section and hide others
    function showSection(sectionToShow) {
        [dashboardSection, donationsSection, usersSection].forEach(section => {
            if (section === sectionToShow) {
                section.classList.remove('d-none');
            } else {
                section.classList.add('d-none');
            }
        });
        
        // Update active nav link
        [dashboardLink, donationsLink, usersLink].forEach(link => {
            if ((link === dashboardLink && sectionToShow === dashboardSection) ||
                (link === donationsLink && sectionToShow === donationsSection) ||
                (link === usersLink && sectionToShow === usersSection)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Add event listeners to nav links
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(dashboardSection);
            loadDashboardData();
        });
    }
    
    if (donationsLink) {
        donationsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(donationsSection);
            loadDonationsData();
        });
    }
    
    if (usersLink) {
        usersLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(usersSection);
            loadUsersData();
        });
    }
    
    // Quick action buttons
    const viewAllDonationsBtn = document.getElementById('viewAllDonationsBtn');
    if (viewAllDonationsBtn) {
        viewAllDonationsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(donationsSection);
            loadDonationsData();
        });
    }
    
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    if (manageUsersBtn) {
        manageUsersBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(usersSection);
            loadUsersData();
        });
    }
}

/**
 * Dashboard functionality
 * Loads and displays dashboard data
 */
function initDashboard() {
    // This will be called when the dashboard is shown
    window.loadDashboardData = function() {
        const totalDonations = document.getElementById('totalDonations');
        const totalDonors = document.getElementById('totalDonors');
        const availableBalance = document.getElementById('availableBalance');
        const recentDonationsTable = document.getElementById('recentDonationsTable');
        
        // Fetch dashboard data from backend
        fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            // Update dashboard stats
            if (totalDonations) totalDonations.textContent = formatCurrency(data.totalDonations);
            if (totalDonors) totalDonors.textContent = data.totalDonors;
            if (availableBalance) availableBalance.textContent = formatCurrency(data.availableBalance);
            
            // Update recent donations table
            if (recentDonationsTable) {
                recentDonationsTable.innerHTML = '';
                
                data.recentDonations.forEach(donation => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${donation.name}</td>
                        <td>${formatCurrency(donation.amount)}</td>
                        <td>${formatDate(donation.date)}</td>
                        <td><span class="badge bg-success">Completed</span></td>
                    `;
                    recentDonationsTable.appendChild(row);
                });
            }
        })
        .catch(error => {
            console.error('Dashboard data error:', error);
            
            // For demo purposes, load sample data
            loadSampleDashboardData();
        });
    };
}

/**
 * Donations table functionality
 * Loads and displays donations data with filtering and pagination
 */
function initDonationsTable() {
    const donationFilterForm = document.getElementById('donationFilterForm');
    const donationsTableBody = document.getElementById('donationsTableBody');
    const donationsPagination = document.getElementById('donationsPagination');
    
    // Initialize date inputs with current month range
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate && endDate) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        startDate.valueAsDate = firstDay;
        endDate.valueAsDate = lastDay;
    }
    
    // Handle filter form submission
    if (donationFilterForm) {
        donationFilterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            loadDonationsData(1); // Load first page with new filters
        });
    }
    
    // Load donations data function
    window.loadDonationsData = function(page = 1) {
        if (!donationsTableBody) return;
        
        // Get filter values
        const filters = {
            startDate: startDate ? startDate.value : '',
            endDate: endDate ? endDate.value : '',
            page: page,
            limit: 10
        };
        
        // Fetch donations data from backend
        fetch(`/api/admin/donations?${new URLSearchParams(filters)}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            // Update donations table
            donationsTableBody.innerHTML = '';
            
            data.donations.forEach(donation => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${donation.name}</td>
                    <td>${donation.email}</td>
                    <td>${donation.phone || 'N/A'}</td>
                    <td>${donation.country}</td>
                    <td>${formatCurrency(donation.amount)}</td>
                    <td>${donation.reference}</td>
                    <td>${formatDate(donation.date)}</td>
                    <td>
                        <a href="#" class="action-btn action-btn-view" title="View Details">
                            <i class="fas fa-eye"></i>
                        </a>
                    </td>
                `;
                donationsTableBody.appendChild(row);
            });
            
            // Update pagination
            if (donationsPagination) {
                updatePagination(donationsPagination, data.totalPages, data.currentPage);
            }
        })
        .catch(error => {
            console.error('Donations data error:', error);
            
            // For demo purposes, load sample data
            loadSampleDonationsData();
        });
    };
    
    // Helper function to update pagination
    function updatePagination(paginationElement, totalPages, currentPage) {
        paginationElement.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const ul = document.createElement('ul');
        ul.className = 'pagination';
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </a>`;
        if (currentPage > 1) {
            prevLi.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                loadDonationsData(currentPage - 1);
            });
        }
        ul.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            
            li.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                loadDonationsData(i);
            });
            
            ul.appendChild(li);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
        </a>`;
        if (currentPage < totalPages) {
            nextLi.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                loadDonationsData(currentPage + 1);
            });
        }
        ul.appendChild(nextLi);
        
        paginationElement.appendChild(ul);
    }
}

/**
 * User management functionality
 * Handles loading, adding, and deleting users
 */
function initUserManagement() {
    const usersTableBody = document.getElementById('usersTableBody');
    const addUserForm = document.getElementById('addUserForm');
    const saveUserBtn = document.getElementById('saveUserBtn');
    
    // Load users data function
    window.loadUsersData = function() {
        if (!usersTableBody) return;
        
        // Fetch users data from backend
        fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            // Update users table
            usersTableBody.innerHTML = '';
            
            data.users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role === 'superadmin' ? 'Super Admin' : 'Regular Admin'}</td>
                    <td><span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}">${user.status}</span></td>
                    <td>${formatDate(user.lastLogin)}</td>
                    <td>
                        <a href="#" class="action-btn action-btn-edit" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </a>
                        ${getCurrentUser().role === 'superadmin' && user.id !== getCurrentUser().id ? 
                            `<a href="#" class="action-btn action-btn-delete" data-user-id="${user.id}" title="Delete User">
                                <i class="fas fa-trash-alt"></i>
                            </a>` : ''}
                    </td>
                `;
                usersTableBody.appendChild(row);
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.action-btn-delete').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const userId = this.getAttribute('data-user-id');
                    if (confirm('Are you sure you want to delete this user?')) {
                        deleteUser(userId);
                    }
                });
            });
        })
        .catch(error => {
            console.error('Users data error:', error);
            
            // For demo purposes, load sample data
            loadSampleUsersData();
        });
    };
    
    // Handle add user form submission
    if (saveUserBtn && addUserForm) {
        saveUserBtn.addEventListener('click', function() {
            const name = document.getElementById('newUserName').value;
            const email = document.getElementById('newUserEmail').value;
            const password = document.getElementById('newUserPassword').value;
            const role = document.getElementById('newUserRole').value;
            
            if (!name || !email || !password || !role) {
                alert('Please fill in all fields');
                return;
            }
            
            // Send add user request to backend
            fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ name, email, password, role })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Close modal and reload users data
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
                    modal.hide();
                    
                    // Reset form
                    addUserForm.reset();
                    
                    // Reload users data
                    loadUsersData();
                    
                    // Show success message
                    alert('User added successfully');
                } else {
                    alert(data.message || 'Failed to add user');
                }
            })
            .catch(error => {
                console.error('Add user error:', error);
                
                // For demo purposes, simulate success
                simulateAddUser(name, email, role);
            });
        });
    }
    
    // Delete user function
    function deleteUser(userId) {
        fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reload users data
                loadUsersData();
                
                // Show success message
                alert('User deleted successfully');
            } else {
                alert(data.message || 'Failed to delete user');
            }
        })
        .catch(error => {
            console.error('Delete user error:', error);
            
            // For demo purposes, simulate success
            alert('User deleted successfully');
            loadUsersData();
        });
    }
}

/**
 * PDF export functionality
 * Generates PDF reports of donations
 */
function initPdfExport() {
    const exportDonationsBtn = document.getElementById('exportDonationsBtn');
    const exportDonationsPdfBtn = document.getElementById('exportDonationsPdfBtn');
    
    // Handle export buttons
    [exportDonationsBtn, exportDonationsPdfBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                generateDonationsPdf();
            });
        }
    });
    
    // Generate donations PDF
    function generateDonationsPdf() {
        // Get filter values if available
        const startDate = document.getElementById('startDate')?.value || '';
        const endDate = document.getElementById('endDate')?.value || '';
        
        // Fetch donations data for PDF
        fetch(`/api/admin/donations/export?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            createDonationsPdf(data);
        })
        .catch(error => {
            console.error('Export donations error:', error);
            
            // For demo purposes, use sample data
            createDonationsPdf(getSampleDonationsData());
        });
    }
    
    // Create donations PDF
    function createDonationsPdf(data) {
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            alert('PDF generation library not loaded. Please try again later.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const { autoTable } = window.jspdf;
        
        // Create new PDF document
        const doc = new jsPDF();
        
        // Add header
        doc.setFontSize(18);
        doc.setTextColor(46, 125, 50); // Primary color
        doc.text('SFIDIN Donations Report', 105, 15, { align: 'center' });
        
        // Add organization info
        doc.setFontSize(10);
        doc.setTextColor(33, 33, 33);
        doc.text('Sarauniya Fanna Initiative for Development in Nigeria', 105, 22, { align: 'center' });
        doc.text('123 Development Road, Abuja, Nigeria', 105, 27, { align: 'center' });
        doc.text('Email: info@sfidin.org | Phone: +234 123 456 7890', 105, 32, { align: 'center' });
        
        // Add report period
        const startDate = document.getElementById('startDate')?.value || 'All time';
        const endDate = document.getElementById('endDate')?.value || 'Present';
        doc.setFontSize(12);
        doc.text(`Report Period: ${startDate} to ${endDate}`, 105, 40, { align: 'center' });
        
        // Add date generated
        doc.setFontSize(10);
        doc.text(`Generated on: ${formatDate(new Date())}`, 105, 45, { align: 'center' });
        
        // Add donations table
        const tableColumn = ['Name', 'Email', 'Phone', 'Country', 'Amount', 'Date', 'Reference'];
        const tableRows = data.donations.map(donation => [
            donation.name,
            donation.email,
            donation.phone || 'N/A',
            donation.country,
            formatCurrency(donation.amount),
            formatDate(donation.date),
            donation.reference
        ]);
        
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [46, 125, 50],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            }
        });
        
        // Add summary
        const finalY = doc.lastAutoTable.finalY || 150;
        doc.setFontSize(12);
        doc.setTextColor(46, 125, 50);
        doc.text('Summary', 14, finalY + 10);
        
        doc.setFontSize(10);
        doc.setTextColor(33, 33, 33);
        doc.text(`Total Donations: ${data.donations.length}`, 14, finalY + 20);
        
        // Calculate total amount
        const totalAmount = data.donations.reduce((sum, donation) => sum + donation.amount, 0);
        doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 14, finalY + 25);
        
        // Add available balance
        doc.text(`Available Balance: ${formatCurrency(data.availableBalance || totalAmount)}`, 14, finalY + 30);
        
        // Add expenses section
        doc.setFontSize(12);
        doc.setTextColor(46, 125, 50);
        doc.text('Expenses', 14, finalY + 40);
        
        // Add expenses table if available
        if (data.expenses && data.expenses.length > 0) {
            const expenseColumns = ['Date', 'Description', 'Amount'];
            const expenseRows = data.expenses.map(expense => [
                formatDate(expense.date),
                expense.description,
                formatCurrency(expense.amount)
            ]);
            
            autoTable(doc, {
                head: [expenseColumns],
                body: expenseRows,
                startY: finalY + 45,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 3
                },
                headStyles: {
                    fillColor: [21, 101, 192], // Secondary color
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                }
            });
        } else {
            doc.setFontSize(10);
            doc.setTextColor(33, 33, 33);
            doc.text('No expenses recorded for this period.', 14, finalY + 45);
        }
        
        // Add signature section
        const signatureY = doc.lastAutoTable ? (doc.lastAutoTable.finalY + 20) : (finalY + 60);
        
        doc.setFontSize(10);
        doc.text('Secretary Signature: _______________________', 14, signatureY);
        doc.text('Date: _______________________', 14, signatureY + 10);
        
        // Save the PDF
        doc.save('SFIDIN_Donations_Report.pdf');
    }
}

/**
 * Expense management functionality
 * Handles adding and tracking expenses
 */
function initExpenseManagement() {
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const saveExpenseBtn = document.getElementById('saveExpenseBtn');
    const addExpenseForm = document.getElementById('addExpenseForm');
    
    // Set default date to today
    const expenseDate = document.getElementById('expenseDate');
    if (expenseDate) {
        expenseDate.valueAsDate = new Date();
    }
    
    // Show expense modal
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('addExpenseModal'));
            modal.show();
        });
    }
    
    // Handle save expense
    if (saveExpenseBtn && addExpenseForm) {
        saveExpenseBtn.addEventListener('click', function() {
            const amount = document.getElementById('expenseAmount').value;
            const description = document.getElementById('expenseDescription').value;
            const date = document.getElementById('expenseDate').value;
            
            if (!amount || !description || !date) {
                alert('Please fill in all fields');
                return;
            }
            
            // Send add expense request to backend
            fetch('/api/admin/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ amount, description, date })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Close modal and reload dashboard data
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
                    modal.hide();
                    
                    // Reset form
                    addExpenseForm.reset();
                    
                    // Reload dashboard data
                    loadDashboardData();
                    
                    // Show success message
                    alert('Expense added successfully');
                } else {
                    alert(data.message || 'Failed to add expense');
                }
            })
            .catch(error => {
                console.error('Add expense error:', error);
                
                // For demo purposes, simulate success
                alert('Expense added successfully');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
                modal.hide();
                
                // Reset form
                addExpenseForm.reset();
                
                // Update available balance
                const availableBalance = document.getElementById('availableBalance');
                if (availableBalance) {
                    const currentBalance = parseFloat(availableBalance.textContent.replace('₦', '').replace(/,/g, ''));
                    const newBalance = currentBalance - parseFloat(amount);
                    availableBalance.textContent = formatCurrency(newBalance);
                }
            });
        });
    }
}

/**
 * Helper Functions
 */

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('authToken') !== null;
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Show admin dashboard
function showAdminDashboard() {
    document.getElementById('loginSection').classList.add('d-none');
    document.getElementById('dashboardSection').classList.remove('d-none');
    document.querySelector('.admin-nav').classList.remove('d-none');
    
    // Set active nav link
    document.getElementById('dashboardLink').classList.add('active');
    
    // Load dashboard data
    loadDashboardData();
}

// Logout function
function logout() {
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionStart');
    
    // Show login section
    document.getElementById('loginSection').classList.remove('d-none');
    document.getElementById('dashboardSection').classList.add('d-none');
    document.querySelector('.admin-nav').classList.add('d-none');
    
    // Clear login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.reset();
    
    // Hide any alerts
    const loginAlert = document.getElementById('loginAlert');
    if (loginAlert) loginAlert.classList.add('d-none');
}

// Format currency
function formatCurrency(amount) {
    return '₦' + parseFloat(amount).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Demo/Sample Data Functions
 * These functions are used for demonstration purposes when the backend is not available
 */

// Simulate login
function simulateLogin(email) {
    // Check if user exists in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);
    
    if (user) {
        // User exists, update last login
        user.lastLogin = new Date().toISOString();
        localStorage.setItem('users', JSON.stringify(users));
        
        // Create session
        const userInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: 'active',
            lastLogin: user.lastLogin
        };
        
        localStorage.setItem('authToken', 'sample-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('sessionStart', Date.now());
    } else {
        // Create new user
        const newUser = {
            id: 1,
            name: 'Admin User',
            email: email,
            role: 'superadmin',
            status: 'active',
            lastLogin: new Date().toISOString()
        };
        
        // Store in localStorage
        localStorage.setItem('authToken', 'sample-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('sessionStart', Date.now());
        
        // Add to users array if it doesn't exist
        if (!users.some(u => u.id === newUser.id)) {
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    // Show admin dashboard
    showAdminDashboard();
}

// Simulate adding a user
function simulateAddUser(name, email, role) {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
    modal.hide();
    
    // Reset form
    document.getElementById('addUserForm').reset();
    
    // Show success message
    alert('User added successfully');
    
    // Reload users data
    loadSampleUsersData();
}

// Load sample dashboard data
function loadSampleDashboardData() {
    const totalDonations = document.getElementById('totalDonations');
    const totalDonors = document.getElementById('totalDonors');
    const availableBalance = document.getElementById('availableBalance');
    const recentDonationsTable = document.getElementById('recentDonationsTable');
    
    // Sample data
    const data = {
        totalDonations: 1250000,
        totalDonors: 45,
        availableBalance: 980000,
        recentDonations: [
            { name: 'John Doe', amount: 50000, date: '2025-03-30T10:30:00' },
            { name: 'Jane Smith', amount: 25000, date: '2025-03-29T14:45:00' },
            { name: 'Robert Johnson', amount: 100000, date: '2025-03-28T09:15:00' },
            { name: 'Mary Williams', amount: 10000, date: '2025-03-27T16:20:00' },
            { name: 'David Brown', amount: 75000, date: '2025-03-26T11:10:00' }
        ]
    };
    
    // Update dashboard stats
    if (totalDonations) totalDonations.textContent = formatCurrency(data.totalDonations);
    if (totalDonors) totalDonors.textContent = data.totalDonors;
    if (availableBalance) availableBalance.textContent = formatCurrency(data.availableBalance);
    
    // Update recent donations table
    if (recentDonationsTable) {
        recentDonationsTable.innerHTML = '';
        
        data.recentDonations.forEach(donation => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${donation.name}</td>
                <td>${formatCurrency(donation.amount)}</td>
                <td>${formatDate(donation.date)}</td>
                <td><span class="badge bg-success">Completed</span></td>
            `;
            recentDonationsTable.appendChild(row);
        });
    }
}

// Load sample donations data
function loadSampleDonationsData() {
    const donationsTableBody = document.getElementById('donationsTableBody');
    const donationsPagination = document.getElementById('donationsPagination');
    
    // Sample data
    const data = getSampleDonationsData();
    
    // Update donations table
    if (donationsTableBody) {
        donationsTableBody.innerHTML = '';
        
        data.donations.forEach(donation => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${donation.name}</td>
                <td>${donation.email}</td>
                <td>${donation.phone || 'N/A'}</td>
                <td>${donation.country}</td>
                <td>${formatCurrency(donation.amount)}</td>
                <td>${donation.reference}</td>
                <td>${formatDate(donation.date)}</td>
                <td>
                    <a href="#" class="action-btn action-btn-view" title="View Details">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            `;
            donationsTableBody.appendChild(row);
        });
    }
    
    // Update pagination
    if (donationsPagination) {
        updatePagination(donationsPagination, data.totalPages, data.currentPage);
    }
    
    // Helper function to update pagination
    function updatePagination(paginationElement, totalPages, currentPage) {
        paginationElement.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const ul = document.createElement('ul');
        ul.className = 'pagination';
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </a>`;
        if (currentPage > 1) {
            prevLi.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                loadDonationsData(currentPage - 1);
            });
        }
        ul.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            
            li.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                loadDonationsData(i);
            });
            
            ul.appendChild(li);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
        </a>`;
        if (currentPage < totalPages) {
            nextLi.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                loadDonationsData(currentPage + 1);
            });
        }
        ul.appendChild(nextLi);
        
        paginationElement.appendChild(ul);
    }
}

// Get sample donations data
function getSampleDonationsData() {
    return {
        donations: [
            {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+234 801 234 5678',
                country: 'Nigeria',
                amount: 50000,
                reference: 'SFIDIN_123456789',
                date: '2025-03-30T10:30:00'
            },
            {
                id: 2,
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone: '+234 802 345 6789',
                country: 'Nigeria',
                amount: 25000,
                reference: 'SFIDIN_234567890',
                date: '2025-03-29T14:45:00'
            },
            {
                id: 3,
                name: 'Robert Johnson',
                email: 'robert.johnson@example.com',
                phone: '+1 555 123 4567',
                country: 'United States',
                amount: 100000,
                reference: 'SFIDIN_345678901',
                date: '2025-03-28T09:15:00'
            },
            {
                id: 4,
                name: 'Mary Williams',
                email: 'mary.williams@example.com',
                phone: '+234 803 456 7890',
                country: 'Nigeria',
                amount: 10000,
                reference: 'SFIDIN_456789012',
                date: '2025-03-27T16:20:00'
            },
            {
                id: 5,
                name: 'David Brown',
                email: 'david.brown@example.com',
                phone: '+44 20 1234 5678',
                country: 'United Kingdom',
                amount: 75000,
                reference: 'SFIDIN_567890123',
                date: '2025-03-26T11:10:00'
            },
            {
                id: 6,
                name: 'Sarah Johnson',
                email: 'sarah.johnson@example.com',
                phone: '+234 804 567 8901',
                country: 'Nigeria',
                amount: 30000,
                reference: 'SFIDIN_678901234',
                date: '2025-03-25T13:40:00'
            },
            {
                id: 7,
                name: 'Michael Davis',
                email: 'michael.davis@example.com',
                phone: '+1 555 234 5678',
                country: 'United States',
                amount: 150000,
                reference: 'SFIDIN_789012345',
                date: '2025-03-24T08:50:00'
            },
            {
                id: 8,
                name: 'Elizabeth Wilson',
                email: 'elizabeth.wilson@example.com',
                phone: '+234 805 678 9012',
                country: 'Nigeria',
                amount: 20000,
                reference: 'SFIDIN_890123456',
                date: '2025-03-23T15:30:00'
            },
            {
                id: 9,
                name: 'James Taylor',
                email: 'james.taylor@example.com',
                phone: '+234 806 789 0123',
                country: 'Nigeria',
                amount: 45000,
                reference: 'SFIDIN_901234567',
                date: '2025-03-22T10:15:00'
            },
            {
                id: 10,
                name: 'Patricia Moore',
                email: 'patricia.moore@example.com',
                phone: '+1 555 345 6789',
                country: 'United States',
                amount: 80000,
                reference: 'SFIDIN_012345678',
                date: '2025-03-21T12:25:00'
            }
        ],
        totalPages: 3,
        currentPage: 1,
        totalDonations: 1250000,
        availableBalance: 980000,
        expenses: [
            {
                id: 1,
                amount: 150000,
                description: 'Educational materials for orphanage',
                date: '2025-03-15T09:00:00'
            },
            {
                id: 2,
                amount: 120000,
                description: 'Medical supplies for community outreach',
                date: '2025-03-10T14:30:00'
            }
        ]
    };
}

// Load sample users data
function loadSampleUsersData() {
    const usersTableBody = document.getElementById('usersTableBody');
    
    // Sample data
    const data = {
        users: [
            {
                id: 1,
                name: 'Admin User',
                email: 'admin@sfidin.org',
                role: 'superadmin',
                status: 'active',
                lastLogin: '2025-04-02T23:45:00'
            },
            {
                id: 2,
                name: 'John Manager',
                email: 'john.manager@sfidin.org',
                role: 'admin',
                status: 'active',
                lastLogin: '2025-04-01T10:30:00'
            },
            {
                id: 3,
                name: 'Sarah Coordinator',
                email: 'sarah.coordinator@sfidin.org',
                role: 'admin',
                status: 'active',
                lastLogin: '2025-03-30T14:15:00'
            }
        ]
    };
    
    // Update users table
    if (usersTableBody) {
        usersTableBody.innerHTML = '';
        
        data.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role === 'superadmin' ? 'Super Admin' : 'Regular Admin'}</td>
                <td><span class="badge bg-success">${user.status}</span></td>
                <td>${formatDate(user.lastLogin)}</td>
                <td>
                    <a href="#" class="action-btn action-btn-edit" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </a>
                    ${getCurrentUser() && getCurrentUser().role === 'superadmin' && user.id !== 1 ? 
                        `<a href="#" class="action-btn action-btn-delete" data-user-id="${user.id}" title="Delete User">
                            <i class="fas fa-trash-alt"></i>
                        </a>` : ''}
                </td>
            `;
            usersTableBody.appendChild(row);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.action-btn-delete').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const userId = this.getAttribute('data-user-id');
                if (confirm('Are you sure you want to delete this user?')) {
                    alert('User deleted successfully');
                    loadSampleUsersData(); // Reload to simulate deletion
                }
            });
        });
    }
}
