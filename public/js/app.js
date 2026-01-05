const API_URL = '/api';

// Check if user is logged in and update UI
document.addEventListener('DOMContentLoaded', () => {
    updateNav();
});

function updateNav() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const navMenu = document.getElementById('nav-menu');

    if (token && navMenu) {
        let dashboardLink = '#';
        if (role === 'donor') dashboardLink = 'donor-dashboard.html';
        if (role === 'receiver') dashboardLink = 'receiver-dashboard.html';

        navMenu.innerHTML = `
            <a href="${dashboardLink}">Dashboard</a>
            <a href="#" onclick="logout()">Logout</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Helper to make authenticated requests
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'auth.html?mode=login';
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    // Only set Content-Type: application/json if not already set and body is not FormData
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(API_URL + url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        logout();
        return;
    }

    return response;
}
