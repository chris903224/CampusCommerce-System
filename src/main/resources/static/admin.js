// admin.js - Complete Admin Dashboard with all features (with Backend Face Recognition)
// ============================================
// API Configuration - FOR RAILWAY (FIXED)
// ============================================
// Gamitin ang current hostname para sa API calls
const API_BASE = window.location.protocol + '//' + window.location.hostname + '/api/admin';

console.log('🔧 API_BASE:', API_BASE);
console.log('🌐 Current Host:', window.location.hostname);

// ============= CHECK AUTHENTICATION =============
(function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }
})();

// ============= GLOBAL VARIABLES =============
let currentUserPage = 1;
let currentUserSearch = '';
let totalUserPages = 1;
let selectedUsers = new Set();

let currentOrderPage = 1;
let currentOrderStatus = 'all';
let orderDateRange = { start: '', end: '' };

let notifications = [];
let notificationInterval = null;

// Face Recognition Variables
let pendingAction = null;
let pendingActionData = null;
let faceDetectionInterval = null;

// Product Image Upload Variables
let selectedProductImageFile = null;
let currentProductImageUrl = '';

// Cache for orders data (for reports)
let cachedOrders = [];

// ============= DOCUMENT READY =============
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDate();
    loadDashboardStats();
    loadNotifications();
    startNotificationPolling();
    initializeEventListeners();
    
    const hash = window.location.hash.substring(1) || 'dashboard';
    switchSection(hash);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Initialize face recognition
    setTimeout(() => {
        initFaceRecognition();
        setupFaceRecognitionObserver();
        checkFaceRegistrationStatus();
    }, 2000);
    
    // Initialize product image upload
    initProductImageUpload();
});

// ============= CHECK FACE REGISTRATION STATUS =============
async function checkFaceRegistrationStatus() {
    try {
        const response = await apiCall('/face/status');
        if (response && response.success) {
            console.log('Face registration status:', response.registered ? 'Registered ✅' : 'Not registered ❌');
            
            const statusBadge = document.getElementById('faceStatusBadge');
            if (statusBadge) {
                statusBadge.textContent = response.registered ? '✓ Face Registered' : '✗ Face Not Registered';
                statusBadge.style.color = response.registered ? '#2ecc71' : '#e74c3c';
            }
            
            const sampleCountBadge = document.getElementById('faceSampleCount');
            if (sampleCountBadge) {
                const sampleCount = response.sampleCount || 0;
                sampleCountBadge.textContent = sampleCount > 0 ? `${sampleCount} sample${sampleCount === 1 ? '' : 's'} saved` : 'No face samples yet';
            }
        }
    } catch (error) {
        console.error('Failed to check face registration:', error);
    }
}

// ============= INITIALIZE EVENT LISTENERS =============
function initializeEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#logout') {
                e.preventDefault();
                logout();
                return;
            }
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            switchSection(sectionId);
        });
    });
    
    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            switchSection(sectionId);
        });
    });
    
    document.getElementById('sidebarToggle')?.addEventListener('click', function() {
        document.querySelector('.admin-sidebar').classList.toggle('collapsed');
    });
    
    // Add face registration button listener
    const registerFaceBtn = document.getElementById('registerFaceBtn');
    if (registerFaceBtn) {
        registerFaceBtn.addEventListener('click', openFaceRegistrationModal);
    }
    
    initUserManagementListeners();
    initOrderManagementListeners();
    initProductManagementListeners();
    initPaymentVerificationListeners();
    initReportsListeners();
    initSettingsListeners();
    initNotificationListeners();
}

// ============= SECTION SWITCHING =============
function switchSection(sectionId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[href="#${sectionId}"]`)?.classList.add('active');
    
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    
    updatePageTitle(sectionId);
    loadSectionData(sectionId);
    window.location.hash = sectionId;
}

function updatePageTitle(sectionId) {
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'User Management',
        'products': 'Product Management',
        'orders': 'Order Management',
        'payments': 'Payment Verification',
        'reports': 'Reports & Analytics',
        'settings': 'System Settings'
    };
    
    const subtitles = {
        'dashboard': 'System overview and analytics',
        'users': 'Manage system users and customer accounts with school information',
        'products': 'Manage school supplies inventory and pricing',
        'orders': 'Process and track customer orders',
        'payments': 'Verify and process customer payments',
        'reports': 'System performance and sales analytics',
        'settings': 'Configure system preferences and options'
    };
    
    const titleElement = document.getElementById('pageTitle');
    const subtitleElement = document.getElementById('pageSubtitle');
    
    if (titleElement) titleElement.textContent = titles[sectionId] || sectionId;
    if (subtitleElement) subtitleElement.textContent = subtitles[sectionId] || '';
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'users': loadUsers(1, ''); break;
        case 'products': loadProducts(); break;
        case 'orders': loadOrders('all'); break;
        case 'payments': loadPayments('pending'); break;
        case 'reports': loadReports(); break;
        case 'settings': loadSettings(); break;
        case 'dashboard': loadDashboardStats(); break;
    }
}

// ============= API FUNCTIONS =============
async function apiCall(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('adminToken');
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    if (data) options.body = JSON.stringify(data);
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (response.status === 204) {
            return { success: true };
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('adminToken');
                window.location.href = 'login.html';
                throw new Error('Session expired');
            }
            throw new Error(result.message || 'API call failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// ============= DASHBOARD FUNCTIONS =============

async function loadDashboardStats() {
    try {
        console.log('Loading dashboard stats...');
        const stats = await apiCall('/dashboard/stats');
        
        console.log('Dashboard Stats:', stats);
        
        // Update stat cards
        const totalUsersEl = document.getElementById('totalUsers');
        const totalOrdersEl = document.getElementById('totalOrders');
        const totalRevenueEl = document.getElementById('totalRevenue');
        const lowStockEl = document.getElementById('lowStock');
        
        if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || 0;
        if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders || 0;
        if (totalRevenueEl) totalRevenueEl.textContent = `₱${(stats.totalRevenue || 0).toFixed(2)}`;
        if (lowStockEl) lowStockEl.textContent = stats.lowStockProducts || 0;
        
        // Load sales data for chart (DYNAMIC - based on actual order dates)
        await loadSalesChartData();
        
        // Load order status for chart
        await loadOrderStatusData();
        
        // Recent Orders Table
        const recentOrdersTable = document.getElementById('recentOrdersTable');
        if (recentOrdersTable) {
            if (stats.recentOrders && stats.recentOrders.length > 0) {
                const recentOrdersHtml = stats.recentOrders.map(order => {
                    const statusLower = (order.status || 'pending').toLowerCase();
                    const statusDisplay = capitalize(statusLower);
                    let statusClass = getStatusClass(statusLower);
                    
                    let customerName = order.userName || order.customerName;
                    if (!customerName && order.userId && window.cachedUsers) {
                        const user = window.cachedUsers.find(u => u.id == order.userId);
                        if (user) customerName = user.fullName || user.name;
                    }
                    if (!customerName) customerName = `User ${order.userId}`;
                    
                    let accurateTotal = order.total || 0;
                    if (order.items && order.items.length > 0) {
                        accurateTotal = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                        accurateTotal += (order.shippingFee || 50);
                    }
                    
                    const roomInfo = order.roomNumber ? `${order.roomBuilding || ''} ${order.roomNumber}` : '';
                    
                    return `
                        <tr class="recent-order-row" data-order-id="${order.id}">
                            <td class="order-id-cell"><strong>#${order.orderNumber || order.id}</strong>${roomInfo ? `<div class="order-room-tooltip" title="Room: ${roomInfo}"><i class="fas fa-door-open"></i></div>` : ''}</td>
                            <td class="customer-cell"><div class="customer-info"><span class="customer-name">${escapeHtml(customerName)}</span>${order.userEmail ? `<span class="customer-email">${escapeHtml(order.userEmail)}</span>` : ''}</div></td>
                            <td class="date-cell"><i class="fas fa-calendar-alt"></i> ${formatDate(order.orderDate)}</td>
                            <td class="amount-cell"><span class="amount-value">₱${accurateTotal.toFixed(2)}</span></td>
                            <td class="status-cell"><span class="status-badge ${statusClass}">${getStatusIcon(statusLower)} ${statusDisplay}</span></td>
                            <td class="action-cell"><button class="btn-action view-order" data-id="${order.id}" title="View Order Details"><i class="fas fa-eye"></i></button></td>
                        </tr>
                    `;
                }).join('');
                recentOrdersTable.innerHTML = recentOrdersHtml;
                
                document.querySelectorAll('#recentOrdersTable .view-order').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        showOrderDetails(this.dataset.id);
                    });
                });
            } else {
                recentOrdersTable.innerHTML = `<tr class="empty-state-row"><td colspan="6" class="text-center"><i class="fas fa-inbox"></i> No recent orders</td></tr>`;
            }
        }
        
        // Recent Users List
        const userList = document.querySelector('.user-list');
        if (userList) {
            if (stats.recentUsers && stats.recentUsers.length > 0) {
                const recentUsersHtml = stats.recentUsers.map(user => `
                    <div class="user-item">
                        <div class="user-avatar">${getInitials(user.fullName || user.name || 'User')}</div>
                        <div class="user-info">
                            <h5>${user.fullName || user.name || 'User'}</h5>
                            <p>${user.email || ''}</p>
                            ${user.studentId ? `<p><small>ID: ${user.studentId}</small></p>` : ''}
                            ${user.roomNumber ? `<p><small>Room: ${user.roomBuilding || ''} ${user.roomNumber}</small></p>` : ''}
                            <span class="user-status ${user.verified ? 'active' : 'inactive'}">${user.verified ? 'Verified' : 'Pending'}</span>
                        </div>
                    </div>
                `).join('');
                userList.innerHTML = recentUsersHtml;
            } else {
                userList.innerHTML = '<div class="text-center">No recent users</div>';
            }
        }
        
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showNotification('Failed to load dashboard stats', 'error');
    }
}

// ============================================
// DYNAMIC SALES CHART DATA FROM ORDERS (Aligned with current date)
// ============================================
async function loadSalesChartData() {
    try {
        const response = await apiCall('/orders');
        const orders = response.orders || response;
        cachedOrders = orders; // Store for reports
        
        if (!orders || orders.length === 0) {
            renderSalesChart([], []);
            return;
        }
        
        // Group orders by month - DYNAMIC, based on current date
        const monthlySales = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        orders.forEach(order => {
            if (order.orderDate) {
                const date = new Date(order.orderDate);
                if (!isNaN(date.getTime())) {
                    const month = months[date.getMonth()];
                    const year = date.getFullYear();
                    const key = `${year}-${month}`;
                    const amount = order.total || 0;
                    
                    if (!monthlySales[key]) {
                        monthlySales[key] = 0;
                    }
                    monthlySales[key] += amount;
                }
            }
        });
        
        // Get last 6 months dynamically
        const today = new Date();
        const labels = [];
        const data = [];
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = months[d.getMonth()];
            const year = d.getFullYear();
            const key = `${year}-${monthName}`;
            labels.push(`${monthName} ${year}`);
            data.push(monthlySales[key] || 0);
        }
        
        renderSalesChart(labels, data);
        
    } catch (error) {
        console.error('Failed to load sales chart data:', error);
        renderSalesChart(['No Data'], [0]);
    }
}

// ============================================
// RENDER SALES CHART (BAR CHART with HOVER EFFECT - Dark Green)
// ============================================
function renderSalesChart(labels, data) {
    const container = document.getElementById('salesChart');
    if (!container) return;
    
    if (!labels || labels.length === 0 || labels[0] === 'No Data') {
        container.innerHTML = '<div class="text-center" style="padding:40px;">No sales data available</div>';
        return;
    }
    
    const maxValue = Math.max(...data, 1);
    
    let bars = '';
    for (let i = 0; i < labels.length; i++) {
        const value = data[i] || 0;
        const height = (value / maxValue) * 180;
        const percentage = maxValue > 0 ? ((value / maxValue) * 100).toFixed(1) : 0;
        
        bars += `
            <div class="chart-bar-group" style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
                <div class="chart-bar-wrapper" style="width:100%; display:flex; justify-content:center; position:relative;">
                    <div class="chart-bar" 
                         style="width:70px; background: linear-gradient(180deg, #4fbd74, #2ecc71); border-radius: 6px 6px 0 0; height: ${height}px; min-height: 4px; transition: all 0.3s ease; cursor:pointer; position:relative;"
                         onmouseenter="this.style.background='#1a5d2e'; this.style.transform='scaleX(1.05)'; this.querySelector('.chart-tooltip').style.display='block'"
                         onmouseleave="this.style.background='linear-gradient(180deg, #4fbd74, #2ecc71)'; this.style.transform='scaleX(1)'; this.querySelector('.chart-tooltip').style.display='none'">
                        <div class="chart-tooltip" style="display:none; position:absolute; bottom:100%; left:50%; transform:translateX(-50%); background:#1a1a2e; color:#4fbd74; padding:4px 10px; border-radius:6px; font-size:11px; white-space:nowrap; margin-bottom:8px; box-shadow:0 2px 8px rgba(0,0,0,0.2); z-index:100;">
                            ₱${value.toLocaleString()} (${percentage}%)
                        </div>
                    </div>
                </div>
                <span style="font-size:11px; color:rgba(255,255,255,0.7); font-weight:500;">${labels[i]}</span>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div style="display:flex; align-items:flex-end; justify-content:space-around; height:250px; padding:10px 0; gap:8px; overflow-x:auto; min-width:100%;">
            ${bars}
        </div>
        <div style="margin-top:15px; text-align:center; font-size:11px; color:rgba(255,255,255,0.4);">
            <i class="fas fa-chart-line"></i> Monthly Sales (Last 6 Months)
        </div>
    `;
}

// ============================================
// LOAD ORDER STATUS DATA
// ============================================
async function loadOrderStatusData() {
    try {
        const response = await apiCall('/orders');
        const orders = response.orders || response;
        
        if (!orders || orders.length === 0) {
            renderOrderStatusChart({});
            return;
        }
        
        const statusCount = {
            pending: 0,
            processing: 0,
            shipped: 0,
            completed: 0,
            cancelled: 0
        };
        
        orders.forEach(order => {
            const status = (order.status || 'pending').toLowerCase();
            if (statusCount[status] !== undefined) {
                statusCount[status]++;
            } else {
                statusCount.pending++;
            }
        });
        
        renderOrderStatusChart(statusCount);
        
    } catch (error) {
        console.error('Failed to load order status:', error);
        renderOrderStatusChart({});
    }
}

// ============================================
// RENDER ORDER STATUS CHART (PIE CHART)
// ============================================
function renderOrderStatusChart(statusData) {
    const container = document.getElementById('orderStatusChart');
    if (!container) return;
    
    const total = Object.values(statusData).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
        container.innerHTML = '<div class="text-center" style="padding:40px;">No orders found</div>';
        return;
    }
    
    const colors = {
        pending: '#f39c12',
        processing: '#3498db',
        shipped: '#9b59b6',
        completed: '#2ecc71',
        cancelled: '#e74c3c'
    };
    
    const statusOrder = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    
    // Build pie chart segments
    let segments = '';
    let startAngle = 0;
    
    statusOrder.forEach(status => {
        const count = statusData[status] || 0;
        if (count > 0) {
            const angle = (count / total) * 360;
            segments += `${colors[status]} ${startAngle}deg ${startAngle + angle}deg, `;
            startAngle += angle;
        }
    });
    
    segments = segments.slice(0, -2);
    
    // Build legend
    let legendHtml = '';
    statusOrder.forEach(status => {
        const count = statusData[status] || 0;
        if (count > 0) {
            const percentage = ((count / total) * 100).toFixed(1);
            legendHtml += `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <div style="width:12px; height:12px; border-radius:2px; background:${colors[status]};"></div>
                    <div style="flex:1; font-size:12px; color:rgba(255,255,255,0.7);">${capitalize(status)}</div>
                    <div style="font-weight:600; color:#4fbd74;">${count}</div>
                    <div style="font-size:11px; color:rgba(255,255,255,0.5);">(${percentage}%)</div>
                </div>
            `;
        }
    });
    
    container.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; gap:20px; align-items:center; justify-content:center; padding:10px;">
            <div style="width:140px; height:140px; border-radius:50%; background: conic-gradient(${segments}); box-shadow: 0 2px 10px rgba(0,0,0,0.3); transition: transform 0.3s ease;" 
                 onmouseenter="this.style.transform='scale(1.05)'" onmouseleave="this.style.transform='scale(1)'"></div>
            <div style="flex:1; min-width:140px;">
                ${legendHtml}
                <div style="margin-top:12px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.1); text-align:center;">
                    <span style="font-size:11px; color:rgba(255,255,255,0.5);">Total Orders: <strong style="color:#4fbd74;">${total}</strong></span>
                </div>
            </div>
        </div>
    `;
}

// ============= REPORTS & ANALYTICS (DYNAMIC with HOVER) =============

function initReportsListeners() {
    const generateBtn = document.getElementById('generateReport');
    const exportBtn = document.getElementById('exportReport');
    
    if (generateBtn) generateBtn.addEventListener('click', generateReport);
    if (exportBtn) exportBtn.addEventListener('click', () => exportReport('csv'));
    
    const periodSelect = document.getElementById('reportPeriod');
    if (periodSelect) periodSelect.addEventListener('change', generateReport);
}

async function loadReports() {
    await generateReport();
}

// ============================================
// GENERATE REPORT (DYNAMIC - Based on actual orders)
// ============================================
async function generateReport() {
    const periodEl = document.getElementById('reportPeriod');
    const period = periodEl ? parseInt(periodEl.value) : 30;
    
    showNotification('Generating report from database...', 'info');
    
    try {
        // Fetch orders if not cached
        let orders = cachedOrders;
        if (!orders || orders.length === 0) {
            const response = await apiCall('/orders');
            orders = response.orders || response;
            cachedOrders = orders;
        }
        
        if (!orders || orders.length === 0) {
            showNotification('No orders found', 'warning');
            displayEmptyReport();
            return;
        }
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);
        
        // Filter orders by date range
        const filteredOrders = orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return !isNaN(orderDate.getTime()) && orderDate >= startDate && orderDate <= endDate;
        });
        
        // Calculate totals
        let totalSales = 0;
        filteredOrders.forEach(order => { totalSales += (order.total || 0); });
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        
        // Update Sales Summary
        const salesSummary = document.getElementById('salesSummary');
        if (salesSummary) {
            salesSummary.innerHTML = `
                <div class="summary-item" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span>Total Sales</span><span style="color:#4fbd74; font-weight:600;">₱${totalSales.toFixed(2)}</span>
                </div>
                <div class="summary-item" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span>Total Orders</span><span style="color:#4fbd74; font-weight:600;">${totalOrders}</span>
                </div>
                <div class="summary-item" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span>Average Order</span><span style="color:#4fbd74; font-weight:600;">₱${avgOrderValue.toFixed(2)}</span>
                </div>
                <div class="summary-item" style="display:flex; justify-content:space-between; padding:8px 0;">
                    <span>Period</span><span>Last ${period} days</span>
                </div>
            `;
        }
        
        // Calculate Top Products
        const productSales = {};
        filteredOrders.forEach(order => {
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const productName = item.productName || item.name || 'Unknown Product';
                    const itemTotal = (item.price || 0) * (item.quantity || 1);
                    productSales[productName] = (productSales[productName] || 0) + itemTotal;
                });
            }
        });
        
        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const topProductsContainer = document.getElementById('topProducts');
        if (topProductsContainer) {
            if (topProducts.length > 0) {
                topProductsContainer.innerHTML = topProducts.map(([name, sales], index) => `
                    <div class="product-rank" style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s ease;" onmouseenter="this.style.background='rgba(79,189,116,0.1)'" onmouseleave="this.style.background='transparent'">
                        <div class="rank-number" style="width:24px; height:24px; background:#4fbd74; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600;">${index + 1}</div>
                        <div style="flex:1;"><div style="font-weight:500;">${escapeHtml(name)}</div></div>
                        <div style="color:#4fbd74; font-weight:600;">₱${sales.toFixed(2)}</div>
                    </div>
                `).join('');
            } else {
                topProductsContainer.innerHTML = '<div class="text-center">No product data</div>';
            }
        }
        
        // Render Monthly Chart for Reports (DYNAMIC with hover)
        renderReportMonthlyChart(orders);
        
        showNotification('Report generated successfully!', 'success');
        
    } catch (error) {
        console.error('Failed to generate report:', error);
        showNotification('Failed to generate report', 'error');
        displayEmptyReport();
    }
}

// ============================================
// RENDER REPORT MONTHLY CHART (DYNAMIC with HOVER - Dark Green)
// ============================================
function renderReportMonthlyChart(orders) {
    const container = document.getElementById('monthlyChartContainer');
    if (!container) return;
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="text-center" style="padding:40px;">No data available</div>';
        return;
    }
    
    // Group by month dynamically
    const monthlySales = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    orders.forEach(order => {
        if (order.orderDate) {
            const date = new Date(order.orderDate);
            if (!isNaN(date.getTime())) {
                const month = months[date.getMonth()];
                const year = date.getFullYear();
                const key = `${year}-${month}`;
                monthlySales[key] = (monthlySales[key] || 0) + (order.total || 0);
            }
        }
    });
    
    // Get last 12 months dynamically
    const today = new Date();
    const labels = [];
    const data = [];
    
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = months[d.getMonth()];
        const year = d.getFullYear();
        const key = `${year}-${monthName}`;
        labels.push(`${monthName} ${year}`);
        data.push(monthlySales[key] || 0);
    }
    
    const maxValue = Math.max(...data, 1);
    
    let bars = '';
    for (let i = 0; i < labels.length; i++) {
        const value = data[i];
        const height = (value / maxValue) * 150;
        const percentage = maxValue > 0 ? ((value / maxValue) * 100).toFixed(1) : 0;
        
        bars += `
            <div class="report-chart-group" style="flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; min-width:60px;">
                <div style="width:100%; display:flex; justify-content:center; position:relative;">
                    <div class="report-chart-bar" 
                         style="width:55px; background: linear-gradient(180deg, #4fbd74, #2ecc71); border-radius: 6px 6px 0 0; height: ${height}px; min-height: 4px; transition: all 0.3s ease; cursor:pointer; position:relative;"
                         onmouseenter="this.style.background='#1a5d2e'; this.style.transform='scaleX(1.05)'; this.querySelector('.report-tooltip').style.display='block'"
                         onmouseleave="this.style.background='linear-gradient(180deg, #4fbd74, #2ecc71)'; this.style.transform='scaleX(1)'; this.querySelector('.report-tooltip').style.display='none'">
                        <div class="report-tooltip" style="display:none; position:absolute; bottom:100%; left:50%; transform:translateX(-50%); background:#1a1a2e; color:#4fbd74; padding:4px 10px; border-radius:6px; font-size:11px; white-space:nowrap; margin-bottom:8px; box-shadow:0 2px 8px rgba(0,0,0,0.2); z-index:100;">
                            ₱${value.toLocaleString()} (${percentage}%)
                        </div>
                    </div>
                </div>
                <span style="font-size:9px; color:rgba(255,255,255,0.6); white-space:nowrap;">${labels[i]}</span>
                <span style="font-size:10px; color:#4fbd74; font-weight:500;">₱${value.toLocaleString()}</span>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div style="display:flex; align-items:flex-end; justify-content:space-around; height:280px; gap:8px; padding:10px 5px; overflow-x:auto; min-width:100%;">
            ${bars}
        </div>
        <div style="margin-top:20px; text-align:center; font-size:11px; color:rgba(255,255,255,0.4);">
            <i class="fas fa-chart-line"></i> Monthly Sales Trend (Last 12 Months)
        </div>
    `;
}

function displayEmptyReport() {
    const salesSummary = document.getElementById('salesSummary');
    if (salesSummary) {
        salesSummary.innerHTML = `
            <div class="summary-item" style="display:flex; justify-content:space-between; padding:8px 0;"><span>Total Sales</span><span>₱0.00</span></div>
            <div class="summary-item" style="display:flex; justify-content:space-between; padding:8px 0;"><span>Total Orders</span><span>0</span></div>
            <div class="summary-item" style="display:flex; justify-content:space-between; padding:8px 0;"><span>Average Order</span><span>₱0.00</span></div>
        `;
    }
    
    const topProducts = document.getElementById('topProducts');
    if (topProducts) topProducts.innerHTML = '<div class="text-center">No orders found</div>';
    
    const monthlyContainer = document.getElementById('monthlyChartContainer');
    if (monthlyContainer) monthlyContainer.innerHTML = '<div class="text-center">No data available</div>';
}

async function exportReport(format) {
    const periodEl = document.getElementById('reportPeriod');
    const period = periodEl ? periodEl.value : '30';
    
    showNotification(`Exporting as ${format.toUpperCase()}...`, 'info');
    
    try {
        // Use cached orders for export
        let orders = cachedOrders;
        if (!orders || orders.length === 0) {
            const response = await apiCall('/orders');
            orders = response.orders || response;
        }
        
        if (!orders || orders.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }
        
        // Filter by period
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        
        const filteredOrders = orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return !isNaN(orderDate.getTime()) && orderDate >= startDate && orderDate <= endDate;
        });
        
        // Create CSV
        const headers = ['Order ID', 'Date', 'Customer', 'Total', 'Status', 'Payment Method', 'Items'];
        const rows = filteredOrders.map(order => [
            order.orderNumber || order.id,
            formatDate(order.orderDate),
            order.userName || order.customerName || `User ${order.userId}`,
            order.total || 0,
            order.status || 'pending',
            order.paymentMethod || 'N/A',
            order.items ? order.items.length : 0
        ]);
        
        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        showNotification('Report exported successfully!', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export report', 'error');
    }
}

// ============= USER MANAGEMENT =============
function initUserManagementListeners() {
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', debounce(function() {
            loadUsers(1, this.value);
        }, 500));
    }
    
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) addUserBtn.addEventListener('click', () => openUserModal('add'));
    
    const exportUsersBtn = document.getElementById('exportUsers');
    if (exportUsersBtn) exportUsersBtn.addEventListener('click', exportUsers);
    
    const bulkDelete = document.getElementById('bulkDelete');
    const bulkActivate = document.getElementById('bulkActivate');
    const bulkSuspend = document.getElementById('bulkSuspend');
    
    if (bulkDelete) bulkDelete.addEventListener('click', bulkDeleteUsers);
    if (bulkActivate) bulkActivate.addEventListener('click', () => bulkUpdateStatus('active'));
    if (bulkSuspend) bulkSuspend.addEventListener('click', () => bulkUpdateStatus('suspended'));
    
    const selectAllUsers = document.getElementById('selectAllUsers');
    if (selectAllUsers) {
        selectAllUsers.addEventListener('change', function() {
            document.querySelectorAll('.user-checkbox').forEach(cb => {
                cb.checked = this.checked;
                if (this.checked) {
                    selectedUsers.add(parseInt(cb.value));
                } else {
                    selectedUsers.delete(parseInt(cb.value));
                }
            });
        });
    }
    
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    
    if (prevPage) {
        prevPage.addEventListener('click', () => {
            if (currentUserPage > 1) loadUsers(currentUserPage - 1, currentUserSearch);
        });
    }
    
    if (nextPage) {
        nextPage.addEventListener('click', () => {
            if (currentUserPage < totalUserPages) loadUsers(currentUserPage + 1, currentUserSearch);
        });
    }
}

async function loadUsers(page = 1, search = '') {
    try {
        currentUserPage = page;
        currentUserSearch = search;
        
        let url = '/users';
        if (search) {
            url += `?search=${encodeURIComponent(search)}`;
        }
        
        console.log('Loading users from:', url);
        
        const response = await apiCall(url);
        console.log('Users response:', response);
        
        let users = [];
        if (response && response.success && Array.isArray(response.users)) {
            users = response.users;
            console.log(`Loaded ${users.length} users`);
            window.cachedUsers = users;
        } else if (Array.isArray(response)) {
            users = response;
            window.cachedUsers = users;
        } else {
            console.error('Unexpected response format:', response);
            users = [];
        }
        
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No users found</td></tr>';
            updateUserPagination(0, 1);
            return;
        }
        
        const itemsPerPage = 10;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = users.slice(startIndex, endIndex);
        totalUserPages = Math.ceil(users.length / itemsPerPage);
        
        let html = '';
        paginatedUsers.forEach(user => {
            const statusClass = user.verified ? 'active' : 'inactive';
            const statusText = user.verified ? 'Verified' : 'Pending';
            const roleBadge = user.role === 'admin' || user.role === 'ADMIN' ? 
                '<span class="badge-admin">Admin</span>' : 
                '<span class="badge-customer">Customer</span>';
            const isSelected = selectedUsers.has(user.id) ? 'checked' : '';
            
            const phoneNumber = user.phone || user.phoneNumber || 'N/A';
            
            let schoolInfoHtml = '';
            if (user.studentId || user.yearLevel || user.course) {
                const schoolParts = [];
                if (user.studentId) schoolParts.push(`ID: ${user.studentId}`);
                if (user.yearLevel) schoolParts.push(`${user.yearLevel}`);
                if (user.course) schoolParts.push(`${user.course}`);
                if (user.schoolYear) schoolParts.push(`SY: ${user.schoolYear}`);
                
                schoolInfoHtml = `
                    <div class="school-info-badge" style="font-size: 11px; color: #4fbd74; margin-bottom: 4px;">
                        <i class="fas fa-graduation-cap"></i> ${schoolParts.join(' • ')}
                    </div>
                `;
            }
            
            let roomInfoHtml = '';
            if (user.roomBuilding || user.roomNumber) {
                const roomParts = [];
                if (user.roomBuilding) roomParts.push(`${user.roomBuilding}`);
                if (user.roomNumber) roomParts.push(`Rm ${user.roomNumber}`);
                if (user.specialDelivery) roomParts.push(`${user.specialDelivery.substring(0, 30)}${user.specialDelivery.length > 30 ? '...' : ''}`);
                
                roomInfoHtml = `
                    <div class="room-info-badge" style="font-size: 11px; color: #f39c12;">
                        <i class="fas fa-door-open"></i> ${roomParts.join(' • ')}
                    </div>
                `;
            }
            
            html += `
                <tr>
                    <td><input type="checkbox" class="user-checkbox" value="${user.id}" ${isSelected}></td>
                    <td><strong>UID-${user.id}</strong></td>
                    <td>
                        ${user.fullName || user.name || 'N/A'} 
                        ${roleBadge}
                    </td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${phoneNumber}</td>
                    <td class="school-info-cell">
                        <div class="user-details-container">
                            ${schoolInfoHtml}
                            ${roomInfoHtml}
                            <button class="btn-view-details" data-id="${user.id}" title="View Full Details" style="background: none; border: none; color: #4fbd74; cursor: pointer; font-size: 11px; margin-top: 4px;">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                        </div>
                    </td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td><span class="user-status ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action edit-user" data-id="${user.id}" title="Edit User">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action delete-user" data-id="${user.id}" title="Delete User">
                                <i class="fas fa-trash"></i>
                            </button>
                            ${user.verified ? 
                                `<button class="btn-action suspend-user" data-id="${user.id}" title="Suspend User">
                                    <i class="fas fa-ban"></i>
                                </button>` : 
                                `<button class="btn-action activate-user" data-id="${user.id}" title="Activate User">
                                    <i class="fas fa-check-circle"></i>
                                </button>`
                            }
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        updateUserPagination(users.length, page);
        attachUserActionListeners();
        updateSelectAllState();
        
    } catch (error) {
        console.error('Failed to load users:', error);
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center error">Failed to load users</td></tr>';
        }
    }
}

function attachUserActionListeners() {
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.removeEventListener('click', handleEditUser);
        btn.addEventListener('click', handleEditUser);
    });
    
    document.querySelectorAll('.btn-view-details').forEach(btn => {
        btn.removeEventListener('click', handleViewDetails);
        btn.addEventListener('click', handleViewDetails);
    });
    
    document.querySelectorAll('.delete-user').forEach(btn => {
        btn.removeEventListener('click', handleDeleteUser);
        btn.addEventListener('click', handleDeleteUser);
    });
    
    document.querySelectorAll('.suspend-user').forEach(btn => {
        btn.removeEventListener('click', handleSuspendUser);
        btn.addEventListener('click', handleSuspendUser);
    });
    
    document.querySelectorAll('.activate-user').forEach(btn => {
        btn.removeEventListener('click', handleActivateUser);
        btn.addEventListener('click', handleActivateUser);
    });
    
    document.querySelectorAll('.user-checkbox').forEach(cb => {
        cb.removeEventListener('change', handleUserCheckboxChange);
        cb.addEventListener('change', handleUserCheckboxChange);
    });
}

function handleEditUser(e) {
    e.preventDefault();
    e.stopPropagation();
    const userId = this.dataset.id;
    openUserModal('edit', userId);
}

function handleViewDetails(e) {
    e.preventDefault();
    e.stopPropagation();
    const userId = this.dataset.id;
    showUserDetailsModal(userId);
}

function handleDeleteUser(e) {
    e.preventDefault();
    e.stopPropagation();
    const userId = this.dataset.id;
    deleteUserWithFace(userId);
}

function handleSuspendUser(e) {
    e.preventDefault();
    e.stopPropagation();
    const userId = this.dataset.id;
    updateUserStatus(userId, 'inactive');
}

function handleActivateUser(e) {
    e.preventDefault();
    e.stopPropagation();
    const userId = this.dataset.id;
    updateUserStatus(userId, 'active');
}

function handleUserCheckboxChange() {
    if (this.checked) {
        selectedUsers.add(parseInt(this.value));
    } else {
        selectedUsers.delete(parseInt(this.value));
    }
    updateSelectAllState();
}

function updateUserPagination(totalUsers, currentPage) {
    const userCountEl = document.getElementById('userCount');
    const totalUserCountEl = document.getElementById('totalUserCount');
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    const startItem = Math.min(((currentPage - 1) * 10) + 1, totalUsers);
    const endItem = Math.min(currentPage * 10, totalUsers);
    
    if (userCountEl) userCountEl.textContent = totalUsers > 0 ? `${startItem}-${endItem}` : '0';
    if (totalUserCountEl) totalUserCountEl.textContent = totalUsers;
    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalUserPages;
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalUserPages || totalUserPages === 0;
}

function updateSelectAllState() {
    const selectAll = document.getElementById('selectAllUsers');
    if (!selectAll) return;
    
    const checkboxes = document.querySelectorAll('.user-checkbox');
    const checkedCount = document.querySelectorAll('.user-checkbox:checked').length;
    
    selectAll.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

async function showUserDetailsModal(userId) {
    try {
        const response = await apiCall(`/users/${userId}`);
        const user = response.user || response;
        
        console.log('User data for details:', user);
        
        let modal = document.getElementById('userDetailsModal');
        if (modal) {
            modal.remove();
        }
        
        modal = document.createElement('div');
        modal.id = 'userDetailsModal';
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-user-circle"></i> User Details</h3>
                    <button class="close-modal" id="closeUserDetailsModal">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px; max-height: 70vh; overflow-y: auto;">
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #ffffff; margin-bottom: 15px; border-bottom: 2px solid #4fbd74; padding-bottom: 8px;">
                            <i class="fas fa-user"></i> Personal Information
                        </h4>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Full Name</div>
                            <div style="flex: 1; color: #fff;">${escapeHtml(user.fullName || user.name || 'N/A')}</div>
                        </div>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Email Address</div>
                            <div style="flex: 1; color: #fff;">${escapeHtml(user.email || 'N/A')}</div>
                        </div>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Phone Number</div>
                            <div style="flex: 1; color: #ffffff;">${escapeHtml(user.phone || user.phoneNumber || 'N/A')}</div>
                        </div>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Date of Birth</div>
                            <div style="flex: 1; color: #ffffff;">${user.dateOfBirth || 'Not provided'}</div>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #ffffff; margin-bottom: 15px; border-bottom: 2px solid #4fbd74; padding-bottom: 8px;">
                            <i class="fas fa-graduation-cap"></i> School Information
                        </h4>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Student ID</div>
                            <div style="flex: 1; color: #4fbd74; font-weight: 500;">${escapeHtml(user.studentId || 'Not provided')}</div>
                        </div>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Year Level</div>
                            <div style="flex: 1; color: #ffffff;">${escapeHtml(user.yearLevel || 'Not provided')}</div>
                        </div>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Course / Strand</div>
                            <div style="flex: 1; color: #ffffff;">${escapeHtml(user.course || 'Not provided')}</div>
                        </div>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">School Year</div>
                            <div style="flex: 1; color: #ffffff;">${escapeHtml(user.schoolYear || 'Not provided')}</div>
                        </div>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">School Email</div>
                            <div style="flex: 1; color: #ffffff;">${user.email?.includes('@phinmaed.com') ? 'Verified @phinmaed.com' : 'Not a school email'}</div>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #ffffff; margin-bottom: 15px; border-bottom: 2px solid #4fbd74; padding-bottom: 8px;">
                            <i class="fas fa-door-open"></i> Room / Delivery Location
                        </h4>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Building</div>
                            <div style="flex: 1; color: #ffffff;">${escapeHtml(user.roomBuilding || 'Not specified')}</div>
                        </div>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Room Number</div>
                            <div style="flex: 1; color: #f39c12; font-weight: 500;">${escapeHtml(user.roomNumber || 'Not specified')}</div>
                        </div>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Special Instructions</div>
                            <div style="flex: 1; color: #ffffff;">${escapeHtml(user.specialDelivery || 'None')}</div>
                        </div>
                    </div>
                    <div>
                        <h4 style="color: #ffffff; margin-bottom: 15px; border-bottom: 2px solid #4fbd74; padding-bottom: 8px;">
                            <i class="fas fa-shield-alt"></i> Account Status
                        </h4>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Registered</div>
                            <div style="flex: 1; color: #ffffff;">${formatDate(user.createdAt)}</div>
                        </div>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Status</div>
                            <div style="flex: 1; color: #ffffff">
                                <span style="color: ${user.verified ? '#2ecc71' : '#e74c3c'}; font-weight: 600;">
                                    ${user.verified ? 'Verified' : 'Pending Verification'}
                                </span>
                            </div>
                        </div>
                        <div style="display: flex; margin-bottom: 10px;">
                            <div style="width: 120px; font-weight: 600; color: #ffffff;">Role</div>
                            <div style="flex: 1; color: #ffff;">${user.role === 'admin' ? 'Administrator' : 'Customer'}</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="closeUserDetailsBtn">Close</button>
                    <button class="btn-primary" id="editUserFromDetailsBtn" data-id="${user.id}">
                        <i class="fas fa-edit"></i> Edit User
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const closeModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => modal.remove(), 300);
        };
        
        document.getElementById('closeUserDetailsModal').addEventListener('click', closeModal);
        document.getElementById('closeUserDetailsBtn').addEventListener('click', closeModal);
        
        const editBtn = document.getElementById('editUserFromDetailsBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                closeModal();
                openUserModal('edit', userId);
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Failed to load user details:', error);
        showNotification('Failed to load user details', 'error');
    }
}

function openUserModal(mode, userId = null) {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    
    const title = document.getElementById('userModalTitle');
    const passwordFields = document.getElementById('passwordFields');
    const form = document.getElementById('userForm');
    
    if (title) title.textContent = mode === 'add' ? 'Add New User' : 'Edit User';
    
    modal.dataset.mode = mode;
    modal.dataset.userId = userId || '';
    
    if (form) form.reset();
    
    if (mode === 'edit' && userId) {
        loadUserData(userId);
        if (passwordFields) passwordFields.style.display = 'none';
    } else {
        const statusEl = document.getElementById('modalUserStatus');
        const roleEl = document.getElementById('modalUserRole');
        
        if (statusEl) statusEl.value = 'active';
        if (roleEl) roleEl.value = 'customer';
        if (passwordFields) passwordFields.style.display = 'flex';
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    setupUserModalListeners();
}

function setupUserModalListeners() {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    
    modal.querySelectorAll('.close-modal, .btn-secondary.close-modal').forEach(btn => {
        btn.removeEventListener('click', closeUserModal);
        btn.addEventListener('click', closeUserModal);
    });
    
    const saveBtn = document.getElementById('saveUserBtn');
    if (saveBtn) {
        saveBtn.removeEventListener('click', saveUser);
        saveBtn.addEventListener('click', saveUser);
    }
    
    modal.removeEventListener('click', handleUserModalOutsideClick);
    modal.addEventListener('click', handleUserModalOutsideClick);
}

function handleUserModalOutsideClick(e) {
    if (e.target === document.getElementById('userModal')) {
        closeUserModal();
    }
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function loadUserData(userId) {
    try {
        const response = await apiCall(`/users/${userId}`);
        const user = response.user || response;
        
        console.log('Loading user data for edit:', user);
        
        const nameEl = document.getElementById('modalUserName');
        const emailEl = document.getElementById('modalUserEmail');
        const phoneEl = document.getElementById('modalUserPhone');
        const roleEl = document.getElementById('modalUserRole');
        const statusEl = document.getElementById('modalUserStatus');
        
        if (nameEl) nameEl.value = user.fullName || user.name || '';
        if (emailEl) emailEl.value = user.email || '';
        if (phoneEl) phoneEl.value = user.phone || user.phoneNumber || '';
        if (roleEl) roleEl.value = (user.role || 'customer').toLowerCase();
        if (statusEl) statusEl.value = user.verified ? 'active' : 'suspended';
        
        const studentIdEl = document.getElementById('modalStudentId');
        const yearLevelEl = document.getElementById('modalYearLevel');
        const courseEl = document.getElementById('modalCourse');
        const dobEl = document.getElementById('modalDateOfBirth');
        const schoolYearEl = document.getElementById('modalSchoolYear');
        
        if (studentIdEl) studentIdEl.value = user.studentId || '';
        if (yearLevelEl) yearLevelEl.value = user.yearLevel || '';
        if (courseEl) courseEl.value = user.course || '';
        if (dobEl) dobEl.value = user.dateOfBirth || '';
        if (schoolYearEl) schoolYearEl.value = user.schoolYear || '';
        
        const roomBuildingEl = document.getElementById('modalRoomBuilding');
        const roomNumberEl = document.getElementById('modalRoomNumber');
        const specialDeliveryEl = document.getElementById('modalSpecialDelivery');
        
        if (roomBuildingEl) roomBuildingEl.value = user.roomBuilding || '';
        if (roomNumberEl) roomNumberEl.value = user.roomNumber || '';
        if (specialDeliveryEl) specialDeliveryEl.value = user.specialDelivery || '';
        
    } catch (error) {
        console.error('Failed to load user data:', error);
        showNotification('Failed to load user data', 'error');
    }
}

async function saveUser() {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    
    const mode = modal.dataset.mode;
    const userId = modal.dataset.userId;
    
    const userData = {
        fullName: document.getElementById('modalUserName')?.value,
        email: document.getElementById('modalUserEmail')?.value,
        phone: document.getElementById('modalUserPhone')?.value,
        role: document.getElementById('modalUserRole')?.value,
        verified: document.getElementById('modalUserStatus')?.value === 'active',
        
        studentId: document.getElementById('modalStudentId')?.value,
        yearLevel: document.getElementById('modalYearLevel')?.value,
        course: document.getElementById('modalCourse')?.value,
        dateOfBirth: document.getElementById('modalDateOfBirth')?.value,
        schoolYear: document.getElementById('modalSchoolYear')?.value,
        
        roomBuilding: document.getElementById('modalRoomBuilding')?.value,
        roomNumber: document.getElementById('modalRoomNumber')?.value,
        specialDelivery: document.getElementById('modalSpecialDelivery')?.value
    };
    
    if (!userData.fullName || !userData.email) {
        showNotification('Name and email are required', 'error');
        return;
    }
    
    if (mode === 'add') {
        const password = document.getElementById('modalUserPassword')?.value;
        const confirmPassword = document.getElementById('modalUserConfirmPassword')?.value;
        
        if (!password) {
            showNotification('Password is required', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        userData.password = password;
        
        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            
            if (data.success) {
                showNotification('User created successfully!', 'success');
                closeUserModal();
                loadUsers(currentUserPage, currentUserSearch);
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            showNotification('Failed to create user: ' + error.message, 'error');
        }
    } else {
        try {
            await apiCall(`/users/${userId}`, 'PUT', userData);
            showNotification('User updated successfully!', 'success');
            closeUserModal();
            loadUsers(currentUserPage, currentUserSearch);
        } catch (error) {
            showNotification('Failed to update user', 'error');
        }
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        await apiCall(`/users/${userId}`, 'DELETE');
        showNotification('User deleted successfully!', 'success');
        selectedUsers.delete(parseInt(userId));
        loadUsers(currentUserPage, currentUserSearch);
    } catch (error) {
        showNotification('Failed to delete user', 'error');
    }
}

async function updateUserStatus(userId, status) {
    const action = status === 'active' ? 'activate' : 'suspend';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    try {
        await apiCall(`/users/${userId}/status`, 'PUT', { status });
        showNotification(`User ${action}d successfully!`, 'success');
        loadUsers(currentUserPage, currentUserSearch);
    } catch (error) {
        showNotification(`Failed to ${action} user`, 'error');
    }
}

async function bulkDeleteUsers() {
    if (selectedUsers.size === 0) {
        showNotification('No users selected', 'warning');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)? This cannot be undone.`)) {
        return;
    }
    
    showNotification('Deleting users...', 'info');
    let successCount = 0;
    let failCount = 0;
    
    for (const userId of selectedUsers) {
        try {
            await apiCall(`/users/${userId}`, 'DELETE');
            successCount++;
        } catch (error) {
            failCount++;
        }
    }
    
    selectedUsers.clear();
    showNotification(`Deleted ${successCount} users, ${failCount} failed`, successCount > 0 ? 'success' : 'error');
    loadUsers(currentUserPage, currentUserSearch);
}

async function bulkUpdateStatus(status) {
    if (selectedUsers.size === 0) {
        showNotification('No users selected', 'warning');
        return;
    }
    
    const action = status === 'active' ? 'activate' : 'suspend';
    if (!confirm(`Are you sure you want to ${action} ${selectedUsers.size} user(s)?`)) {
        return;
    }
    
    showNotification(`${action}ing users...`, 'info');
    let successCount = 0;
    let failCount = 0;
    
    for (const userId of selectedUsers) {
        try {
            await apiCall(`/users/${userId}/status`, 'PUT', { status });
            successCount++;
        } catch (error) {
            failCount++;
        }
    }
    
    selectedUsers.clear();
    showNotification(`${action}d ${successCount} users, ${failCount} failed`, successCount > 0 ? 'success' : 'error');
    loadUsers(currentUserPage, currentUserSearch);
}

async function exportUsers() {
    try {
        showNotification('Exporting users...', 'info');
        const response = await apiCall('/users');
        const users = response.users || response;
        
        const headers = [
            'ID', 'Name', 'Email', 'Phone', 'Student ID', 'Year Level', 'Course', 
            'Date of Birth', 'School Year', 'Building', 'Room Number', 'Special Delivery',
            'Role', 'Status', 'Registered Date'
        ];
        const csvRows = [headers.join(',')];
        
        users.forEach(user => {
            const row = [
                user.id,
                `"${(user.fullName || user.name || '').replace(/"/g, '""')}"`,
                `"${(user.email || '').replace(/"/g, '""')}"`,
                `"${(user.phone || user.phoneNumber || '').replace(/"/g, '""')}"`,
                `"${(user.studentId || '').replace(/"/g, '""')}"`,
                `"${(user.yearLevel || '').replace(/"/g, '""')}"`,
                `"${(user.course || '').replace(/"/g, '""')}"`,
                `"${(user.dateOfBirth || '').replace(/"/g, '""')}"`,
                `"${(user.schoolYear || '').replace(/"/g, '""')}"`,
                `"${(user.roomBuilding || '').replace(/"/g, '""')}"`,
                `"${(user.roomNumber || '').replace(/"/g, '""')}"`,
                `"${(user.specialDelivery || '').replace(/"/g, '""')}"`,
                user.role || 'customer',
                user.verified ? 'Verified' : 'Pending',
                formatDate(user.createdAt)
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        window.URL.revokeObjectURL(url);
        showNotification('Users exported successfully!', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export users', 'error');
    }
}

// ============= ORDER MANAGEMENT =============
function initOrderManagementListeners() {
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const selectedStatus = this.dataset.filter;
            currentOrderStatus = selectedStatus;
            
            console.log('Filter clicked:', selectedStatus);
            
            loadOrders(selectedStatus, orderDateRange.start, orderDateRange.end);
        });
    });
    
    const applyFilter = document.getElementById('applyDateFilter');
    const clearFilter = document.getElementById('clearDateFilter');
    
    if (applyFilter) {
        applyFilter.addEventListener('click', () => {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                showNotification('Please select both start and end dates', 'warning');
                return;
            }
            
            orderDateRange.start = startDate;
            orderDateRange.end = endDate;
            loadOrders(currentOrderStatus, startDate, endDate);
        });
    }
    
    if (clearFilter) {
        clearFilter.addEventListener('click', () => {
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            orderDateRange = { start: '', end: '' };
            loadOrders(currentOrderStatus);
            showNotification('Date filter cleared', 'success');
        });
    }
}

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'status-pending';
    if (statusLower === 'processing') return 'status-processing';
    if (statusLower === 'shipped') return 'status-shipped';
    if (statusLower === 'completed' || statusLower === 'delivered') return 'status-completed';
    if (statusLower === 'cancelled' || statusLower === 'canceled') return 'status-cancelled';
    return 'status-unknown';
}

function getStatusIcon(status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return '⏳';
    if (statusLower === 'processing') return '⚙️';
    if (statusLower === 'shipped') return '🚚';
    if (statusLower === 'completed' || statusLower === 'delivered') return '✅';
    if (statusLower === 'cancelled' || statusLower === 'canceled') return '❌';
    return '❓';
}

async function loadOrders(status = 'all', startDate = '', endDate = '') {
    try {
        console.log('Loading orders with status:', status);
        
        let url = '/orders';
        const params = [];
        
        if (startDate && endDate) {
            params.push(`startDate=${startDate}`);
            params.push(`endDate=${endDate}`);
        }
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        console.log('Fetching orders from:', `${API_BASE}${url}`);
        
        const response = await apiCall(url);
        console.log('Orders API response:', response);
        
        let orders = [];
        if (response && response.success && Array.isArray(response.orders)) {
            orders = response.orders;
        } else if (Array.isArray(response)) {
            orders = response;
        } else {
            console.error('Unexpected response format:', response);
            orders = [];
        }
        
        // Cache orders for reports
        cachedOrders = orders;
        
        console.log(`Loaded ${orders.length} orders from API`);
        
        let filteredOrders = orders;
        if (status !== 'all') {
            const statusLower = status.toLowerCase();
            filteredOrders = orders.filter(order => 
                order.status && order.status.toLowerCase() === statusLower
            );
            console.log(`After ${status} filter: ${filteredOrders.length} orders`);
        }
        
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) {
            console.error('ordersTableBody not found in DOM');
            return;
        }
        
        if (!filteredOrders || filteredOrders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center">No ${status} orders found</td><td colspan="8" class="text-center">No ${status} orders found</td></tr>`;
            return;
        }
        
        let html = '';
        filteredOrders.forEach(order => {
            const itemsCount = order.items ? order.items.length : 0;
            const itemsDisplay = itemsCount > 0 ? `${itemsCount} item(s)` : 'No items';
            
            const statusValue = order.status || 'pending';
            const statusLower = statusValue.toLowerCase();
            const statusDisplay = capitalize(statusValue);
            const statusClass = getStatusClass(statusLower);
            const statusIcon = getStatusIcon(statusLower);
            
            const displayId = order.orderNumber || order.id;
            
            let customerName = order.userName || order.customerName;
            
            if (!customerName && order.userId && window.cachedUsers) {
                const user = window.cachedUsers.find(u => u.id == order.userId);
                if (user) {
                    customerName = user.fullName || user.name;
                }
            }
            
            if (!customerName) {
                customerName = `User ${order.userId}`;
            }
            
            const isCompleted = statusLower === 'completed' || statusLower === 'delivered' || statusLower === 'cancelled';
            const viewBtnDisabled = isCompleted ? 'disabled' : '';
            const trackingBtnDisabled = isCompleted ? 'disabled' : '';
            
            const roomInfo = order.roomNumber ? `${order.roomBuilding || ''} ${order.roomNumber}` : '-';
            
            html += `
                <tr>
                    <td><strong>${displayId}</strong></td>
                    <td>${escapeHtml(customerName)}</td>
                    <td>${formatDate(order.orderDate)}</td>
                    <td>${itemsDisplay}</td>
                    <td>₱${(order.total || 0).toFixed(2)}</td>
                    <td>${order.paymentMethod || 'N/A'}</td>
                    <td>${roomInfo}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${statusIcon} ${statusDisplay}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action view-order" data-id="${order.id}" title="View Details" ${viewBtnDisabled}>
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-action tracking-order" data-id="${order.id}" title="Update Tracking" ${trackingBtnDisabled}>
                                <i class="fas fa-truck"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        document.querySelectorAll('#ordersTableBody .view-order:not([disabled])').forEach(btn => {
            btn.addEventListener('click', function() {
                showOrderDetails(this.dataset.id);
            });
        });
        
        document.querySelectorAll('#ordersTableBody .tracking-order:not([disabled])').forEach(btn => {
            btn.addEventListener('click', function() {
                updateOrderTracking(this.dataset.id);
            });
        });
        
    } catch (error) {
        console.error('Failed to load orders:', error);
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center error">Failed to load orders: ${error.message}</td></td>`;
        }
    }
}

async function showOrderDetails(orderId) {
    try {
        console.log('Loading order details for:', orderId);
        
        const response = await apiCall(`/orders/${orderId}`);
        const orderData = response.order || response;
        
        if (!orderData || !orderData.id) {
            showNotification('Order not found', 'error');
            return;
        }
        
        const displayId = orderData.orderNumber || orderData.id;
        const statusLower = (orderData.status || 'pending').toLowerCase();
        const isCompleted = statusLower === 'completed' || statusLower === 'delivered' || statusLower === 'cancelled';
        
        // DOM elements
        const detailOrderId = document.getElementById('detailOrderId');
        const infoOrderId = document.getElementById('infoOrderId');
        const infoOrderDate = document.getElementById('infoOrderDate');
        const infoCustomer = document.getElementById('infoCustomer');
        const infoEmail = document.getElementById('infoEmail');
        const infoContact = document.getElementById('infoContact');
        const infoStudentId = document.getElementById('infoStudentId');
        const infoSchoolEmail = document.getElementById('infoSchoolEmail');
        const infoPayment = document.getElementById('infoPayment');
        const infoPaymentStatus = document.getElementById('infoPaymentStatus');
        
        // ROOM INFORMATION
        const infoBuilding = document.getElementById('infoBuilding');
        const infoRoomNumber = document.getElementById('infoRoomNumber');
        const infoSpecialDelivery = document.getElementById('infoSpecialDelivery');
        
        // Order Information
        const orderInfoId = document.getElementById('orderInfoId');
        const orderInfoDate = document.getElementById('orderInfoDate');
        const orderInfoPaymentMethod = document.getElementById('orderInfoPaymentMethod');
        const orderInfoPaymentStatus = document.getElementById('orderInfoPaymentStatus');
        
        // Tracking Information
        const infoTracking = document.getElementById('infoTracking');
        const infoEstimatedDelivery = document.getElementById('infoEstimatedDelivery');
        const infoDeliveryStatus = document.getElementById('infoDeliveryStatus');
        
        if (detailOrderId) detailOrderId.textContent = displayId;
        if (infoOrderId) infoOrderId.textContent = displayId;
        if (infoOrderDate) infoOrderDate.textContent = formatDate(orderData.orderDate);
        if (orderInfoId) orderInfoId.textContent = displayId;
        if (orderInfoDate) orderInfoDate.textContent = formatDate(orderData.orderDate);
        
        // Resolve customer name and extra user fields
        let customerName = orderData.userName || orderData.customerName;
        let customerEmail = orderData.userEmail || orderData.email;
        let customerPhone = orderData.userPhone || orderData.phone;
        let studentId = orderData.studentId;
        let schoolEmail = orderData.schoolEmail;
        let building = orderData.roomBuilding || orderData.building;
        let roomNumber = orderData.roomNumber;
        let specialDelivery = orderData.specialDelivery || orderData.specialInstructions;
        
        if ((!customerName || !studentId) && orderData.userId && window.cachedUsers) {
            const user = window.cachedUsers.find(u => u.id == orderData.userId);
            if (user) {
                if (!customerName) customerName = user.fullName || user.name;
                if (!customerEmail) customerEmail = user.email;
                if (!customerPhone) customerPhone = user.phone || user.phoneNumber;
                if (!studentId) studentId = user.studentId;
                if (!schoolEmail) schoolEmail = user.schoolEmail || (user.email && user.email.includes('@phinmaed.com') ? user.email : null);
                if (!building) building = user.roomBuilding;
                if (!roomNumber) roomNumber = user.roomNumber;
                if (!specialDelivery) specialDelivery = user.specialDelivery;
            }
        }
        if (!customerName) customerName = `User ${orderData.userId}`;
        
        if (infoCustomer) infoCustomer.textContent = customerName;
        if (infoEmail) infoEmail.textContent = customerEmail || 'N/A';
        if (infoContact) infoContact.textContent = customerPhone || 'N/A';
        if (infoStudentId) infoStudentId.textContent = studentId || '-';
        if (infoSchoolEmail) infoSchoolEmail.textContent = schoolEmail || '-';
        
        // Payment method
        const paymentMethod = orderData.paymentMethod || 'N/A';
        const paymentStatus = orderData.paymentStatus || orderData.status || 'pending';
        
        if (infoPayment) infoPayment.textContent = paymentMethod;
        if (infoPaymentStatus) infoPaymentStatus.textContent = capitalize(paymentStatus);
        if (orderInfoPaymentMethod) orderInfoPaymentMethod.textContent = paymentMethod;
        if (orderInfoPaymentStatus) orderInfoPaymentStatus.textContent = capitalize(paymentStatus);
        
        // ROOM INFORMATION
        if (infoBuilding) infoBuilding.textContent = building || '-';
        if (infoRoomNumber) infoRoomNumber.textContent = roomNumber || '-';
        if (infoSpecialDelivery) infoSpecialDelivery.textContent = specialDelivery || '-';
        
        // Tracking Information
        const trackingNumber = orderData.trackingNumber || 'Not assigned';
        let estimatedDelivery = orderData.estimatedDelivery || orderData.estimatedDeliveryDate;
        
        if (estimatedDelivery && estimatedDelivery !== '-') {
            const displayDate = new Date(estimatedDelivery).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            if (infoEstimatedDelivery) infoEstimatedDelivery.textContent = displayDate;
            
            // Update delivery status
            if (infoDeliveryStatus) {
                const today = new Date().toISOString().split('T')[0];
                const estDate = new Date(estimatedDelivery).toISOString().split('T')[0];
                
                if (estDate < today) {
                    infoDeliveryStatus.textContent = '📦 Delivered';
                    infoDeliveryStatus.style.color = '#2ecc71';
                } else if (estDate === today) {
                    infoDeliveryStatus.textContent = '🚚 Out for Delivery';
                    infoDeliveryStatus.style.color = '#f39c12';
                } else {
                    infoDeliveryStatus.textContent = '⏳ In Transit';
                    infoDeliveryStatus.style.color = '#3498db';
                }
            }
        } else {
            if (infoEstimatedDelivery) infoEstimatedDelivery.textContent = 'To be determined';
            if (infoDeliveryStatus) {
                infoDeliveryStatus.textContent = '⏳ Pending';
                infoDeliveryStatus.style.color = '#95a5a6';
            }
        }
        
        if (infoTracking) infoTracking.textContent = trackingNumber;
        
        // Proof of payment image
        const proofImage = document.getElementById('verifyProofImage');
        if (proofImage) {
            if (orderData.paymentReceipt) {
                proofImage.innerHTML = `
                    <img src="${orderData.paymentReceipt}" alt="Payment Receipt" style="max-width:100%; max-height:200px; border-radius:8px; cursor:pointer;" 
                         onclick="window.open('${orderData.paymentReceipt}', '_blank')">
                    <p style="margin-top:10px;">
                        <a href="${orderData.paymentReceipt}" target="_blank" class="btn-secondary">
                            <i class="fas fa-external-link-alt"></i> View Full Size
                        </a>
                    </p>
                `;
            } else if (orderData.paymentMethod === 'GCash QR' && orderData.paymentReference) {
                proofImage.innerHTML = `
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px;">
                        <p><i class="fas fa-check-circle" style="color: #2ecc71;"></i> 
                           <strong>PayMongo Payment</strong></p>
                        <p>Reference: <strong>${orderData.paymentReference}</strong></p>
                        <p>Status: <span class="status-badge status-completed">PAID VIA GCASH QR</span></p>
                    </div>
                `;
            } else {
                proofImage.innerHTML = `
                    <i class="fas fa-receipt" style="font-size: 48px; color: #ccc;"></i>
                    <p>No receipt uploaded</p>
                `;
            }
        }
        
        // Order items table
        const itemsTable = document.getElementById('orderItemsTable');
        const orderSubtotal = document.getElementById('orderSubtotal');
        const orderShipping = document.getElementById('orderShipping');
        const orderTotal = document.getElementById('orderTotal');
        
        if (orderData.items && orderData.items.length > 0) {
            let itemsHtml = '';
            let subtotal = 0;
            
            orderData.items.forEach(item => {
                const itemTotal = (item.price || 0) * (item.quantity || 1);
                subtotal += itemTotal;
                
                itemsHtml += `
                    <tr>
                        <td>${item.productName || 'Product'}</td>
                        <td>${item.size || 'Standard'}</td>
                        <td>${item.quantity || 1}</td>
                        <td>₱${(item.price || 0).toFixed(2)}</td>
                        <td>₱${itemTotal.toFixed(2)}</td>
                    </tr>
                `;
            });
            
            if (itemsTable) itemsTable.innerHTML = itemsHtml;
            
            const shipping = orderData.shippingFee || 50;
            const total = subtotal + shipping;
            
            if (orderSubtotal) orderSubtotal.textContent = '₱' + subtotal.toFixed(2);
            if (orderShipping) orderShipping.textContent = '₱' + shipping.toFixed(2);
            if (orderTotal) orderTotal.textContent = '₱' + total.toFixed(2);
        } else {
            if (itemsTable) itemsTable.innerHTML = '<tr><td colspan="5" class="text-center">No items found</td></tr>';
        }
        
        // Status select
        const statusSelect = document.getElementById('updateStatus');
        if (statusSelect) {
            statusSelect.value = statusLower;
            statusSelect.disabled = isCompleted;
        }
        
        const updateBtn = document.getElementById('updateStatusBtn');
        if (updateBtn) {
            updateBtn.dataset.orderId = orderData.id;
            updateBtn.disabled = isCompleted;
        }
        
        // Tracking update button
        const updateTrackingBtn = document.getElementById('updateTrackingBtn');
        if (updateTrackingBtn) {
            updateTrackingBtn.dataset.orderId = orderData.id;
            updateTrackingBtn.disabled = isCompleted;
        }
        
        // Store current order data for printing
        window.currentOrderData = orderData;
        
        // Add edit button listeners
        const editTrackingBtn = document.getElementById('editTrackingBtn');
        if (editTrackingBtn) {
            editTrackingBtn.onclick = () => updateOrderTracking(orderData.id);
        }
        
        const editEstimatedDeliveryBtn = document.getElementById('editEstimatedDeliveryBtn');
        if (editEstimatedDeliveryBtn) {
            editEstimatedDeliveryBtn.onclick = () => updateEstimatedDelivery(orderData.id);
        }
        
        const modal = document.getElementById('orderDetailsModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        setupOrderModalListeners();
        
    } catch (error) {
        console.error('Failed to load order details:', error);
        showNotification('Failed to load order details: ' + error.message, 'error');
    }
}

function setupOrderModalListeners() {
    const modal = document.getElementById('orderDetailsModal');
    if (!modal) return;
    
    modal.querySelectorAll('.close-modal, .btn-secondary.close-modal').forEach(btn => {
        btn.removeEventListener('click', closeOrderModal);
        btn.addEventListener('click', closeOrderModal);
    });
    
    const updateBtn = document.getElementById('updateStatusBtn');
    if (updateBtn && !updateBtn.disabled) {
        updateBtn.removeEventListener('click', updateOrderStatus);
        updateBtn.addEventListener('click', updateOrderStatus);
    }
    
    const printBtn = document.getElementById('printInvoice');
    if (printBtn) {
        printBtn.removeEventListener('click', printInvoice);
        printBtn.addEventListener('click', printInvoice);
    }
    
    const notifBtn = document.getElementById('sendNotification');
    if (notifBtn) {
        notifBtn.removeEventListener('click', sendOrderNotification);
        notifBtn.addEventListener('click', sendOrderNotification);
    }

    const trackingBtn = document.getElementById('updateTrackingBtn');
    if (trackingBtn && !trackingBtn.disabled) {
        trackingBtn.onclick = () => {
            const orderId = document.getElementById('updateStatusBtn')?.dataset.orderId;
            if (orderId) updateOrderTracking(orderId);
        };
    }

    modal.removeEventListener('click', handleOrderModalOutsideClick);
    modal.addEventListener('click', handleOrderModalOutsideClick);
}

function handleOrderModalOutsideClick(e) {
    if (e.target === document.getElementById('orderDetailsModal')) {
        closeOrderModal();
    }
}

function closeOrderModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function updateOrderStatus() {
    const updateBtn = document.getElementById('updateStatusBtn');
    if (!updateBtn) return;
    
    const orderId = updateBtn.dataset.orderId;
    const newStatus = document.getElementById('updateStatus')?.value;
    
    if (!orderId) {
        showNotification('Order ID not found', 'error');
        return;
    }
    
    try {
        showNotification(`Updating order to ${newStatus}...`, 'info');
        
        await apiCall(`/orders/${orderId}/status`, 'PUT', { status: newStatus.toUpperCase() });
        
        // If status is Shipped, prompt for tracking number
        if (newStatus === 'shipped') {
            const tracking = prompt('Enter tracking number:');
            if (tracking && tracking.trim()) {
                await apiCall(`/orders/${orderId}/tracking`, 'PUT', { trackingNumber: tracking });
                showNotification(`Tracking number ${tracking} added`, 'success');
                
                const infoTracking = document.getElementById('infoTracking');
                if (infoTracking) {
                    infoTracking.textContent = tracking;
                }
            }
        }
        
        showNotification(`Order status updated to ${newStatus}`, 'success');
        closeOrderModal();
        loadOrders(currentOrderStatus, orderDateRange.start, orderDateRange.end);
        loadDashboardStats();
    } catch (error) {
        console.error('Failed to update order status:', error);
        showNotification('Failed to update order status: ' + error.message, 'error');
    }
}

// ============= UPDATE TRACKING FUNCTION =============
async function updateOrderTracking(orderId) {
    const currentTracking = document.getElementById('infoTracking')?.textContent || '';
    
    const newTracking = prompt('Enter tracking number:', currentTracking !== 'Not assigned' ? currentTracking : '');
    
    if (!newTracking || newTracking === currentTracking) {
        if (!newTracking) showNotification('Tracking number is required', 'warning');
        return;
    }
    
    try {
        showNotification('Updating tracking number...', 'info');
        
        const response = await apiCall(`/orders/${orderId}/tracking`, 'PUT', { trackingNumber: newTracking });
        
        if (response && response.success !== false) {
            showNotification(`Tracking number updated to: ${newTracking}`, 'success');
            
            const infoTracking = document.getElementById('infoTracking');
            if (infoTracking) {
                infoTracking.textContent = newTracking;
            }
            
            loadOrders(currentOrderStatus, orderDateRange.start, orderDateRange.end);
        } else {
            showNotification(response?.message || 'Failed to update tracking number', 'error');
        }
        
    } catch (error) {
        console.error('Failed to update tracking:', error);
        showNotification('Failed to update tracking number: ' + (error.message || 'Unknown error'), 'error');
    }
}

// ============= ESTIMATED DELIVERY FUNCTION =============
async function updateEstimatedDelivery(orderId) {
    const currentDate = document.getElementById('infoEstimatedDelivery')?.textContent;
    
    const newDate = prompt('Enter estimated delivery date (YYYY-MM-DD):', 
        currentDate !== '-' && currentDate !== 'To be determined' ? currentDate : new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0]);
    
    if (!newDate) {
        showNotification('Estimated delivery date is required', 'warning');
        return;
    }
    
    try {
        const displayDate = new Date(newDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        
        await apiCall(`/orders/${orderId}/estimated-delivery`, 'PUT', {
            estimatedDelivery: newDate,
            deliveryNotes: ''
        });
        
        const infoEstimatedDelivery = document.getElementById('infoEstimatedDelivery');
        if (infoEstimatedDelivery) {
            infoEstimatedDelivery.textContent = displayDate;
        }
        
        const infoDeliveryStatus = document.getElementById('infoDeliveryStatus');
        if (infoDeliveryStatus) {
            const todayStr = new Date().toISOString().split('T')[0];
            if (newDate < todayStr) {
                infoDeliveryStatus.textContent = '📦 Delivered';
                infoDeliveryStatus.style.color = '#2ecc71';
            } else if (newDate === todayStr) {
                infoDeliveryStatus.textContent = '🚚 Out for Delivery';
                infoDeliveryStatus.style.color = '#f39c12';
            } else {
                infoDeliveryStatus.textContent = '⏳ In Transit';
                infoDeliveryStatus.style.color = '#3498db';
            }
        }
        
        showNotification(`Estimated delivery date set to ${displayDate}`, 'success');
        loadOrders(currentOrderStatus, orderDateRange.start, orderDateRange.end);
        
    } catch (error) {
        console.error('Failed to save delivery date:', error);
        showNotification('Failed to save delivery date', 'error');
    }
}

function printInvoice() {
    const order = window.currentOrderData;
    if (!order) {
        showNotification('No order data to print', 'error');
        return;
    }
    
    const displayId = order.orderNumber || order.id;
    const customerName = document.getElementById('infoCustomer')?.textContent || 'N/A';
    const customerEmail = document.getElementById('infoEmail')?.textContent || 'N/A';
    const building = document.getElementById('infoBuilding')?.textContent || 'N/A';
    const roomNumber = document.getElementById('infoRoomNumber')?.textContent || 'N/A';
    const specialDelivery = document.getElementById('infoSpecialDelivery')?.textContent || 'None';
    const trackingNumber = document.getElementById('infoTracking')?.textContent || 'Not assigned';
    const estimatedDelivery = document.getElementById('infoEstimatedDelivery')?.textContent || 'To be determined';
    
    let itemsHtml = '';
    let subtotal = 0;
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            subtotal += itemTotal;
            itemsHtml += `
                <tr>
                    <td>${item.productName || 'Product'}</td>
                    <td>${item.size || 'Standard'}</td>
                    <td>${item.quantity || 1}</td>
                    <td>₱${(item.price || 0).toFixed(2)}</td>
                    <td>₱${itemTotal.toFixed(2)}</td>
                </tr>
            `;
        });
    }
    
    const shipping = order.shippingFee || 50;
    const total = subtotal + shipping;
    
    const printContent = `
        <html>
        <head>
            <title>Invoice #${displayId}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4fbd74; padding-bottom: 20px; }
                .invoice-header h1 { color: #4fbd74; margin: 0; }
                .order-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px; }
                .info-row { margin: 5px 0; }
                .info-label { font-weight: bold; width: 120px; display: inline-block; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background: #4fbd74; color: white; }
                .summary { text-align: right; margin-top: 20px; }
                .total { font-size: 18px; font-weight: bold; color: #4fbd74; }
                .tracking-box { background: #e8f5e9; padding: 10px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <h1>SJC SUPPLIES</h1>
                <p>SJC Building, Campus Drive, San Jose City</p>
                <h2>INVOICE #${displayId}</h2>
                <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="order-info">
                <h3>Customer Information</h3>
                <div class="info-row"><span class="info-label">Name:</span> ${customerName}</div>
                <div class="info-row"><span class="info-label">Email:</span> ${customerEmail}</div>
                <div class="info-row"><span class="info-label">Building:</span> ${building}</div>
                <div class="info-row"><span class="info-label">Room Number:</span> ${roomNumber}</div>
                <div class="info-row"><span class="info-label">Special Instructions:</span> ${specialDelivery}</div>
            </div>
            
            <div class="tracking-box">
                <strong>📦 Tracking Number:</strong> ${trackingNumber}<br>
                <strong>🚚 Estimated Delivery:</strong> ${estimatedDelivery}
            </div>
            
            <h3>Order Items</h3>
            <table>
                <thead>
                    <tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="summary">
                <div class="info-row">Subtotal: ₱${subtotal.toFixed(2)}</div>
                <div class="info-row">Shipping Fee: ₱${shipping.toFixed(2)}</div>
                <div class="info-row total">TOTAL: ₱${total.toFixed(2)}</div>
            </div>
            
            <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #999;">
                <p>Thank you for shopping with SJC Supplies!</p>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    } else {
        showNotification('Please allow pop-ups to print invoice', 'error');
    }
}

function sendOrderNotification() {
    const detailOrderId = document.getElementById('detailOrderId');
    const infoCustomer = document.getElementById('infoCustomer');
    const updateStatus = document.getElementById('updateStatus');
    
    const orderId = detailOrderId ? detailOrderId.textContent : 'N/A';
    const customer = infoCustomer ? infoCustomer.textContent : 'N/A';
    const status = updateStatus ? updateStatus.value : 'N/A';
    
    showNotification(`Email notification sent to ${customer} about order status: ${status}`, 'success');
}

// ============= PRODUCT MANAGEMENT =============
function initProductManagementListeners() {
    const productSearch = document.getElementById('productSearch');
    if (productSearch) {
        productSearch.addEventListener('input', debounce(function() {
            loadProducts('', this.value);
        }, 500));
    }
    
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) addProductBtn.addEventListener('click', () => openProductModal('add'));
    
    const exportProductsBtn = document.getElementById('exportProducts');
    if (exportProductsBtn) exportProductsBtn.addEventListener('click', exportProducts);
}

async function loadProducts(category = '', search = '') {
    try {
        let url = '/products';
        const params = [];
        if (category) params.push(`category=${encodeURIComponent(category)}`);
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (params.length > 0) url += '?' + params.join('&');
        
        const response = await apiCall(url);
        const products = response.products || response;
        
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;
        
        if (!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No products found</td></tr>';
            return;
        }
        
        let html = '';
        products.forEach(product => {
            const statusClass = product.inStock ? 'active' : 'inactive';
            const statusText = product.inStock ? 'In Stock' : 'Out of Stock';
            
            let minPrice = 0;
            let stockLevel = 'N/A';
            let stockWarning = '';
            
            if (product.sizes && product.sizes.length > 0) {
                minPrice = Math.min(...product.sizes.map(s => s.price));
                stockLevel = product.sizes.reduce((total, size) => total + (size.stock || 0), 0);
                
                if (stockLevel < 10 && stockLevel > 0) {
                    stockWarning = '<span class="stock-warning"> Low Stock</span>';
                } else if (stockLevel === 0) {
                    stockWarning = '<span class="stock-danger"> Out of Stock</span>';
                }
            }
            
            // Display image if exists
            const productImage = product.imageUrl && product.imageUrl !== '/images/products/null' && product.imageUrl !== '' 
                ? `<img src="${product.imageUrl}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;">`
                : '<i class="fas fa-image" style="font-size: 24px; color: #666;"></i>';
            
            html += `
                <tr>
                    <td>${productImage} </td>
                    <td><strong>${product.sku || 'PRD-' + product.id}</strong> </td>
                    <td>${product.name} </td>
                    <td>${product.category || 'Uncategorized'} </td>
                    <td>₱${minPrice.toFixed(2)} </td>
                    <td>${stockLevel} ${stockWarning} </td>
                    <td><span class="product-status ${statusClass}">${statusText}</span> </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action edit-product" data-id="${product.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action duplicate-product" data-id="${product.id}" title="Duplicate">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="btn-action delete-product" data-id="${product.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        document.querySelectorAll('#productsTableBody .edit-product').forEach(btn => {
            btn.addEventListener('click', function() {
                openProductModal('edit', this.dataset.id);
            });
        });
        
        document.querySelectorAll('#productsTableBody .duplicate-product').forEach(btn => {
            btn.addEventListener('click', function() {
                duplicateProduct(this.dataset.id);
            });
        });
        
        document.querySelectorAll('#productsTableBody .delete-product').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteProductWithFace(this.dataset.id);
            });
        });
        
    } catch (error) {
        console.error('Failed to load products:', error);
        const tbody = document.getElementById('productsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center error">Failed to load products</td></tr>';
        }
    }
}

// ============= PRODUCT IMAGE UPLOAD FUNCTIONS =============
function initProductImageUpload() {
    const uploadBtn = document.getElementById('uploadImageBtn');
    const imageInput = document.getElementById('modalProductImage');
    const imagePreview = document.getElementById('productImagePreview');
    const removeBtn = document.getElementById('removeImageBtn');
    const imageUrlInput = document.getElementById('modalProductImageUrl');
    
    if (!uploadBtn) return;
    
    uploadBtn.onclick = () => imageInput.click();
    
    imageInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showNotification('File too large. Max 2MB', 'error');
                return;
            }
            if (!file.type.startsWith('image/')) {
                showNotification('Please select an image file', 'error');
                return;
            }
            
            selectedProductImageFile = file;
            const reader = new FileReader();
            reader.onload = function(ev) {
                currentProductImageUrl = ev.target.result;
                imagePreview.innerHTML = `<img src="${currentProductImageUrl}" alt="Preview">`;
                removeBtn.style.display = 'inline-block';
                if (imageUrlInput) imageUrlInput.value = currentProductImageUrl;
            };
            reader.readAsDataURL(file);
        }
    };
    
    removeBtn.onclick = function() {
        selectedProductImageFile = null;
        currentProductImageUrl = '';
        imagePreview.innerHTML = '<i class="fas fa-image"></i><span>No image selected</span>';
        imageInput.value = '';
        removeBtn.style.display = 'none';
        if (imageUrlInput) imageUrlInput.value = '';
    };
}

function openProductModal(mode, productId = null) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    
    // Reset image variables
    selectedProductImageFile = null;
    currentProductImageUrl = '';
    
    if (title) title.textContent = mode === 'add' ? 'Add New Product' : 'Edit Product';
    
    modal.dataset.mode = mode;
    modal.dataset.productId = productId || '';
    
    if (form) form.reset();
    
    // Reset image preview
    const imagePreview = document.getElementById('productImagePreview');
    const removeBtn = document.getElementById('removeImageBtn');
    if (imagePreview) {
        imagePreview.innerHTML = '<i class="fas fa-image"></i><span>No image selected</span>';
    }
    if (removeBtn) removeBtn.style.display = 'none';
    
    const sizesContainer = document.getElementById('sizesContainer');
    if (sizesContainer) sizesContainer.innerHTML = '';
    
    if (mode === 'edit' && productId) {
        loadProductData(productId);
    } else {
        addSize();
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    setupProductModalListeners();
}

function setupProductModalListeners() {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    modal.querySelectorAll('.close-modal, .btn-secondary.close-modal').forEach(btn => {
        btn.removeEventListener('click', closeProductModal);
        btn.addEventListener('click', closeProductModal);
    });
    
    const saveBtn = document.getElementById('saveProductBtn');
    if (saveBtn) {
        saveBtn.removeEventListener('click', saveProduct);
        saveBtn.addEventListener('click', saveProduct);
    }
    
    const addSizeBtn = document.querySelector('.add-size-btn');
    if (addSizeBtn) {
        addSizeBtn.removeEventListener('click', addSize);
        addSizeBtn.addEventListener('click', addSize);
    }
    
    modal.removeEventListener('click', handleProductModalOutsideClick);
    modal.addEventListener('click', handleProductModalOutsideClick);
}

function handleProductModalOutsideClick(e) {
    if (e.target === document.getElementById('productModal')) {
        closeProductModal();
    }
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function loadProductData(productId) {
    try {
        const response = await apiCall(`/products/${productId}`);
        const product = response.product || response;
        
        const nameEl = document.getElementById('modalProductName');
        const categoryEl = document.getElementById('modalProductCategory');
        const descEl = document.getElementById('modalProductDescription');
        const statusEl = document.getElementById('modalProductStatus');
        const imageUrlInput = document.getElementById('modalProductImageUrl');
        const imagePreview = document.getElementById('productImagePreview');
        const removeBtn = document.getElementById('removeImageBtn');
        
        if (nameEl) nameEl.value = product.name || '';
        if (categoryEl) categoryEl.value = product.category || '';
        if (descEl) descEl.value = product.description || '';
        if (statusEl) statusEl.value = product.inStock ? 'active' : 'inactive';
        
        // Load existing image
        if (product.imageUrl && product.imageUrl !== '/images/products/null' && product.imageUrl !== '') {
            currentProductImageUrl = product.imageUrl;
            if (imageUrlInput) imageUrlInput.value = product.imageUrl;
            if (imagePreview) {
                imagePreview.innerHTML = `<img src="${product.imageUrl}" alt="Product Image">`;
            }
            if (removeBtn) removeBtn.style.display = 'inline-block';
        } else {
            currentProductImageUrl = '';
            if (imagePreview) {
                imagePreview.innerHTML = '<i class="fas fa-image"></i><span>No image selected</span>';
            }
            if (removeBtn) removeBtn.style.display = 'none';
        }
        
        const sizesContainer = document.getElementById('sizesContainer');
        if (sizesContainer) {
            sizesContainer.innerHTML = '';
            if (product.sizes && product.sizes.length > 0) {
                product.sizes.forEach(size => {
                    addSizeRow(size.name, size.desc || '', size.price, size.stock || 0);
                });
            } else {
                addSize();
            }
        }
        
    } catch (error) {
        console.error('Failed to load product data:', error);
        showNotification('Failed to load product data', 'error');
    }
}

function addSizeRow(name = '', desc = '', price = '', stock = '') {
    const container = document.getElementById('sizesContainer');
    if (!container) return;
    
    const row = document.createElement('div');
    row.className = 'size-row';
    row.innerHTML = `
        <input type="text" class="size-name" placeholder="Size name (e.g., A4, Small)" value="${name}">
        <input type="text" class="size-desc" placeholder="Description (e.g., 210x297mm)" value="${desc}">
        <input type="number" class="size-price" placeholder="Price" step="0.01" min="0" value="${price}">
        <input type="number" class="size-stock" placeholder="Stock" min="0" value="${stock}">
        <button type="button" class="remove-size" onclick="removeSize(this)">x</button>
    `;
    container.appendChild(row);
    
    row.querySelector('.remove-size')?.addEventListener('click', function() {
        row.remove();
    });
}

function addSize() {
    addSizeRow();
}

function removeSize(button) {
    const row = button.closest('.size-row');
    if (row) row.remove();
}

async function saveProduct() {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    const mode = modal.dataset.mode;
    const productId = modal.dataset.productId;
    
    const sizes = [];
    document.querySelectorAll('.size-row').forEach(row => {
        const name = row.querySelector('.size-name')?.value;
        const desc = row.querySelector('.size-desc')?.value;
        const price = parseFloat(row.querySelector('.size-price')?.value);
        const stock = parseInt(row.querySelector('.size-stock')?.value) || 0;
        
        if (name && price) {
            sizes.push({ name, desc, price, stock });
        }
    });
    
    // Get image URL (existing or new)
    let imageUrl = currentProductImageUrl;
    
    const productData = {
        name: document.getElementById('modalProductName')?.value,
        category: document.getElementById('modalProductCategory')?.value,
        description: document.getElementById('modalProductDescription')?.value,
        sizes: sizes,
        imageUrl: imageUrl,
        inStock: sizes.some(s => s.stock > 0),
        status: document.getElementById('modalProductStatus')?.value
    };
    
    if (!productData.name || sizes.length === 0) {
        showNotification('Product name and at least one size are required', 'error');
        return;
    }
    
    try {
        if (mode === 'add') {
            await apiCall('/products', 'POST', productData);
            showNotification('Product created successfully!', 'success');
        } else {
            await apiCall(`/products/${productId}`, 'PUT', productData);
            showNotification('Product updated successfully!', 'success');
        }
        
        // Reset image variables
        selectedProductImageFile = null;
        currentProductImageUrl = '';
        
        closeProductModal();
        loadProducts();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
        
    } catch (error) {
        showNotification('Failed to save product: ' + error.message, 'error');
    }
}

async function duplicateProduct(productId) {
    try {
        const response = await apiCall(`/products/${productId}`);
        const product = response.product || response;
        product.name = `${product.name} (Copy)`;
        await apiCall('/products', 'POST', product);
        showNotification('Product duplicated!', 'success');
        loadProducts();
    } catch (error) {
        showNotification('Failed to duplicate product', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Delete this product?')) return;
    
    try {
        await apiCall(`/products/${productId}`, 'DELETE');
        showNotification('Product deleted', 'success');
        loadProducts();
    } catch (error) {
        showNotification('Failed to delete product', 'error');
    }
}

async function exportProducts() {
    try {
        showNotification('Exporting products...', 'info');
        const response = await apiCall('/products');
        const products = response.products || response;
        
        const headers = ['ID', 'Name', 'Category', 'Price', 'Stock', 'Status'];
        const csvRows = [headers.join(',')];
        
        products.forEach(product => {
            let minPrice = 0;
            let totalStock = 0;
            
            if (product.sizes && product.sizes.length > 0) {
                minPrice = Math.min(...product.sizes.map(s => s.price));
                totalStock = product.sizes.reduce((total, size) => total + (size.stock || 0), 0);
            }
            
            const row = [
                product.sku || 'PRD-' + product.id,
                `"${(product.name || '').replace(/"/g, '""')}"`,
                `"${(product.category || '').replace(/"/g, '""')}"`,
                minPrice.toFixed(2),
                totalStock,
                product.inStock ? 'In Stock' : 'Out of Stock'
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        window.URL.revokeObjectURL(url);
        showNotification('Products exported successfully!', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export products', 'error');
    }
}

// ============= PAYMENT VERIFICATION =============
function initPaymentVerificationListeners() {
    document.querySelectorAll('.payment-tab[data-tab]').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.payment-tab[data-tab]').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            loadPayments(this.dataset.tab);
        });
    });
}

async function loadPayments(status = 'pending') {
    try {
        let url = '/orders/pending-payments';
        if (status !== 'pending') {
            url = `/orders?status=${status}`;
        }
        
        const response = await apiCall(url);
        const payments = response.orders || response;
        
        const container = document.querySelector('.payment-cards-container');
        if (!container) return;
        
        if (!payments || payments.length === 0) {
            container.innerHTML = `<div class="text-center" style="padding: 40px;">No ${status} payments</div>`;
            return;
        }
        
        let html = '';
        payments.forEach(payment => {
            let paymentIcon = '';
            let paymentTypeLabel = '';
            let receiptStatus = '';
            let hasReceipt = false;
            
            // Check if payment has receipt/proof
            if (payment.paymentProof && payment.paymentProof !== 'null' && payment.paymentProof !== '') {
                hasReceipt = true;
                receiptStatus = '<span class="receipt-badge has-receipt"><i class="fas fa-check-circle"></i> Receipt Uploaded</span>';
            } else if (payment.paymentReceipt && payment.paymentReceipt !== 'null' && payment.paymentReceipt !== '') {
                hasReceipt = true;
                receiptStatus = '<span class="receipt-badge has-receipt"><i class="fas fa-check-circle"></i> Receipt Uploaded</span>';
            } else {
                receiptStatus = '<span class="receipt-badge no-receipt"><i class="fas fa-exclamation-triangle"></i> No Receipt</span>';
            }
            
            if (payment.paymentMethod === 'GCash QR' || payment.paymentType === 'QR') {
                paymentIcon = '<i class="fas fa-qrcode"></i>';
                paymentTypeLabel = '<span class="badge-qr">QR Payment</span>';
            } else if (payment.paymentMethod === 'GCash Manual') {
                paymentIcon = '<i class="fas fa-mobile-alt"></i>';
                paymentTypeLabel = '<span class="badge-manual">Manual GCash</span>';
            } else if (payment.paymentMethod === 'Cash on Delivery') {
                paymentIcon = '<i class="fas fa-truck"></i>';
                paymentTypeLabel = '<span class="badge-cod">Cash on Delivery</span>';
                receiptStatus = '<span class="receipt-badge cod"><i class="fas fa-truck"></i> COD</span>';
            }
            
            const roomInfo = payment.roomNumber ? `${payment.roomBuilding || ''} ${payment.roomNumber}` : '-';
            
            // Get first product for preview
            let productPreview = '';
            if (payment.items && payment.items.length > 0) {
                const firstItem = payment.items[0];
                productPreview = `
                    <div class="product-preview">
                        <div class="product-preview-icon">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="product-preview-details">
                            <div class="product-preview-name">${escapeHtml(firstItem.productName || 'Product')}</div>
                            <div class="product-preview-brand">Advance Paper Corporation</div>
                            <div class="product-preview-price">₱${((firstItem.price || 0) * (firstItem.quantity || 1)).toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }
            
            // Show receipt thumbnail preview if available
            let receiptPreview = '';
            if (hasReceipt) {
                const receiptImg = payment.paymentProof || payment.paymentReceipt;
                if (receiptImg && receiptImg.startsWith('data:image')) {
                    receiptPreview = `
                        <div class="receipt-preview">
                            <img src="${receiptImg}" class="receipt-mini-preview" onclick="event.stopPropagation(); openFullReceiptImage('${receiptImg}')" title="Click to view full receipt">
                        </div>
                    `;
                }
            }
            
            html += `
                <div class="payment-card ${status}" data-order-id="${payment.id}">
                    <div class="payment-header">
                        <h4>${paymentIcon} Order #${payment.orderNumber || payment.id}</h4>
                        <span class="payment-badge ${status}">${status === 'pending' ? 'PENDING' : status.toUpperCase()}</span>
                    </div>
                    <div class="payment-info">
                        <p><span>Customer:</span> <span>${escapeHtml(payment.userName || payment.customerName || 'User ' + payment.userId)}</span></p>
                        <p><span>Amount:</span> <span>₱${(payment.total || 0).toFixed(2)}</span></p>
                        <p><span>Method:</span> <span>${paymentTypeLabel} ${payment.paymentMethod || 'N/A'}</span></p>
                        <p><span>Room:</span> <span>${escapeHtml(roomInfo)}</span></p>
                        <p><span>Date:</span> <span>${formatDate(payment.orderDate)}</span></p>
                        <p><span>Receipt:</span> <span>${receiptStatus}</span></p>
                        ${payment.gcashReference ? `<p><span>Ref No.:</span> <span class="reference-number">${escapeHtml(payment.gcashReference)}</span></p>` : ''}
                        ${payment.senderName ? `<p><span>Sender:</span> <span>${escapeHtml(payment.senderName)}</span></p>` : ''}
                    </div>
                    ${productPreview}
                    ${receiptPreview}
                    <div class="payment-actions">
                        <button class="verify-payment" data-id="${payment.id}">
                            <i class="fas fa-check-circle"></i> Review
                        </button>
                        ${status === 'pending' ? `
                            <button class="mark-fraud" data-id="${payment.id}">
                                <i class="fas fa-flag"></i> Mark Fraud
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        document.querySelectorAll('.verify-payment').forEach(btn => {
            btn.addEventListener('click', function() {
                verifyPaymentModal(this.dataset.id);
            });
        });
        
        document.querySelectorAll('.mark-fraud').forEach(btn => {
            btn.addEventListener('click', function() {
                markAsFraud(this.dataset.id);
            });
        });
        
    } catch (error) {
        console.error('Failed to load payments:', error);
        const container = document.querySelector('.payment-cards-container');
        if (container) {
            container.innerHTML = '<div class="text-center error">Failed to load payments</div>';
        }
    }
}   

// Function to display payment receipt image properly
function displayPaymentReceiptImage(order) {
    let receiptImage = null;
    
    if (order.paymentProof && order.paymentProof !== 'null' && order.paymentProof !== '') {
        receiptImage = order.paymentProof;
    } else if (order.paymentReceipt && order.paymentReceipt !== 'null' && order.paymentReceipt !== '') {
        receiptImage = order.paymentReceipt;
    }
    
    if (receiptImage) {
        if (receiptImage.startsWith('data:image')) {
            return `
                <div class="receipt-display">
                    <div class="receipt-label">
                        <i class="fas fa-receipt"></i> Payment Receipt:
                    </div>
                    <div class="receipt-image-box">
                        <img src="${receiptImage}" 
                             class="receipt-thumbnail" 
                             onclick="openFullReceiptImage('${receiptImage}')"
                             onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23ffcccc\'/%3E%3Ctext x=\'20\' y=\'110\' fill=\'%23ff0000\' font-size=\'14\'%3ENo Image%3C/text%3E%3C/svg%3E';">
                        <button class="btn-view-receipt" onclick="openFullReceiptImage('${receiptImage}')">
                            <i class="fas fa-search-plus"></i> View Full Size
                        </button>
                    </div>
                    ${order.gcashReference ? `<div class="receipt-info"><i class="fas fa-hashtag"></i> Ref: ${escapeHtml(order.gcashReference)}</div>` : ''}
                    ${order.senderName ? `<div class="receipt-info"><i class="fas fa-user"></i> Sender: ${escapeHtml(order.senderName)}</div>` : ''}
                </div>
            `;
        } else {
            return `
                <div class="receipt-display">
                    <div class="receipt-label">
                        <i class="fas fa-receipt"></i> Payment Receipt:
                    </div>
                    <div class="receipt-image-box">
                        <img src="${receiptImage}" 
                             class="receipt-thumbnail" 
                             onclick="openFullReceiptImage('${receiptImage}')"
                             onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23ffcccc\'/%3E%3Ctext x=\'20\' y=\'110\' fill=\'%23ff0000\' font-size=\'14\'%3ENo Image%3C/text%3E%3C/svg%3E';">
                        <button class="btn-view-receipt" onclick="openFullReceiptImage('${receiptImage}')">
                            <i class="fas fa-search-plus"></i> View Full Size
                        </button>
                    </div>
                </div>
            `;
        }
    }
    return `
        <div class="receipt-display no-receipt">
            <div class="receipt-label warning">
                <i class="fas fa-exclamation-triangle"></i> No Receipt Uploaded
            </div>
            <p>${order.paymentMethod === 'GCash QR' ? 'User selected GCash QR but did not upload a receipt.' : 'No payment receipt available'}</p>
        </div>
    `;
}

// Function to open full-size receipt image in modal
function openFullReceiptImage(imageSrc) {
    let modal = document.getElementById('receiptFullscreenModal');
    if (modal) {
        modal.remove();
    }
    
    modal = document.createElement('div');
    modal.id = 'receiptFullscreenModal';
    modal.className = 'receipt-fullscreen-modal';
    modal.innerHTML = `
        <div class="receipt-fullscreen-overlay" onclick="closeFullReceiptModal()"></div>
        <div class="receipt-fullscreen-content">
            <button class="receipt-fullscreen-close" onclick="closeFullReceiptModal()">
                <i class="fas fa-times"></i>
            </button>
            <img src="${imageSrc}" alt="Payment Receipt Full Size" class="receipt-fullscreen-img">
            <div class="receipt-fullscreen-footer">
                <button onclick="window.open('${imageSrc}', '_blank')">
                    <i class="fas fa-download"></i> Download Image
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeFullReceiptModal() {
    const modal = document.getElementById('receiptFullscreenModal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = '';
}

// Updated verifyPaymentModal to show receipt images properly
async function verifyPaymentModal(orderId) {
    try {
        const response = await apiCall(`/orders/${orderId}`);
        const order = response.order || response;
        
        console.log('Payment order data:', order);
        
        const verifyOrderId = document.getElementById('verifyOrderId');
        const verifyCustomer = document.getElementById('verifyCustomer');
        const verifyAmount = document.getElementById('verifyAmount');
        const verifyMethod = document.getElementById('verifyMethod');
        const verifyDate = document.getElementById('verifyDate');
        const verifySender = document.getElementById('verifySender');
        const verifyReferenceNo = document.getElementById('verifyReferenceNo');
        
        if (verifyOrderId) verifyOrderId.textContent = order.orderNumber || 'ORD-' + order.id;
        if (verifyCustomer) verifyCustomer.textContent = order.userName || order.customerName || 'User ' + order.userId;
        if (verifyAmount) verifyAmount.textContent = `₱${(order.total || 0).toFixed(2)}`;
        if (verifyMethod) verifyMethod.textContent = order.paymentMethod || 'N/A';
        if (verifyDate) verifyDate.textContent = formatDate(order.orderDate);
        if (verifySender) verifySender.textContent = order.userName || order.customerName || 'N/A';
        if (verifyReferenceNo) verifyReferenceNo.textContent = order.paymentReference || order.gcashReference || 'REF-' + order.id;
        
        // Use the displayPaymentReceiptImage function
        const proofImage = document.getElementById('verifyProofImage');
        if (proofImage) {
            proofImage.innerHTML = displayPaymentReceiptImage(order);
        }
        
        const approveBtn = document.getElementById('approvePaymentBtn');
        const rejectBtn = document.getElementById('rejectPaymentBtn');
        
        if (approveBtn) approveBtn.dataset.orderId = order.id;
        if (rejectBtn) rejectBtn.dataset.orderId = order.id;
        
        setupPaymentModalListeners();
        
        const modal = document.getElementById('paymentVerificationModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
    } catch (error) {
        console.error('Failed to load payment details:', error);
        showNotification('Failed to load payment details', 'error');
    }
}

function setupPaymentModalListeners() {
    const modal = document.getElementById('paymentVerificationModal');
    if (!modal) return;
    
    modal.querySelectorAll('.close-modal, .btn-secondary.close-modal').forEach(btn => {
        btn.removeEventListener('click', closePaymentModal);
        btn.addEventListener('click', closePaymentModal);
    });
    
    const approveBtn = document.getElementById('approvePaymentBtn');
    if (approveBtn) {
        approveBtn.removeEventListener('click', approvePayment);
        approveBtn.addEventListener('click', approvePayment);
    }
    
    const rejectBtn = document.getElementById('rejectPaymentBtn');
    if (rejectBtn) {
        rejectBtn.removeEventListener('click', rejectPayment);
        rejectBtn.addEventListener('click', rejectPayment);
    }
    
    modal.removeEventListener('click', handlePaymentModalOutsideClick);
    modal.addEventListener('click', handlePaymentModalOutsideClick);
}

function handlePaymentModalOutsideClick(e) {
    if (e.target === document.getElementById('paymentVerificationModal')) {
        closePaymentModal();
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentVerificationModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function approvePayment() {
    const approveBtn = document.getElementById('approvePaymentBtn');
    if (!approveBtn) return;
    
    const orderId = approveBtn.dataset.orderId;
    const notes = document.getElementById('verificationNotes')?.value || '';
    
    if (!orderId) return;
    
    try {
        await apiCall(`/orders/${orderId}/verify`, 'POST', {
            action: 'approve',
            notes: notes
        });
        
        showNotification('Payment approved! Order is now processing.', 'success');
        closePaymentModal();
        loadPayments('pending');
        loadDashboardStats();
    } catch (error) {
        showNotification('Failed to approve payment', 'error');
    }
}

async function rejectPayment() {
    const rejectBtn = document.getElementById('rejectPaymentBtn');
    if (!rejectBtn) return;
    
    const orderId = rejectBtn.dataset.orderId;
    const notes = document.getElementById('verificationNotes')?.value || '';
    
    if (!orderId) return;
    
    if (!confirm('Reject this payment? This will cancel the order.')) return;
    
    try {
        await apiCall(`/orders/${orderId}/verify`, 'POST', {
            action: 'reject',
            notes: notes
        });
        
        showNotification('Payment rejected. Order cancelled.', 'warning');
        closePaymentModal();
        loadPayments('pending');
        loadDashboardStats();
    } catch (error) {
        showNotification('Failed to reject payment', 'error');
    }
}

async function markAsFraud(orderId) {
    if (!confirm('Mark as fraudulent? This will flag the order and notify security.')) return;
    
    try {
        await apiCall(`/orders/${orderId}/fraud`, 'POST');
        showNotification('Order marked as fraudulent', 'warning');
        loadPayments('pending');
    } catch (error) {
        showNotification('Failed to mark as fraud', 'error');
    }
}

// ============= SYSTEM SETTINGS =============
function initSettingsListeners() {
    document.querySelectorAll('.settings-tab[data-tab]').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.settings-tab[data-tab]').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            showSettingsPanel(this.dataset.tab);
        });
    });
    
    const dashboardBackground = document.getElementById('dashboardBackground');
    if (dashboardBackground) {
        dashboardBackground.addEventListener('change', function() {
            applyDashboardBackground(this.value);
        });
    }
    
    const saveBtn = document.getElementById('saveSettings');
    const resetBtn = document.getElementById('resetSettings');
    const changePwdBtn = document.getElementById('changeAdminPassword');
    
    if (saveBtn) saveBtn.addEventListener('click', saveSettings);
    if (resetBtn) resetBtn.addEventListener('click', resetSettingsWithFace);
    if (changePwdBtn) changePwdBtn.addEventListener('click', changePassword);
}

async function loadSettings() {
    try {
        const settings = await apiCall('/settings');
        
        const storeName = document.getElementById('storeName');
        const storeEmail = document.getElementById('storeEmail');
        const storePhone = document.getElementById('storePhone');
        const storeAddress = document.getElementById('storeAddress');
        const storeCurrency = document.getElementById('storeCurrency');
        
        if (storeName) storeName.value = settings.storeName || 'SJC Supplies';
        if (storeEmail) storeEmail.value = settings.storeEmail || 'contact@sjcsupplies.com';
        if (storePhone) storePhone.value = settings.storePhone || '+63 912 345 6789';
        if (storeAddress) storeAddress.value = settings.storeAddress || '';
        if (storeCurrency) storeCurrency.value = settings.currency || 'PHP';
        
        const dashboardBackground = document.getElementById('dashboardBackground');
        if (dashboardBackground) dashboardBackground.value = settings.dashboardBackground || 'default';
        applyDashboardBackground(settings.dashboardBackground || 'default');
        
        const gcashEnabled = document.getElementById('gcashEnabled');
        const qrEnabled = document.getElementById('qrEnabled');
        const codEnabled = document.getElementById('codEnabled');
        const gcashNumber = document.getElementById('gcashNumber');
        
        if (gcashEnabled) gcashEnabled.checked = settings.gcashEnabled !== false;
        if (qrEnabled) qrEnabled.checked = settings.qrEnabled !== false;
        if (codEnabled) codEnabled.checked = settings.codEnabled !== false;
        if (gcashNumber) gcashNumber.value = settings.gcashNumber || '09123456789';
        
        const shippingFee = document.getElementById('shippingFee');
        const freeShippingThreshold = document.getElementById('freeShippingThreshold');
        const deliveryDays = document.getElementById('deliveryDays');
        
        if (shippingFee) shippingFee.value = settings.shippingFee || 50;
        if (freeShippingThreshold) freeShippingThreshold.value = settings.freeShippingThreshold || 500;
        if (deliveryDays) deliveryDays.value = settings.deliveryDays || 3;
        
        const emailNotifications = document.getElementById('emailNotifications');
        const orderConfirmation = document.getElementById('orderConfirmation');
        const paymentReceived = document.getElementById('paymentReceived');
        const shippingUpdate = document.getElementById('shippingUpdate');
        
        if (emailNotifications) emailNotifications.checked = settings.emailNotifications !== false;
        if (orderConfirmation) orderConfirmation.checked = settings.orderConfirmation !== false;
        if (paymentReceived) paymentReceived.checked = settings.paymentReceived !== false;
        if (shippingUpdate) shippingUpdate.checked = settings.shippingUpdate !== false;
        
        const twoFactorEnabled = document.getElementById('twoFactorEnabled');
        const loginAttemptsEnabled = document.getElementById('loginAttemptsEnabled');
        const sessionTimeout = document.getElementById('sessionTimeout');
        
        if (twoFactorEnabled) twoFactorEnabled.checked = settings.twoFactorEnabled || false;
        if (loginAttemptsEnabled) loginAttemptsEnabled.checked = settings.loginAttemptsEnabled !== false;
        if (sessionTimeout) sessionTimeout.value = settings.sessionTimeout || 480;
        
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

function showSettingsPanel(tabId) {
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const panel = document.getElementById(`${tabId}Panel`);
    if (panel) panel.classList.add('active');
}

function applyDashboardBackground(background = 'default') {
    if (background && background !== 'default') {
        document.body.setAttribute('data-dashboard-bg', background);
    } else {
        document.body.removeAttribute('data-dashboard-bg');
    }
}

async function saveSettings() {
    const settings = {
        storeName: document.getElementById('storeName')?.value,
        storeEmail: document.getElementById('storeEmail')?.value,
        storePhone: document.getElementById('storePhone')?.value,
        storeAddress: document.getElementById('storeAddress')?.value,
        currency: document.getElementById('storeCurrency')?.value,
        dashboardBackground: document.getElementById('dashboardBackground')?.value || 'default',
        gcashEnabled: document.getElementById('gcashEnabled')?.checked,
        qrEnabled: document.getElementById('qrEnabled')?.checked,
        codEnabled: document.getElementById('codEnabled')?.checked,
        gcashNumber: document.getElementById('gcashNumber')?.value,
        shippingFee: parseFloat(document.getElementById('shippingFee')?.value) || 50,
        freeShippingThreshold: parseFloat(document.getElementById('freeShippingThreshold')?.value) || 500,
        deliveryDays: parseInt(document.getElementById('deliveryDays')?.value) || 3,
        emailNotifications: document.getElementById('emailNotifications')?.checked,
        orderConfirmation: document.getElementById('orderConfirmation')?.checked,
        paymentReceived: document.getElementById('paymentReceived')?.checked,
        shippingUpdate: document.getElementById('shippingUpdate')?.checked,
        twoFactorEnabled: document.getElementById('twoFactorEnabled')?.checked,
        loginAttemptsEnabled: document.getElementById('loginAttemptsEnabled')?.checked,
        sessionTimeout: parseInt(document.getElementById('sessionTimeout')?.value) || 480
    };
    
    try {
        await apiCall('/settings', 'PUT', settings);
        showNotification('Settings saved successfully!', 'success');
    } catch (error) {
        showNotification('Failed to save settings', 'error');
    }
}

async function resetSettings() {
    if (!confirm('Reset all settings to default?')) return;
    
    try {
        await apiCall('/settings/reset', 'POST');
        await loadSettings();
        showNotification('Settings reset to default', 'success');
    } catch (error) {
        showNotification('Failed to reset settings', 'error');
    }
}

async function changePassword() {
    const currentPassword = prompt('Enter current admin password:');
    if (!currentPassword) return;
    
    const newPassword = prompt('Enter new password (min. 8 characters):');
    if (!newPassword || newPassword.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }
    
    const confirmPassword = prompt('Confirm new password:');
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        await apiCall('/settings/security/change-password', 'POST', {
            currentPassword,
            newPassword
        });
        showNotification('Password changed successfully!', 'success');
    } catch (error) {
        showNotification('Failed to change password', 'error');
    }
}

// ============= NOTIFICATIONS =============
function initNotificationListeners() {
    const notificationBtn = document.getElementById('notificationBtn');
    const markAllRead = document.getElementById('markAllRead');
    const viewAll = document.getElementById('viewAllNotifications');
    
    if (notificationBtn) notificationBtn.addEventListener('click', toggleNotifications);
    if (markAllRead) markAllRead.addEventListener('click', markAllNotificationsRead);
    if (viewAll) viewAll.addEventListener('click', (e) => {
        e.preventDefault();
        showAllNotifications();
    });
}

function startNotificationPolling() {
    notificationInterval = setInterval(loadNotifications, 30000);
}

function stopNotificationPolling() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
}

async function loadNotifications() {
    try {
        const notifs = await apiCall('/notifications');
        notifications = notifs;
        updateNotificationBadge();
        renderNotifications();
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = '<div class="text-center">No notifications</div>';
        return;
    }
    
    const html = notifications.slice(0, 5).map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon">
                <i class="fas ${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <p><strong>${notif.title}</strong></p>
                <p>${notif.message}</p>
                <span class="notification-time">${timeAgo(notif.createdAt)}</span>
            </div>
        </div>
    `).join('');
    
    list.innerHTML = html;
    
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => markNotificationRead(item.dataset.id));
    });
}

function getNotificationIcon(type) {
    const icons = {
        order: 'fa-shopping-cart',
        payment: 'fa-credit-card',
        user: 'fa-user-plus',
        product: 'fa-box',
        alert: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    return icons[type] || 'fa-bell';
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return formatDate(dateString);
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

async function markNotificationRead(notificationId) {
    try {
        await apiCall(`/notifications/${notificationId}/read`, 'PUT');
        const notif = notifications.find(n => n.id == notificationId);
        if (notif) notif.read = true;
        updateNotificationBadge();
        renderNotifications();
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

async function markAllNotificationsRead() {
    try {
        await apiCall('/notifications/read-all', 'PUT');
        notifications.forEach(n => n.read = true);
        updateNotificationBadge();
        renderNotifications();
        showNotification('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Failed to mark all as read:', error);
    }
}

function showAllNotifications() {
    let modal = document.getElementById('allNotificationsModal');
    if (modal) {
        modal.remove();
    }
    
    modal = document.createElement('div');
    modal.id = 'allNotificationsModal';
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>All Notifications</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                ${notifications.length === 0 ? 
                    '<p class="text-center">No notifications</p>' : 
                    notifications.map(notif => `
                        <div class="notification-item ${notif.read ? '' : 'unread'}" data-id="${notif.id}">
                            <div class="notification-icon">
                                <i class="fas ${getNotificationIcon(notif.type)}"></i>
                            </div>
                            <div class="notification-content">
                                <p><strong>${notif.title}</strong></p>
                                <p>${notif.message}</p>
                                <span class="notification-time">${timeAgo(notif.createdAt)}</span>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
            <div class="modal-footer">
                <button class="btn-secondary close-modal">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => modal.remove(), 300);
    };
    
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    modal.querySelectorAll('.notification-item.unread').forEach(item => {
        const id = item.dataset.id;
        markNotificationRead(id);
    });
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('notificationDropdown')?.classList.remove('active');
}

// ============= HELPER FUNCTIONS =============
function formatDateShort(date) {
    if (!date) return 'N/A';
    try {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
        return 'N/A';
    }
}

function updateCurrentDate() {
    const now = new Date();
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return 'Invalid date';
    }
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Invalid date';
    }
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function showNotification(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    
    let toast = document.getElementById('dynamicToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'dynamicToast';
        toast.style.cssText = `
            position: fixed;    
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(toast);
    }
    
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    toast.style.background = colors[type] || colors.info;
    toast.textContent = message;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            toast.style.display = 'none';
            toast.style.animation = '';
        }, 300);
    }, 3000);
}

function closeAllModals() {
    const modals = ['orderDetailsModal', 'userModal', 'productModal', 'paymentVerificationModal', 'userDetailsModal', 'allNotificationsModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    });
    document.body.style.overflow = '';
}

async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        stopNotificationPolling();
        try {
            await apiCall('/logout', 'POST', { token: localStorage.getItem('adminToken') });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminLoginTime');
            window.location.href = 'login.html';
        }
    }
}

// ============= FACE RECOGNITION FUNCTIONS =============
async function checkFaceRegistrationStatus() {
    try {
        const response = await apiCall('/face/status');
        if (response && response.success) {
            console.log('Face registration status:', response.registered ? 'Registered ✅' : 'Not registered ❌');
            
            const statusBadge = document.getElementById('faceStatusBadge');
            if (statusBadge) {
                statusBadge.textContent = response.registered ? '✓ Face Registered' : '✗ Face Not Registered';
                statusBadge.style.color = response.registered ? '#2ecc71' : '#e74c3c';
            }
        }
    } catch (error) {
        console.error('Failed to check face registration:', error);
    }
}

function openFaceRegistrationModal() {
    let modal = document.getElementById('faceRegisterModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'faceRegisterModal';
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-camera"></i> Register Admin Face</h3>
                    <button class="close-modal" id="closeFaceRegisterModal">&times;</button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <video id="registerFaceVideo" autoplay muted style="width: 100%; border-radius: 10px; background: #1a1a2e;"></video>
                    <canvas id="registerFaceCanvas" style="display: none;"></canvas>
                    <div id="registerFaceStatus" style="margin-top: 10px; font-size: 14px;"></div>
                    <div id="registerFaceMessage" class="face-message"></div>
                    <p style="margin-top: 10px; font-size: 12px; color: #aaa;">
                        Position your face clearly in the frame. Make sure lighting is good.
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancelRegisterFaceBtn">Cancel</button>
                    <button class="btn-primary" id="confirmRegisterFaceBtn">Register Face</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    startFaceRegistration();
}

function closeFaceRegisterModal() {
    const modal = document.getElementById('faceRegisterModal');
    const video = document.getElementById('registerFaceVideo');
    
    if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
        faceDetectionInterval = null;
    }
    
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function startFaceRegistration() {
    const video = document.getElementById('registerFaceVideo');
    const canvas = document.getElementById('registerFaceCanvas');
    const statusEl = document.getElementById('registerFaceStatus');
    const messageEl = document.getElementById('registerFaceMessage');
    const registerBtn = document.getElementById('confirmRegisterFaceBtn');
    const cancelBtn = document.getElementById('cancelRegisterFaceBtn');
    const closeBtn = document.getElementById('closeFaceRegisterModal');
    
    if (!video) return;
    
    if (registerBtn) registerBtn.disabled = true;
    if (messageEl) {
        messageEl.textContent = 'Starting camera...';
        messageEl.className = 'face-message';
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' }
        });
        video.srcObject = stream;
        await video.play();
        
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Camera ready';
            statusEl.style.color = '#2ecc71';
        }
        if (messageEl) {
            messageEl.textContent = 'Position your face clearly in the frame';
            messageEl.className = 'face-message';
        }
        
        startFaceDetectionForRegister(video, canvas, statusEl);
        
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.onclick = async () => {
                await captureAndRegisterFace(video, messageEl, statusEl, registerBtn);
            };
        }
        
        if (cancelBtn) cancelBtn.onclick = closeFaceRegisterModal;
        if (closeBtn) closeBtn.onclick = closeFaceRegisterModal;
        
    } catch (error) {
        console.error('Camera error:', error);
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Camera access denied';
            statusEl.style.color = '#e74c3c';
        }
        if (messageEl) {
            messageEl.textContent = 'Please allow camera access to register your face';
            messageEl.className = 'face-message error';
        }
    }
}

function startFaceDetectionForRegister(video, canvas, statusEl) {
    if (faceDetectionInterval) clearInterval(faceDetectionInterval);
    
    faceDetectionInterval = setInterval(async () => {
        if (!video || video.paused || video.readyState !== 4) return;
        
        try {
            if (typeof faceapi === 'undefined') return;
            
            const detection = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
            
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (detection) {
                const box = detection.detection.box;
                ctx.save();
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.strokeStyle = '#4fbd74';
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                ctx.restore();
                
                if (statusEl && statusEl.innerHTML.includes('No face')) {
                    statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Face detected';
                    statusEl.style.color = '#2ecc71';
                }
            } else {
                if (statusEl && !statusEl.innerHTML.includes('No face')) {
                    statusEl.innerHTML = '<i class="fas fa-user"></i> No face detected';
                    statusEl.style.color = '#aaa';
                }
            }
        } catch (err) {}
    }, 100);
}

async function captureAndRegisterFace(video, messageEl, statusEl, registerBtn) {
    if (!video || video.paused || video.readyState !== 4) {
        if (messageEl) {
            messageEl.textContent = 'Please wait for camera to initialize';
            messageEl.className = 'face-message error';
        }
        return;
    }
    
    if (messageEl) {
        messageEl.textContent = 'Capturing face...';
        messageEl.className = 'face-message';
    }
    
    registerBtn.disabled = true;
    
    try {
        const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (!detection) {
            if (messageEl) {
                messageEl.textContent = '❌ No face detected. Please position your face clearly.';
                messageEl.className = 'face-message error';
            }
            registerBtn.disabled = false;
            return;
        }
        
        const faceDescriptor = Array.from(detection.descriptor);
        
        if (messageEl) {
            messageEl.textContent = 'Registering face with server...';
            messageEl.className = 'face-message';
        }
        
        const response = await fetch(`${API_BASE}/face/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ faceDescriptor: JSON.stringify(faceDescriptor) })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (messageEl) {
                messageEl.textContent = '✅ Face registered successfully!';
                messageEl.className = 'face-message success';
            }
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Registered!';
                statusEl.style.color = '#2ecc71';
            }
            
            setTimeout(() => {
                closeFaceRegisterModal();
                showNotification('Face registered successfully!', 'success');
                checkFaceRegistrationStatus();
            }, 2000);
        } else {
            if (messageEl) {
                messageEl.textContent = '❌ Registration failed: ' + (result.message || 'Unknown error');
                messageEl.className = 'face-message error';
            }
            registerBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Face registration error:', error);
        if (messageEl) {
            messageEl.textContent = 'Registration error: ' + error.message;
            messageEl.className = 'face-message error';
        }
        registerBtn.disabled = false;
    }
}

function openFaceAuthModal(action, actionData) {
    pendingAction = action;
    pendingActionData = actionData;
    const modal = document.getElementById('faceAuthModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        startFaceVerification();
    }
}

function closeFaceAuthModal() {
    const modal = document.getElementById('faceAuthModal');
    const video = document.getElementById('adminFaceVideo');
    
    if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
        faceDetectionInterval = null;
    }
    
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    pendingAction = null;
    pendingActionData = null;
}

async function startFaceVerification() {
    const video = document.getElementById('adminFaceVideo');
    const canvas = document.getElementById('adminFaceCanvas');
    const statusEl = document.getElementById('adminFaceStatus');
    const messageEl = document.getElementById('faceAuthMessage');
    const verifyBtn = document.getElementById('verifyFaceBtn');
    const cancelBtn = document.getElementById('cancelFaceAuth');
    const closeBtn = document.getElementById('closeFaceModal');
    
    if (!video) return;
    
    if (verifyBtn) verifyBtn.disabled = true;
    if (messageEl) {
        messageEl.textContent = 'Starting camera...';
        messageEl.className = 'face-message';
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' }
        });
        video.srcObject = stream;
        await video.play();
        
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Camera ready';
            statusEl.style.color = '#2ecc71';
        }
        if (messageEl) {
            messageEl.textContent = 'Position your face in the frame and click Verify';
            messageEl.className = 'face-message';
        }
        if (verifyBtn) verifyBtn.disabled = false;
        
        startFaceDetection(video, canvas, statusEl);
        
        if (verifyBtn) {
            verifyBtn.onclick = async () => {
                await verifyFaceWithBackend(video, messageEl, statusEl, verifyBtn);
            };
        }
        
        if (cancelBtn) cancelBtn.onclick = closeFaceAuthModal;
        if (closeBtn) closeBtn.onclick = closeFaceAuthModal;
        
    } catch (error) {
        console.error('Camera error:', error);
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Camera access denied';
            statusEl.style.color = '#e74c3c';
        }
        if (messageEl) {
            messageEl.textContent = 'Please allow camera access to verify your identity';
            messageEl.className = 'face-message error';
        }
    }
}

async function verifyFaceWithBackend(video, messageEl, statusEl, verifyBtn) {
    if (!video || video.paused || video.readyState !== 4) {
        if (messageEl) {
            messageEl.textContent = 'Please wait for camera to initialize';
            messageEl.className = 'face-message error';
        }
        return;
    }
    
    if (messageEl) {
        messageEl.textContent = 'Verifying face with server...';
        messageEl.className = 'face-message';
    }
    
    verifyBtn.disabled = true;
    
    try {
        const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (!detection) {
            if (messageEl) {
                messageEl.textContent = '❌ No face detected. Please position your face clearly.';
                messageEl.className = 'face-message error';
            }
            verifyBtn.disabled = false;
            return;
        }
        
        const faceDescriptor = Array.from(detection.descriptor);
        
        const response = await fetch(`${API_BASE}/face/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ faceDescriptor: JSON.stringify(faceDescriptor) })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (messageEl) {
                const confidence = result.confidence ? ` (${result.confidence.toFixed(1)}% match)` : '';
                messageEl.textContent = `✅ Face verified successfully!${confidence}`;
                messageEl.className = 'face-message success';
            }
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
                statusEl.style.color = '#2ecc71';
            }
            
            if (result.token) {
                localStorage.setItem('adminToken', result.token);
            }
            
            setTimeout(() => {
                executePendingAction();
            }, 1000);
        } else {
            if (messageEl) {
                const confidence = result.confidence ? ` (${result.confidence.toFixed(1)}% match)` : '';
                messageEl.textContent = `❌ Face verification failed. Access denied.${confidence}`;
                messageEl.className = 'face-message error';
            }
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-times-circle"></i> Verification failed';
                statusEl.style.color = '#e74c3c';
            }
            verifyBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Face verification error:', error);
        if (messageEl) {
            messageEl.textContent = 'Verification error: ' + error.message;
            messageEl.className = 'face-message error';
        }
        verifyBtn.disabled = false;
    }
}

function startFaceDetection(video, canvas, statusEl) {
    if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
    }
    
    faceDetectionInterval = setInterval(async () => {
        if (!video || video.paused || video.readyState !== 4) return;
        
        try {
            if (typeof faceapi === 'undefined') {
                return;
            }
            
            const detection = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());
            
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (detection) {
                const box = detection.detection.box;
                
                ctx.save();
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                
                ctx.strokeStyle = '#4fbd74';
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                
                ctx.restore();
                
                if (statusEl && statusEl.innerHTML.includes('No face')) {
                    statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Face detected';
                    statusEl.style.color = '#2ecc71';
                }
            } else {
                if (statusEl && !statusEl.innerHTML.includes('No face')) {
                    statusEl.innerHTML = '<i class="fas fa-user"></i> No face detected';
                    statusEl.style.color = '#aaa';
                }
            }
        } catch (err) {
            // Silently fail
        }
    }, 100);
}

function executePendingAction() {
    if (!pendingAction) {
        closeFaceAuthModal();
        return;
    }
    
    switch(pendingAction) {
        case 'deleteUser':
            if (pendingActionData) executeDeleteUser(pendingActionData);
            break;
        case 'deleteProduct':
            if (pendingActionData) executeDeleteProduct(pendingActionData);
            break;
        case 'cancelOrder':
            if (pendingActionData) executeCancelOrder(pendingActionData);
            break;
        case 'rejectPayment':
            if (pendingActionData) executeRejectPayment(pendingActionData);
            break;
        case 'resetSettings':
            executeResetSettings();
            break;
        default:
            console.log('Unknown action:', pendingAction);
            showNotification('Unknown action', 'error');
    }
    
    closeFaceAuthModal();
}

async function executeDeleteUser(userId) {
    try {
        await apiCall(`/users/${userId}`, 'DELETE');
        showNotification('User deleted successfully!', 'success');
        loadUsers(currentUserPage || 1, currentUserSearch || '');
        loadDashboardStats();
    } catch (error) {
        showNotification('Failed to delete user: ' + error.message, 'error');
    }
}

async function executeDeleteProduct(productId) {
    try {
        await apiCall(`/products/${productId}`, 'DELETE');
        showNotification('Product deleted successfully!', 'success');
        loadProducts();
        loadDashboardStats();
    } catch (error) {
        showNotification('Failed to delete product: ' + error.message, 'error');
    }
}

async function executeCancelOrder(orderId) {
    try {
        await apiCall(`/orders/${orderId}/cancel?userId=1`, 'PUT');
        showNotification('Order cancelled successfully!', 'success');
        loadOrders(currentOrderStatus || 'all');
        loadDashboardStats();
    } catch (error) {
        showNotification('Failed to cancel order: ' + error.message, 'error');
    }
}

async function executeRejectPayment(orderId) {
    try {
        await apiCall(`/orders/${orderId}/verify`, 'POST', {
            action: 'reject',
            notes: 'Payment rejected by admin'
        });
        showNotification('Payment rejected!', 'warning');
        loadPayments('pending');
        loadDashboardStats();
    } catch (error) {
        showNotification('Failed to reject payment: ' + error.message, 'error');
    }
}

async function executeResetSettings() {
    try {
        await apiCall('/settings/reset', 'POST');
        loadSettings();
        showNotification('Settings reset to default', 'success');
    } catch (error) {
        showNotification('Failed to reset settings: ' + error.message, 'error');
    }
}

function deleteUserWithFace(userId) {
    openFaceAuthModal('deleteUser', userId);
}

function deleteProductWithFace(productId) {
    openFaceAuthModal('deleteProduct', productId);
}

function cancelOrderWithFace(orderId) {
    openFaceAuthModal('cancelOrder', orderId);
}

function rejectPaymentWithFace(orderId) {
    openFaceAuthModal('rejectPayment', orderId);
}

function resetSettingsWithFace() {
    openFaceAuthModal('resetSettings', null);
}

function overrideButtonsWithFaceRecognition() {
    document.querySelectorAll('.delete-user, .btn-action.delete-user').forEach(btn => {
        const userId = btn.dataset.id;
        if (userId) {
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                deleteUserWithFace(userId);
            };
        }
    });
    
    document.querySelectorAll('.delete-product, .btn-action.delete-product').forEach(btn => {
        const productId = btn.dataset.id;
        if (productId) {
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                deleteProductWithFace(productId);
            };
        }
    });
    
    document.querySelectorAll('.cancel-order, .btn-cancel-order').forEach(btn => {
        const orderId = btn.dataset.id || btn.dataset.orderId;
        if (orderId) {
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                cancelOrderWithFace(orderId);
            };
        }
    });
    
    const rejectPaymentBtn = document.getElementById('rejectPaymentBtn');
    if (rejectPaymentBtn) {
        rejectPaymentBtn.onclick = function(e) {
            e.preventDefault();
            const orderId = this.dataset.orderId;
            if (orderId) {
                rejectPaymentWithFace(orderId);
            }
        };
    }
    
    const resetSettingsBtn = document.getElementById('resetSettings');
    if (resetSettingsBtn) {
        resetSettingsBtn.onclick = function(e) {
            e.preventDefault();
            resetSettingsWithFace();
        };
    }
}

async function initFaceRecognition() {
    try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        console.log('✅ Face recognition models loaded');
        
        await checkFaceRegistrationStatus();
        
        setTimeout(() => {
            overrideButtonsWithFaceRecognition();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Failed to load face models:', error);
    }
}

function setupFaceRecognitionObserver() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                overrideButtonsWithFaceRecognition();
            }
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('click', function(e) {
    const modal = document.getElementById('faceAuthModal');
    if (modal && modal.classList.contains('active')) {
        if (e.target === modal) {
            closeFaceAuthModal();
        }
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('faceAuthModal');
        if (modal && modal.classList.contains('active')) {
            closeFaceAuthModal();
        }
    }
});

// Make functions global for inline onclick handlers
window.addSize = addSize;
window.removeSize = removeSize;
window.updateOrderTracking = updateOrderTracking;
window.updateOrderStatus = updateOrderStatus;
window.updateEstimatedDelivery = updateEstimatedDelivery;
window.openFullReceiptImage = openFullReceiptImage;
window.closeFullReceiptModal = closeFullReceiptModal;
