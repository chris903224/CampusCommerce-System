// ==================== CONFIGURATION ====================
const API_BASE_URL = 'http://localhost:8080/api/admin';

// DOM Elements
const splashScreen = document.querySelector('.splash');
const stepMethod = document.getElementById('stepMethod');
const stepOtp = document.getElementById('stepOtp');
const methodBtns = document.querySelectorAll('.method-btn');
const panelPassword = document.getElementById('panelPassword');
const panelFace = document.getElementById('panelFace');
const adminPassword = document.getElementById('adminPassword');
const eyeToggle = document.getElementById('eyeToggle');
const messageDiv = document.getElementById('message');
const loginBtn = document.getElementById('loginBtn');
const toast = document.getElementById('toast');

// Face Recognition Elements
let faceVideo = null;
let faceCanvas = null;
let faceStatus = null;
let faceMessage = null;
let verifyFaceBtn = null;
let cancelFaceBtn = null;
let faceDetectionInterval = null;
let faceModelsLoaded = false;
let currentFaceDescriptor = null;

// OTP Elements
let otpInput, otpMessage, verifyOtpBtn, resendLink, timerSpan;
let currentSessionId = null;
let timerInterval = null;
let timeLeft = 300;

// ==================== MULTIPLE FACE REGISTRATION VARIABLES ====================
let registrationForm = null;
let registerNameInput = null;
let registerEmailInput = null;
let registerRoleSelect = null;
let registerFaceBtn = null;
let saveFaceBtn = null;
let cancelRegisterBtn = null;
let registeredUsersList = null;
let isRegistrationMode = false;
let tempFaceDescriptor = null;
let selectedUserId = null;
let allRegisteredUsers = [];

// ==================== HELPER FUNCTIONS ====================
function showToast(msg, type = 'info') {
    const t = toast;
    t.textContent = msg;
    t.className = 'toast show';
    
    if (type === 'success') {
        t.classList.add('success');
        t.style.borderLeft = '3px solid #4CAF93';
    } else if (type === 'error') {
        t.classList.add('error');
        t.style.borderLeft = '3px solid #ff4757';
    } else {
        t.classList.remove('success', 'error');
    }
    
    setTimeout(() => t.classList.remove('show'), 3000);
}

function showMessage(element, text, isError = true) {
    if (!element) return;
    element.textContent = text;
    element.className = 'message';
    if (isError) {
        element.classList.add('error');
    } else {
        element.classList.add('success');
    }
}

function setLoading(button, isLoading, originalText = null) {
    if (!button) return;
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    } else {
        button.disabled = false;
        if (originalText) button.innerHTML = originalText;
    }
}

// ==================== METHOD SELECTOR ====================
methodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const method = btn.dataset.method;
        
        methodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (method === 'password') {
            panelPassword.classList.add('active');
            panelFace.classList.remove('active');
            if (adminPassword) adminPassword.focus();
            stopFaceCamera();
        } else {
            panelPassword.classList.remove('active');
            panelFace.classList.add('active');
            initFaceRecognition();
            loadRegisteredUsers(); // Load users when face panel opens
        }
    });
});

// ==================== PASSWORD LOGIN ====================
if (eyeToggle) {
    eyeToggle.addEventListener('click', function () {
        const pw = adminPassword;
        const isHidden = pw.type === 'password';
        pw.type = isHidden ? 'text' : 'password';
        this.classList.toggle('fa-eye', !isHidden);
        this.classList.toggle('fa-eye-slash', isHidden);
    });
}

if (adminPassword) {
    adminPassword.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('adminLoginForm')?.dispatchEvent(new Event('submit'));
        }
    });
}

document.getElementById('adminLoginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const password = adminPassword.value.trim();
    if (!password) {
        showMessage(messageDiv, 'Please enter your password');
        return;
    }
    
    showMessage(messageDiv, 'Verifying password...', false);
    setLoading(loginBtn, true, '<br><span><Verify Password</span> </br><i class="fas fa-arrow-right"></i>');

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success && data.requiresOtp) {
            currentSessionId = data.sessionId;
            showMessage(messageDiv, '✅ Password verified! OTP sent to your email.', false);
            showToast('OTP Sent', 'success');
            
            initOtpSection();
            stepMethod.style.display = 'none';
            stepOtp.style.display = 'block';
            startTimer(300);
        } else {
            showMessage(messageDiv, data.message || 'Invalid admin password');
            showToast('Access Denied', 'error');
            adminPassword.value = '';
            adminPassword.focus();
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(messageDiv, 'Cannot connect to server. Is backend running?');
        showToast('Connection Error', 'error');
    } finally {
        setLoading(loginBtn, false, '<span>Verify Password</span> <i class="fas fa-arrow-right"></i>');
    }
});

// ==================== FACE RECOGNITION LOGIN ====================
async function initFaceRecognition() {
    faceVideo = document.getElementById('faceVideo');
    faceCanvas = document.getElementById('faceCanvas');
    faceStatus = document.getElementById('faceStatus');
    faceMessage = document.getElementById('faceMessage');
    verifyFaceBtn = document.getElementById('verifyFaceBtn');
    cancelFaceBtn = document.getElementById('cancelFaceBtn');
    
    if (!faceVideo) return;
    
    if (cancelFaceBtn) {
        cancelFaceBtn.onclick = () => {
            panelPassword.classList.add('active');
            panelFace.classList.remove('active');
            document.querySelector('.method-btn[data-method="password"]').classList.add('active');
            document.querySelector('.method-btn[data-method="face"]').classList.remove('active');
            stopFaceCamera();
            hideRegistrationForm();
        };
    }
    
    if (verifyFaceBtn) {
        verifyFaceBtn.onclick = verifyFaceLogin;
    }
    
    await loadFaceModels();
    startCamera();
    addMultipleFaceUI(); // Add the multiple face UI
    loadRegisteredUsers(); // Load registered users
}

async function loadFaceModels() {
    if (faceStatus) faceStatus.textContent = 'Loading face models...';
    
    try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        faceModelsLoaded = true;
        if (faceStatus) faceStatus.textContent = 'Camera ready';
        if (faceMessage) {
            faceMessage.textContent = 'Position your face in the frame';
            faceMessage.className = 'message success';
        }
        if (verifyFaceBtn) verifyFaceBtn.disabled = false;
        
    } catch (error) {
        console.error('Failed to load face models:', error);
        if (faceStatus) faceStatus.textContent = 'Failed to load models';
        if (faceMessage) {
            faceMessage.textContent = 'Error loading face recognition. Please use password login.';
            faceMessage.className = 'message error';
        }
    }
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' }
        });
        faceVideo.srcObject = stream;
        await faceVideo.play();
        
        if (faceStatus) faceStatus.textContent = 'Camera ready';
        
        startFaceDetection();
        
    } catch (error) {
        console.error('Camera error:', error);
        if (faceStatus) faceStatus.textContent = 'Camera access denied';
        if (faceMessage) {
            faceMessage.textContent = 'Please allow camera access to use Face Recognition';
            faceMessage.className = 'message error';
        }
    }
}

function startFaceDetection() {
    if (faceDetectionInterval) clearInterval(faceDetectionInterval);
    
    faceDetectionInterval = setInterval(async () => {
        if (!faceVideo || faceVideo.paused || faceVideo.readyState !== 4) return;
        if (!faceModelsLoaded) return;
        
        try {
            const detection = await faceapi
                .detectSingleFace(faceVideo, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
            
            const ctx = faceCanvas.getContext('2d');
            faceCanvas.width = faceVideo.videoWidth;
            faceCanvas.height = faceVideo.videoHeight;
            ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
            
            if (detection) {
                const box = detection.detection.box;
                ctx.save();
                ctx.translate(faceCanvas.width, 0);
                ctx.scale(-1, 1);
                ctx.strokeStyle = '#00ffb7';
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                ctx.restore();
                
                currentFaceDescriptor = detection.descriptor;
                
                // If in registration mode, store temp descriptor
                if (isRegistrationMode) {
                    tempFaceDescriptor = detection.descriptor;
                    if (registerFaceBtn) {
                        registerFaceBtn.disabled = false;
                        registerFaceBtn.innerHTML = '<i class="fas fa-check-circle"></i> Face Captured';
                        registerFaceBtn.style.background = '#00ffb7';
                        registerFaceBtn.style.color = '#000';
                    }
                    if (faceStatus) {
                        faceStatus.textContent = 'Face captured! Ready to save.';
                        faceStatus.style.color = '#00ffb7';
                    }
                }
                
                if (faceStatus && faceStatus.textContent.includes('No face')) {
                    faceStatus.textContent = 'Face detected';
                    faceStatus.style.color = '#00ffb7';
                }
                if (verifyFaceBtn) verifyFaceBtn.disabled = false;
            } else {
                currentFaceDescriptor = null;
                if (isRegistrationMode) {
                    tempFaceDescriptor = null;
                    if (registerFaceBtn) {
                        registerFaceBtn.disabled = true;
                        registerFaceBtn.innerHTML = '<i class="fas fa-camera"></i> Capture Face';
                        registerFaceBtn.style.background = '';
                    }
                }
                if (faceStatus && !faceStatus.textContent.includes('No face')) {
                    faceStatus.textContent = 'No face detected';
                    faceStatus.style.color = '#ff4757';
                }
                if (verifyFaceBtn) verifyFaceBtn.disabled = true;
            }
        } catch (err) {
            console.log('Detection error:', err);
        }
    }, 100);
}

function stopFaceCamera() {
    if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
        faceDetectionInterval = null;
    }
    if (faceVideo && faceVideo.srcObject) {
        faceVideo.srcObject.getTracks().forEach(track => track.stop());
        faceVideo.srcObject = null;
    }
    currentFaceDescriptor = null;
    tempFaceDescriptor = null;
}

// ==================== MULTIPLE FACE REGISTRATION UI ====================
function addMultipleFaceUI() {
    const facePanel = document.getElementById('panelFace');
    if (!facePanel) return;
    
    // Check if UI already exists
    if (document.getElementById('multipleFaceSection')) return;
    
    // Create the multiple face management section
    const multipleFaceHTML = `
        <div id="multipleFaceSection" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
            <!-- User Selection Dropdown for Login -->
            <div style="margin-bottom: 15px;">
                <label style="display: block; color: #aaa; font-size: 0.75rem; margin-bottom: 5px;">
                    <i class="fas fa-user"></i> Select User (Optional)
                </label>
                <select id="userSelectDropdown" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; font-size: 0.85rem;">
                    <option value="">-- Auto-detect from all users --</option>
                </select>
            </div>
            
            <!-- Action Buttons -->
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button id="showRegisterBtn" class="btn-secondary" style="flex: 1; padding: 8px;">
                    <i class="fas fa-user-plus"></i> Register New User
                </button>
                <button id="showManageBtn" class="btn-secondary" style="flex: 1; padding: 8px;">
                    <i class="fas fa-users"></i> Manage Users
                </button>
            </div>
            
            <!-- Registration Form (Hidden by default) -->
            <div id="registerFormContainer" style="display: none; background: rgba(0,0,0,0.4); border-radius: 12px; padding: 15px; margin-bottom: 15px;">
                <h5 style="color: #00ffb7; margin-bottom: 12px; font-size: 0.85rem;">
                    <i class="fas fa-id-card"></i> Register New Face
                </h5>
                <input type="text" id="regFullName" placeholder="Full Name" style="width: 100%; padding: 10px; margin-bottom: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white;">
                <input type="email" id="regEmail" placeholder="Email Address" style="width: 100%; padding: 10px; margin-bottom: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white;">
                <select id="regRole" style="width: 100%; padding: 10px; margin-bottom: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;">
                    <option value="admin">Administrator</option>
                    <option value="staff">Staff Member</option>
                    <option value="manager">Manager</option>
                </select>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button id="captureFaceBtn" class="btn-secondary" style="flex: 1;" disabled>
                        <i class="fas fa-camera"></i> Capture Face
                    </button>
                    <button id="saveFaceBtn" class="btn-primary" style="flex: 1; background: #4CAF93;" disabled>
                        <i class="fas fa-save"></i> Save User
                    </button>
                </div>
                <button id="cancelRegBtn" class="btn-secondary" style="width: 100%; margin-top: 10px; background: rgba(255,69,87,0.2);">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
            
            <!-- Users List Container (Hidden by default) -->
            <div id="usersListContainer" style="display: none;">
                <h5 style="color: #00ffb7; margin-bottom: 12px; font-size: 0.85rem;">
                    <i class="fas fa-list"></i> Registered Users
                </h5>
                <div id="registeredUsersList" style="max-height: 300px; overflow-y: auto;">
                    <!-- Users will be loaded here -->
                </div>
                <button id="closeUsersListBtn" class="btn-secondary" style="width: 100%; margin-top: 10px;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
            </div>
        </div>
    `;
    
    // Insert the UI after the video element
    const videoContainer = facePanel.querySelector('video, #faceVideo')?.parentNode || facePanel;
    videoContainer.insertAdjacentHTML('beforeend', multipleFaceHTML);
    
    // Initialize elements
    registerNameInput = document.getElementById('regFullName');
    registerEmailInput = document.getElementById('regEmail');
    registerRoleSelect = document.getElementById('regRole');
    registerFaceBtn = document.getElementById('captureFaceBtn');
    saveFaceBtn = document.getElementById('saveFaceBtn');
    cancelRegisterBtn = document.getElementById('cancelRegBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showManageBtn = document.getElementById('showManageBtn');
    const registerContainer = document.getElementById('registerFormContainer');
    const usersContainer = document.getElementById('usersListContainer');
    const closeUsersBtn = document.getElementById('closeUsersListBtn');
    
    // Event Listeners
    if (showRegisterBtn) {
        showRegisterBtn.onclick = () => {
            registerContainer.style.display = 'block';
            usersContainer.style.display = 'none';
            isRegistrationMode = true;
            resetRegistrationForm();
        };
    }
    
    if (showManageBtn) {
        showManageBtn.onclick = () => {
            registerContainer.style.display = 'none';
            usersContainer.style.display = 'block';
            isRegistrationMode = false;
            loadRegisteredUsers();
        };
    }
    
    if (closeUsersBtn) {
        closeUsersBtn.onclick = () => {
            usersContainer.style.display = 'none';
        };
    }
    
    if (cancelRegisterBtn) {
        cancelRegisterBtn.onclick = () => {
            registerContainer.style.display = 'none';
            isRegistrationMode = false;
            tempFaceDescriptor = null;
            resetRegistrationForm();
        };
    }
    
    if (registerFaceBtn) {
        registerFaceBtn.onclick = () => {
            if (tempFaceDescriptor) {
                showToast('Face already captured! Click Save to register.', 'info');
            } else if (currentFaceDescriptor) {
                tempFaceDescriptor = currentFaceDescriptor;
                registerFaceBtn.disabled = false;
                registerFaceBtn.innerHTML = '<i class="fas fa-check-circle"></i> Face Captured';
                registerFaceBtn.style.background = '#00ffb7';
                registerFaceBtn.style.color = '#000';
                if (faceStatus) {
                    faceStatus.textContent = 'Face captured! Ready to save.';
                    faceStatus.style.color = '#00ffb7';
                }
                showToast('Face captured successfully!', 'success');
            } else {
                showToast('Please position your face in the camera', 'error');
            }
        };
    }
    
    if (saveFaceBtn) {
        saveFaceBtn.onclick = registerNewFace;
    }
}

function resetRegistrationForm() {
    if (registerNameInput) registerNameInput.value = '';
    if (registerEmailInput) registerEmailInput.value = '';
    if (registerRoleSelect) registerRoleSelect.value = 'staff';
    if (registerFaceBtn) {
        registerFaceBtn.disabled = true;
        registerFaceBtn.innerHTML = '<i class="fas fa-camera"></i> Capture Face';
        registerFaceBtn.style.background = '';
    }
    if (saveFaceBtn) saveFaceBtn.disabled = true;
    tempFaceDescriptor = null;
}

function hideRegistrationForm() {
    const registerContainer = document.getElementById('registerFormContainer');
    const usersContainer = document.getElementById('usersListContainer');
    if (registerContainer) registerContainer.style.display = 'none';
    if (usersContainer) usersContainer.style.display = 'none';
    isRegistrationMode = false;
    tempFaceDescriptor = null;
}

// ==================== FACE REGISTRATION API CALLS ====================
async function registerNewFace() {
    const fullName = registerNameInput?.value.trim();
    const email = registerEmailInput?.value.trim();
    const role = registerRoleSelect?.value;
    
    if (!fullName) {
        showToast('Please enter full name', 'error');
        return;
    }
    
    if (!email) {
        showToast('Please enter email address', 'error');
        return;
    }
    
    if (!tempFaceDescriptor && !currentFaceDescriptor) {
        showToast('Please capture your face first', 'error');
        return;
    }
    
    const faceToSave = tempFaceDescriptor || currentFaceDescriptor;
    if (!faceToSave) {
        showToast('No face detected. Please position your face clearly.', 'error');
        return;
    }
    
    setLoading(saveFaceBtn, true, '<span>Save User</span> <i class="fas fa-save"></i>');
    
    try {
        const faceDescriptorArray = Array.from(faceToSave);
        const userId = `user_${Date.now()}`;
        
        const response = await fetch(`${API_BASE_URL}/face/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                faceDescriptor: JSON.stringify(faceDescriptorArray),
                userId: userId,
                username: fullName,
                email: email,
                role: role
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`✅ ${fullName} registered successfully!`, 'success');
            resetRegistrationForm();
            hideRegistrationForm();
            loadRegisteredUsers();
            updateUserDropdown();
            
            if (faceMessage) {
                faceMessage.textContent = `✅ ${fullName} has been registered!`;
                faceMessage.className = 'message success';
                setTimeout(() => {
                    faceMessage.textContent = 'Position your face in the frame';
                    faceMessage.className = 'message success';
                }, 3000);
            }
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Connection error. Please try again.', 'error');
    } finally {
        setLoading(saveFaceBtn, false, '<span>Save User</span> <i class="fas fa-save"></i>');
    }
}

async function loadRegisteredUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/face/users`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success && data.users) {
            allRegisteredUsers = data.users;
            updateUserDropdown();
            displayUsersList(data.users);
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

function updateUserDropdown() {
    const dropdown = document.getElementById('userSelectDropdown');
    if (!dropdown) return;
    
    let options = '<option value="">-- Auto-detect from all users --</option>';
    
    allRegisteredUsers.forEach(user => {
        if (user.isRegistered) {
            const status = user.isActive ? '✓' : '⛔';
            options += `<option value="${user.userId}">${status} ${user.username} (${user.role})</option>`;
        }
    });
    
    dropdown.innerHTML = options;
    
    // Add change event to select specific user for verification
    dropdown.onchange = (e) => {
        selectedUserId = e.target.value;
        if (selectedUserId) {
            if (faceMessage) {
                const user = allRegisteredUsers.find(u => u.userId === selectedUserId);
                faceMessage.textContent = `Selected: ${user?.username}. Position your face.`;
                faceMessage.className = 'message success';
            }
        } else {
            if (faceMessage) {
                faceMessage.textContent = 'Auto-detect mode. Position your face.';
                faceMessage.className = 'message success';
            }
        }
    };
}

function displayUsersList(users) {
    const container = document.getElementById('registeredUsersList');
    if (!container) return;
    
    if (!users || users.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #aaa; padding: 20px;">No registered users</div>';
        return;
    }
    
    let html = '';
    users.forEach(user => {
        const statusBadge = user.isRegistered 
            ? '<span style="color: #00ffb7;">✓ Registered</span>' 
            : '<span style="color: #ff4757;">✗ Not Registered</span>';
        const activeBadge = user.isActive 
            ? '<span style="color: #00ffb7;">Active</span>' 
            : '<span style="color: #ff4757;">Inactive</span>';
        
        html += `
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: #fff;">${escapeHtml(user.username)}</strong><br>
                        <small style="color: #aaa;">${escapeHtml(user.email)} | ${user.role}</small><br>
                        <small>${statusBadge} | ${activeBadge}</small>
                        ${user.lastLogin ? `<small style="color: #aaa;">Last: ${new Date(user.lastLogin).toLocaleString()}</small>` : ''}
                    </div>
                    <div style="display: flex; gap: 5px;">
                        ${user.isRegistered ? `
                            <button class="delete-user-btn" data-userid="${user.userId}" style="background: rgba(255,69,87,0.2); border: none; border-radius: 6px; padding: 5px 10px; color: #ff4757; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add delete button listeners
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.onclick = () => deleteFaceUser(btn.dataset.userid);
    });
}

async function deleteFaceUser(userId) {
    if (!confirm('Are you sure you want to delete this user\'s face registration?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/face/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('User face registration deleted', 'success');
            loadRegisteredUsers();
        } else {
            showToast('Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Connection error', 'error');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== UPDATED FACE VERIFICATION WITH USER SELECTION ====================
async function verifyFaceLogin() {
    if (!currentFaceDescriptor) {
        if (faceMessage) {
            faceMessage.textContent = 'No face detected. Please position your face clearly.';
            faceMessage.className = 'message error';
        }
        return;
    }
    
    if (verifyFaceBtn) {
        verifyFaceBtn.disabled = true;
        verifyFaceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    }
    
    if (faceMessage) {
        faceMessage.textContent = 'Verifying face with server...';
        faceMessage.className = 'message';
    }
    
    try {
        const faceDescriptorArray = Array.from(currentFaceDescriptor);
        
        // Include selected user ID if specified
        const requestBody = {
            faceDescriptor: JSON.stringify(faceDescriptorArray)
        };
        
        if (selectedUserId) {
            requestBody.userId = selectedUserId;
        }
        
        const response = await fetch(`${API_BASE_URL}/face/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (faceMessage) {
                const confidence = data.confidence ? ` (${data.confidence.toFixed(1)}% match)` : '';
                const userName = data.user?.username ? ` Welcome ${data.user.username}!` : '';
                faceMessage.textContent = `✅ Face verified successfully!${confidence}${userName}`;
                faceMessage.className = 'message success';
            }
            showToast(`Welcome ${data.user?.username || 'Admin'}!`, 'success');
            
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminLoginTime', Date.now());
            localStorage.setItem('adminAuthenticated', 'true');
            localStorage.setItem('adminUser', JSON.stringify(data.user || {}));
            
            stopFaceCamera();
            
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1500);
        } else {
            if (faceMessage) {
                const confidence = data.confidence ? ` (${data.confidence.toFixed(1)}% match)` : '';
                faceMessage.textContent = data.message || `❌ Face verification failed. Access denied.${confidence}`;
                faceMessage.className = 'message error';
            }
            showToast('Face Verification Failed', 'error');
            if (verifyFaceBtn) {
                verifyFaceBtn.disabled = false;
                verifyFaceBtn.innerHTML = '<i class="fas fa-camera"></i> Verify Face';
            }
        }
        
    } catch (error) {
        console.error('Face verification error:', error);
        if (faceMessage) {
            faceMessage.textContent = 'Verification error: ' + error.message;
            faceMessage.className = 'message error';
        }
        showToast('Connection Error', 'error');
        if (verifyFaceBtn) {
            verifyFaceBtn.disabled = false;
            verifyFaceBtn.innerHTML = '<i class="fas fa-camera"></i> Verify Face';
        }
    }
}

// ==================== OTP FUNCTIONS ====================
function initOtpSection() {
    otpInput = document.getElementById('otpInput');
    otpMessage = document.getElementById('otpMessage');
    verifyOtpBtn = document.getElementById('verifyOtpBtn');
    resendLink = document.getElementById('resendOtpLink');
    timerSpan = document.getElementById('timerDisplay');
    
    if (verifyOtpBtn) verifyOtpBtn.onclick = verifyOtp;
    if (resendLink) resendLink.onclick = resendOtp;
    if (otpInput) {
        otpInput.value = '';
        otpInput.focus();
        otpInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length === 6) verifyOtp();
        });
    }
}

function startTimer(seconds) {
    timeLeft = seconds;
    updateTimerDisplay();
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (timerSpan) timerSpan.textContent = '(expired)';
            if (resendLink) resendLink.style.pointerEvents = 'auto';
            if (otpMessage) showMessage(otpMessage, 'OTP expired. Please request a new one.');
        }
    }, 1000);
}

function updateTimerDisplay() {
    if (timerSpan) {
        if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerSpan.textContent = `(${minutes}:${seconds.toString().padStart(2, '0')})`;
        } else {
            timerSpan.textContent = '(expired)';
        }
    }
}

async function verifyOtp() {
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
        showMessage(otpMessage, 'Please enter a valid 6-digit OTP');
        return;
    }
    
    showMessage(otpMessage, 'Verifying OTP...', false);
    setLoading(verifyOtpBtn, true, '<span>Verify OTP</span> <i class="fas fa-check-circle"></i>');
    
    try {
        const response = await fetch(`${API_BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId, otp: otp })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(otpMessage, '✅ OTP verified! Redirecting...', false);
            showToast('OTP Verified', 'success');
            
            if (timerInterval) clearInterval(timerInterval);
            
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminLoginTime', Date.now());
            localStorage.setItem('adminAuthenticated', 'true');
            
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1500);
        } else {
            showMessage(otpMessage, data.message || 'Invalid OTP');
            showToast('Verification Failed', 'error');
            setLoading(verifyOtpBtn, false, '<span>Verify OTP</span> <i class="fas fa-check-circle"></i>');
            if (otpInput) {
                otpInput.value = '';
                otpInput.focus();
            }
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        showMessage(otpMessage, 'Verification failed. Please try again.');
        showToast('Connection Error', 'error');
        setLoading(verifyOtpBtn, false, '<span>Verify OTP</span> <i class="fas fa-check-circle"></i>');
    }
}

async function resendOtp(e) {
    e.preventDefault();
    
    if (!currentSessionId) {
        showMessage(otpMessage, 'Session expired. Please login again.');
        return;
    }
    
    if (resendLink) {
        resendLink.style.pointerEvents = 'none';
        resendLink.textContent = 'Sending...';
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(otpMessage, '✅ New OTP sent to your email!', false);
            showToast('OTP Resent', 'success');
            startTimer(300);
        } else {
            showMessage(otpMessage, data.message || 'Failed to resend OTP');
        }
    } catch (error) {
        console.error('Resend error:', error);
        showMessage(otpMessage, 'Failed to resend OTP. Please try again.');
    } finally {
        if (resendLink) {
            resendLink.textContent = 'Resend OTP';
            resendLink.style.pointerEvents = 'auto';
        }
    }
}

// ==================== CHECK EXISTING SESSION ====================
function checkExistingSession() {
    const token = localStorage.getItem('adminToken');
    const loginTime = localStorage.getItem('adminLoginTime');
    const authenticated = localStorage.getItem('adminAuthenticated');
    
    if (token && loginTime && authenticated === 'true') {
        const now = Date.now();
        const eightHours = 8 * 60 * 60 * 1000;
        
        if (now - parseInt(loginTime) < eightHours) {
            window.location.href = 'admin-dashboard.html';
            return true;
        } else {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminLoginTime');
            localStorage.removeItem('adminAuthenticated');
            localStorage.removeItem('adminUser');
        }
    }
    return false;
}

// ==================== SPLASH SCREEN ====================
window.addEventListener('load', function() {
    if (checkExistingSession()) return;
    
    setTimeout(() => {
        if (splashScreen) splashScreen.style.display = 'none';
    }, 2800);
});

setTimeout(() => {
    if (adminPassword) adminPassword.focus();
}, 3000);

// Add CSS for method selector and login panels
const style = document.createElement('style');
style.textContent = `
    .method-selector {
        display: flex;
        gap: 12px;
        margin-bottom: 28px;
        background: rgba(255,255,255,0.05);
        border-radius: 50px;
        padding: 4px;
    }
    .method-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 12px 16px;
        background: transparent;
        border: none;
        border-radius: 40px;
        color: rgba(255,255,255,0.6);
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
    }
    .method-btn i {
        font-size: 1rem;
    }
    .method-btn.active {
        background: linear-gradient(135deg, rgba(76,175,147,0.3), rgba(93,173,226,0.2));
        color: #00ffb7;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .login-panel {
        display: none;
    }
    .login-panel.active {
        display: block;
        animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .btn-secondary {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 14px;
        padding: 14px;
        color: white;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
    }
    .btn-secondary:hover {
        background: rgba(255,255,255,0.15);
        transform: translateY(-1px);
    }
    .btn-primary {
        background: linear-gradient(135deg, #4CAF93, #2E7D64);
        border: none;
        border-radius: 14px;
        padding: 14px;
        color: white;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
    }
    .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(76,175,147,0.3);
    }
    #registeredUsersList::-webkit-scrollbar {
        width: 6px;
    }
    #registeredUsersList::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.05);
        border-radius: 3px;
    }
    #registeredUsersList::-webkit-scrollbar-thumb {
        background: #4CAF93;
        border-radius: 3px;
    }
`;
document.head.appendChild(style);