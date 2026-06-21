export * from './adminDashboard.js';
export * from './users.js';
export * from './settings.js';

import { supabase } from '../../services/supabase.service.js';
import { syncSessionFromSupabase } from '../auth/session.js';

function renderAdminLogin() {
    return `
    <div class="login-container">
        <div class="login-box">
            <h2>Admin Login</h2>
            <p>Welcome back, Admin. Please log in to continue.</p>
            <div class="input-group">
                <label for="admin-email">Email</label>
                <input type="email" id="admin-email" value="admin@stutor.com" placeholder="Enter your email">
            </div>
            <div class="input-group">
                <label for="admin-password">Password</label>
                <input type="password" id="admin-password" value="stutor_admin_password" placeholder="Enter your password">
            </div>
            <button id="admin-login-btn" class="btn btn-primary">Login</button>
            <div id="admin-login-error" class="error-message"></div>
        </div>
    </div>
    `;
}

async function handleAdminLogin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('admin-login-error');

    if (!email || !password) {
        errorDiv.textContent = 'Email and password are required.';
        return;
    }

    errorDiv.textContent = '';

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('Admin login failed:', error.message);
        errorDiv.textContent = `Login failed: ${error.message}`;
        return;
    }

    if (data.user) {
        await syncSessionFromSupabase();
        
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session && window.APP.role === 'admin') {
            console.log('Admin login successful, Supabase session active.');
            window.location.reload(); 
        } else {
            const msg = 'Login successful, but role is not admin or session is invalid.';
            console.error(msg);
            errorDiv.textContent = msg;
            await supabase.auth.signOut(); 
        }
    } 
}

function initializeAdminLogin() {
    const adminView = document.getElementById('admin-view');
    if (!adminView) return;

    adminView.innerHTML = renderAdminLogin();

    const loginButton = document.getElementById('admin-login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', handleAdminLogin);
    }
}

if (document.getElementById('admin-view')) {
    initializeAdminLogin();
}
