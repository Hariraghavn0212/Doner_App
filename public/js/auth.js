const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    constpassword = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: document.getElementById('login-password').value })
        });

        const data = await res.json();

        if (res.ok) {
            handleAuthSuccess(data);
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred');
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const role = document.getElementById('role').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone, address, role })
        });

        const data = await res.json();

        if (res.ok) {
            handleAuthSuccess(data);
        } else {
            alert(data.message || 'Signup failed');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred');
    }
});

function handleAuthSuccess(user) {
    localStorage.setItem('token', user.token);
    localStorage.setItem('role', user.role);
    localStorage.setItem('user', JSON.stringify(user));

    const redirectPath = localStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectPath;
        return;
    }

    if (user.role === 'donor') {
        window.location.href = 'donor-dashboard.html';
    } else {
        // Default receiver view
        window.location.href = 'index.html';
    }
}
