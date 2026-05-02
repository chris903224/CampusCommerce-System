        // ============================================
        // DASHBOARD.JS - COMPLETE FIXED VERSION
        // ============================================

        // ============================================
        // ENSURE TOKEN IS INCLUDED IN ALL REQUESTS
        // ============================================

        // Get token from localStorage or URL parameter
        let token = localStorage.getItem('authToken') || 'bypass-token';
        let userRole = localStorage.getItem('userRole') || 'USER';

        // Get userId from localStorage (set during login)
        let userId = localStorage.getItem('userId') || null;

        console.log('🔐 Auth initialized');
        console.log('👤 User Role:', userRole);
        console.log('🆔 User ID:', userId);

        // ============================================
        // API Configuration
        // ============================================
        const isNgrok = window.location.hostname.includes('ngrok-free.dev');
        const API_BASE_URL = isNgrok 
            ? 'https://localhost:8080/api'
            : '/api';

        console.log('🔧 API_BASE_URL:', API_BASE_URL);
        console.log('🌐 Current Host:', window.location.hostname);

        // ============================================
        // Application State
        // ============================================
        const appState = {
            currentPage: 'home',
            cart: [],
            orders: [],
            selectedProduct: null,
            selectedSize: null,
            darkMode: localStorage.getItem('theme') === 'dark', // FIXED: Load from localStorage
            user: {
                id: userId ? parseInt(userId) : null,
                name: localStorage.getItem('userName') || localStorage.getItem('profile_fullName') || 'User',
                email: localStorage.getItem('userEmail') || localStorage.getItem('profile_email') || 'user@example.com',
                phone: ''
            },
            products: [],
            selectedPaymentMethod: null,
            tempPaymentReceiptDataURL: null,
            currentPaymentSourceId: null,
            paymentPollingInterval: null
        };

        // For order filtering
        let currentOrderStatus = 'all';

        // Category mapping
        const CATEGORY_MAP = {
            'paper': 'Paper Products',
            'writing': 'Writing Tools',
            'coloring': 'Coloring Materials',
            'storage': 'Storage & Organization'
        };

        // ============================================
        // ROOM CONFIGURATION DATA
        // ============================================
        const roomConfig = {
            "Phinma Hall": { prefix: "PH" },
            "Dimasalang Hall": { prefix: "DH" },
            "Silang Hall": { prefix: "S" }
        };

        // Generate all rooms for a building
        function generateAllRooms(prefix) {
            const rooms = [];
            for (let floor = 2; floor <= 7; floor++) {
                for (let roomNum = 1; roomNum <= 21; roomNum++) {
                    const roomNumber = `${prefix}${floor}${roomNum.toString().padStart(2, '0')}`;
                    rooms.push(roomNumber);
                }
            }
            return rooms;
        }

        function populateRoomsByBuilding(selectedBuilding, roomSelectElement) {
            if (!roomSelectElement) return;
            
            roomSelectElement.innerHTML = '<option value="">Select Room</option>';
            
            if (!selectedBuilding || !roomConfig[selectedBuilding]) {
                roomSelectElement.disabled = true;
                return;
            }
            
            const buildingConfig = roomConfig[selectedBuilding];
            const allRooms = generateAllRooms(buildingConfig.prefix);
            
            allRooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room;
                option.textContent = room;
                roomSelectElement.appendChild(option);
            });
            
            roomSelectElement.disabled = false;
        }

        // ============================================
        // DARK MODE FUNCTIONS (FIXED - Persists after refresh)
        // ============================================
        function initDarkMode() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                appState.darkMode = true;
                document.body.setAttribute('data-theme', 'dark');
                updateThemeIcon();
            } else {
                appState.darkMode = false;
                document.body.removeAttribute('data-theme');
                updateThemeIcon();
            }
        }

        function toggleDarkMode() {
            appState.darkMode = !appState.darkMode;
            if (appState.darkMode) {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            }
            updateThemeIcon();
        }

        function updateThemeIcon() {
            const icon = document.querySelector('#themeToggle i');
            if (icon) {
                icon.className = appState.darkMode ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        // ============================================
        // CHANGE PASSWORD FUNCTIONALITY (FIXED)
        // ============================================

        function initPasswordStrengthMeter() {
            const newPasswordInput = document.getElementById('newPassword');
            if (!newPasswordInput) return;
            
            const requirements = {
                length: document.getElementById('req-length'),
                uppercase: document.getElementById('req-upper'),
                number: document.getElementById('req-number'),
                special: document.getElementById('req-special')
            };
            
            const strengthSegments = {
                seg1: document.getElementById('pwSeg1'),
                seg2: document.getElementById('pwSeg2'),
                seg3: document.getElementById('pwSeg3'),
                seg4: document.getElementById('pwSeg4')
            };
            
            const strengthLabel = document.getElementById('pwStrengthLabel');
            
            function checkPasswordStrength(password) {
                let strength = 0;
                let met = { length: false, uppercase: false, number: false, special: false };
                
                if (password.length >= 8) {
                    met.length = true;
                    strength++;
                }
                
                if (/[A-Z]/.test(password)) {
                    met.uppercase = true;
                    strength++;
                }
                
                if (/[0-9]/.test(password)) {
                    met.number = true;
                    strength++;
                }
                
                if (/[^A-Za-z0-9]/.test(password)) {
                    met.special = true;
                    strength++;
                }
                
                for (const [key, element] of Object.entries(requirements)) {
                    if (element) {
                        if (met[key]) {
                            element.classList.add('valid');
                        } else {
                            element.classList.remove('valid');
                        }
                    }
                }
                
                const strengthLevels = ['Weak', 'Fair', 'Good', 'Strong'];
                const strengthColors = ['#ff4444', '#ffaa44', '#ffff44', '#44ff44'];
                
                for (let i = 0; i < 4; i++) {
                    if (strengthSegments[`seg${i+1}`]) {
                        if (i < strength) {
                            strengthSegments[`seg${i+1}`].style.backgroundColor = strengthColors[i] || '#44ff44';
                        } else {
                            strengthSegments[`seg${i+1}`].style.backgroundColor = '#e0e0e0';
                        }
                    }
                }
                
                if (strengthLabel) {
                    if (password.length === 0) {
                        strengthLabel.textContent = 'Enter a new password';
                    } else {
                        strengthLabel.textContent = strengthLevels[strength - 1] || 'Weak';
                        strengthLabel.style.color = strengthColors[strength - 1] || '#ff4444';
                    }
                }
                
                return strength === 4;
            }
            
            newPasswordInput.addEventListener('input', function() {
                checkPasswordStrength(this.value);
                validatePasswordMatch();
            });
            
            const confirmPasswordInput = document.getElementById('confirmPassword');
            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', validatePasswordMatch);
            }
            
            function validatePasswordMatch() {
                const newPassword = document.getElementById('newPassword')?.value || '';
                const confirmPassword = document.getElementById('confirmPassword')?.value || '';
                const confirmHint = document.getElementById('confirmPasswordHint');
                const updateBtn = document.getElementById('pwUpdateBtn');
                const isStrong = checkPasswordStrength(newPassword);
                
                if (confirmPassword.length > 0) {
                    if (newPassword === confirmPassword) {
                        if (confirmHint) {
                            confirmHint.textContent = '✓ Passwords match';
                            confirmHint.style.color = '#2ecc71';
                        }
                        if (updateBtn && isStrong) {
                            updateBtn.disabled = false;
                        } else if (updateBtn) {
                            updateBtn.disabled = true;
                        }
                    } else {
                        if (confirmHint) {
                            confirmHint.textContent = '✗ Passwords do not match';
                            confirmHint.style.color = '#e74c3c';
                        }
                        if (updateBtn) updateBtn.disabled = true;
                    }
                } else {
                    if (confirmHint) confirmHint.textContent = '';
                    if (updateBtn) updateBtn.disabled = true;
                }
            }
        }

        function initPasswordEyeButtons() {
            document.querySelectorAll('.pw-eye-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const input = document.getElementById(targetId);
                    if (input) {
                        const type = input.type === 'password' ? 'text' : 'password';
                        input.type = type;
                        this.querySelector('i').classList.toggle('fa-eye');
                        this.querySelector('i').classList.toggle('fa-eye-slash');
                    }
                });
            });
        }

        function initPasswordCancelButton() {
            const cancelBtn = document.getElementById('pwCancelBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function() {
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                    
                    for (let i = 1; i <= 4; i++) {
                        const seg = document.getElementById(`pwSeg${i}`);
                        if (seg) seg.style.backgroundColor = '#e0e0e0';
                    }
                    
                    const strengthLabel = document.getElementById('pwStrengthLabel');
                    if (strengthLabel) strengthLabel.textContent = 'Enter a new password';
                    
                    const requirements = ['req-length', 'req-upper', 'req-number', 'req-special'];
                    requirements.forEach(req => {
                        const el = document.getElementById(req);
                        if (el) el.classList.remove('valid');
                    });
                    
                    const confirmHint = document.getElementById('confirmPasswordHint');
                    if (confirmHint) confirmHint.textContent = '';
                    
                    const updateBtn = document.getElementById('pwUpdateBtn');
                    if (updateBtn) updateBtn.disabled = true;
                    
                    const successBanner = document.getElementById('pwSuccessBanner');
                    const errorBanner = document.getElementById('pwErrorBanner');
                    if (successBanner) successBanner.style.display = 'none';
                    if (errorBanner) errorBanner.style.display = 'none';
                });
            }
        }

        async function changePassword(event) {
            event.preventDefault();
            
            const currentPasswordInput = document.getElementById('currentPassword');
            const newPasswordInput = document.getElementById('newPassword');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const updateBtn = document.getElementById('pwUpdateBtn');
            const successBanner = document.getElementById('pwSuccessBanner');
            const errorBanner = document.getElementById('pwErrorBanner');
            const errorMessage = document.getElementById('pwErrorMessage');
            
            const currentPassword = currentPasswordInput?.value || '';
            const newPassword = newPasswordInput?.value || '';
            const confirmPassword = confirmPasswordInput?.value || '';
            
            if (successBanner) successBanner.style.display = 'none';
            if (errorBanner) errorBanner.style.display = 'none';
            
            if (!currentPassword) {
                showToast('Current password is required', 'error');
                if (errorBanner) {
                    errorMessage.textContent = 'Current password is required';
                    errorBanner.style.display = 'flex';
                    setTimeout(() => errorBanner.style.display = 'none', 3000);
                }
                return;
            }
            
            if (!newPassword) {
                showToast('New password is required', 'error');
                if (errorBanner) {
                    errorMessage.textContent = 'New password is required';
                    errorBanner.style.display = 'flex';
                    setTimeout(() => errorBanner.style.display = 'none', 3000);
                }
                return;
            }
            
            if (!confirmPassword) {
                showToast('Please confirm your new password', 'error');
                if (errorBanner) {
                    errorMessage.textContent = 'Please confirm your new password';
                    errorBanner.style.display = 'flex';
                    setTimeout(() => errorBanner.style.display = 'none', 3000);
                }
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showToast('New passwords do not match', 'error');
                if (errorBanner) {
                    errorMessage.textContent = 'New passwords do not match';
                    errorBanner.style.display = 'flex';
                    setTimeout(() => errorBanner.style.display = 'none', 3000);
                }
                return;
            }
            
            if (newPassword.length < 8) {
                showToast('Password must be at least 8 characters', 'error');
                if (errorBanner) {
                    errorMessage.textContent = 'Password must be at least 8 characters';
                    errorBanner.style.display = 'flex';
                    setTimeout(() => errorBanner.style.display = 'none', 3000);
                }
                return;
            }
            
            if (!/[A-Z]/.test(newPassword)) {
                showToast('Password must contain at least one uppercase letter', 'error');
                if (errorBanner) {
                    errorMessage.textContent = 'Password must contain at least one uppercase letter';
                    errorBanner.style.display = 'flex';
                    setTimeout(() => errorBanner.style.display = 'none', 3000);
                }
                return;
            }
            
            if (!/[0-9]/.test(newPassword)) {
                showToast('Password must contain at least one number', 'error');
                if (errorBanner) {
                    errorMessage.textContent = 'Password must contain at least one number';
                    errorBanner.style.display = 'flex';
                    setTimeout(() => errorBanner.style.display = 'none', 3000);
                }
                return;
            }
            
            if (!/[^A-Za-z0-9]/.test(newPassword)) {
                showToast('Password must contain at least one special character', 'error');
                if (errorBanner) {
                    errorMessage.textContent = 'Password must contain at least one special character';
                    errorBanner.style.display = 'flex';
                    setTimeout(() => errorBanner.style.display = 'none', 3000);
                }
                return;
            }
            
            const user = getCurrentUser();
            if (!user || !user.userId) {
                showToast('User not found. Please login again.', 'error');
                if (errorBanner) {
                    errorMessage.textContent = 'User not found. Please login again.';
                    errorBanner.style.display = 'flex';
                    setTimeout(() => errorBanner.style.display = 'none', 3000);
                }
                return;
            }
            
            const originalText = updateBtn?.innerHTML;
            if (updateBtn) {
                updateBtn.disabled = true;
                updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            }
            
            try {
                const response = await api.profile.changePassword(user.userId, {
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                });
                
                if (response.success) {
                    if (currentPasswordInput) currentPasswordInput.value = '';
                    if (newPasswordInput) newPasswordInput.value = '';
                    if (confirmPasswordInput) confirmPasswordInput.value = '';
                    
                    if (successBanner) {
                        successBanner.style.display = 'flex';
                        setTimeout(() => {
                            successBanner.style.display = 'none';
                        }, 5000);
                    }
                    
                    showToast('Password changed successfully!', 'success');
                } else {
                    const backendError = response.message || 'Failed to change password';
                    showToast(backendError, 'error');
                    if (errorBanner) {
                        errorMessage.textContent = backendError;
                        errorBanner.style.display = 'flex';
                        setTimeout(() => errorBanner.style.display = 'none', 5000);
                    }
                }
            } catch (error) {
                console.error('Password change error:', error);
                let errorMsg = 'Error changing password';
                
                if (error.message) {
                    errorMsg = error.message;
                }
                
                showToast(errorMsg, 'error');
                if (errorBanner) {
                    errorMessage.textContent = errorMsg;
                    errorBanner.style.display = 'flex';
                    setTimeout(() => errorBanner.style.display = 'none', 5000);
                }
            } finally {
                if (updateBtn) {
                    updateBtn.innerHTML = originalText;
                    updateBtn.disabled = true;
                }
            }
        }

        // ============================================
        // API SERVICE
        // ============================================
        const api = {
            async request(endpoint, options = {}) {
                const url = `${API_BASE_URL}${endpoint}`;
                
                const headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                };
                
                if (token && token !== 'bypass-token') {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                
                if (options.headers) {
                    Object.assign(headers, options.headers);
                }
                
                const defaultOptions = {
                    headers: headers
                };
                
                try {
                    console.log(`📡 ${options.method || 'GET'} ${url}`);
                    const response = await fetch(url, { ...defaultOptions, ...options });
                    
                    const contentType = response.headers.get('content-type');
                    let data;
                    if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                    } else {
                        const text = await response.text();
                        console.warn('Non-JSON response:', text);
                        throw new Error('Server returned non-JSON response');
                    }
                    
                    if (!response.ok) {
                        throw new Error(data.message || `HTTP ${response.status}`);
                    }
                    
                    return data;
                } catch (error) {
                    console.error(`API Error (${endpoint}):`, error);
                    throw error;
                }
            },
            
            auth: {
                login: (email, password) => 
                    api.request('/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({ email, password })
                    }),
                register: (fullName, email, password) => 
                    api.request('/auth/register', {
                        method: 'POST',
                        body: JSON.stringify({ fullName, email, password })
                    }),
                logout: () => 
                    api.request('/auth/logout', {
                        method: 'POST'
                    })
            },
            
            products: {
                getAll: () => api.request('/products'),
                getById: (id) => api.request(`/products/${id}`)
            },
            
            cart: {
                get: (userId) => api.request(`/cart?userId=${userId}`),
                add: (userId, item) => api.request('/cart/add', {
                    method: 'POST',
                    body: JSON.stringify({ userId, ...item })
                }),
                update: (userId, itemId, quantity) => api.request(`/cart/update/${itemId}?userId=${userId}&quantity=${quantity}`, {
                    method: 'PUT'
                }),
                remove: (userId, itemId) => api.request(`/cart/remove/${itemId}?userId=${userId}`, {
                    method: 'DELETE'
                }),
                clear: (userId) => api.request(`/cart/clear?userId=${userId}`, {
                    method: 'DELETE'
                })
            },
            
            orders: {
                getAll: (userId, status) => {
                    const url = status ? `/orders?userId=${userId}&status=${status}` : `/orders?userId=${userId}`;
                    return api.request(url);
                },
                getById: (userId, orderId) => api.request(`/orders/${orderId}?userId=${userId}`),
                checkout: (orderData) => api.request('/orders/checkout', {
                    method: 'POST',
                    body: JSON.stringify(orderData)
                }),
                cancel: (userId, orderId) => api.request(`/orders/${orderId}/cancel?userId=${userId}`, {
                    method: 'PUT'
                }),
                getStats: (userId) => api.request(`/orders/stats?userId=${userId}`)
            },
            
            profile: {
                get: (userId) => api.request(`/profile/${userId}`),
                update: (userId, data) => api.request(`/profile/${userId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                }),
                changePassword: (userId, data) => api.request(`/profile/${userId}/change-password`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                }),
                deactivate: (userId) => api.request(`/profile/${userId}`, {
                    method: 'DELETE'
                }),
                updateProfileImage: (userId, profileImage) => api.request(`/profile/${userId}/profile-image`, {
                    method: 'PUT',
                    body: JSON.stringify({ profileImage })
                }),
                getProfileImage: (userId) => api.request(`/profile/${userId}/profile-image`)
            },
            
            stats: {
                getUser: (userId) => api.request(`/stats/${userId}`)
            },
            
            payments: {
                checkStatus: (sourceId) => api.request(`/payments/status/${sourceId}`)
            },
            
            chatbot: {
                sendMessage: (userId, message) => api.request('/chatbot/message', {
                    method: 'POST',
                    body: JSON.stringify({ userId, message })
                }),
                getHistory: (userId) => api.request(`/chatbot/history/${userId}`),
                getHistoryByIntent: (userId, intent) => api.request(`/chatbot/history/${userId}/intent/${intent}`)
            }
        };

        // ============================================
        // UTILITY FUNCTIONS
        // ============================================
        function getCurrentUser() {
            const storedUserId = localStorage.getItem('userId');
            const storedName = localStorage.getItem('userName');
            const storedEmail = localStorage.getItem('userEmail');
            const storedPhone = localStorage.getItem('profile_phone');
            
            if (storedUserId) {
                return {
                    userId: parseInt(storedUserId),
                    name: storedName || localStorage.getItem('profile_fullName') || 'User',
                    email: storedEmail || localStorage.getItem('profile_email') || 'user@example.com',
                    phone: storedPhone || ''
                };
            }
            
            const userStr = localStorage.getItem('eduUser');
            if (!userStr) {
                const savedName = localStorage.getItem('profile_fullName');
                const savedEmail = localStorage.getItem('profile_email');
                
                return {
                    userId: localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null,
                    name: savedName || 'User',
                    email: savedEmail || 'user@example.com',
                    phone: localStorage.getItem('profile_phone') || ''
                };
            }
            
            try {
                const user = JSON.parse(userStr);
                const savedPhone = localStorage.getItem('profile_phone');
                if (savedPhone) {
                    user.phone = savedPhone;
                }
                if (user.userId || user.id) {
                    localStorage.setItem('userId', user.userId || user.id);
                }
                return user;
            } catch (e) {
                console.error('Error parsing user:', e);
                return null;
            }
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            const msg = document.getElementById('toastMessage');
            if (!toast || !msg) return;

            msg.textContent = message;
            
            if (type === 'error') {
                toast.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
                toast.querySelector('i').className = 'fas fa-exclamation-circle';
            } else if (type === 'success') {
                toast.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
                toast.querySelector('i').className = 'fas fa-check-circle';
            } else {
                toast.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
                toast.querySelector('i').className = 'fas fa-info-circle';
            }

            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        function showSuccessOverlay(text) {
            const ov = document.getElementById('successOverlay');
            if (!ov) return;
            const box = ov.querySelector('.success-box h1');
            if (box && text) box.textContent = text;
            ov.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function hideSuccessOverlay() {
            const ov = document.getElementById('successOverlay');
            if (!ov) return;
            ov.classList.remove('active');
            document.body.style.overflow = '';
        }

        // ============================================
        // CART FUNCTIONS
        // ============================================
        async function loadCartFromBackend() {
            const user = getCurrentUser();
            if (!user) return;
            
            if (sessionStorage.getItem('justCheckedOut') === 'true') {
                appState.cart = [];
                updateCartUI();
                return;
            }
            
            try {
                const data = await api.cart.get(user.userId);
                if (data.success && data.cart) {
                    appState.cart = data.cart;
                    saveCart();
                    updateCartUI();
                }
            } catch (error) {
                console.error('❌ Failed to load cart:', error);
                loadSavedData();
            }
        }

        function saveCart() { 
            localStorage.setItem('eduCart', JSON.stringify(appState.cart)); 
        }

        function saveOrders() { 
            localStorage.setItem('eduOrders', JSON.stringify(appState.orders)); 
        }

        function loadSavedData() {
            const savedCart = localStorage.getItem('eduCart');
            const savedOrders = localStorage.getItem('eduOrders');
            const savedProducts = localStorage.getItem('eduProducts');
            
            if (savedCart) { 
                appState.cart = JSON.parse(savedCart); 
                updateCartUI(); 
            }
            if (savedOrders) { 
                appState.orders = JSON.parse(savedOrders); 
                renderOrders(); 
                updateStats(); 
            }
            if (savedProducts && appState.products.length === 0) { 
                appState.products = JSON.parse(savedProducts); 
                renderProducts(); 
                updateCategoryCounts(); 
            }
        }

        function updateCartUI() {
            const badge = document.getElementById('cartBadge');
            const body = document.getElementById('cartBody');
            const subtotal = document.getElementById('cartSubtotal');
            const total = document.getElementById('cartTotal');

            if (badge) badge.textContent = appState.cart.length;
            if (!body || !subtotal || !total) return;

            if (appState.cart.length === 0) {
                body.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Your cart is empty</p></div>`;
                subtotal.textContent = '₱0.00';
                total.textContent = '₱0.00';
            } else {
                const cartTotal = appState.cart.reduce((sum, item) => sum + (item.total || (item.price * item.quantity)), 0);
                
                body.innerHTML = appState.cart.map(item => {
                    const product = appState.products.find(p => p.id === item.productId);
                    const imageUrl = product?.imageUrl || item.productIcon;
                    const imageHtml = imageUrl && (imageUrl.startsWith('/') || imageUrl.startsWith('http') || imageUrl.startsWith('data:'))
                        ? `<img src="${imageUrl}" alt="${item.productName}" class="cart-item-image">`
                        : `<i class="${imageUrl || 'fas fa-box'}"></i>`;
                    
                    const itemTotal = (item.total || (item.price * item.quantity));
                    const isMinQuantity = item.quantity <= 1;
                    
                    let maxStock = 100;
                    if (product) {
                        const size = product.sizes.find(s => s.name === item.size);
                        if (size) maxStock = size.stock;
                    }
                    
                    return `
                    <div class="cart-item" data-item-id="${item.id}" data-product-id="${item.productId}" data-size="${item.size}">
                        <div class="cart-item-image-wrapper">${imageHtml}</div>
                        <div class="cart-item-details">
                            <div class="cart-item-name">${escapeHtml(item.productName)}</div>
                            <div class="cart-item-size">Size: ${escapeHtml(item.size)}</div>
                            <div class="cart-item-price">₱${(item.price).toFixed(2)}</div>
                            <div class="cart-item-quantity-controls">
                                <button class="qty-decrease ${isMinQuantity ? 'disabled' : ''}" 
                                        ${isMinQuantity ? 'disabled' : ''}
                                        onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" 
                                    class="cart-item-qty-input" 
                                    value="${item.quantity}" 
                                    min="1" 
                                    max="${maxStock}"
                                    data-item-id="${item.id}"
                                    onchange="updateCartItemQuantityFromInput(this)">
                                <button class="qty-increase" 
                                        onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="cart-item-total">Total: ₱${itemTotal.toFixed(2)}</div>
                        </div>
                        <button class="remove-cart-item" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>`;
                }).join('');
                
                subtotal.textContent = `₱${cartTotal.toFixed(2)}`;
                total.textContent = `₱${cartTotal.toFixed(2)}`;
            }
        }

        async function updateCartItemQuantity(itemId, newQuantity) {
            if (newQuantity < 1) {
                showToast('Minimum quantity is 1', 'warning');
                return;
            }
            
            const cartItem = appState.cart.find(item => item.id === itemId);
            if (!cartItem) return;
            
            if (newQuantity > cartItem.quantity) {
                const product = appState.products.find(p => p.id === cartItem.productId);
                if (product) {
                    const size = product.sizes.find(s => s.name === cartItem.size);
                    if (size && newQuantity > size.stock) {
                        showToast(`Only ${size.stock} items available in stock!`, 'error');
                        return;
                    }
                }
            }
            
            cartItem.quantity = newQuantity;
            cartItem.total = cartItem.price * newQuantity;
            
            const user = getCurrentUser();
            if (user && user.userId) {
                try {
                    await api.cart.update(user.userId, itemId, newQuantity);
                    await loadCartFromBackend();
                } catch (error) {
                    console.error('Failed to update cart:', error);
                    saveCart();
                    updateCartUI();
                }
            } else {
                saveCart();
                updateCartUI();
            }
            
            showToast('Cart updated!', 'success');
        }

        async function updateCartItemQuantityFromInput(inputElement) {
            let newQuantity = parseInt(inputElement.value);
            const itemId = parseInt(inputElement.dataset.itemId);
            const maxStock = parseInt(inputElement.max);
            
            if (isNaN(newQuantity) || newQuantity < 1) {
                newQuantity = 1;
                inputElement.value = 1;
            }
            
            if (newQuantity > maxStock) {
                newQuantity = maxStock;
                inputElement.value = maxStock;
                showToast(`Only ${maxStock} items available in stock!`, 'error');
                return;
            }
            
            await updateCartItemQuantity(itemId, newQuantity);
        }

        async function removeFromCart(itemId) {
            const user = getCurrentUser();
            try {
                await api.cart.remove(user.userId, itemId);
                await loadCartFromBackend();
                showToast('Item removed from cart');
            } catch (error) {
                console.error('Failed to remove from cart:', error);
                appState.cart = appState.cart.filter(item => item.id !== itemId);
                saveCart();
                updateCartUI();
                showToast('Item removed from cart');
            }
        }

        function openCart() {
            const sidebar = document.getElementById('cartSidebar');
            const overlay = document.getElementById('cartOverlay');
            if (sidebar) sidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeCart() {
            const sidebar = document.getElementById('cartSidebar');
            const overlay = document.getElementById('cartOverlay');
            if (sidebar) sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        // ============================================
        // PRODUCT LOADING & RENDERING
        // ============================================
        async function loadProductsFromBackend() {
            try {
                console.log('📥 Loading products from backend...');
                const data = await api.products.getAll();
                
                if (data) {
                    if (Array.isArray(data)) {
                        appState.products = data;
                    } else if (data.success && data.products) {
                        appState.products = data.products;
                    } else if (data.data) {
                        appState.products = data.data;
                    }
                    
                    renderProducts();
                    updateCategoryCounts();
                    localStorage.setItem('eduProducts', JSON.stringify(appState.products));
                }
            } catch (error) {
                console.error('❌ Failed to load products from backend:', error);
                const savedProducts = localStorage.getItem('eduProducts');
                if (savedProducts) {
                    appState.products = JSON.parse(savedProducts);
                    renderProducts();
                    updateCategoryCounts();
                }
            }
        }

        function renderProducts() {
            const featured = document.getElementById('featuredProducts');
            const allProducts = document.getElementById('allProducts');
            
            if (!appState.products || appState.products.length === 0) {
                if (featured) featured.innerHTML = '<div class="text-center">Loading products...</div>';
                if (allProducts) allProducts.innerHTML = '<div class="text-center">Loading products...</div>';
                return;
            }
            
            const productHTML = (product) => {
                const minPrice = product.sizes && product.sizes.length > 0 ? Math.min(...product.sizes.map(s => s.price)) : 0;
                const imageHtml = product.imageUrl 
                    ? `<img src="${product.imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23cccccc\'/%3E%3Ctext x=\'20\' y=\'120\' fill=\'white\' font-size=\'18\'%3ENo%3C/text%3E%3Ctext x=\'20\' y=\'150\' fill=\'white\' font-size=\'18\'%3EImage%3C/text%3E%3C/svg%3E'">`
                    : `<i class="${product.icon || 'fas fa-box'}"></i>`;
                return `
                <div class="product-card" onclick="openProductModal(${product.id})">
                    <div class="product-image-wrapper">
                        <div class="product-badge">New</div>
                        ${imageHtml}
                        <button class="quick-view" onclick="event.stopPropagation(); openProductModal(${product.id})">Quick View</button>
                    </div>
                    <div class="product-info">
                        <div class="product-category">${product.category || 'Uncategorized'}</div>
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">₱${minPrice}</div>
                    </div>
                </div>`;
            };
            
            const featuredProducts = appState.products.filter(p => ['Bond Paper', 'Gel Pens', 'Colored Pencils'].includes(p.name)).slice(0, 3);
            if (featured) featured.innerHTML = featuredProducts.map(productHTML).join('');
            if (allProducts) allProducts.innerHTML = appState.products.map(productHTML).join('');
        }

        function updateCategoryCounts() {
            const allCount = appState.products.length;
            const paperCount = appState.products.filter(p => p.category === 'Paper Products').length;
            const writingCount = appState.products.filter(p => p.category === 'Writing Tools').length;
            const coloringCount = appState.products.filter(p => p.category === 'Coloring Materials').length;
            const storageCount = appState.products.filter(p => p.category === 'Storage & Organization').length;

            const elAll = document.getElementById('countAll');
            const elPaper = document.getElementById('countPaper');
            const elWriting = document.getElementById('countWriting');
            const elColoring = document.getElementById('countColoring');
            const elStorage = document.getElementById('countStorage');

            if (elAll) elAll.textContent = allCount;
            if (elPaper) elPaper.textContent = paperCount;
            if (elWriting) elWriting.textContent = writingCount;
            if (elColoring) elColoring.textContent = coloringCount;
            if (elStorage) elStorage.textContent = storageCount;
        }

        // ============================================
        // PRODUCT MODAL FUNCTIONS
        // ============================================
        function openProductModal(productId) {
            const product = appState.products.find(p => p.id == productId);
            if (!product) return;

            appState.selectedProduct = product;
            appState.selectedSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : null;

            const modalImage = document.querySelector('.modal-image');
            if (modalImage) {
                if (product.imageUrl) modalImage.innerHTML = `<img src="${product.imageUrl}" alt="${product.name}" class="modal-product-image">`;
                else modalImage.innerHTML = `<i class="${product.icon || 'fas fa-box'}"></i>`;
            }
            
            document.getElementById('modalProductName').textContent = product.name;
            document.getElementById('modalDescription').textContent = product.description;
            document.getElementById('productSKU').textContent = product.sku || 'N/A';
            document.getElementById('productCategory').textContent = product.category || 'Uncategorized';

            const sizeOptions = document.getElementById('sizeOptions');
            if (sizeOptions && product.sizes) {
                sizeOptions.innerHTML = product.sizes.map((size, index) => {
                    const isDisabled = size.stock === 0;
                    return `<div class="size-option ${index === 0 && !isDisabled ? 'active' : ''} ${isDisabled ? 'disabled' : ''}" 
                            data-size="${size.name}" data-price="${size.price}" data-stock="${size.stock || 0}"
                            onclick="${!isDisabled ? `selectSize('${size.name}', ${size.price})` : ''}">
                            <div class="size-name">${size.name}</div>
                            <div class="size-desc">${size.desc || ''}</div>
                            <div class="size-price">₱${size.price}</div>
                            <div class="size-stock">${size.stock > 0 ? `${size.stock} left` : 'Out of stock'}</div>
                        </div>`;
                }).join('');
            }

            const qtyInput = document.getElementById('modalQuantity');
            if (qtyInput && appState.selectedSize) {
                const selectedSize = product.sizes.find(s => s.name === appState.selectedSize.name);
                qtyInput.max = selectedSize?.stock || 100;
                qtyInput.value = 1;
            }
            
            updateModalPrice();
            const modal = document.getElementById('productModal');
            if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
        }

        function selectSize(sizeName, price) {
            appState.selectedSize = { name: sizeName, price: price };
            document.querySelectorAll('.size-option').forEach(opt => {
                opt.classList.remove('active');
                if (opt.dataset.size === sizeName && !opt.classList.contains('disabled')) opt.classList.add('active');
            });
            const product = appState.selectedProduct;
            const selectedSize = product.sizes.find(s => s.name === sizeName);
            const qtyInput = document.getElementById('modalQuantity');
            if (qtyInput && selectedSize) {
                qtyInput.max = selectedSize.stock || 100;
                if (parseInt(qtyInput.value) > qtyInput.max) qtyInput.value = qtyInput.max;
            }
            updateModalPrice();
        }

        function updateModalPrice() {
            if (!appState.selectedSize) return;
            const qty = parseInt(document.getElementById('modalQuantity')?.value) || 1;
            const total = appState.selectedSize.price * qty;
            const mp = document.getElementById('modalPrice');
            if (mp) mp.textContent = `₱${total.toFixed(2)}`;
        }

        function decreaseQuantity() {
            const input = document.getElementById('modalQuantity');
            if (!input) return;
            const value = parseInt(input.value);
            if (value > 1) { input.value = value - 1; updateModalPrice(); }
        }

        function increaseQuantity() {
            const input = document.getElementById('modalQuantity');
            if (!input) return;
            const value = parseInt(input.value);
            const max = parseInt(input.max) || 100;
            if (value < max) { input.value = value + 1; updateModalPrice(); }
        }

        function closeProductModal() {
            const modal = document.getElementById('productModal');
            if (modal) modal.classList.remove('active');
            document.body.style.overflow = '';
            appState.selectedProduct = null;
            appState.selectedSize = null;
        }

        function addToCart() {
            if (!appState.selectedProduct || !appState.selectedSize) { showToast('Please select a size', 'error'); return; }

            const qty = parseInt(document.getElementById('modalQuantity')?.value) || 1;
            const selectedSize = appState.selectedProduct.sizes.find(s => s.name === appState.selectedSize.name);
            
            if (selectedSize && selectedSize.stock === 0) { showToast('This size is out of stock', 'error'); return; }
            if (selectedSize && qty > selectedSize.stock) { showToast(`Only ${selectedSize.stock} items available`, 'error'); return; }
            
            const cartItem = {
                productId: appState.selectedProduct.id,
                productName: appState.selectedProduct.name,
                productIcon: appState.selectedProduct.icon || 'fas fa-box',
                size: appState.selectedSize.name,
                price: appState.selectedSize.price,
                quantity: qty
            };

            addToCartBackend(cartItem, selectedSize).catch(() => addToCartLocal(cartItem, selectedSize));
            closeProductModal();
            setTimeout(() => openCart(), 300);
        }

        async function addToCartBackend(cartItem, selectedSize) {
            const user = getCurrentUser();
            if (!user) return;
            
            try {
                const existingItem = appState.cart.find(item => item.productId === cartItem.productId && item.size === cartItem.size);
                const totalQty = (existingItem?.quantity || 0) + cartItem.quantity;
                if (selectedSize && totalQty > selectedSize.stock) {
                    showToast(`Cannot add more. Only ${selectedSize.stock - (existingItem?.quantity || 0)} more available`, 'error');
                    return;
                }
                const data = await api.cart.add(user.userId, cartItem);
                if (data.success) { await loadCartFromBackend(); showToast('✅ Added to cart!', 'success'); }
            } catch (error) { throw error; }
        }

        function addToCartLocal(cartItem, selectedSize) {
            const existingItem = appState.cart.find(item => item.productId === cartItem.productId && item.size === cartItem.size);
            const user = getCurrentUser();
            
            if (existingItem) {
                const totalQty = existingItem.quantity + cartItem.quantity;
                if (selectedSize && totalQty > selectedSize.stock) {
                    const available = selectedSize.stock - existingItem.quantity;
                    showToast(`Cannot add more. Only ${available} more available`, 'error');
                    return;
                }
                existingItem.quantity += cartItem.quantity;
                existingItem.total = existingItem.price * existingItem.quantity;
                showToast('Cart updated!', 'success');
            } else {
                const localItem = { id: Date.now(), userId: user?.userId || 1, ...cartItem, total: cartItem.price * cartItem.quantity };
                appState.cart.push(localItem);
                showToast('✅ Added to cart!', 'success');
            }
            saveCart();
            updateCartUI();
        }

        // ============================================
        // ORDER FUNCTIONS
        // ============================================
        async function loadOrdersFromBackend() {
            const user = getCurrentUser();
            if (!user || !user.userId) {
                console.log('⚠️ No user ID found, cannot load orders');
                loadSavedData();
                return;
            }
            
            try {
                console.log('📥 Loading orders for user ID:', user.userId);
                
                const data = await api.orders.getAll(user.userId);
                
                if (data.success && data.orders) {
                    appState.orders = data.orders;
                    console.log(`✅ Loaded ${appState.orders.length} orders from backend`);
                    
                    saveOrders();
                    updateStats();
                    renderOrders();
                    
                } else if (data.orders) {
                    appState.orders = data.orders;
                    updateStats();
                    renderOrders();
                } else {
                    console.log('⚠️ No orders data from backend, using cached data');
                    loadSavedData();
                }
            } catch (error) {
                console.error('❌ Failed to load orders from backend:', error);
                loadSavedData();
            }
        }

        function renderOrders() {
            const container = document.getElementById('ordersList');
            if (!container) return;
            
            if (appState.orders.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-shopping-bag"></i>
                        <h3>No orders yet</h3>
                        <p>Start shopping to see your orders here</p>
                        <button class="btn-primary" data-page="shop" onclick="navigateTo('shop')">Start Shopping</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = appState.orders.map(order => {
                let orderDate = order.orderDate || order.date;
                if (orderDate && orderDate.includes('T')) {
                    orderDate = new Date(orderDate).toLocaleDateString();
                }
                
                let status = (order.status || 'pending').toLowerCase();
                const showCancel = status === 'pending' || status === 'processing' || status === 'waiting_payment';
                const displayId = order.orderNumber || order.id;
                
                const trackingNumber = order.trackingNumber || 'Not assigned';
                let estimatedDelivery = order.estimatedDelivery;
                let deliveryStatus = order.deliveryStatus || '';
                
                let formattedEstimatedDelivery = 'To be determined';
                if (estimatedDelivery) {
                    try {
                        const estDate = new Date(estimatedDelivery);
                        if (!isNaN(estDate.getTime())) {
                            formattedEstimatedDelivery = estDate.toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            });
                        }
                    } catch(e) {}
                }
                
                let deliveryStatusIcon = '⏳';
                let deliveryStatusText = 'Pending';
                let deliveryStatusClass = 'pending';
                
                if (deliveryStatus === 'DELIVERED') {
                    deliveryStatusIcon = '✅';
                    deliveryStatusText = 'Delivered';
                    deliveryStatusClass = 'delivered';
                } else if (deliveryStatus === 'OUT_FOR_DELIVERY') {
                    deliveryStatusIcon = '🚚';
                    deliveryStatusText = 'Out for Delivery';
                    deliveryStatusClass = 'out-for-delivery';
                } else if (deliveryStatus === 'IN_TRANSIT') {
                    deliveryStatusIcon = '📦';
                    deliveryStatusText = 'In Transit';
                    deliveryStatusClass = 'in-transit';
                }
                
                let itemsHtml = '';
                let subtotal = 0;
                
                if (order.items && order.items.length > 0) {
                    itemsHtml = order.items.map(item => {
                        const itemTotal = (item.price || 0) * (item.quantity || 1);
                        subtotal += itemTotal;
                        
                        const product = appState.products.find(p => p.id === item.productId);
                        const imageUrl = product?.imageUrl || item.productIcon;
                        
                        const imageHtml = (imageUrl && (imageUrl.startsWith('/') || imageUrl.startsWith('http') || imageUrl.startsWith('data:')))
                            ? `<img src="${imageUrl}" alt="${item.productName}">`
                            : `<i class="${imageUrl || 'fas fa-box'}"></i>`;
                        
                        return `
                <div class="order-item-row">
                    <div class="order-item-image">
                        ${imageHtml}
                    </div>
                    <div class="order-item-details">
                        <div class="order-item-top">
                            <div class="order-item-name">${item.productName}</div>
                        </div>
                        <div class="order-item-divider"></div>
                        <div class="order-item-price-row">
                            <div class="order-item-bottom-left">
                                <span class="order-item-size">Size: ${item.size || 'Standard'}</span>
                                <span class="order-item-qty">Qty: ${item.quantity}</span>
                            </div>
                            <span class="order-item-total">₱${itemTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
                    }).join('');
                }
                
                const total = subtotal + (order.shippingFee || 10);
                const roomInfo = order.roomNumber ? `${order.roomBuilding || ''} ${order.roomNumber}` : 'Not specified';
                
                return `
                    <div class="order-card">
                        <div class="order-card-header">
                            <div class="order-id">Order #${displayId}</div>
                            <div class="order-date">📅 ${orderDate || new Date().toLocaleDateString()}</div>
                            <div class="order-status-badge ${status}">${status.toUpperCase()}</div>
                        </div>
                        <div class="order-card-body">
                            <div class="order-items-section">
                                <div class="order-items-title"><i class="fas fa-boxes"></i> Items</div>
                                <div class="order-items-list">${itemsHtml}</div>
                            </div>
                            <div class="order-info-section">
                                <div class="order-info-card">
                                    <div class="order-info-title"><i class="fas fa-credit-card"></i> Payment Details</div>
                                    <div class="order-info-row"><span class="order-info-label">Payment Method:</span><span class="order-info-value">${order.paymentMethod || 'Standard'}</span></div>
                                    <div class="order-info-row"><span class="order-info-label">Room / Building:</span><span class="order-info-value">${roomInfo}</span></div>
                                    ${order.specialDelivery ? `<div class="order-info-row"><span class="order-info-label">Special Instructions:</span><span class="order-info-value">${order.specialDelivery.substring(0, 50)}</span></div>` : ''}
                                    <div class="order-info-row total-row"><span class="order-info-label">Total Amount:</span><span class="order-info-value order-total-amount">₱${total.toFixed(2)}</span></div>
                                </div>
                                <div class="tracking-section">
                                    <div class="order-info-title"><i class="fas fa-truck"></i> Delivery Tracking</div>
                                    <div class="order-info-row">
                                        <span class="order-info-label">Tracking Number:</span>
                                        <span class="order-info-value tracking-number" id="tracking-${order.id}">${trackingNumber}</span>
                                    </div>
                                    <div class="order-info-row">
                                        <span class="order-info-label">Est. Delivery:</span>
                                        <span class="order-info-value" id="delivery-${order.id}">${formattedEstimatedDelivery}</span>
                                    </div>
                                    <div class="order-info-row">
                                        <span class="order-info-label">Delivery Status:</span>
                                        <span class="delivery-status ${deliveryStatusClass}">${deliveryStatusIcon} ${deliveryStatusText}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ${showCancel ? `<div class="order-card-footer"><button class="btn-cancel-order" onclick="cancelOrder(${order.id})"><i class="fas fa-times-circle"></i> Cancel Order</button></div>` : ''}
                    </div>
                `;
            }).join('');
        }

        async function cancelOrder(orderId) {
            if (!confirm('Are you sure you want to cancel this order?')) return;
            
            const user = getCurrentUser();
            if (!user) { showToast('Please login first', 'error'); return; }
            
            try {
                showToast('Cancelling order...', 'info');
                const data = await api.orders.cancel(user.userId, orderId);
                
                if (data && data.success) {
                    showToast('✅ Order cancelled successfully!', 'success');
                    await loadOrdersFromBackend();
                    await updateStats();
                } else {
                    showToast(data?.message || '❌ Failed to cancel order', 'error');
                }
            } catch (error) {
                console.error('Cancel order error:', error);
                showToast('❌ Failed to cancel order. Please try again.', 'error');
            }
        }

        function filterOrders(status) {
            const container = document.getElementById('ordersList');
            if (!container) return;
            
            document.querySelectorAll('.filter-chip').forEach(chip => {
                chip.classList.remove('active');
                if (chip.dataset.status === status) {
                    chip.classList.add('active');
                }
            });
            
            currentOrderStatus = status;
            
            if (appState.orders.length === 0) {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><h3>No orders found</h3></div>`;
                return;
            }
            
            let ordersToDisplay = status === 'all' 
                ? [...appState.orders] 
                : appState.orders.filter(order => 
                    order.status && order.status.toLowerCase() === status.toLowerCase()
                );
            
            if (ordersToDisplay.length === 0) {
                container.innerHTML = `<div class="empty-state"><i class="fas fa-filter"></i><h3>No ${status} orders</h3><p>Try a different filter</p></div>`;
                return;
            }
            
            renderFilteredOrders(ordersToDisplay);
        }

        function renderFilteredOrders(orders) {
            const container = document.getElementById('ordersList');
            if (!container) return;
            
            container.innerHTML = orders.map(order => {
                let orderDate = order.orderDate || order.date;
                if (orderDate && orderDate.includes('T')) {
                    orderDate = new Date(orderDate).toLocaleDateString();
                }
                
                let orderStatus = (order.status || 'pending').toLowerCase();
                const showCancel = orderStatus === 'pending' || orderStatus === 'processing' || orderStatus === 'waiting_payment';
                const displayId = order.orderNumber || order.id;
                
                let trackingNumber = order.trackingNumber || 'Not assigned';
                let estimatedDelivery = order.estimatedDelivery;
                let deliveryStatus = order.deliveryStatus || '';
                
                let formattedEstimatedDelivery = 'To be determined';
                if (estimatedDelivery) {
                    try {
                        const estDate = new Date(estimatedDelivery);
                        if (!isNaN(estDate.getTime())) {
                            formattedEstimatedDelivery = estDate.toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            });
                        }
                    } catch(e) {}
                }
                
                let deliveryStatusIcon = '⏳';
                let deliveryStatusText = 'Pending';
                let deliveryStatusClass = 'pending';
                
                if (deliveryStatus === 'DELIVERED') {
                    deliveryStatusIcon = '✅';
                    deliveryStatusText = 'Delivered';
                    deliveryStatusClass = 'delivered';
                } else if (deliveryStatus === 'OUT_FOR_DELIVERY') {
                    deliveryStatusIcon = '🚚';
                    deliveryStatusText = 'Out for Delivery';
                    deliveryStatusClass = 'out-for-delivery';
                } else if (deliveryStatus === 'IN_TRANSIT') {
                    deliveryStatusIcon = '📦';
                    deliveryStatusText = 'In Transit';
                    deliveryStatusClass = 'in-transit';
                }
                
                let itemsHtml = '';
                let subtotal = 0;
                
                if (order.items && order.items.length > 0) {
                    itemsHtml = order.items.map(item => {
                        const itemTotal = (item.price || 0) * (item.quantity || 1);
                        subtotal += itemTotal;
                        
                        const product = appState.products.find(p => p.id === item.productId);
                        const imageUrl = product?.imageUrl || item.productIcon;
                        
                        const imageHtml = (imageUrl && (imageUrl.startsWith('/') || imageUrl.startsWith('http') || imageUrl.startsWith('data:')))
                            ? `<img src="${imageUrl}" alt="${item.productName}">`
                            : `<i class="${imageUrl || 'fas fa-box'}"></i>`;
                        
                        return `
                <div class="order-item-row">
                    <div class="order-item-image">
                        ${imageHtml}
                    </div>
                    <div class="order-item-details">
                        <div class="order-item-top">
                            <div class="order-item-name">${item.productName}</div>
                        </div>
                        <div class="order-item-divider"></div>
                        <div class="order-item-price-row">
                            <div class="order-item-bottom-left">
                                <span class="order-item-size">Size: ${item.size || 'Standard'}</span>
                                <span class="order-item-qty">Qty: ${item.quantity}</span>
                            </div>
                            <span class="order-item-total">₱${itemTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
                    }).join('');
                }
                
                const total = subtotal + (order.shippingFee || 10);
                const roomInfo = order.roomNumber ? `${order.roomBuilding || ''} ${order.roomNumber}` : 'Not specified';
                
                return `
                    <div class="order-card">
                        <div class="order-card-header">
                            <div class="order-id">Order #${displayId}</div>
                            <div class="order-date">📅 ${orderDate || new Date().toLocaleDateString()}</div>
                            <div class="order-status-badge ${orderStatus}">${orderStatus.toUpperCase()}</div>
                        </div>
                        <div class="order-card-body">
                            <div class="order-items-section">
                                <div class="order-items-title"><i class="fas fa-boxes"></i> Items</div>
                                <div class="order-items-list">${itemsHtml}</div>
                            </div>
                            <div class="order-info-section">
                                <div class="order-info-card">
                                    <div class="order-info-title"><i class="fas fa-credit-card"></i> Payment Details</div>
                                    <div class="order-info-row"><span class="order-info-label">Payment Method:</span><span class="order-info-value">${order.paymentMethod || 'Standard'}</span></div>
                                    <div class="order-info-row"><span class="order-info-label">Room / Building:</span><span class="order-info-value">${roomInfo}</span></div>
                                    ${order.specialDelivery ? `<div class="order-info-row"><span class="order-info-label">Special Instructions:</span><span class="order-info-value">${order.specialDelivery.substring(0, 50)}</span></div>` : ''}
                                    <div class="order-info-row total-row"><span class="order-info-label">Total Amount:</span><span class="order-info-value order-total-amount">₱${total.toFixed(2)}</span></div>
                                </div>
                                <div class="tracking-section">
                                    <div class="order-info-title"><i class="fas fa-truck"></i> Delivery Tracking</div>
                                    <div class="order-info-row">
                                        <span class="order-info-label">Tracking Number:</span>
                                        <span class="order-info-value tracking-number">${trackingNumber}</span>
                                    </div>
                                    <div class="order-info-row">
                                        <span class="order-info-label">Est. Delivery:</span>
                                        <span class="order-info-value">${formattedEstimatedDelivery}</span>
                                    </div>
                                    <div class="order-info-row">
                                        <span class="order-info-label">Delivery Status:</span>
                                        <span class="delivery-status ${deliveryStatusClass}">${deliveryStatusIcon} ${deliveryStatusText}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ${showCancel ? `<div class="order-card-footer"><button class="btn-cancel-order" onclick="cancelOrder(${order.id})"><i class="fas fa-times-circle"></i> Cancel Order</button></div>` : ''}
                    </div>
                `;
            }).join('');
        }

        async function updateStats() {
            const user = getCurrentUser();
            if (!user) return;
            
            try {
                const data = await api.stats.getUser(user.userId);
                
                if (data.success) {
                    const total = data.totalOrders || 0;
                    const pending = data.pendingOrders || 0;
                    const completed = data.completedOrders || 0;
                    
                    updateStatsUI(total, pending, completed);
                    updateProfileOrderCounts(total, pending, completed);
                    return;
                }
            } catch (error) {
                console.error('Failed to get stats from backend:', error);
            }
            
            const total = appState.orders.length;
            const pending = appState.orders.filter(o => 
                o.status === 'pending' || o.status === 'processing' || o.status === 'confirmed' || o.status === 'waiting_payment'
            ).length;
            const completed = appState.orders.filter(o => 
                o.status === 'completed' || o.status === 'delivered' || o.status === 'shipped'
            ).length;
            
            updateStatsUI(total, pending, completed);
            updateProfileOrderCounts(total, pending, completed);
        }

        function updateStatsUI(total, pending, completed) {
            const elTotal = document.getElementById('totalOrders');
            const elPending = document.getElementById('pendingOrders');
            const elCompleted = document.getElementById('completedOrders');
            
            if (elTotal) {
                elTotal.textContent = total;
                elTotal.parentElement.style.cursor = 'pointer';
                elTotal.parentElement.onclick = () => {
                    navigateTo('orders');
                    filterOrders('all');
                };
            }
            if (elPending) {
                elPending.textContent = pending;
                elPending.parentElement.style.cursor = 'pointer';
                elPending.parentElement.onclick = () => {
                    navigateTo('orders');
                    filterOrders('pending');
                };
            }
            if (elCompleted) {
                elCompleted.textContent = completed;
                elCompleted.parentElement.style.cursor = 'pointer';
                elCompleted.parentElement.onclick = () => {
                    navigateTo('orders');
                    filterOrders('completed');
                };
            }
        }

        function updateProfileOrderCounts(total, pending, completed) {
            const profileTotal = document.getElementById('profileTotalOrders');
            const profilePending = document.getElementById('profilePendingOrders');
            const profileCompleted = document.getElementById('profileCompletedOrders');
            
            if (profileTotal) profileTotal.textContent = total;
            if (profilePending) profilePending.textContent = pending;
            if (profileCompleted) profileCompleted.textContent = completed;
        }

        // ============================================
        // CHECKOUT FUNCTIONS
        // ============================================
        function openCheckoutModal() {
            if (appState.cart.length === 0) { showToast('Your cart is empty', 'error'); return; }
            
            const hasStockIssues = appState.cart.some(item => {
                const product = appState.products.find(p => p.id === item.productId);
                const size = product?.sizes.find(s => s.name === item.size);
                return !size || size.stock === 0 || size.stock < item.quantity;
            });
            if (hasStockIssues) { showToast('Some items have stock issues. Please review your cart.', 'error'); return; }
            
            const total = appState.cart.reduce((sum, item) => sum + (item.total || (item.price * item.quantity)), 0);
            const totalEl = document.getElementById('checkoutTotalAmount');
            if (totalEl) totalEl.textContent = `₱${total.toFixed(2)}`;
            
            document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => radio.checked = false);
            closeCart();
            const modal = document.getElementById('checkoutModal');
            if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
        }

        function closeCheckoutModal() {
            const modal = document.getElementById('checkoutModal');
            if (modal) modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        function proceedToPaymentWindow() {
            const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked');
            if (!selectedPayment) { showToast('Please select a payment method', 'error'); return; }
            
            const method = selectedPayment.value;
            preparePaymentWindow(method);
            closeCheckoutModal();
            openPaymentWindow();
        }

        function preparePaymentWindow(method) {
            const previewIconEl = document.getElementById('paymentProductIcon');
            const previewNameEl = document.getElementById('paymentProductName');
            const previewTotalEl = document.getElementById('paymentTotalAmount');
            const detailsEl = document.getElementById('paymentDetailsArea');

            const total = appState.cart.reduce((s, i) => s + (i.total || (i.price * i.quantity)), 0);

            // Display products with images
            let itemsHtml = '';
            appState.cart.forEach(item => {
                const product = appState.products.find(p => p.id === item.productId);
                const imageUrl = product?.imageUrl || item.productIcon;
                
                const imageHtml = (imageUrl && (imageUrl.startsWith('/') || imageUrl.startsWith('http') || imageUrl.startsWith('data:')))
                    ? `<img src="${imageUrl}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">`
                    : `<i class="${imageUrl || 'fas fa-box'}" style="font-size: 30px;"></i>`;
                
                itemsHtml += `
                    <div style="display: flex; align-items: center; gap: 15px; padding: 10px; border-bottom: 1px solid var(--border-color, #eee);">
                        <div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
                            ${imageHtml}
                        </div>
                        <div style="flex: 1;">
                            <strong>${escapeHtml(item.productName)}</strong><br>
                            Size: ${item.size} | Qty: ${item.quantity}
                        </div>
                        <div>
                            ₱${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </div>
                    </div>
                `;
            });

            if (previewIconEl) {
                const firstItem = appState.cart[0];
                if (firstItem) {
                    const product = appState.products.find(p => p.id === firstItem.productId);
                    const imageUrl = product?.imageUrl || firstItem.productIcon;
                    
                    if (imageUrl && (imageUrl.startsWith('/') || imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
                        previewIconEl.innerHTML = `<img src="${imageUrl}" alt="${firstItem.productName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%;">`;
                    } else {
                        previewIconEl.innerHTML = `<i class="${imageUrl || 'fas fa-box'}" style="font-size: 40px;"></i>`;
                    }
                } else {
                    previewIconEl.innerHTML = '<i class="fas fa-shopping-bag"></i>';
                }
            }
            
            if (previewNameEl) previewNameEl.textContent = `${appState.cart.length} item(s)`;
            if (previewTotalEl) previewTotalEl.textContent = `₱${total.toFixed(2)}`;

            if (!detailsEl) return;

            else if (method === 'GCash Manual') {
            detailsEl.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h4><i class="fas fa-boxes"></i> Your Order Items</h4>
                    <div style="background: var(--bg-secondary, #f8f9fa); border-radius: 12px; padding: 10px; max-height: 300px; overflow-y: auto;">
                        ${itemsHtml}
                    </div>
                    <div style="margin-top: 15px; padding: 15px; background: var(--bg-primary, #fff); border-radius: 12px; border: 1px solid var(--border-color, #eee);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>Subtotal:</span>
                            <span>₱${total.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>Shipping Fee:</span>
                            <span>₱50.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; border-top: 2px solid var(--border-color, #eee);">
                            <span>Total Amount:</span>
                            <span style="color: #2ecc71;">₱${(total + 50).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="payment-instruction">
                    <h4><i class="fas fa-mobile-alt"></i> Manual GCash Payment</h4>
                    <p>Please send payment to:</p>
                    <div class="gcash-details-card" style="background: #007bff; padding: 15px; border-radius: 10px; margin: 15px 0; color: white;">
                        <p><strong>GCash Number:</strong> <span class="gcash-number">09152797837</span></p>
                        <p><strong>Name:</strong> Christian Villanueva</p>
                        <p><strong>Amount:</strong> <span class="amount">₱${total.toFixed(2)}</span></p>
                    </div>
                    
                    <!-- ========== UPLOAD RECEIPT SECTION ========== -->
                    <div style="margin: 20px 0; padding: 15px; background: var(--bg-secondary, #f8f9fa); border-radius: 12px;">
                        <label style="font-weight: 600; display: block; margin-bottom: 10px;">
                            <i class="fas fa-image"></i> Upload Payment Receipt/Screenshot *
                        </label>
                        <div id="manualReceiptPreview" style="border: 2px dashed var(--border-color, #ddd); border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; margin-bottom: 10px; transition: all 0.3s ease;" onclick="document.getElementById('manualReceiptInput').click()">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 40px; color: var(--primary-color, #2ecc71);"></i>
                            <p style="margin-top: 10px;">Click to upload receipt</p>
                            <p style="font-size: 12px; color: var(--text-secondary, #666);">JPG, PNG (Max 2MB)</p>
                        </div>
                        <input type="file" id="manualReceiptInput" accept="image/*" style="display: none;">
                        <div id="manualReceiptImagePreview" style="display: none; margin-top: 10px; text-align: center;">
                            <img id="manualReceiptImg" style="max-width: 100%; max-height: 150px; border-radius: 8px;">
                            <div style="margin-top: 8px;">
                                <button type="button" id="removeManualReceipt" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 12px;">
                                    <i class="fas fa-trash"></i> Remove
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- ========== SENDER NAME FIELD ========== -->
                    <div style="margin: 15px 0;">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            <i class="fas fa-user"></i> Sender Name (GCash Account Name) *
                        </label>
                        <input type="text" id="manualSenderName" placeholder="Enter the name on your GCash account" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color, #ddd); background: var(--bg-primary, #fff);">
                    </div>
                    
                    <!-- ========== REFERENCE NUMBER FIELD ========== -->
                    <div style="margin: 15px 0;">
                        <label style="font-weight: 600; display: block; margin-bottom: 8px;">
                            <i class="fas fa-hashtag"></i> GCash Reference Number *
                        </label>
                        <input type="text" id="manualReferenceNo" placeholder="Enter the reference number from your GCash transaction" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color, #ddd); background: var(--bg-primary, #fff);">
                        <p style="font-size: 11px; color: #666; margin-top: 5px;">You can find this in your GCash transaction history</p>
                    </div>
                    
                    <div class="payment-steps" style="background: #e8f5e9; padding: 15px; border-radius: 12px; margin-top: 15px;">
                        <p><strong><i class="fas fa-info-circle"></i> How to pay via GCash:</strong></p>
                        <ol style="margin: 10px 0 0 20px;">
                            <li>Open GCash app</li>
                            <li>Tap "Send Money"</li>
                            <li>Enter GCash number: <strong>09152797837</strong></li>
                            <li>Enter amount: <strong>₱${total.toFixed(2)}</strong></li>
                            <li>Complete the payment</li>
                            <li>Take a screenshot of the transaction</li>
                            <li>Upload the screenshot above</li>
                            <li>Fill in your sender name and reference number</li>
                        </ol>
                    </div>
                </div>
            `;
            
            // Add event listeners for manual GCash upload
            setTimeout(() => {
                const receiptInput = document.getElementById('manualReceiptInput');
                if (receiptInput) {
                    receiptInput.removeEventListener('change', handleManualReceiptUpload);
                    receiptInput.addEventListener('change', handleManualReceiptUpload);
                }
                
                const removeBtn = document.getElementById('removeManualReceipt');
                if (removeBtn) {
                    removeBtn.removeEventListener('click', removeManualReceipt);
                    removeBtn.addEventListener('click', removeManualReceipt);
                }
                
                const senderName = document.getElementById('manualSenderName');
                const referenceNo = document.getElementById('manualReferenceNo');
                
                if (senderName) {
                    senderName.removeEventListener('input', validateManualForm);
                    senderName.addEventListener('input', validateManualForm);
                }
                if (referenceNo) {
                    referenceNo.removeEventListener('input', validateManualForm);
                    referenceNo.addEventListener('input', validateManualForm);
                }
            }, 100);
        }
            else if (method === 'GCash QR') {
                detailsEl.innerHTML = `
                    <div style="margin-bottom: 20px;">
                        <h4><i class="fas fa-boxes"></i> Your Order Items</h4>
                        <div style="background: var(--bg-secondary, #f8f9fa); border-radius: 12px; padding: 10px; max-height: 300px; overflow-y: auto;">
                            ${itemsHtml}
                        </div>
                        <div style="margin-top: 15px; padding: 15px; background: var(--bg-primary, #fff); border-radius: 12px; border: 1px solid var(--border-color, #eee);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>Subtotal:</span>
                                <span>₱${total.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>Shipping Fee:</span>
                                <span>₱50.00</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; border-top: 2px solid var(--border-color, #eee);">
                                <span>Total Amount:</span>
                                <span style="color: #2ecc71;">₱${(total + 50).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="payment-instruction" id="paymentQRInstruction">
                        <h4><i class="fas fa-qrcode"></i> GCash QR Code Payment</h4>
                        <div class="paymongo-info" style="background: #000000; padding: 15px; border-radius: 10px; margin: 15px 0;">
                            <p><strong>Amount:</strong> <span class="amount">₱${total.toFixed(2)}</span></p>
                            <p><strong>Merchant:</strong> SJC Supplies</p>
                            <p><strong>GCash Number:</strong> 09152797837</p>
                        </div>
                        <div class="payment-steps">
                            <p><strong>How to pay:</strong></p>
                            <ol>
                                <li>Open GCash app</li>
                                <li>Tap "Scan QR" or "Pay QR"</li>
                                <li>Click the button below to scan or upload your payment proof</li>
                                <li>Complete the payment</li>
                                <li>Upload your payment receipt/screenshot</li>
                            </ol>
                        </div>
                        <button class="btn-primary" id="openGcashQrBtn" style="width: 100%; margin-top: 15px;">
                            <i class="fas fa-qrcode"></i> Pay with GCash QR
                        </button>
                    </div>`;
                
                setTimeout(() => {
                    const openQrBtn = document.getElementById('openGcashQrBtn');
                    if (openQrBtn) {
                        openQrBtn.onclick = () => {
                            openGcashQrModal();
                        };
                    }
                }, 100);
            } 
            else if (method === 'Cash on Delivery') {
                detailsEl.innerHTML = `
                    <div style="margin-bottom: 20px;">
                        <h4><i class="fas fa-boxes"></i> Your Order Items</h4>
                        <div style="background: var(--bg-secondary, #f8f9fa); border-radius: 12px; padding: 10px; max-height: 300px; overflow-y: auto;">
                            ${itemsHtml}
                        </div>
                        <div style="margin-top: 15px; padding: 15px; background: var(--bg-primary, #fff); border-radius: 12px; border: 1px solid var(--border-color, #eee);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>Subtotal:</span>
                                <span>₱${total.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>Shipping Fee:</span>
                                <span>₱50.00</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; border-top: 2px solid var(--border-color, #eee);">
                                <span>Total Amount:</span>
                                <span style="color: #2ecc71;">₱${(total + 50).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="payment-instruction">
                        <h4>🚚 Cash on Delivery</h4>
                        <p>You have selected Cash on Delivery.</p>
                        <div class="cod-details" style="background: #e8f5e9; padding: 15px; border-radius: 10px; margin: 15px 0;">
                            <p>Please prepare exact amount when the driver arrives.</p>
                        </div>
                    </div>`;
            }

            const pw = document.getElementById('paymentWindow');
            if (pw) pw.dataset.method = method;
            
            const checkbox = document.getElementById('paymentCheckbox');
            const finalBtn = document.getElementById('finalConfirmBtn');
            if (checkbox) checkbox.checked = false;
            if (finalBtn) finalBtn.disabled = true;
            
            const confirmBuilding = document.getElementById('confirmBuilding');
            const confirmRoomNumber = document.getElementById('confirmRoomNumber');
            const confirmSpecialDelivery = document.getElementById('confirmSpecialDelivery');
            if (confirmBuilding) confirmBuilding.value = '';
            if (confirmRoomNumber) confirmRoomNumber.value = '';
            if (confirmSpecialDelivery) confirmSpecialDelivery.value = '';
        }

        function openPaymentWindow() {
            const pw = document.getElementById('paymentWindow');
            if (pw) { pw.classList.add('active'); document.body.style.overflow = 'hidden'; }
        }

        function closePaymentWindow() {
            const pw = document.getElementById('paymentWindow');
            if (pw) { pw.classList.remove('active'); document.body.style.overflow = ''; }
        }

        // ============================================
        // MANUAL GCASH UPLOAD FUNCTIONS
        // ============================================

        let manualGcashReceiptDataURL = null;
        let manualGcashReceiptFile = null;

        function handleManualReceiptUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (file.size > 2 * 1024 * 1024) {
                showToast('File too large. Max 2MB', 'error');
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                showToast('Please select an image file', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                manualGcashReceiptDataURL = e.target.result;
                manualGcashReceiptFile = file;
                
                const previewDiv = document.getElementById('manualReceiptImagePreview');
                const previewImg = document.getElementById('manualReceiptImg');
                const uploadDiv = document.getElementById('manualReceiptPreview');
                
                if (previewImg) previewImg.src = manualGcashReceiptDataURL;
                if (previewDiv) previewDiv.style.display = 'block';
                if (uploadDiv) uploadDiv.style.display = 'none';
                
                validateManualForm();
            };
            reader.readAsDataURL(file);
        }

        function removeManualReceipt() {
            manualGcashReceiptDataURL = null;
            manualGcashReceiptFile = null;
            
            const previewDiv = document.getElementById('manualReceiptImagePreview');
            const uploadDiv = document.getElementById('manualReceiptPreview');
            const fileInput = document.getElementById('manualReceiptInput');
            
            if (previewDiv) previewDiv.style.display = 'none';
            if (uploadDiv) uploadDiv.style.display = 'block';
            if (fileInput) fileInput.value = '';
            
            validateManualForm();
        }

        function validateManualForm() {
            const hasReceipt = manualGcashReceiptDataURL !== null;
            const senderName = document.getElementById('manualSenderName')?.value.trim() || '';
            const referenceNo = document.getElementById('manualReferenceNo')?.value.trim() || '';
            const finalBtn = document.getElementById('finalConfirmBtn');
            
            if (finalBtn) {
                finalBtn.disabled = !(hasReceipt && senderName && referenceNo);
            }
        }
        // ============================================
        // GCASH QR MODAL FUNCTIONS
        // ============================================

        let selectedProofImage = null;
        let proofConfirmed = false;

        function openGcashQrModal() {
            const modal = document.getElementById('gcashQrModal');
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                selectedProofImage = null;
                proofConfirmed = false;
                const doneBtn = document.getElementById('gcashDoneBtn');
                if (doneBtn) doneBtn.disabled = true;
                const previewDiv = document.getElementById('proofPreview');
                if (previewDiv) previewDiv.style.display = 'none';
                const checkbox = document.getElementById('proofConfirmed');
                if (checkbox) checkbox.checked = false;
                const fileInput = document.getElementById('proofImageInput');
                if (fileInput) fileInput.value = '';
            }
        }

        function closeGcashQrModal() {
            const modal = document.getElementById('gcashQrModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        function initGcashQrModal() {
            const selectBtn = document.getElementById('selectPictureBtn');
            const fileInput = document.getElementById('proofImageInput');
            const doneBtn = document.getElementById('gcashDoneBtn');
            const closeBtn = document.getElementById('gcashQrClose');
            const overlay = document.getElementById('gcashQrOverlay');
            const checkbox = document.getElementById('proofConfirmed');
            
            if (selectBtn) {
                selectBtn.addEventListener('click', () => {
                    if (fileInput) fileInput.click();
                });
            }
            
            if (fileInput) {
                fileInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                            showToast('File too large. Max 2MB', 'error');
                            return;
                        }
                        if (!file.type.startsWith('image/')) {
                            showToast('Please select an image file', 'error');
                            return;
                        }
                        
                        const reader = new FileReader();
                        reader.onload = function(ev) {
                            selectedProofImage = ev.target.result;
                            const previewDiv = document.getElementById('proofPreview');
                            const previewImg = document.getElementById('proofPreviewImage');
                            if (previewDiv && previewImg) {
                                previewImg.src = selectedProofImage;
                                previewDiv.style.display = 'block';
                            }
                            if (checkbox && checkbox.checked) {
                                if (doneBtn) doneBtn.disabled = false;
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
            
            if (checkbox) {
                checkbox.addEventListener('change', function() {
                    proofConfirmed = this.checked;
                    if (doneBtn) {
                        doneBtn.disabled = !(selectedProofImage && proofConfirmed);
                    }
                });
            }
            
            if (doneBtn) {
                doneBtn.addEventListener('click', async function() {
                    if (selectedProofImage && proofConfirmed) {
                        await processOrderWithProof();
                        closeGcashQrModal();
                    }
                });
            }
            
            if (closeBtn) {
                closeBtn.addEventListener('click', closeGcashQrModal);
            }
            
            if (overlay) {
                overlay.addEventListener('click', closeGcashQrModal);
            }
        }

        async function processOrderWithProof() {
            const user = getCurrentUser();
            const building = document.getElementById('confirmBuilding')?.value || '';
            const roomNumber = document.getElementById('confirmRoomNumber')?.value || '';
            const specialDelivery = document.getElementById('confirmSpecialDelivery')?.value || '';
            
            if (!building) { showToast('Building is required', 'error'); return; }
            if (!roomNumber) { showToast('Room Number is required', 'error'); return; }
            if (!specialDelivery) { showToast('Special Delivery instruction is required', 'error'); return; }
            
            const total = appState.cart.reduce((s, i) => s + (i.total || (i.price * i.quantity)), 0);
            
            const orderData = {
                userId: user.userId,
                total: total,
                paymentMethod: 'GCash QR',
                paymentProof: selectedProofImage,
                roomBuilding: building,
                roomNumber: roomNumber,
                specialDelivery: specialDelivery,
                items: appState.cart.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    productIcon: item.productIcon,
                    size: item.size,
                    price: item.price,
                    quantity: item.quantity
                }))
            };
            
            const confirmBtn = document.getElementById('finalConfirmBtn');
            const originalBtnText = confirmBtn?.innerHTML;
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }
            
            try {
                showToast('Processing order...', 'info');
                const data = await api.orders.checkout(orderData);
                
                if (data.success) {
                    appState.cart = [];
                    localStorage.removeItem('eduCart');
                    sessionStorage.setItem('justCheckedOut', 'true');
                    updateCartUI();
                    closePaymentWindow();
                    closeCart();
                    showSuccessOverlay('ORDER PLACED SUCCESSFULLY!');
                    await loadOrdersFromBackend();
                    updateStats();
                    setTimeout(() => { 
                        hideSuccessOverlay(); 
                        showToast('Order placed successfully!', 'success'); 
                        navigateTo('orders'); 
                    }, 1500);
                } else {
                    showToast(data.message || 'Checkout failed', 'error');
                    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.innerHTML = originalBtnText; }
                }
            } catch (error) {
                console.error('Checkout error:', error);
                showToast('Checkout failed: ' + error.message, 'error');
                if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.innerHTML = originalBtnText; }
            }
        }

        // ============================================
        // FINALIZE PAYMENT AND PLACE ORDER (FIXED)
        // ============================================
        async function finalizePaymentAndPlaceOrder() {
            const pw = document.getElementById('paymentWindow');
            if (!pw) return;
            
            const method = pw.dataset.method || 'Unknown';
            const checkbox = document.getElementById('paymentCheckbox');
            const checked = checkbox && checkbox.checked;

            if (!checked) {
                showToast('Please confirm by checking "I confirm that I have completed the payment"', 'error');
                return;
            }

            const user = getCurrentUser();
            const total = appState.cart.reduce((s, i) => s + (i.total || (i.price * i.quantity)), 0);
            
            // For GCash QR, use the existing modal function
            if (method === 'GCash QR') {
                openGcashQrModal();
                return;
            }
            
            // ========== MANUAL GCASH WITH UPLOAD ==========
            if (method === 'GCash Manual') {
                const receiptDataURL = manualGcashReceiptDataURL;
                const senderName = document.getElementById('manualSenderName')?.value.trim() || '';
                const referenceNo = document.getElementById('manualReferenceNo')?.value.trim() || '';
                
                if (!receiptDataURL) {
                    showToast('Please upload your payment receipt', 'error');
                    return;
                }
                if (!senderName) {
                    showToast('Please enter sender name', 'error');
                    return;
                }
                if (!referenceNo) {
                    showToast('Please enter reference number', 'error');
                    return;
                }
                
                const building = document.getElementById('confirmBuilding')?.value.trim() || '';
                const roomNumber = document.getElementById('confirmRoomNumber')?.value.trim() || '';
                const specialDelivery = document.getElementById('confirmSpecialDelivery')?.value.trim() || '';
                
                if (!building || !roomNumber || !specialDelivery) {
                    showToast(!building ? 'Building is required' : !roomNumber ? 'Room Number is required' : 'Special Delivery instruction is required', 'error');
                    return;
                }
                
                const orderData = {
                    userId: user.userId,
                    total: total,
                    paymentMethod: 'GCash Manual',
                    paymentReceipt: receiptDataURL,
                    gcashReference: referenceNo,
                    senderName: senderName,
                    roomBuilding: building,
                    roomNumber: roomNumber,
                    specialDelivery: specialDelivery,
                    items: appState.cart.map(item => ({
                        productId: item.productId,
                        productName: item.productName,
                        productIcon: item.productIcon,
                        size: item.size,
                        price: item.price,
                        quantity: item.quantity
                    }))
                };
                
                const confirmBtn = document.getElementById('finalConfirmBtn');
                const originalBtnText = confirmBtn?.innerHTML;
                if (confirmBtn) {
                    confirmBtn.disabled = true;
                    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                }
                
                try {
                    showToast('Submitting payment for verification...', 'info');
                    const data = await api.orders.checkout(orderData);
                    
                    if (data.success) {
                        appState.cart = [];
                        localStorage.removeItem('eduCart');
                        sessionStorage.setItem('justCheckedOut', 'true');
                        updateCartUI();
                        closePaymentWindow();
                        closeCart();
                        showSuccessOverlay('PAYMENT SUBMITTED!');
                        await loadOrdersFromBackend();
                        updateStats();
                        setTimeout(() => {
                            hideSuccessOverlay();
                            showToast('Payment submitted for admin verification!', 'success');
                            navigateTo('orders');
                        }, 1500);
                    } else {
                        showToast(data.message || 'Payment submission failed', 'error');
                        if (confirmBtn) {
                            confirmBtn.disabled = false;
                            confirmBtn.innerHTML = originalBtnText;
                        }
                    }
                } catch (error) {
                    console.error('Payment error:', error);
                    showToast('Payment submission failed: ' + error.message, 'error');
                    if (confirmBtn) {
                        confirmBtn.disabled = false;
                        confirmBtn.innerHTML = originalBtnText;
                    }
                }
                return;
            }   
            
            // ========== CASH ON DELIVERY ==========
            const building = document.getElementById('confirmBuilding')?.value.trim() || '';
            const roomNumber = document.getElementById('confirmRoomNumber')?.value.trim() || '';
            const specialDelivery = document.getElementById('confirmSpecialDelivery')?.value.trim() || '';
            
            if (!building || !roomNumber || !specialDelivery) {
                showToast(!building ? 'Building is required' : !roomNumber ? 'Room Number is required' : 'Special Delivery instruction is required', 'error');
                return;
            }
            
            const orderData = {
                userId: user.userId,
                total: total,
                paymentMethod: method,
                roomBuilding: building,
                roomNumber: roomNumber,
                specialDelivery: specialDelivery,
                items: appState.cart.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    productIcon: item.productIcon,
                    size: item.size,
                    price: item.price,
                    quantity: item.quantity
                }))
            };

            const confirmBtn = document.getElementById('finalConfirmBtn');
            const originalBtnText = confirmBtn?.innerHTML;
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }

            try {
                showToast('Processing order...', 'info');
                const data = await api.orders.checkout(orderData);
                
                if (data.success) {
                    appState.cart = [];
                    localStorage.removeItem('eduCart');
                    sessionStorage.setItem('justCheckedOut', 'true');
                    updateCartUI();
                    closePaymentWindow();
                    closeCart();
                    showSuccessOverlay('ORDER PLACED SUCCESSFULLY!');
                    await loadOrdersFromBackend();
                    updateStats();
                    setTimeout(() => { 
                        hideSuccessOverlay(); 
                        showToast('Order placed successfully!', 'success'); 
                        navigateTo('orders'); 
                    }, 1500);
                } else {
                    showToast(data.message || 'Checkout failed', 'error');
                    if (confirmBtn) { 
                        confirmBtn.disabled = false; 
                        confirmBtn.innerHTML = originalBtnText; 
                    }
                }
            } catch (error) {
                console.error('Checkout error:', error);
                showToast('Checkout failed: ' + error.message, 'error');
                if (confirmBtn) { 
                    confirmBtn.disabled = false; 
                    confirmBtn.innerHTML = originalBtnText; 
                }
            }
        }
            
            


        // ============================================
        // PROFILE FUNCTIONS
        // ============================================
        async function loadProfileFromBackend() {
            const user = getCurrentUser();
            if (!user || !user.userId) {
                console.log('⚠️ No user ID, using localStorage');
                loadProfileFromLocalStorage();
                return;
            }
            
            try {
                console.log('📥 Loading profile from backend...');
                const response = await api.profile.get(user.userId);
                
                if (response.success && response.profile) {
                    const profile = response.profile;
                    
                    localStorage.setItem('profile_fullName', profile.fullName || '');
                    localStorage.setItem('profile_email', profile.email || '');
                    localStorage.setItem('profile_phone', profile.phone || '');
                    localStorage.setItem('profile_dob', profile.dateOfBirth || '');
                    localStorage.setItem('profile_studentId', profile.studentId || '');
                    localStorage.setItem('profile_schoolYear', profile.schoolYear || '');
                    localStorage.setItem('profile_yearLevel', profile.yearLevel || '');
                    localStorage.setItem('profile_course', profile.course || '');
                    localStorage.setItem('profile_roomBuilding', profile.roomBuilding || '');
                    localStorage.setItem('profile_roomNumber', profile.roomNumber || '');
                    localStorage.setItem('profile_specialDelivery', profile.specialDelivery || '');
                    
                    if (profile.profileImage && profile.profileImage !== 'null' && profile.profileImage !== '') {
                        localStorage.setItem('userAvatar', profile.profileImage);
                        localStorage.setItem('profile_profileImage', profile.profileImage);
                        updateAvatarDisplay(profile.profileImage);
                    }
                    
                    appState.user.name = profile.fullName || appState.user.name;
                    appState.user.email = profile.email || appState.user.email;
                    appState.user.phone = profile.phone || appState.user.phone;
                    appState.user.id = user.userId;
                    
                    console.log('✅ Profile loaded from backend');
                }
            } catch (error) {
                console.error('❌ Failed to load from backend:', error);
            }
            
            loadProfileFromLocalStorage();
        }

        function loadProfileFromLocalStorage() {
            console.log('📥 Loading profile data from localStorage...');
            
            const savedName = localStorage.getItem('profile_fullName');
            const savedEmail = localStorage.getItem('profile_email');
            const savedPhone = localStorage.getItem('profile_phone');
            const savedDob = localStorage.getItem('profile_dob');
            const savedStudentId = localStorage.getItem('profile_studentId');
            const savedSchoolYear = localStorage.getItem('profile_schoolYear');
            const savedYearLevel = localStorage.getItem('profile_yearLevel');
            const savedCourse = localStorage.getItem('profile_course');
            
            if (savedName) appState.user.name = savedName;
            if (savedEmail) appState.user.email = savedEmail;
            if (savedPhone) appState.user.phone = savedPhone;
            
            const nameInput = document.getElementById('fullName');
            if (nameInput) nameInput.value = appState.user.name || '';
            
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.value = appState.user.email || '';
                emailInput.readOnly = true;
                emailInput.disabled = true;
            }
            
            const phoneInput = document.getElementById('phone');
            if (phoneInput) phoneInput.value = savedPhone || '';
            
            const dobInput = document.getElementById('dob');
            if (dobInput) dobInput.value = savedDob || '';
            
            const studentIdInput = document.getElementById('studentId');
            if (studentIdInput) studentIdInput.value = savedStudentId || '';
            
            const schoolYearInput = document.
            
            getElementById('schoolYear');
            if (schoolYearInput) schoolYearInput.value = savedSchoolYear || '';
            
            const yearLevelSelect = document.getElementById('yearLevel');
            if (yearLevelSelect && savedYearLevel) {
                yearLevelSelect.value = savedYearLevel;
            }
            
            const courseSelect = document.getElementById('course');
            if (courseSelect && savedCourse) {
                courseSelect.value = savedCourse;
            }
            
            loadRoomDataFromLocalStorage();
            
            const specialDeliveryInput = document.getElementById('specialDelivery');
            const savedSpecial = localStorage.getItem('profile_specialDelivery');
            if (specialDeliveryInput && savedSpecial) {
                specialDeliveryInput.value = savedSpecial;
            }
            
            const savedAvatar = localStorage.getItem('userAvatar');
            if (savedAvatar && savedAvatar !== 'null' && savedAvatar !== '') {
                updateAvatarDisplay(savedAvatar);
            }
            
            console.log('✅ Profile data loaded');
        }

        function loadRoomDataFromLocalStorage() {
            const savedBuilding = localStorage.getItem('profile_roomBuilding');
            const savedRoom = localStorage.getItem('profile_roomNumber');
            const savedSpecial = localStorage.getItem('profile_specialDelivery');
            
            const buildingSelect = document.getElementById('roomBuilding');
            const roomSelect = document.getElementById('roomNumber');
            const specialInput = document.getElementById('specialDelivery');
            
            if (buildingSelect && savedBuilding) {
                buildingSelect.value = savedBuilding;
                const event = new Event('change');
                buildingSelect.dispatchEvent(event);
                
                setTimeout(() => {
                    if (roomSelect && savedRoom) {
                        roomSelect.value = savedRoom;
                    }
                }, 100);
            }
            
            if (specialInput && savedSpecial) {
                specialInput.value = savedSpecial;
            }
        }

        function initRoomSelectors() {
            let buildingSelect = document.getElementById('roomBuilding');
            let roomSelect = document.getElementById('roomNumber');
            let confirmBuildingSelect = document.getElementById('confirmBuilding');
            let confirmRoomSelect = document.getElementById('confirmRoomNumber');
            
            if (buildingSelect && buildingSelect.tagName === 'INPUT') {
                const select = document.createElement('select');
                select.id = 'roomBuilding';
                select.className = buildingSelect.className;
                select.innerHTML = `
                    <option value="">Select Building</option>
                    <option value="Phinma Hall">Phinma Hall</option>
                    <option value="Dimasalang Hall">Dimasalang Hall</option>
                    <option value="Silang Hall">Silang Hall</option>
                `;
                buildingSelect.parentNode.replaceChild(select, buildingSelect);
                buildingSelect = select;
            }
            
            if (roomSelect && roomSelect.tagName === 'INPUT') {
                const select = document.createElement('select');
                select.id = 'roomNumber';
                select.className = roomSelect.className;
                select.innerHTML = '<option value="">Select Building First</option>';
                roomSelect.parentNode.replaceChild(select, roomSelect);
                roomSelect = select;
            }
            
            if (buildingSelect) {
                buildingSelect.addEventListener('change', function() {
                    const selectedBuilding = this.value;
                    populateRoomsByBuilding(selectedBuilding, roomSelect);
                    if (selectedBuilding) {
                        localStorage.setItem('profile_roomBuilding', selectedBuilding);
                        localStorage.removeItem('profile_roomNumber');
                    } else {
                        localStorage.removeItem('profile_roomBuilding');
                        localStorage.removeItem('profile_roomNumber');
                    }
                });
            }
            
            if (roomSelect) {
                roomSelect.addEventListener('change', function() {
                    if (this.value) {
                        localStorage.setItem('profile_roomNumber', this.value);
                    } else {
                        localStorage.removeItem('profile_roomNumber');
                    }
                });
            }
            
            if (confirmBuildingSelect && confirmBuildingSelect.tagName === 'INPUT') {
                const select = document.createElement('select');
                select.id = 'confirmBuilding';
                select.className = confirmBuildingSelect.className;
                select.innerHTML = `
                    <option value="">Select Building</option>
                    <option value="Phinma Hall">Phinma Hall</option>
                    <option value="Dimasalang Hall">Dimasalang Hall</option>
                    <option value="Silang Hall">Silang Hall</option>
                `;
                confirmBuildingSelect.parentNode.replaceChild(select, confirmBuildingSelect);
                confirmBuildingSelect = select;
            }
            
            if (confirmRoomSelect && confirmRoomSelect.tagName === 'INPUT') {
                const select = document.createElement('select');
                select.id = 'confirmRoomNumber';
                select.className = confirmRoomSelect.className;
                select.innerHTML = '<option value="">Select Building First</option>';
                confirmRoomSelect.parentNode.replaceChild(select, confirmRoomSelect);
                confirmRoomSelect = select;
            }
            
            if (confirmBuildingSelect) {
                confirmBuildingSelect.addEventListener('change', function() {
                    const selectedBuilding = this.value;
                    populateRoomsByBuilding(selectedBuilding, confirmRoomSelect);
                });
            }
        }

        async function savePersonalInfo(event) {
            event.preventDefault();
            
            const fullName = document.getElementById('fullName')?.value || '';
            const email = document.getElementById('email')?.value || '';
            let phone = document.getElementById('phone')?.value || '';
            const dob = document.getElementById('dob')?.value || '';
            let studentId = document.getElementById('studentId')?.value || '';
            let schoolYear = document.getElementById('schoolYear')?.value || '';
            const yearLevel = document.getElementById('yearLevel')?.value || '';
            const course = document.getElementById('course')?.value || '';
            
            const roomBuilding = document.getElementById('roomBuilding')?.value || '';
            const roomNumber = document.getElementById('roomNumber')?.value || '';
            const specialDelivery = document.getElementById('specialDelivery')?.value || '';
            
            const currentAvatar = localStorage.getItem('userAvatar') || localStorage.getItem('profile_profileImage') || '';
            
            if (phone) {
                phone = phone.replace(/\D/g, '');
                if (phone.length !== 11 || !phone.startsWith('09')) {
                    showToast('Phone number must be exactly 11 digits and start with 09', 'error');
                    return;
                }
            }
            
            if (!fullName || !email) {
                showToast('Name and email are required', 'error');
                return;
            }
            
            appState.user.name = fullName;
            appState.user.email = email;
            appState.user.phone = phone;
            
            localStorage.setItem('profile_fullName', fullName);
            localStorage.setItem('profile_email', email);
            localStorage.setItem('profile_phone', phone);
            localStorage.setItem('profile_dob', dob);
            localStorage.setItem('profile_studentId', studentId);
            localStorage.setItem('profile_schoolYear', schoolYear);
            localStorage.setItem('profile_yearLevel', yearLevel);
            localStorage.setItem('profile_course', course);
            localStorage.setItem('profile_roomBuilding', roomBuilding);
            localStorage.setItem('profile_roomNumber', roomNumber);
            localStorage.setItem('profile_specialDelivery', specialDelivery);
            
            const user = getCurrentUser();
            if (user && user.userId) {
                try {
                    await api.profile.update(user.userId, {
                        fullName, email, phone, dateOfBirth: dob,
                        studentId, schoolYear, yearLevel, course,
                        roomBuilding, roomNumber, specialDelivery,
                        profileImage: currentAvatar
                    });
                    console.log('✅ Profile saved to backend');
                } catch (error) {
                    console.error('❌ Failed to save to backend:', error);
                }
            }
            
            const topName = document.getElementById('topUserName');
            if (topName) topName.textContent = fullName.split(' ')[0];
            
            showToast('Personal information saved!', 'success');
        }

        function updateAvatarDisplay(profileImage) {
            const avatarIcon = document.getElementById('avatarIcon');
            const avatarPreview = document.getElementById('avatarPreview');
            
            if (profileImage && profileImage !== 'null' && profileImage !== '') {
                if (avatarIcon) avatarIcon.style.display = 'none';
                if (avatarPreview) {
                    avatarPreview.src = profileImage;
                    avatarPreview.style.display = 'block';
                }
                localStorage.setItem('userAvatar', profileImage);
                localStorage.setItem('profile_profileImage', profileImage);
            } else {
                if (avatarIcon) avatarIcon.style.display = 'flex';
                if (avatarPreview) {
                    avatarPreview.style.display = 'none';
                    avatarPreview.src = '';
                }
            }
        }

        // ============================================
        // NAVIGATION FUNCTIONS
        // ============================================
        function navigateTo(page) {
            if (!page) return;
            
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const el = document.getElementById(page);
            if (el) el.classList.add('active');

            document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.page === page) link.classList.add('active');
            });

            const hero = document.getElementById('heroSection');
            if (hero) hero.style.display = page === 'home' ? 'block' : 'none';

            appState.currentPage = page;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            closeMobileMenu();
            
            if (page === 'orders') renderOrders();
            else if (page === 'profile') { loadProfileFromLocalStorage(); }
        }

        function openMobileMenu() { 
            const menu = document.getElementById('mobileMenu'); 
            if (menu) menu.classList.add('active'); 
        }

        function closeMobileMenu() { 
            const menu = document.getElementById('mobileMenu'); 
            if (menu) menu.classList.remove('active'); 
        }

        // ============================================
        // SEARCH & FILTER FUNCTIONS
        // ============================================
        function handleSearch(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            if (searchTerm === '') { renderProducts(); return; }
            
            const filtered = appState.products.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                p.category.toLowerCase().includes(searchTerm) ||
                (p.description && p.description.toLowerCase().includes(searchTerm))
            );
            
            const allProducts = document.getElementById('allProducts');
            const featured = document.getElementById('featuredProducts');
            
            const productHTML = (product) => {
                const minPrice = product.sizes && product.sizes.length > 0 ? Math.min(...product.sizes.map(s => s.price)) : 0;
                const imageHtml = product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}" class="product-image">` : `<i class="${product.icon || 'fas fa-box'}"></i>`;
                return `<div class="product-card" onclick="openProductModal(${product.id})">
                    <div class="product-image-wrapper"><div class="product-badge">New</div>${imageHtml}<button class="quick-view" onclick="event.stopPropagation(); openProductModal(${product.id})">Quick View</button></div>
                    <div class="product-info"><div class="product-category">${product.category || 'Uncategorized'}</div><h3 class="product-name">${product.name}</h3><div class="product-price">₱${minPrice}</div></div>
                </div>`;
            };
            
            if (filtered.length === 0) {
                const emptyHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><i class="fas fa-search"></i><h3>No products found</h3><p>Try a different search term</p></div>`;
                if (allProducts) allProducts.innerHTML = emptyHTML;
                if (featured) featured.innerHTML = emptyHTML;
            } else {
                if (allProducts) allProducts.innerHTML = filtered.map(productHTML).join('');
                if (featured) featured.innerHTML = filtered.slice(0, 3).map(productHTML).join('');
            }
            
            if (appState.currentPage !== 'shop') navigateTo('shop');
        }

        function handleCriteriaFilter(category) {
            let filtered = [...appState.products];
            const filterBar = document.getElementById('activeFilterBar');
            const filterText = document.getElementById('activeFilterText');
            
            if (category && category !== 'all') {
                const categoryName = CATEGORY_MAP[category];
                if (categoryName) filtered = filtered.filter(p => p.category === categoryName);
                if (filterBar) filterBar.style.display = 'flex';
                if (filterText) filterText.textContent = `Showing: ${categoryName || category}`;
            } else {
                if (filterBar) filterBar.style.display = 'none';
            }
            
            const sortValue = document.getElementById('sortFilter')?.value || 'default';
            filtered = applySorting(filtered, sortValue);
            renderFilteredProducts(filtered);
        }

        function handleSortFilter(e) {
            const sortValue = e.target.value;
            let filtered = [...appState.products];
            const activeCategory = document.querySelector('.criteria-item[data-category].active');
            if (activeCategory && activeCategory.dataset.category !== 'all') {
                const categoryName = CATEGORY_MAP[activeCategory.dataset.category];
                if (categoryName) filtered = filtered.filter(p => p.category === categoryName);
            }
            filtered = applySorting(filtered, sortValue);
            renderFilteredProducts(filtered);
        }

        function applySorting(products, sortValue) {
            switch (sortValue) {
                case 'price-low': return [...products].sort((a, b) => {
                    const priceA = a.sizes ? Math.min(...a.sizes.map(s => s.price)) : 0;
                    const priceB = b.sizes ? Math.min(...b.sizes.map(s => s.price)) : 0;
                    return priceA - priceB;
                });
                case 'price-high': return [...products].sort((a, b) => {
                    const priceA = a.sizes ? Math.min(...a.sizes.map(s => s.price)) : 0;
                    const priceB = b.sizes ? Math.min(...b.sizes.map(s => s.price)) : 0;
                    return priceB - priceA;
                });
                case 'name': return [...products].sort((a, b) => a.name.localeCompare(b.name));
                default: return products;
            }
        }

        function renderFilteredProducts(products) {
            const allProducts = document.getElementById('allProducts');
            if (!allProducts) return;
            
            const productHTML = (product) => {
                const minPrice = product.sizes && product.sizes.length > 0 ? Math.min(...product.sizes.map(s => s.price)) : 0;
                const imageHtml = product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}" class="product-image">` : `<i class="${product.icon || 'fas fa-box'}"></i>`;
                return `<div class="product-card" onclick="openProductModal(${product.id})">
                    <div class="product-image-wrapper"><div class="product-badge">New</div>${imageHtml}<button class="quick-view" onclick="event.stopPropagation(); openProductModal(${product.id})">Quick View</button></div>
                    <div class="product-info"><div class="product-category">${product.category || 'Uncategorized'}</div><h3 class="product-name">${product.name}</h3><div class="product-price">₱${minPrice}</div></div>
                </div>`;
            };
            
            if (products.length === 0) {
                allProducts.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><i class="fas fa-box-open"></i><h3>No products found</h3><p>Try changing your filters</p></div>`;
            } else {
                allProducts.innerHTML = products.map(productHTML).join('');
            }
        }

        // ============================================
        // LOGOUT FUNCTION
        // ============================================
        async function handleLogout() {
            if (!confirm('Are you sure you want to logout?')) return;
            
            showToast('Logging out...', 'info');
            
            try {
                await api.auth.logout();
                console.log('✅ Logout successful on server');
            } catch (error) { 
                console.error('Logout API error:', error); 
            }
            
            appState.cart = [];
            appState.orders = [];
            appState.selectedProduct = null;
            appState.selectedSize = null;
            appState.selectedPaymentMethod = null;
            appState.tempPaymentReceiptDataURL = null;
            
            const keysToRemove = [
                'userId', 'userEmail', 'userName', 'userRole', 'authToken',
                'eduUser', 'eduCart', 'eduOrders', 'eduProducts', 'rememberMe', 
                'savedEmail', 'theme', 'userAvatar', 'roomInfo',
                'profile_fullName', 'profile_email', 'profile_phone', 'profile_dob', 
                'profile_studentId', 'profile_schoolYear', 'profile_yearLevel',
                'profile_course', 'profile_roomBuilding', 'profile_roomNumber', 
                'profile_specialDelivery', 'isLoggedIn', 'profile_profileImage'
            ];
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            sessionStorage.removeItem('justCheckedOut');
            
            showToast('✅ Logged out successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        }

        // ============================================
        // INITIALIZATION
        // ============================================
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('🚀 Dashboard loading...');
            console.log('🔧 API_BASE_URL:', API_BASE_URL);
            console.log('🌐 Current Host:', window.location.hostname);
            
            const storedUserId = localStorage.getItem('userId');
            if (storedUserId) {
                userId = storedUserId;
                appState.user.id = parseInt(storedUserId);
                console.log('🔄 User ID updated from localStorage:', userId);
            }
            
            const storedToken = localStorage.getItem('authToken');
            if (storedToken) {
                token = storedToken;
            }
            
            const user = getCurrentUser();
            if (!user) {
                showToast('Please login first', 'error');
                setTimeout(() => window.location.href = 'index.html', 1500);
                return;
            }
            
            if (user.name) appState.user.name = user.name;
            if (user.email) appState.user.email = user.email;
            if (user.userId) appState.user.id = user.userId;
            
            const justCheckedOut = sessionStorage.getItem('justCheckedOut');
            if (justCheckedOut === 'true') {
                appState.cart = [];
                localStorage.removeItem('eduCart');
                sessionStorage.removeItem('justCheckedOut');
                console.log('🛒 Cart cleared after checkout');
            } else {
                loadSavedData();
            }
            
            await loadProfileFromBackend();
            loadProfileFromLocalStorage();
            
            await loadProductsFromBackend();
            await loadOrdersFromBackend();
            await loadCartFromBackend();
            
            initializeEventListeners();
            updateUserInfo();
            initDarkMode(); // FIXED: Dark mode persists after refresh
            initRoomSelectors();
            initGcashQrModal();
            initPasswordStrengthMeter();
            initPasswordEyeButtons();
            initPasswordCancelButton();
            
            const profilePage = document.getElementById('profile');
            if (profilePage && profilePage.classList.contains('active')) {
                updateProfileOrderCounts(appState.orders.length, 
                    appState.orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
                    appState.orders.filter(o => o.status === 'completed' || o.status === 'delivered').length);
            }
            
            // Handle product links from chatbot
            handleProductLink();
        });

        function updateUserInfo() {
            const topName = document.getElementById('topUserName');
            const profileName = document.getElementById('profileUserName');
            const profileEmail = document.getElementById('profileUserEmail');
            
            if (topName) topName.textContent = appState.user.name || 'User';
            if (profileName) profileName.textContent = appState.user.name || 'User';
            if (profileEmail) profileEmail.textContent = appState.user.email || 'user@example.com';
            
            const fullNameInput = document.getElementById('fullName');
            const emailInput = document.getElementById('email');
            const phoneInput = document.getElementById('phone');
            if (fullNameInput) fullNameInput.value = appState.user.name || '';
            if (emailInput) emailInput.value = appState.user.email || '';
            if (phoneInput) phoneInput.value = appState.user.phone || '';
        }

        // ============================================
        // EVENT LISTENERS
        // ============================================
        function initializeEventListeners() {
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) themeToggle.addEventListener('click', toggleDarkMode);

            document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
                link.addEventListener('click', (e) => { e.preventDefault(); const page = e.target.closest('a')?.dataset.page; if (page) navigateTo(page); });
            });

            document.querySelectorAll('[data-page]').forEach(btn => {
                btn.addEventListener('click', (e) => { const page = e.target.closest('[data-page]')?.dataset.page; if (page) navigateTo(page); });
            });

            const mobileToggle = document.getElementById('mobileToggle');
            if (mobileToggle) mobileToggle.addEventListener('click', openMobileMenu);
            const closeMobileMenuBtn = document.getElementById('closeMobileMenu');
            if (closeMobileMenuBtn) closeMobileMenuBtn.addEventListener('click', closeMobileMenu);

            const cartBtn = document.getElementById('cartBtn');
            if (cartBtn) cartBtn.addEventListener('click', openCart);
            const cartClose = document.getElementById('cartClose');
            if (cartClose) cartClose.addEventListener('click', closeCart);
            const cartOverlay = document.getElementById('cartOverlay');
            if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

            const modalClose = document.getElementById('modalClose');
            if (modalClose) modalClose.addEventListener('click', closeProductModal);
            const modalOverlay = document.getElementById('modalOverlay');
            if (modalOverlay) modalOverlay.addEventListener('click', closeProductModal);

            const qtyMinus = document.getElementById('qtyMinus');
            if (qtyMinus) qtyMinus.addEventListener('click', decreaseQuantity);
            const qtyPlus = document.getElementById('qtyPlus');
            if (qtyPlus) qtyPlus.addEventListener('click', increaseQuantity);
            const modalQuantity = document.getElementById('modalQuantity');
            if (modalQuantity) modalQuantity.addEventListener('change', updateModalPrice);

            const addToCartModal = document.getElementById('addToCartModal');
            if (addToCartModal) addToCartModal.addEventListener('click', addToCart);

            const checkoutBtn = document.getElementById('checkoutBtn');
            if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);
            const checkoutClose = document.getElementById('checkoutClose');
            if (checkoutClose) checkoutClose.addEventListener('click', closeCheckoutModal);
            const checkoutOverlay = document.getElementById('checkoutOverlay');
            if (checkoutOverlay) checkoutOverlay.addEventListener('click', closeCheckoutModal);
            const btnBackToCart = document.getElementById('btnBackToCart');
            if (btnBackToCart) btnBackToCart.addEventListener('click', () => { closeCheckoutModal(); setTimeout(openCart, 200); });
            const confirmCheckoutBtn = document.getElementById('confirmCheckoutBtn');
            if (confirmCheckoutBtn) confirmCheckoutBtn.addEventListener('click', proceedToPaymentWindow);

            document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    appState.selectedPaymentMethod = e.target.value;
                    const confirmText = document.getElementById('paymentCheckbox')?.nextSibling;
                    if (confirmText) confirmText.textContent = e.target.value === 'Cash on Delivery' ? ' I confirm my order with Cash on Delivery' : ' I confirm that I have completed the payment';
                });
            });

            const paymentClose = document.getElementById('paymentClose');
            if (paymentClose) paymentClose.addEventListener('click', closePaymentWindow);
            const paymentOverlay = document.getElementById('paymentOverlay');
            if (paymentOverlay) paymentOverlay.addEventListener('click', closePaymentWindow);
            const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
            if (cancelPaymentBtn) cancelPaymentBtn.addEventListener('click', closePaymentWindow);
            
            // FIXED: Use the correct function name
            const finalConfirmBtn = document.getElementById('finalConfirmBtn');
            if (finalConfirmBtn) finalConfirmBtn.addEventListener('click', finalizePaymentAndPlaceOrder);

            const paymentCheckbox = document.getElementById('paymentCheckbox');
            if (paymentCheckbox) paymentCheckbox.addEventListener('change', (e) => {
                const finalBtn = document.getElementById('finalConfirmBtn');
                if (finalBtn) finalBtn.disabled = !e.target.checked;
            });

            const successOverlay = document.getElementById('successOverlay');
            if (successOverlay) successOverlay.addEventListener('click', () => successOverlay.classList.remove('active'));

            document.querySelectorAll('.profile-menu-item').forEach(item => {
                item.addEventListener('click', (e) => { e.preventDefault(); const tab = e.target.closest('a')?.dataset.tab; if (tab) switchProfileTab(tab); });
            });

            const personalForm = document.getElementById('personalForm');
            if (personalForm) personalForm.addEventListener('submit', savePersonalInfo);
            
            const passwordForm = document.getElementById('passwordForm');
            if (passwordForm) {
                passwordForm.addEventListener('submit', changePassword);
            }
            
            const addressForm = document.getElementById('addressForm');
            if (addressForm) addressForm.addEventListener('submit', (e) => { e.preventDefault(); showToast('Address saved successfully!'); });

            document.querySelectorAll('.filter-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                    e.target.classList.add('active');
                    filterOrders(e.target.dataset.status);
                });
            });

            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.addEventListener('input', handleSearch);
            const sortFilter = document.getElementById('sortFilter');
            if (sortFilter) sortFilter.addEventListener('change', handleSortFilter);

            document.querySelectorAll('.criteria-item[data-category]').forEach(item => {
                item.addEventListener('click', (e) => {
                    const btn = e.target.closest('.criteria-item');
                    if (!btn) return;
                    const category = btn.dataset.category;
                    document.querySelectorAll('.criteria-item[data-category]').forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    handleCriteriaFilter(category);
                });
            });

            const clearFilterBtn = document.getElementById('clearFilterBtn');
            if (clearFilterBtn) {
                clearFilterBtn.addEventListener('click', () => {
                    document.querySelectorAll('.criteria-item[data-category]').forEach(c => c.classList.remove('active'));
                    document.querySelector('.criteria-item[data-category="all"]')?.classList.add('active');
                    handleCriteriaFilter('all');
                });
            }
            
            const phoneInput = document.getElementById('phone');
            if (phoneInput) {
                phoneInput.addEventListener('input', function(e) {
                    let value = this.value.replace(/\D/g, '');
                    if (value.length > 11) {
                        value = value.slice(0, 11);
                    }
                    this.value = value;
                });
            }
            
            const studentIdInput = document.getElementById('studentId');
            if (studentIdInput) {
                studentIdInput.addEventListener('input', function(e) {
                    let value = this.value;
                    let digits = value.replace(/\D/g, '');
                    if (digits.length > 2) {
                        digits = digits.slice(0, 2) + '-' + digits.slice(2);
                    }
                    if (digits.length > 7) {
                        digits = digits.slice(0, 7) + '-' + digits.slice(7);
                    }
                    if (digits.length > 14) {
                        digits = digits.slice(0, 14);
                    }
                    this.value = digits;
                });
            }
            
            // Avatar upload
            const avatarUpload = document.getElementById('avatarUpload');
            if (avatarUpload) {
                avatarUpload.addEventListener('change', async function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                            showToast('File too large. Max 2MB', 'error');
                            return;
                        }
                        if (!file.type.startsWith('image/')) {
                            showToast('Please select an image file', 'error');
                            return;
                        }
                        
                        const reader = new FileReader();
                        reader.onload = async function(ev) {
                            const profileImage = ev.target.result;
                            updateAvatarDisplay(profileImage);
                            showToast('Uploading profile picture...', 'info');
                            
                            const user = getCurrentUser();
                            if (user && user.userId) {
                                try {
                                    await api.profile.updateProfileImage(user.userId, profileImage);
                                    showToast('Profile picture updated!', 'success');
                                } catch (error) {
                                    showToast('Failed to save to server', 'error');
                                    const savedAvatar = localStorage.getItem('userAvatar');
                                    updateAvatarDisplay(savedAvatar);
                                }
                            } else {
                                localStorage.setItem('userAvatar', profileImage);
                                showToast('Profile picture saved locally!', 'success');
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        }

        function switchProfileTab(tab) {
            document.querySelectorAll('.profile-menu-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.tab === tab) item.classList.add('active');
            });
            document.querySelectorAll('.profile-tab').forEach(t => {
                t.classList.remove('active');
                if (t.id === tab) t.classList.add('active');
            });
        }

        // ============================================
        // PRODUCT QUICK VIEW FROM CHATBOT LINKS
        // ============================================
        function handleProductLink() {
            const urlParams = new URLSearchParams(window.location.search);
            const page = urlParams.get('page');
            const productId = urlParams.get('productId');
            
            if (page === 'shop' && productId) {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
                
                navigateTo('shop');
                
                const openModal = () => {
                    if (appState.products.length > 0) {
                        openProductModal(parseInt(productId));
                    } else {
                        setTimeout(openModal, 100);
                    }
                };
                
                setTimeout(openModal, 300);
            }
        }

        // ============================================
        // AI CHATBOT FUNCTIONALITY
        // ============================================
        (function() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initChatbot);
            } else {
                initChatbot();
            }

            function initChatbot() {
                const chatbotButton = document.getElementById('chatbotButton');
                const chatbotWindow = document.getElementById('chatbotWindow');
                const chatbotClose = document.getElementById('chatbotClose');
                const chatbotInput = document.getElementById('chatbotInput');
                const chatbotSend = document.getElementById('chatbotSend');
                const chatbotMessages = document.getElementById('chatbotMessages');
                const chatbotTyping = document.getElementById('chatbotTyping');

                if (!chatbotButton || !chatbotWindow || !chatbotClose || !chatbotInput || !chatbotSend || !chatbotMessages || !chatbotTyping) {
                    console.warn('Chatbot elements not found');
                    return;
                }

                chatbotButton.addEventListener('click', function() {
                    chatbotWindow.classList.toggle('active');
                    if (chatbotWindow.classList.contains('active')) {
                        chatbotInput.focus();
                        loadChatHistory();
                    }
                });

                chatbotClose.addEventListener('click', function() {
                    chatbotWindow.classList.remove('active');
                });

                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && chatbotWindow.classList.contains('active')) {
                        chatbotWindow.classList.remove('active');
                    }
                });

                async function loadChatHistory() {
                    const user = getCurrentUser();
                    if (!user || !user.userId) return;
                    
                    try {
                        const response = await api.chatbot.getHistory(user.userId);
                        if (response && Array.isArray(response) && response.length > 0) {
                            const existingMessages = chatbotMessages.querySelectorAll('.chatbot-message');
                            if (existingMessages.length <= 1) {
                                response.slice().reverse().forEach(msg => {
                                    addMessageToChat(msg.userMessage, 'user', new Date(msg.createdAt));
                                    addMessageToChat(msg.botResponse, 'bot', new Date(msg.createdAt));
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Failed to load chat history:', error);
                    }
                }

                async function sendMessageToBackend(message, userId) {
                    try {
                        const response = await api.chatbot.sendMessage(userId, message);
                        return response;
                    } catch (error) {
                        console.error('Chatbot API error:', error);
                        return null;
                    }
                }

                async function sendMessage() {
                    const message = chatbotInput.value.trim();
                    if (message === '') return;

                    const user = getCurrentUser();
                    if (!user || !user.userId) {
                        addMessageToChat("Please login first to use the AI assistant. Go to the login page and sign in to your account.", 'bot');
                        chatbotInput.value = '';
                        return;
                    }

                    addMessageToChat(message, 'user');
                    chatbotInput.value = '';

                    chatbotTyping.classList.add('active');
                    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

                    const response = await sendMessageToBackend(message, user.userId);
                    
                    chatbotTyping.classList.remove('active');

                    if (response && response.reply) {
                        addMessageToChat(response.reply, 'bot');
                    } else if (response && response.message) {
                        addMessageToChat(response.message, 'bot');
                    } else {
                        addMessageToChat(getFallbackResponse(message), 'bot');
                    }
                }

                function addMessageToChat(text, sender, timestamp = null) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'chatbot-message ' + sender;
                    
                    const now = timestamp ? new Date(timestamp) : new Date();
                    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    const isHtml = text.includes('<div') || text.includes('<a');
                    
                    if (sender === 'bot') {
                        messageDiv.innerHTML = `
                            <div class="message-avatar">
                                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=SJC&backgroundColor=2ecc71" alt="SJC AI">
                            </div>
                            <div class="message-content">
                                <div class="message-text">${isHtml ? text : escapeHtml(text)}</div>
                                <div class="message-time">${time}</div>
                            </div>
                        `;
                    } else {
                        messageDiv.innerHTML = `
                            <div class="message-content">
                                <div class="message-text">${escapeHtml(text)}</div>
                                <div class="message-time">${time}</div>
                            </div>
                        `;
                    }
                    
                    chatbotMessages.appendChild(messageDiv);
                    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
                }

                function getFallbackResponse(message) {
                    const msg = message.toLowerCase().trim();
                    
                    if (/^(hello|hi|hey|kamusta|musta)/i.test(msg)) {
                        return "Hello! Welcome to SJC Supplies! How can I help you with your school supplies today?";
                    }
                    else if (/(product|item|supplies|binebenta)/i.test(msg)) {
                        return "We have Paper Products, Writing Tools, Coloring Materials, and Storage items. Type 'products' to see all!";
                    }
                    else if (/(price|cost|magkano|presyo)/i.test(msg)) {
                        return "Bond Paper: ₱20, Gel Pens: ₱149, Colored Pencils: ₱149, Notebook: ₱45. Need specific product prices?";
                    }
                    else if (/(order|bili|checkout|cart)/i.test(msg)) {
                        return "To order: Go to Shop > Add to Cart > Checkout > Choose Payment > Confirm Order. Need help?";
                    }
                    else if (/(track|delivery|status|nasaan)/i.test(msg)) {
                        return "Go to 'My Orders' page to track your delivery status and see your tracking number.";
                    }
                    else if (/(payment|pay|gcash|cod|bayad)/i.test(msg)) {
                        return "We accept GCash (09152797837) and Cash on Delivery. Choose your preferred method at checkout.";
                    }
                    else if (/(help|tulong|what can you do)/i.test(msg)) {
                        return "I can help with: Products, Prices, Orders, Tracking, Payments, Account, and Room Delivery info!";
                    }
                    else if (/(thank|thanks|salamat)/i.test(msg)) {
                        return "You're welcome! Happy shopping at SJC Supplies!";
                    }
                    else if (/(room|building|phinma|dimasalang|silang)/i.test(msg)) {
                        return "Available buildings: Phinma Hall, Dimasalang Hall, Silang Hall. Room format: PH201, DH305, S108";
                    }
                    else {
                        return "I'm here to help! Try typing 'products', 'help', or ask about prices and orders. Pwede ka ring mag-Tagalog!";
                    }
                }

                chatbotSend.addEventListener('click', sendMessage);
                
                chatbotInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessage();
                    }
                });

                chatbotInput.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
                });
            }
        })();

        // Make functions global
        window.openProductModal = openProductModal;
        window.selectSize = selectSize;
        window.removeFromCart = removeFromCart;
        window.cancelOrder = cancelOrder;
        window.navigateTo = navigateTo;
        window.updateCartItemQuantity = updateCartItemQuantity;
        window.updateCartItemQuantityFromInput = updateCartItemQuantityFromInput;
        window.finalizePaymentAndPlaceOrder = finalizePaymentAndPlaceOrder; 