
//(function(){
//  const __console = (typeof window !== 'undefined' && window.console) ? window.console : { log: function(){} };
//  const console = Object.assign({}, __console, { log: function(){} });

// Global variables
let currentUser = null;
let availableSites = [];
let availableCompanies = [];
let totalPriceData = [];
let tableSort = { key: 'materialName', dir: 'asc' };
let pagination = { page: 1, pageSize: 25 };
let charts = { costBreakdown: null, totalsOverTime: null };

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadAvailableSites();
    setDefaultDates();
    setupEventListeners();
    // Hide results (charts + table) until user calculates
    setResultsVisible(false);
});

// Setup event listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Fetch button
    const fetchBtn = document.getElementById('fetchBtn');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', fetchTotalPrices);
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }

    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearResults);
    }

    // Create User button
    const createUserBtn = document.getElementById('createUserBtn');
    const headerCreateUserBtn = document.getElementById('headerCreateUserBtn');
    if (createUserBtn) {
        createUserBtn.addEventListener('click', function() {
            console.log('👤 Create User button clicked');
            window.location.href = '/manager-create-user';
        });
    }

    if (headerCreateUserBtn) {
        headerCreateUserBtn.addEventListener('click', function() {
            console.log('👤 Header Create User clicked');
            window.location.href = '/manager-create-user';
        });
    }

    // Site and company selection
    const siteSelect = document.getElementById('siteSelect');
    const companySelect = document.getElementById('companySelect');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    // Preset controls removed
    const table = document.getElementById('totalPriceTable');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    // Add change event listeners for site and company
    if (siteSelect) {
        siteSelect.addEventListener('change', function() {
            console.log('📍 Site selected:', this.value);
            updateCompanyOptions(this.value);
            if (this.value) localStorage.setItem('managerSite', this.value);
        });
        console.log('✅ Site select event listener added');
    }

    if (companySelect) {
        companySelect.addEventListener('change', function() {
            console.log('🏢 Company selected:', this.value);
            if (this.value) localStorage.setItem('managerCompany', this.value);
        });
    }

    // Table sorting
    if (table) {
        const headers = Array.from(table.querySelectorAll('thead th'));
        headers.forEach((th, index) => {
            th.addEventListener('click', () => {
                const key = getSortKeyByColumnIndex(index);
                if (!key) return;
                if (tableSort.key === key) {
                    tableSort.dir = tableSort.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    tableSort.key = key;
                    tableSort.dir = 'asc';
                }
                updateSortHeaderStyles(headers);
                renderTable();
            });
        });
    }

    // Pagination buttons
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => changePage(-1));
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => changePage(1));

    // Add date change listeners
    [startDate, endDate].forEach((input, index) => {
        if (input) {
            input.addEventListener('change', function() {
                console.log(`📅 Date ${index === 0 ? 'start' : 'end'} changed:`, this.value);
            });
        }
    });
    console.log('✅ Date input event listeners added');

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to fetch data
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            console.log('⌨️ Keyboard shortcut: Ctrl+Enter - Fetching data');
            fetchTotalPrices();
        }
        
        // Ctrl/Cmd + E to export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            console.log('⌨️ Keyboard shortcut: Ctrl+E - Exporting data');
            exportToExcel();
        }
        
        // Ctrl/Cmd + R to clear results
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            console.log('⌨️ Keyboard shortcut: Ctrl+R - Clearing results');
            clearResults();
        }
    });
    console.log('✅ Keyboard shortcuts added');
}

// Show or hide results sections (charts + table)
function setResultsVisible(visible) {
    const sections = document.querySelectorAll('.manager-results');
    sections.forEach(sec => {
        sec.style.display = visible ? '' : 'none';
    });
}

// Check if user is authenticated and is manager
function checkAuthentication() {
    const token = (typeof getToken === 'function') ? getToken() : (sessionStorage.getItem('token') || localStorage.getItem('token'));
    const managerAccess = localStorage.getItem('managerAccess');
    
    if (!token) {
        console.log('❌ No token found, redirecting to manager login');
        window.location.href = '/manager-login';
        return;
    }

    if (!managerAccess) {
        console.log('❌ No manager access found, redirecting to manager login');
        window.location.href = '/manager-login';
        return;
    }

    // Clear any potentially stale site/company cache on page load
    console.log('🧹 Clearing potentially stale site/company cache');
    localStorage.removeItem('managerSite');
    localStorage.removeItem('managerCompany');

    // Decode JWT token to get user info
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUser = payload;
        // Check if user has manager access (admin or manager role)
        if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
            showMessage(`Access denied. Manager privileges required. Current role: ${currentUser.role}`, 'error');
            setTimeout(() => {
                window.location.href = '/manager-login';
            }, 2000);
            return;
        }

        document.getElementById('currentUser').textContent = `Welcome, ${currentUser.username} (Manager)`;
    } catch (error) {
        window.location.href = '/manager-login';
    }
}

// Load available sites from the database
async function loadAvailableSites() {
    try {
        const token = (typeof getToken === 'function') ? getToken() : (sessionStorage.getItem('token') || localStorage.getItem('token'));

        // Decode token to see current user info
        let payload = null;
        if (token) {
            try {
                payload = JSON.parse(atob(token.split('.')[1]));
            } catch (error) {
                console.log('❌ Error decoding token for debugging:', error);
            }
        }

    // Admins can query site users; managers try their own site/company from token or fallback to users they created
        if (payload?.role === 'admin') {
            const response = await fetch('/api/admin/site/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            if (data.success === false) {
                throw new Error(data.message || 'Failed to load sites');
            }

            const sites = new Set();
            const companies = new Set();
            if (data.users && data.users.length > 0) {
                data.users.forEach((user) => {
                    if (user.site) sites.add(user.site);
                    if (user.company) companies.add(user.company);
                });
            } else if (data.site) {
                sites.add(data.site);
            }

            availableSites = Array.from(sites);
            availableCompanies = Array.from(companies);
        } else {
            // Manager mode: try token first
            // Also check previously saved managerSite/managerCompany in localStorage
            const savedSite = localStorage.getItem('managerSite');
            const savedCompany = localStorage.getItem('managerCompany');
            availableSites = payload?.site ? [payload.site] : (savedSite ? [savedSite] : []);
            availableCompanies = payload?.company ? [payload.company] : (savedCompany ? [savedCompany] : []);
            
            if (availableSites.length === 0 || availableCompanies.length === 0) {
                // Fallback: ask backend for users created by this manager and derive site/company from them
                try {
                    const resp = await fetch('/api/auth/users/recent', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        const sites = new Set();
                        const companies = new Set();
                        (data.users || []).forEach(u => {
                            if (u.site) sites.add(u.site);
                            if (u.company) companies.add(u.company);
                        });
                        availableSites = availableSites.length ? availableSites : Array.from(sites);
                        availableCompanies = availableCompanies.length ? availableCompanies : Array.from(companies);
                    }
                } catch (_) { /* ignore */ }
            }
            // If we resolved exactly one site/company, persist for future requests
            if (availableSites.length === 1) {
                localStorage.setItem('managerSite', availableSites[0]);
            }
            if (availableCompanies.length === 1) {
                localStorage.setItem('managerCompany', availableCompanies[0]);
            }
        }

        console.log('🏢 Available sites:', availableSites);
        console.log('🏢 Available companies:', availableCompanies);
        console.log('🔍 Debug - Sites array:', JSON.stringify(availableSites));
        console.log('🔍 Debug - Companies array:', JSON.stringify(availableCompanies));
        
        if (availableSites.length === 0) {
            console.log('⚠️ No sites available');
            showMessage('No sites available yet. Create users with site info or contact admin.', 'info');
        }
        
        populateSiteSelect();
        populateCompanySelect();
        updateSortHeaderFromState();
        
    } catch (error) {
        console.error('❌ Error loading sites:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        showMessage(`Failed to load available sites: ${error.message}`, 'error');
        
        // Keep selections empty on error (no demo fallbacks)
        populateSiteSelect();
        populateCompanySelect();
    }
}

// Populate site select dropdown
function populateSiteSelect() {
    console.log('📋 Populating site select dropdown...');
    const siteSelect = document.getElementById('siteSelect');
    if (!siteSelect) {
        console.log('❌ Site select element not found');
        return;
    }
    
    // Store current selection if it exists
    const currentSite = siteSelect.value;
    console.log('💾 Preserving current site selection:', currentSite);
    
    siteSelect.innerHTML = '<option value="">Select a site...</option>';
    
    availableSites.forEach(site => {
        const option = document.createElement('option');
        option.value = site;
        option.textContent = site;
        siteSelect.appendChild(option);
        console.log(`📋 Added site option: ${site}`);
    });
    
    // Restore selection if it's still valid
    if (currentSite && availableSites.includes(currentSite)) {
        siteSelect.value = currentSite;
        console.log('✅ Restored site selection:', currentSite);
    }
    
    console.log('✅ Site select dropdown populated');
}

// Populate company select dropdown
function populateCompanySelect() {
    console.log('🏢 Populating company select dropdown...');
    const companySelect = document.getElementById('companySelect');
    if (!companySelect) {
        console.log('❌ Company select element not found');
        return;
    }
    
    // Store current selection if it exists
    const currentCompany = companySelect.value;
    console.log('💾 Preserving current company selection:', currentCompany);
    
    companySelect.innerHTML = '<option value="">Select a company...</option>';
    
    availableCompanies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companySelect.appendChild(option);
        console.log(`🏢 Added company option: ${company}`);
    });
    
    // Restore selection if it's still valid
    if (currentCompany && availableCompanies.includes(currentCompany)) {
        companySelect.value = currentCompany;
        console.log('✅ Restored company selection:', currentCompany);
    }
    
    console.log('✅ Company select dropdown populated');
}

// Update company options based on selected site
function updateCompanyOptions(selectedSite) {
    console.log('🔄 Updating company options for site:', selectedSite);
    const companySelect = document.getElementById('companySelect');
    if (!companySelect) {
        console.log('❌ Company select element not found');
        return;
    }
    
    // Store current company selection
    const currentCompany = companySelect.value;
    console.log('💾 Preserving current company selection:', currentCompany);
    
    // Filter companies based on selected site
    const filteredCompanies = availableCompanies.filter(company => {
        // For now, show all companies. You can implement site-specific filtering later
        return true;
    });
    
    companySelect.innerHTML = '<option value="">Select a company...</option>';
    
    filteredCompanies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companySelect.appendChild(option);
        console.log(`🏢 Added filtered company option: ${company}`);
    });
    
    // Restore company selection if it's still valid
    if (currentCompany && filteredCompanies.includes(currentCompany)) {
        companySelect.value = currentCompany;
        console.log('✅ Restored company selection:', currentCompany);
    } else {
        console.log('⚠️ Previous company selection not available in filtered options');
    }
    
    console.log('✅ Company options updated for site:', selectedSite);
}

// Set default date range (current month)
function setDefaultDates() {
    console.log('📅 Setting default dates...');
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    // Only set default dates if they're not already set
    if (startDateInput && !startDateInput.value) {
        startDateInput.value = formatDateForInput(firstDay);
        console.log('📅 Start date set:', startDateInput.value);
    } else if (startDateInput) {
        console.log('📅 Start date already set:', startDateInput.value);
    }
    
    if (endDateInput && !endDateInput.value) {
        endDateInput.value = formatDateForInput(lastDay);
        console.log('📅 End date set:', endDateInput.value);
    } else if (endDateInput) {
        console.log('📅 End date already set:', endDateInput.value);
    }
    
    console.log('✅ Default dates set');
}

// Format date for input field
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Fetch total prices for selected site, company and date range
async function fetchTotalPrices() {
    console.log('🔍 Fetching total prices for manager...');
    const siteSelect = document.getElementById('siteSelect');
    const companySelect = document.getElementById('companySelect');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (!siteSelect || !companySelect || !startDate || !endDate) {
        console.log('❌ Required elements not found');
        showMessage('Required elements not found.', 'error');
        return;
    }
    
    console.log('📋 Fetch parameters:', {
        site: siteSelect.value,
        company: companySelect.value,
        startDate: startDate.value,
        endDate: endDate.value
    });
    
    // Validation
    if (!siteSelect.value) {
        console.log('❌ No site selected');
        showMessage('Please select a site.', 'error');
        return;
    }
    
    if (!companySelect.value) {
        console.log('❌ No company selected');
        showMessage('Please select a company.', 'error');
        return;
    }
    
    if (!startDate.value || !endDate.value) {
        console.log('❌ Missing date range');
        showMessage('Please select both start and end dates.', 'error');
        return;
    }
    
    if (new Date(startDate.value) > new Date(endDate.value)) {
        console.log('❌ Invalid date range');
        showMessage('Start date cannot be after end date.', 'error');
        return;
    }

    showLoading(true);
    
    try {
        const token = (typeof getToken === 'function') ? getToken() : (sessionStorage.getItem('token') || localStorage.getItem('token'));
        const selectedSite = siteSelect.value;
        const selectedCompany = companySelect.value;
        // Persist for API middleware headers
        localStorage.setItem('managerSite', selectedSite);
        localStorage.setItem('managerCompany', selectedCompany);
        
        // Use manager-specific API endpoint
        const apiUrl = `/api/manager/site/calculate-total-prices?site=${selectedSite}&company=${selectedCompany}&startDate=${startDate.value}&endDate=${endDate.value}`;
        
        console.log('🌐 Making manager API request to:', apiUrl);
        console.log('📍 Selected site:', selectedSite);
        console.log('🏢 Selected company:', selectedCompany);
        
        // Fetch calculated total prices for the specific site and company
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Site': selectedSite,
                'X-Company': selectedCompany
            }
        });

        console.log('📡 Manager API Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Manager API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('📊 Raw manager API response data:', data);
        
        if (data.success) {
            totalPriceData = data.calculatedTotalPrices || [];
            console.log('💰 Calculated total price data fetched:', totalPriceData);
            console.log('📊 Data summary:', {
                totalRecords: totalPriceData.length,
                grandTotal: data.summary?.grandTotal || 0,
                totalMaterialCost: data.summary?.totalMaterialCost || 0,
                totalLaborCost: data.summary?.totalLaborCost || 0,
                dateRange: data.dateRange,
                site: data.site || selectedSite,
                company: data.company || selectedCompany
            });
            
            if (totalPriceData.length === 0) {
                // No records found: show table section with the built-in no-data row, but hide charts
                displayCalculatedTotalPrices();
                // Show the table section only
                const sections = document.querySelectorAll('.manager-results');
                sections.forEach(sec => {
                    const hasTable = sec.querySelector('#totalPriceTable');
                    sec.style.display = hasTable ? '' : 'none';
                });
                const exportBtnEl = document.getElementById('exportBtn');
                if (exportBtnEl) exportBtnEl.disabled = true;
                showMessage('No records found for the selected criteria.', 'info');
            } else {
                displayCalculatedTotalPrices();
                updateCalculatedStatistics(data.summary);
                updateCharts(totalPriceData, data.summary, { start: startDate.value, end: endDate.value });
                // Reveal results and enable export
                setResultsVisible(true);
                const exportBtnEl = document.getElementById('exportBtn');
                if (exportBtnEl) exportBtnEl.disabled = false;
                showMessage(`Successfully calculated ${totalPriceData.length} total price records for ${data.site || selectedSite}, ${data.company || selectedCompany}. Grand Total: $${formatNumber(data.summary?.grandTotal || 0)}`, 'success');
            }
        } else {
            console.log('❌ Manager API returned success: false');
            throw new Error(data.message || 'Failed to calculate total prices');
        }
        
    } catch (error) {
        console.error('❌ Error fetching total prices:', error);
        showMessage('Failed to calculate total prices. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Display calculated total prices in the table
function displayCalculatedTotalPrices() {
    console.log('📋 Displaying calculated total prices in table...');
    const tableBody = document.getElementById('totalPriceTableBody');
    if (!tableBody) {
        console.log('❌ Table body element not found');
        return;
    }
    
    if (totalPriceData.length === 0) {
        console.log('📭 No data to display');
        tableBody.innerHTML = '<tr><td colspan="5" class="no-data">No records found for the selected criteria.</td></tr>';
        return;
    }

    console.log('📊 Creating table rows for', totalPriceData.length, 'calculated records');
    tableBody.innerHTML = '';
    
    // Render with sorting and pagination
    const { sorted, totalPages, page, pageSize } = getSortedAndPagedData();
    
    sorted.forEach((item, index) => {
        console.log(`📋 Row ${index + 1}:`, item);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.materialName || 'N/A'}</td>
            <td>${item.quantity || 'N/A'} ${item.unit || ''}</td>
            <td>$${formatNumber(item.materialCost)}</td>
            <td>$${formatNumber(item.laborCost)}</td>
            <td>$${formatNumber(item.totalPrice)}</td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add grand total row
    const grandTotal = totalPriceData.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalMaterialCost = totalPriceData.reduce((sum, item) => sum + (item.materialCost || 0), 0);
    const totalLaborCost = totalPriceData.reduce((sum, item) => sum + (item.laborCost || 0), 0);
    
    const totalRow = document.createElement('tr');
    totalRow.className = 'table-dark fw-bold';
    totalRow.innerHTML = `
        <td><strong>TOTAL</strong></td>
        <td></td>
        <td><strong>$${formatNumber(totalMaterialCost)}</strong></td>
        <td><strong>$${formatNumber(totalLaborCost)}</strong></td>
        <td><strong>$${formatNumber(grandTotal)}</strong></td>
    `;
    tableBody.appendChild(totalRow);
    
    updatePaginationControls(totalPages, page);
    console.log('✅ Table populated with', sorted.length, 'rows (paged) + total row');
}

// Update statistics panel with calculated data
function updateCalculatedStatistics(summary) {
    console.log('📊 Updating calculated statistics...');
    
    const totalUsersElement = document.getElementById('totalUsers');
    const totalPricesElement = document.getElementById('totalPrices');
    const totalAmountElement = document.getElementById('totalAmount');
    const selectedSiteElement = document.getElementById('selectedSite');
    
    if (totalUsersElement) totalUsersElement.textContent = summary?.totalMaterials || 0;
    if (totalPricesElement) totalPricesElement.textContent = totalPriceData.length;
    if (totalAmountElement) totalAmountElement.textContent = `$${formatNumber(summary?.grandTotal || 0)}`;
    if (selectedSiteElement) selectedSiteElement.textContent = 'Calculated';
    
    console.log('✅ Calculated statistics updated:', {
        totalMaterials: summary?.totalMaterials || 0,
        grandTotal: summary?.grandTotal || 0,
        totalMaterialCost: summary?.totalMaterialCost || 0,
        totalLaborCost: summary?.totalLaborCost || 0
    });
}

// Format number for display
function formatNumber(number) {
    if (isNaN(number) || number === null || number === undefined) return '0.00';
    return parseFloat(number).toFixed(2);
}

// Charts
function updateCharts(dataRows, summary, range) {
    if (!(window.Chart)) return;
    const ctxPie = document.getElementById('costBreakdownChart');
    const ctxLine = document.getElementById('totalsOverTimeChart');
    if (!ctxPie || !ctxLine) return;

    // Cost breakdown pie (material vs labor vs total)
    const material = Number(summary?.totalMaterialCost || 0);
    const labor = Number(summary?.totalLaborCost || 0);
    const total = Number(summary?.grandTotal || 0);
    const other = Math.max(0, total - (material + labor));

    const pieData = {
        labels: ['Material', 'Labor', 'Other'],
        datasets: [{
            data: [material, labor, other],
            backgroundColor: ['#667eea', '#56ab2f', '#f6ad55']
        }]
    };

    if (charts.costBreakdown) charts.costBreakdown.destroy();
    charts.costBreakdown = new Chart(ctxPie, {
        type: 'pie',
        data: pieData,
        options: {
            plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Cost Breakdown' } }
        }
    });

    // Totals over time (group by location as proxy if no date per row)
    // If rows contain a date field in the future, replace grouping accordingly.
    const groups = new Map();
    dataRows.forEach(r => {
        const key = r.location || 'N/A';
        const prev = groups.get(key) || 0;
        groups.set(key, prev + Number(r.totalPrice || 0));
    });
    const labels = Array.from(groups.keys());
    const values = Array.from(groups.values());

    if (charts.totalsOverTime) charts.totalsOverTime.destroy();
    charts.totalsOverTime = new Chart(ctxLine, {
        type: 'bar',
        data: {
            labels,
            datasets: [{ label: `Totals (${range.start} to ${range.end})`, data: values, backgroundColor: '#764ba2' }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Sorting and pagination helpers
function getSortKeyByColumnIndex(index) {
    switch (index) {
        case 0: return 'materialName';
        case 1: return 'quantity';
        case 2: return 'materialCost';
        case 3: return 'laborCost';
        case 4: return 'totalPrice';
        default: return null;
    }
}

function compareValues(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
    }
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a).localeCompare(String(b));
}

function getSortedAndPagedData() {
    const sortedAll = [...totalPriceData].sort((x, y) => {
        const valA = x[tableSort.key];
        const valB = y[tableSort.key];
        const cmp = compareValues(valA, valB);
        return tableSort.dir === 'asc' ? cmp : -cmp;
    });
    const totalPages = Math.max(1, Math.ceil(sortedAll.length / pagination.pageSize));
    pagination.page = Math.min(Math.max(1, pagination.page), totalPages);
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return { sorted: sortedAll.slice(start, end), totalPages, page: pagination.page, pageSize: pagination.pageSize };
}

function updatePaginationControls(totalPages, page) {
    const pageInfo = document.getElementById('pageInfo');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (pageInfo) pageInfo.textContent = `Page ${page} of ${totalPages}`;
    if (prevPageBtn) prevPageBtn.disabled = page <= 1;
    if (nextPageBtn) nextPageBtn.disabled = page >= totalPages;
}

function changePage(delta) {
    pagination.page += delta;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('totalPriceTableBody');
    if (!tbody) return;
    // Reuse display function for totals and structure; it will call pagination updates
    displayCalculatedTotalPrices();
}

function updateSortHeaderStyles(headers) {
    headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
    const index = ['materialName', 'quantity', 'materialCost', 'laborCost', 'totalPrice'].indexOf(tableSort.key);
    if (index >= 0 && headers[index]) {
        headers[index].classList.add(tableSort.dir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
}

function updateSortHeaderFromState() {
    const table = document.getElementById('totalPriceTable');
    if (!table) return;
    const headers = Array.from(table.querySelectorAll('thead th'));
    updateSortHeaderStyles(headers);
}



// Export data to Excel
function exportToExcel() {
    console.log('📤 Exporting calculated data to Excel...');
    if (totalPriceData.length === 0) {
        console.log('❌ No data to export');
        showMessage('No data to export. Please calculate total prices first.', 'error');
        return;
    }

    try {
        console.log('📊 Preparing Excel data...');
        // Prepare data for Excel
        const excelData = totalPriceData.map(item => ({
            'Material': item.materialName || 'N/A',
            'Total Quantity': `${item.quantity || 'N/A'} ${item.unit || ''}`,
            'Material Cost': `$${formatNumber(item.materialCost)}`,
            'Labor Cost': `$${formatNumber(item.laborCost)}`,
            'Total Price': `$${formatNumber(item.totalPrice)}`,
            'Location': item.location || 'N/A'
        }));

        // Add grand total row
        const grandTotal = totalPriceData.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        const totalMaterialCost = totalPriceData.reduce((sum, item) => sum + (item.materialCost || 0), 0);
        const totalLaborCost = totalPriceData.reduce((sum, item) => sum + (item.laborCost || 0), 0);
        
        excelData.push({
            'Material': 'TOTAL',
            'Total Quantity': '',
            'Material Cost': `$${formatNumber(totalMaterialCost)}`,
            'Labor Cost': `$${formatNumber(totalLaborCost)}`,
            'Total Price': `$${formatNumber(grandTotal)}`,
            'Location': ''
        });

        console.log('📋 Excel data prepared:', excelData);

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Manager Total Prices');

        // Generate filename
        const selectedSite = document.getElementById('siteSelect')?.value || 'unknown';
        const selectedCompany = document.getElementById('companySelect')?.value || 'unknown';
        const startDate = document.getElementById('startDate')?.value || 'unknown';
        const endDate = document.getElementById('endDate')?.value || 'unknown';
        const filename = `ManagerTotalPrices_${selectedSite}_${selectedCompany}_${startDate}_to_${endDate}.xlsx`;

        console.log('💾 Saving file as:', filename);

        // Save file
        XLSX.writeFile(wb, filename);
        
        console.log('✅ Excel file exported successfully');
        showMessage('Manager data exported to Excel successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Error exporting to Excel:', error);
        showMessage('Failed to export data. Please try again.', 'error');
    }
}

// Clear results
function clearResults() {
    console.log('🗑️ Clearing calculated results...');
    totalPriceData = [];
    const tableBody = document.getElementById('totalPriceTableBody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No calculated data available. Select a site and date range to calculate total prices.</td></tr>';
    }
    
    // Reset statistics (but preserve form selections)
    const totalUsersElement = document.getElementById('totalUsers');
    const totalPricesElement = document.getElementById('totalPrices');
    const totalAmountElement = document.getElementById('totalAmount');
    const selectedSiteElement = document.getElementById('selectedSite');
    
    if (totalUsersElement) totalUsersElement.textContent = '0';
    if (totalPricesElement) totalPricesElement.textContent = '0';
    if (totalAmountElement) totalAmountElement.textContent = '$0';
    if (selectedSiteElement) selectedSiteElement.textContent = '-';
    
    console.log('✅ Calculated results cleared (form selections preserved)');
    showMessage('Calculated results cleared. Form selections preserved.', 'info');
    // Hide results and disable export until next calculate
    setResultsVisible(false);
    const exportBtnEl = document.getElementById('exportBtn');
    if (exportBtnEl) exportBtnEl.disabled = true;
}

// Show/hide loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
        console.log(show ? '⏳ Showing loading spinner' : '✅ Hiding loading spinner');
    }
}

// Show message to user
function showMessage(message, type = 'info') {
    console.log(`💬 Showing message (${type}):`, message);
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    // Insert message at the top of the manager/admin panel
    const container = document.querySelector('.admin-panel') || document.querySelector('.manager-panel');
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);

        // Auto-remove message after 10 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 10000);
    }
}

// Logout function
function logout() {
    console.log('👋 Manager logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('managerAccess');
    localStorage.removeItem('managerSite');
    localStorage.removeItem('managerCompany');
    window.location.href = '/manager-login';
}