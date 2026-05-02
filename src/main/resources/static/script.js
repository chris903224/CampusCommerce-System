// ==================== API CONFIGURATION ====================
// Detect if running on ngrok, localhost, or railway
const isNgrok = window.location.hostname.includes('ngrok-free.dev');
const isRailway = window.location.hostname.includes('up.railway.app');
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

let API_BASE_URL;

if (isRailway) {
    API_BASE_URL = 'https://' + window.location.hostname + '/api';
} else if (isLocalhost) {
    API_BASE_URL = 'http://localhost:8080/api';
} else if (isNgrok) {
    API_BASE_URL = '/api';
} else {
    API_BASE_URL = '/api';
}

console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🌐 Host:', window.location.hostname);
console.log('📡 Mode:', isRailway ? 'Railway (Production)' : (isLocalhost ? 'Local' : (isNgrok ? 'Ngrok' : 'Unknown')));

// ==================== CONFIG ====================
const CONFIG = {
    API_BASE_URL: API_BASE_URL,
    OTP_EXPIRY: 300,
    MAX_OTP_RESENDS: 5,
    WELCOME_SCREEN_DURATION: 2800,
    TOAST_DURATION: 3000,
    SESSION_DURATION: 24 * 60 * 60 * 1000,
    REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000
};

// ==================== API ENDPOINTS ====================
const ENDPOINTS = {
    TEST: `${CONFIG.API_BASE_URL}/auth/test`,
    LOGIN: `${CONFIG.API_BASE_URL}/auth/login`,
    REGISTER: `${CONFIG.API_BASE_URL}/auth/register`,
    FORGOT_PASSWORD: `${CONFIG.API_BASE_URL}/auth/forgot-password`,
    VERIFY_OTP: `${CONFIG.API_BASE_URL}/auth/verify-otp`,
    RESEND_OTP: `${CONFIG.API_BASE_URL}/auth/resend-otp`,
    CHECK_EMAIL: `${CONFIG.API_BASE_URL}/auth/check-email`,
    SESSION_CHECK: `${CONFIG.API_BASE_URL}/auth/session-check`
};

// ==================== DOM ELEMENTS ====================
const elements = {
    welcomeScreen: document.getElementById('welcomeScreen'),
    loginToggle: document.getElementById('loginToggle'),
    signupToggle: document.getElementById('signupToggle'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    forgotForm: document.getElementById('forgotForm'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    switchToSignup: document.getElementById('switchToSignup'),
    switchToLogin: document.getElementById('switchToLogin'),
    switchBackToLogin: document.getElementById('switchBackToLogin'),
    toast: document.getElementById('toast'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    rememberMe: document.getElementById('rememberMe'),
    signupName: document.getElementById('signupName'),
    signupEmail: document.getElementById('signupEmail'),
    signupPassword: document.getElementById('signupPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    forgotEmail: document.getElementById('forgotEmail')
};

// ==================== STATE MANAGEMENT ====================
const state = {
    currentUserEmail: '',
    otpTimerInterval: null,
    otpResendCount: 0,
    maxResendReached: false,
    isRedirecting: false
};

// ==================== SESSION CHECK FUNCTION ====================
async function checkBackendSession() {
    if (state.isRedirecting) {
        return null;
    }
    
    try {
        console.log('🔍 Checking session at:', ENDPOINTS.SESSION_CHECK);
        
        const response = await fetch(ENDPOINTS.SESSION_CHECK, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('📡 Session check response status:', response.status);
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            console.warn('⚠️ Server returned HTML instead of JSON - endpoint may not exist yet');
            return null;
        }
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Active session found:', data);
            return data;
        }
        
        if (response.status === 401 || response.status === 403) {
            console.log('ℹ️ No active session (401/403 response)');
            return null;
        }
        
        return null;
    } catch (error) {
        console.log('ℹ️ Session check skipped:', error.message);
        return null;
    }
}

// ==================== UTILITY FUNCTIONS ====================
const utils = {
    validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    
    validatePhinmaEmail: (email) => email.endsWith('@phinmaed.com'),
    
    // ✅ FIXED FULL NAME VALIDATION - More flexible
    validateFullName: (name) => {
        if (!name || !name.trim()) {
            return 'Please enter your full name';
        }
        
        // Remove extra spaces and trim
        const cleanName = name.trim().replace(/\s+/g, ' ');
        const words = cleanName.split(' ');
        
        if (words.length < 2) {
            return 'Please enter both first name and last name';
        }
        
        if (words.length > 4) {
            return 'Please enter a valid name (max 4 words)';
        }
        
        // Check each word has at least 2 characters
        for (let word of words) {
            if (word.length < 2) {
                return `"${word}" is too short. Please enter full name properly.`;
            }
        }
        
        // Auto-format the name (capitalize first letter of each word)
        const formattedName = words.map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
        
        return { isValid: true, formattedName: formattedName };
    },
    
    formatFullName: (name) => {
        const cleanName = name.trim().replace(/\s+/g, ' ');
        const words = cleanName.split(' ');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    },
    
    validatePassword: (password) => {
        if (!password || password.length < 8) {
            return "Password must be at least 8 characters";
        }
        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter";
        }
        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter";
        }
        if (!/[0-9]/.test(password)) {
            return "Password must contain at least one number";
        }
        if (!/[!@#$%^&*]/.test(password)) {
            return "Password must contain at least one special character (!@#$%^&*)";
        }
        return null;
    },
    
    showToast: (message, type = 'info') => {
        if (!elements.toast) return;
        
        const colors = {
            success: 'rgba(76, 175, 145, 0.95)',
            error: 'rgba(228, 101, 245, 0.95)',
            info: 'rgba(93, 226, 146, 0.95)',
            warning: 'rgba(251, 191, 36, 0.95)'
        };
        
        elements.toast.textContent = message;
        elements.toast.className = 'toast show';
        elements.toast.style.background = colors[type] || colors.info;
        
        setTimeout(() => elements.toast.classList.remove('show'), CONFIG.TOAST_DURATION);
    },
    
    saveUserToStorage: (userData) => {
        const user = {
            ...userData,
            loginTime: Date.now(),
            rememberMe: true,
            expiryTime: Date.now() + CONFIG.REMEMBER_ME_DURATION
        };
        localStorage.setItem('eduUser', JSON.stringify(user));
        localStorage.setItem('rememberMePref', 'true');
    },
    
    clearTimer: () => {
        if (state.otpTimerInterval) {
            clearInterval(state.otpTimerInterval);
            state.otpTimerInterval = null;
        }
    },
    
    resetOtpState: () => {
        state.otpResendCount = 0;
        state.maxResendReached = false;
        utils.clearTimer();
    }
};

// ==================== FORM HANDLING ====================
const formHandler = {
    showForm: (formToShow) => {
        if (elements.loginForm) elements.loginForm.style.display = 'none';
        if (elements.signupForm) elements.signupForm.style.display = 'none';
        if (elements.forgotForm) elements.forgotForm.style.display = 'none';
        
        if (formToShow) formToShow.style.display = 'flex';
        
        const otpDiv = document.getElementById('otpVerificationDiv');
        if (otpDiv) otpDiv.remove();
        
        utils.clearTimer();
        utils.resetOtpState();
    },
    
    togglePassword: (inputId) => {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const icon = input.parentElement.querySelector('.toggle-password');
        const isPassword = input.type === 'password';
        
        input.type = isPassword ? 'text' : 'password';
        if (icon) {
            icon.classList.toggle('fa-eye', !isPassword);
            icon.classList.toggle('fa-eye-slash', isPassword);
        }
    }
};

// ==================== OTP HANDLING ====================
const otpHandler = {
    createOtpForm: () => {
        const otpDiv = document.createElement('div');
        otpDiv.id = 'otpVerificationDiv';
        otpDiv.className = 'form otp-form';
        otpDiv.style.cssText = 'display: flex; flex-direction: column; animation: slideIn 0.3s ease;';
        
        const resendsLeft = CONFIG.MAX_OTP_RESENDS - state.otpResendCount;
        const resendDisabled = state.maxResendReached || resendsLeft <= 0;
        
        otpDiv.innerHTML = `
            <h2><i class="fas fa-key"></i> Email Verification</h2>
            <p class="instruction">We've sent a 6-digit code to:</p>
            <p class="instruction" style="font-weight: bold; color: #00fbff;">${state.currentUserEmail}</p>
            
            <div class="input-group">
                <i class="fas fa-lock"></i>
                <input type="text" id="otpCode" placeholder="Enter 6-digit OTP" maxlength="6" required>
                <div class="input-focus-line"></div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button type="button" class="submit-btn" id="verifyOtpBtn" style="flex: 2;">
                    <span class="btn-text">Verify Email</span>
                    <i class="fas fa-check"></i>
                </button>
                <button type="button" class="submit-btn" id="resendOtpBtn" style="flex: 1;" ${resendDisabled ? 'disabled' : ''}>
                    <i class="fas fa-redo"></i>
                </button>
            </div>
            
            <p class="timer-text" id="otpTimer">Code expires in 05:00</p>
            
            <p class="switch-form">
                <a href="#" id="backToLoginFromOtp">← Back to Login</a>
            </p>
        `;
        
        document.querySelector('.glass-card').appendChild(otpDiv);
        
        document.getElementById('verifyOtpBtn').addEventListener('click', () => otpHandler.verify());
        
        const resendBtn = document.getElementById('resendOtpBtn');
        if (resendBtn && !state.maxResendReached && state.otpResendCount < CONFIG.MAX_OTP_RESENDS) {
            resendBtn.addEventListener('click', () => otpHandler.resend());
        }
        
        document.getElementById('backToLoginFromOtp').addEventListener('click', (e) => {
            e.preventDefault();
            utils.resetOtpState();
            if (elements.loginToggle) elements.loginToggle.click();
        });
        
        setTimeout(() => document.getElementById('otpCode')?.focus(), 100);
        otpHandler.startTimer();
    },
    
    startTimer: () => {
        let timeLeft = CONFIG.OTP_EXPIRY;
        const timerEl = document.getElementById('otpTimer');
        if (!timerEl) return;
        
        utils.clearTimer();
        
        state.otpTimerInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            timerEl.textContent = `Code expires in ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                utils.clearTimer();
                timerEl.textContent = 'Code expired';
                timerEl.style.color = '#f56565';
            }
            timeLeft--;
        }, 1000);
    },
    
    show: (email) => {
        state.currentUserEmail = email;
        utils.resetOtpState();
        
        if (elements.loginForm) elements.loginForm.style.display = 'none';
        if (elements.signupForm) elements.signupForm.style.display = 'none';
        if (elements.forgotForm) elements.forgotForm.style.display = 'none';
        
        const existingOtp = document.getElementById('otpVerificationDiv');
        if (existingOtp) existingOtp.remove();
        
        otpHandler.createOtpForm();
    },
    
    verify: async () => {
        const otp = document.getElementById('otpCode')?.value;
        const verifyBtn = document.getElementById('verifyOtpBtn');
        const originalText = verifyBtn ? verifyBtn.innerHTML : '';
        
        if (!otp || otp.length !== 6) {
            utils.showToast('Please enter 6-digit OTP', 'error');
            return;
        }
        
        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<span class="btn-text">Verifying...</span> <i class="fas fa-spinner fa-spin"></i>';
        }
        
        try {
            const response = await fetch(ENDPOINTS.VERIFY_OTP, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    email: state.currentUserEmail,
                    otp: otp,
                    type: 'REGISTRATION'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                utils.showToast('✅ Email verified!', 'success');
                utils.clearTimer();
                
                const otpDiv = document.getElementById('otpVerificationDiv');
                if (otpDiv) otpDiv.remove();
                
                setTimeout(() => {
                    if (elements.loginToggle) elements.loginToggle.click();
                    if (elements.loginEmail) elements.loginEmail.value = state.currentUserEmail;
                    utils.showToast('Please login with your credentials', 'info');
                }, 1500);
            } else {
                utils.showToast(data.message || '❌ Verification failed', 'error');
                if (verifyBtn) {
                    verifyBtn.disabled = false;
                    verifyBtn.innerHTML = originalText;
                }
            }
        } catch (error) {
            console.error('❌ OTP error:', error);
            utils.showToast('❌ Network error', 'error');
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = originalText;
            }
        }
    },
    
    resend: async () => {
        if (state.otpResendCount >= CONFIG.MAX_OTP_RESENDS) {
            state.maxResendReached = true;
            utils.showToast('Maximum resends reached', 'warning');
            return;
        }
        
        const resendBtn = document.getElementById('resendOtpBtn');
        const originalText = resendBtn ? resendBtn.innerHTML : '';
        
        state.otpResendCount++;
        
        if (resendBtn) {
            resendBtn.disabled = true;
            resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        try {
            const response = await fetch(ENDPOINTS.RESEND_OTP, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ 
                    email: state.currentUserEmail,
                    type: 'REGISTRATION'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                utils.showToast('✅ New OTP sent', 'success');
                otpHandler.startTimer();
                const otpInput = document.getElementById('otpCode');
                if (otpInput) otpInput.value = '';
            } else {
                utils.showToast('❌ Failed to resend', 'error');
                state.otpResendCount--;
            }
            
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.innerHTML = '<i class="fas fa-redo"></i>';
            }
        } catch (error) {
            console.error('❌ Resend error:', error);
            utils.showToast('❌ Network error', 'error');
            state.otpResendCount--;
            
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.innerHTML = '<i class="fas fa-redo"></i>';
            }
        }
    }
};

// ==================== API CALLS ====================
const api = {
    login: async (email, password) => {
        const response = await fetch(ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: email, 
                password: password 
            }),
            credentials: 'include'
        });
        return response;
    },
    
    register: async (fullName, email, password) => {
        console.log('📤 REGISTER API CALL:', { fullName, email, password });
        
        try {
            const response = await fetch(ENDPOINTS.REGISTER, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ 
                    fullName: fullName,
                    email: email, 
                    password: password
                })
            });
            
            const data = await response.json();
            console.log('📥 REGISTER RESPONSE:', data);
            return data;
            
        } catch (error) {
            console.error('❌ REGISTER ERROR:', error);
            return { success: false, message: 'Network error' };
        }
    },
    
    forgotPassword: async (email) => {
        const response = await fetch(ENDPOINTS.FORGOT_PASSWORD, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ email })
        });
        return await response.json();
    },
    
    checkEmail: async (email) => {
        const response = await fetch(ENDPOINTS.CHECK_EMAIL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ email })
        });
        return await response.json();
    }
};

// ==================== REDIRECT FUNCTION ====================
function redirectToDashboard() {
    if (state.isRedirecting) return;
    state.isRedirecting = true;
    console.log('🚀 Redirecting to dashboard.html');
    window.location.replace('dashboard.html');
}

// ==================== EVENT HANDLERS ====================
const handlers = {
    // ✅ FIXED LOGIN HANDLER - REMOVED REMEMBER ME CONDITION
    login: async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!elements.loginEmail || !elements.loginPassword) return;
        
        const email = elements.loginEmail.value;
        const password = elements.loginPassword.value;
        const rememberMe = elements.rememberMe?.checked || false;
        
        console.log('📝 Login attempt:', { email, rememberMe: rememberMe ? 'Yes' : 'No' });
        
        if (!utils.validateEmail(email)) {
            utils.showToast('Invalid email address', 'error');
            return;
        }
        
        if (!utils.validatePhinmaEmail(email)) {
            utils.showToast('Only @phinmaed.com emails allowed', 'error');
            return;
        }
        
        if (!password || password.length < 6) {
            utils.showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('.submit-btn');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Login';
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-text">Logging in...</span> <i class="fas fa-spinner fa-spin"></i>';
        }
        utils.showToast('Logging in...', 'info');
        
        try {
            const response = await api.login(email, password);
            
            console.log('🔍 LOGIN RESPONSE STATUS:', response.status);
            
            const data = await response.json();
            console.log('📥 Login response data:', data);
            
            if (response.ok && data.success) {
                utils.showToast('✅ Login successful!', 'success');
                
                localStorage.setItem('savedEmail', email);
                localStorage.setItem('userEmail', data.email || email);
                if (data.userId) localStorage.setItem('userId', data.userId);
                if (data.role) localStorage.setItem('userRole', data.role);
                if (data.name) localStorage.setItem('userName', data.name);
                if (data.token) localStorage.setItem('token', data.token);
                
                setTimeout(() => {
                    redirectToDashboard();
                }, 500);
                
            } else if (response.status === 401) {
                utils.showToast(data.message || '❌ Invalid email or password', 'error');
            } else if (response.status === 400) {
                utils.showToast(data.message || '❌ Please verify your email first', 'error');
            } else {
                utils.showToast(data.message || '❌ Login failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            utils.showToast('❌ Network error. Please check your connection.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    },
    
    // ✅ FIXED REGISTER HANDLER - WITH IMPROVED NAME VALIDATION
    register: async (e) => {
        e.preventDefault();
        
        if (!elements.signupName || !elements.signupEmail || !elements.signupPassword || !elements.confirmPassword) {
            utils.showToast('Please fill all fields', 'error');
            return;
        }
        
        const name = elements.signupName.value;
        const email = elements.signupEmail.value;
        const password = elements.signupPassword.value;
        const confirmPassword = elements.confirmPassword.value;
        
        // ✅ FIXED: Using the improved validation
        const nameValidation = utils.validateFullName(name);
        
        if (typeof nameValidation === 'string') {
            utils.showToast(nameValidation, 'error');
            return;
        }
        
        if (!nameValidation.isValid) {
            utils.showToast(nameValidation.message, 'error');
            return;
        }
        
        // Use the formatted name
        const formattedName = nameValidation.formattedName;
        
        // Optional: Update the input field with formatted name
        if (elements.signupName && formattedName !== name) {
            elements.signupName.value = formattedName;
        }
        
        if (!utils.validateEmail(email)) {
            utils.showToast('Invalid email address', 'error');
            return;
        }
        
        if (!utils.validatePhinmaEmail(email)) {
            utils.showToast('Only @phinmaed.com emails allowed', 'error');
            return;
        }
        
        try {
            utils.showToast('Checking email...', 'info');
            const checkResult = await api.checkEmail(email);
            if (checkResult.exists) {
                utils.showToast('Email already registered', 'error');
                return;
            }
        } catch (error) {
            console.error('Email check error:', error);
        }
        
        const passwordError = utils.validatePassword(password);
        if (passwordError) {
            utils.showToast(passwordError, 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            utils.showToast('Passwords do not match', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('.submit-btn');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Sign Up';
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-text">Creating account...</span> <i class="fas fa-spinner fa-spin"></i>';
        }
        utils.showToast('Creating your account...', 'info');
        
        try {
            console.log('📤 SENDING REGISTRATION DATA:', { formattedName, email, password });
            
            const data = await api.register(formattedName, email, password);
            
            console.log('✅ Registration response:', data);
            
            if (data.success) {
                utils.showToast('✅ Registration successful!', 'success');
                e.target.reset();
                
                setTimeout(() => {
                    if (data.requiresOtp) {
                        otpHandler.show(data.email || email);
                    } else {
                        if (elements.loginToggle) elements.loginToggle.click();
                        if (elements.loginEmail) elements.loginEmail.value = email;
                        utils.showToast('Please login with your credentials', 'info');
                    }
                }, 1500);
            } else {
                utils.showToast(data.message || '❌ Registration failed', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            utils.showToast('❌ Network error. Please try again.', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    },
    
    forgotPassword: async (e) => {
        e.preventDefault();
        
        if (!elements.forgotEmail) return;
        
        const email = elements.forgotEmail.value;
        
        if (!utils.validateEmail(email)) {
            utils.showToast('Invalid email address', 'error');
            return;
        }
        
        if (!utils.validatePhinmaEmail(email)) {
            utils.showToast('Only @phinmaed.com emails allowed', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('.submit-btn');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Reset Link';
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-text">Sending...</span> <i class="fas fa-spinner fa-spin"></i>';
        }
        utils.showToast('Sending reset instructions...', 'info');
        
        try {
            const data = await api.forgotPassword(email);
            
            if (data.success) {
                utils.showToast('✅ Reset link sent!', 'success');
                e.target.reset();
                setTimeout(() => {
                    if (elements.loginToggle) elements.loginToggle.click();
                }, 1500);
            } else {
                utils.showToast(data.message || '❌ Failed', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        } catch (error) {
            console.error('❌ Forgot password error:', error);
            utils.showToast('❌ Network error', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    }
};

// ==================== INITIALIZATION ====================
function initializeEventListeners() {
    if (elements.loginToggle) {
        elements.loginToggle.addEventListener('click', () => {
            elements.loginToggle.classList.add('active');
            if (elements.signupToggle) elements.signupToggle.classList.remove('active');
            formHandler.showForm(elements.loginForm);
        });
    }
    
    if (elements.signupToggle) {
        elements.signupToggle.addEventListener('click', () => {
            elements.signupToggle.classList.add('active');
            if (elements.loginToggle) elements.loginToggle.classList.remove('active');
            formHandler.showForm(elements.signupForm);
        });
    }
    
    if (elements.forgotPasswordLink) {
        elements.forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            formHandler.showForm(elements.forgotForm);
        });
    }
    
    if (elements.switchToSignup) {
        elements.switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            if (elements.signupToggle) elements.signupToggle.click();
        });
    }
    
    if (elements.switchToLogin) {
        elements.switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (elements.loginToggle) elements.loginToggle.click();
        });
    }
    
    if (elements.switchBackToLogin) {
        elements.switchBackToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (elements.loginToggle) elements.loginToggle.click();
        });
    }
    
    if (elements.loginForm) {
        const newLoginForm = elements.loginForm.cloneNode(true);
        elements.loginForm.parentNode.replaceChild(newLoginForm, elements.loginForm);
        elements.loginForm = newLoginForm;
        
        elements.loginForm.addEventListener('submit', handlers.login);
    }
    
    if (elements.signupForm) {
        const newSignupForm = elements.signupForm.cloneNode(true);
        elements.signupForm.parentNode.replaceChild(newSignupForm, elements.signupForm);
        elements.signupForm = newSignupForm;
        
        elements.signupForm.addEventListener('submit', handlers.register);
    }
    
    if (elements.forgotForm) {
        const newForgotForm = elements.forgotForm.cloneNode(true);
        elements.forgotForm.parentNode.replaceChild(newForgotForm, elements.forgotForm);
        elements.forgotForm = newForgotForm;
        
        elements.forgotForm.addEventListener('submit', handlers.forgotPassword);
    }
}

async function initialize() {
    console.log('🚀 App Started');
    console.log('🔧 API_BASE_URL:', CONFIG.API_BASE_URL);
    console.log('🌐 Host:', window.location.hostname);
    
    const isLoginPage = window.location.pathname === '/' || 
                        window.location.pathname === '/index.html' ||
                        window.location.pathname.endsWith('index.html') ||
                        window.location.pathname === '/login.html';
    
    if (isLoginPage) {
        try {
            const sessionData = await checkBackendSession();
            if (sessionData && sessionData.authenticated === true && !state.isRedirecting) {
                console.log('✅ Existing session found, redirecting to dashboard');
                redirectToDashboard();
                return;
            }
        } catch (err) {
            console.log('ℹ️ Session check failed gracefully:', err.message);
        }
    } else {
        console.log('ℹ️ Not on login page, skipping session redirect check');
    }
    
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail && elements.loginEmail) {
        elements.loginEmail.value = savedEmail;
    }
    
    initializeEventListeners();
    
    if (elements.welcomeScreen) {
        setTimeout(() => {
            elements.welcomeScreen.style.display = 'none';
        }, CONFIG.WELCOME_SCREEN_DURATION);
    }
    
    fetch(ENDPOINTS.TEST, {
        headers: {
            'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include'
    })
        .then(res => {
            if (res.ok) {
                return res.json();
            }
            throw new Error('Backend not ready');
        })
        .then(data => console.log('✅ Backend connected:', data))
        .catch(err => console.log('ℹ️ Backend test:', err.message));
}

// ==================== EXPOSE GLOBALLY ====================
window.togglePassword = formHandler.togglePassword;
window.otpHandler = otpHandler;

// ==================== START APP ====================
document.addEventListener('DOMContentLoaded', initialize);

// ==================== ADD STYLES ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .otp-form { animation: slideIn 0.3s ease; }
    
    .fa-spinner {
        animation: spin 1s linear infinite;
    }
    
    .submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        z-index: 1000;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .toast.show {
        transform: translateY(0);
        opacity: 1;
    }
`;
document.head.appendChild(style);
