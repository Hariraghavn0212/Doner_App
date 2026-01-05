const vegItems = [
    "Sambar", "Rasam", "White Rice", "Curd Rice", "Lemon Rice", "Tomato Rice",
    "Vegetable Biryani", "Paruppu (Dal)", "Avial", "Kootu", "Poriyal", "Pachadi",
    "Appalam", "Pickle", "Vadai", "Chapati", "Vegetable Kurma", "Payasam", "Kesari", "Sweet Pongal"
];

const nonVegItems = [
    "Chicken Biryani", "Mutton Biryani", "Chicken Curry", "Mutton Curry", "Chicken 65",
    "Chicken Fry", "Fish Fry", "Fish Curry", "Egg Curry", "Egg Fry", "Tandoori Chicken",
    "Chicken Gravy", "Mutton Gravy", "Prawn Fry", "Prawn Curry", "Pepper Chicken",
    "Kadai Chicken", "Chicken Lollipop", "Keema Curry", "Boiled Eggs"
];

document.addEventListener('DOMContentLoaded', () => {
    // Verify role
    const role = localStorage.getItem('role');
    if (role !== 'donor') {
        window.location.href = 'index.html';
        return;
    }

    switchPostTab('food'); // initialize tab states
    updateFoodItems(); // init list
    loadMyPosts();
    loadRequests();

    // Polling
    setInterval(() => {
        loadRequests();
        loadMyPosts();
    }, 5000);

    // Set min date-time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const currentDateTime = now.toISOString().slice(0, 16);
    const expiryEl = document.getElementById('expiryTime');
    if (expiryEl) expiryEl.min = currentDateTime;

    // Check URL Params for category
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
        if (['Clothes', 'Toys', 'Books', 'Others'].includes(category)) {
            switchPostTab('resource');
            const resCat = document.getElementById('resCategory');
            if (resCat) resCat.value = category;
        }
    }
});

function switchPostTab(tab) {
    const foodForm = document.getElementById('post-food-form');
    const resForm = document.getElementById('post-resource-form');
    const foodInputs = foodForm.querySelectorAll('input, select, textarea, button');
    const resInputs = resForm.querySelectorAll('input, select, textarea, button');

    if (tab === 'food') {
        foodForm.style.display = 'block';
        resForm.style.display = 'none';
        document.getElementById('tab-food').classList.remove('btn-secondary');
        document.getElementById('tab-resource').classList.add('btn-secondary');

        // Enable food, disable resource
        foodInputs.forEach(i => i.disabled = false);
        resInputs.forEach(i => i.disabled = true);
    } else {
        foodForm.style.display = 'none';
        resForm.style.display = 'block';
        document.getElementById('tab-food').classList.add('btn-secondary');
        document.getElementById('tab-resource').classList.remove('btn-secondary');

        // Disable food, enable resource
        foodInputs.forEach(i => i.disabled = true);
        resInputs.forEach(i => i.disabled = false);
    }
}

function updateFoodItems() {
    const type = document.getElementById('foodType').value;
    const container = document.getElementById('foodItemsContainer');
    if (!container) return;
    container.innerHTML = '';

    let items = [];
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('veg') && !normalizedType.includes('non')) {
        items = vegItems;
    } else if (normalizedType.includes('non')) {
        items = nonVegItems;
    }

    if (items.length > 0) {
        items.forEach(item => {
            const div = document.createElement('div');
            div.innerHTML = `
            <label style="font-weight:normal; display:flex; align-items:center; gap: 8px; margin: 4px 0; cursor: pointer;">
                <input type="checkbox" name="foodItem" value="${item}" style="width: auto; margin: 0;"> ${item}
            </label>
        `;
            container.appendChild(div);
        });
    }

    // Add "Other" option inside the scrollable box
    const otherDiv = document.createElement('div');
    otherDiv.style.marginTop = '8px';
    otherDiv.style.borderTop = '1px solid #eee';
    otherDiv.style.paddingTop = '8px';
    otherDiv.innerHTML = `
        <label style="font-weight:normal; display:flex; align-items:center; gap: 8px; margin: 4px 0; cursor: pointer;">
            <input type="checkbox" id="otherCheckbox" onchange="toggleOtherField(this)" style="width: auto; margin: 0;"> Other
        </label>
        <div id="otherFieldContainer" style="display:none; margin-top:5px; padding-left: 24px;">
            <input type="text" id="otherInput" placeholder="Enter custom item name" 
                style="width: 100%; padding: 8px; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px;">
        </div>
    `;
    container.appendChild(otherDiv);
}

function toggleOtherField(checkbox) {
    const container = document.getElementById('otherFieldContainer');
    const input = document.getElementById('otherInput');
    if (checkbox.checked) {
        container.style.display = 'block';
        input.focus();
    } else {
        container.style.display = 'none';
        input.value = '';
    }
}

// Post Food
const foodForm = document.getElementById('post-food-form');
if (foodForm) {
    foodForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const checkboxes = document.querySelectorAll('input[name="foodItem"]:checked');
        let foodItems = Array.from(checkboxes).map(cb => cb.value);

        const otherCheckbox = document.getElementById('otherCheckbox');
        const otherInput = document.getElementById('otherInput');

        if (otherCheckbox && otherCheckbox.checked && otherInput.value.trim() !== "") {
            foodItems.push(otherInput.value.trim());
        }

        if (foodItems.length === 0) {
            alert('Please select at least one food item from the list or add a custom item.');
            return;
        }

        const postData = {
            foodType: document.getElementById('foodType').value,
            foodItems,
            quantity: document.getElementById('quantity').value,
            cookedTime: document.getElementById('cookedTime').value,
            expiryTime: document.getElementById('expiryTime').value,
            location: document.getElementById('location').value,
            contactPhone: document.getElementById('contactPhone').value
        };

        try {
            const res = await authFetch('/food', {
                method: 'POST',
                body: JSON.stringify(postData)
            });

            if (res && res.ok) {
                alert('Food posted successfully!');
                foodForm.reset();
                updateFoodItems();
                loadMyPosts();
            } else if (res) {
                const data = await res.json();
                alert(data.message || 'Error posting food');
            } else {
                // authFetch likely redirected or failed
                console.log("authFetch returned null/undefined");
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while posting: ' + err.message);
        }
    });
}

// Post Resource
const resForm = document.getElementById('post-resource-form');
if (resForm) {
    resForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Submitting resource form listener triggered");

        const category = document.getElementById('resCategory').value;
        const itemName = document.getElementById('resItemName').value;
        console.log("Posting resource category:", category, "item:", itemName);


        const formData = new FormData();
        formData.append('category', document.getElementById('resCategory').value);
        formData.append('itemName', document.getElementById('resItemName').value);
        formData.append('description', document.getElementById('resDescription').value);
        formData.append('quantity', document.getElementById('resQuantity').value);
        formData.append('location', document.getElementById('resLocation').value);
        formData.append('contactPhone', document.getElementById('resContactPhone').value);

        const fileInput = document.getElementById('resImages');
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('images', fileInput.files[i]);
        }

        const token = localStorage.getItem('token');

        try {
            const res = await authFetch('/resources', {
                method: 'POST',
                body: formData
            });

            if (res && res.ok) {
                const data = await res.json();
                alert('Resource posted successfully!');
                resForm.reset();
                loadMyPosts();
            } else if (res) {
                const data = await res.json();
                alert(data.message || 'Error posting resource');
            }
        } catch (err) {
            console.error('Resource Post Error:', err);
            alert('An error occurred while posting resource: ' + err.message);
        }
    });
}

// Load All Posts (Food + Resources)
async function loadMyPosts() {
    const container = document.getElementById('my-posts-list');
    if (!container) return;
    container.innerHTML = 'Loading...';

    try {
        // Fetch posts sequentially
        const [foodRes, resRes] = await Promise.all([
            authFetch('/food/my'),
            authFetch('/resources/my')
        ]);

        // Check availability
        if (!foodRes || !resRes) {
            console.error("One of the fetch requests failed (returned null/undefined).");
            container.innerHTML = '<p>Error loading posts (Network or Auth error).</p>';
            return;
        }

        let fetchedFoodPosts = [];
        let fetchedResourcePosts = [];

        if (foodRes.ok) {
            const foodData = await foodRes.json();
            console.log('Donor Food Data:', foodData);
            fetchedFoodPosts = Array.isArray(foodData) ? foodData : [];
        } else {
            console.error('Food fetch failed', foodRes.status);
        }

        if (resRes.ok) {
            const resData = await resRes.json();
            console.log('Donor Resource Data:', resData);
            fetchedResourcePosts = Array.isArray(resData) ? resData : [];
        } else {
            console.error('Resource fetch failed', resRes.status);
        }

        let html = '';

        if (fetchedFoodPosts.length === 0 && fetchedResourcePosts.length === 0) {
            container.innerHTML = '<p>No active posts.</p>';
            return;
        }

        // Render Food
        fetchedFoodPosts.forEach(post => {
            const items = (post.food_items || post.foodItems || []) && Array.isArray(post.food_items || post.foodItems) ? (post.food_items || post.foodItems).join(', ') : 'No items listed';
            html += `
            <div class="card food-item" style="border-left:5px solid var(--primary-color);">
                <h3>[Food] ${post.food_type || post.foodType || 'Unknown'} <span class="badge ${post.food_type === 'Vegetarian' ? 'badge-veg' : 'badge-non-veg'}">${post.status || 'Pending'}</span></h3>
                <p><strong>Items:</strong> ${items}</p>
                <p><strong>Expiry:</strong> ${post.expiry_time || post.expiryTime ? new Date(post.expiry_time || post.expiryTime).toLocaleString() : 'N/A'}</p>
                <div style="margin-top:10px;">
                    <button class="btn btn-secondary btn-sm" onclick="deletePost('food', '${post.id || post._id}')">Delete</button>
                </div>
            </div>`;
        });

        // Render Resources
        fetchedResourcePosts.forEach(post => {
            const images = (post.images && Array.isArray(post.images)) ? post.images : [];
            const imagesHtml = images.map(img => `<img src="${img}" style="width:50px; height:50px; object-fit:cover; margin-right:5px;" onerror="this.src='https://via.placeholder.com/50'">`).join('');
            html += `
            <div class="card" style="border-left:5px solid var(--accent-color);">
                <h3>[${post.category || 'Resource'}] ${post.item_name || post.itemName || 'Unnamed Item'} <span class="badge" style="background:var(--accent-color)">${post.status || 'Pending'}</span></h3>
                <p><strong>Desc:</strong> ${post.description || 'No description'}</p>
                <div style="margin:5px 0;">${imagesHtml}</div>
                <div style="margin-top:10px;">
                    <button class="btn btn-secondary btn-sm" onclick="deletePost('resource', '${post.id || post._id}')">Delete</button>
                </div>
            </div>`;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error('Error loading posts', err);
        container.innerHTML = `<p style="color:red;">Error loading posts: ${err.message}. Check console for details.</p>`;
    }
}

async function deletePost(type, id) {
    if (!confirm('Are you sure?')) return;
    const endpoint = type === 'food' ? `/food/${id}` : `/resources/${id}`;
    try {
        const res = await authFetch(endpoint, { method: 'DELETE' });
        if (res && res.ok) loadMyPosts();
    } catch (err) { console.error(err); }
}

async function loadRequests() {
    const container = document.getElementById('requests-list');
    if (!container) return;

    try {
        const res = await authFetch('/requests/donor');
        if (!res || !res.ok) {
            container.innerHTML = '<p>Error loading requests.</p>';
            return;
        }
        const requests = await res.json();
        console.log('Requests data received:', requests);
        if (!Array.isArray(requests)) {
            console.warn('Requests data is not an array:', requests);
            container.innerHTML = '<p>Received invalid data format for requests.</p>';
            return;
        }
        if (requests.length === 0) {
            container.innerHTML = '<p>No pending requests.</p>';
            return;
        }

        container.innerHTML = requests.map(req => {
            // Determine if it's a food request or resource request
            let content = '';
            let typeLabel = '';

            if (req.foodPost) {
                typeLabel = `[Food] ${req.foodPost.food_type || req.foodPost.foodType || 'Unknown'}`;
                const items = (req.selected_items || req.selectedItems || []) && Array.isArray(req.selected_items || req.selectedItems) ? (req.selected_items || req.selectedItems).join(', ') : 'All';
                content = `
                    <p><strong>For Post:</strong> ${typeLabel} (${(req.foodPost.created_at || req.foodPost.createdAt) ? new Date(req.foodPost.created_at || req.foodPost.createdAt).toLocaleDateString() : 'Unknown date'})</p>
                    <p><strong>Requested Items:</strong> <b>${items}</b></p>
                `;
            } else if (req.resourcePost) {
                typeLabel = `[${req.resourcePost.category || 'Resource'}] ${req.resourcePost.item_name || req.resourcePost.itemName || 'Unnamed'}`;
                content = `
                    <p><strong>For Post:</strong> ${typeLabel}</p>
                    <p><strong>Details:</strong> ${req.resourcePost.description || 'No details'}</p>
                `;
            } else {
                content = `<p>Unknown Request (Post deleted?)</p>`;
            }

            return `
            <div class="card" style="border-left: 4px solid ${req.status === 'Pending' ? 'orange' : req.status === 'Accepted' ? 'green' : 'red'};">
                <p><strong>From:</strong> ${req.receiver?.name || 'Unknown'} <a href="tel:${req.receiver?.phone}">${req.receiver?.phone || ''}</a></p>
                ${content}
                <p><strong>Message:</strong> ${req.message || 'No message'}</p>
                <p><strong>Status:</strong> ${req.status}</p>
                
                ${req.status === 'Pending' ? `
                    <div style="margin-top:10px;">
                        <button class="btn btn-sm" onclick="updateStatus('${req.id || req._id}', 'Accepted')">Accept</button>
                        <button class="btn btn-secondary btn-sm" onclick="updateStatus('${req.id || req._id}', 'Rejected')">Reject</button>
                    </div>
                ` : ''}
            </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<p>Error listing requests.</p>';
    }
}

async function updateStatus(id, status) {
    try {
        const res = await authFetch(`/requests/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            loadRequests();
            loadMyPosts();
        }
    } catch (err) {
        console.error(err);
    }
}
