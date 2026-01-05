document.addEventListener('DOMContentLoaded', () => {
    // Verify role
    const role = localStorage.getItem('role');
    if (role !== 'receiver') {
        window.location.href = 'index.html';
        return;
    }

    // Set filter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type) {
        document.getElementById('filterType').value = type;
        // If type is not Food-related, we might need adjustments, but 'Clothes' works directly
    }

    loadAvailableItems();
    loadMyRequests();

    // Auto-refresh every 3 seconds
    setInterval(() => {
        loadAvailableItems();
        loadMyRequests();
    }, 3000);
});

async function loadAvailableItems() {
    const container = document.getElementById('food-list');
    const type = document.getElementById('filterType').value;

    // Determine if we are fetching Food or Resources
    let isResource = ['Clothes', 'Toys', 'Books', 'Others'].includes(type);

    let url = '/food';
    if (isResource) {
        url = `/resources?category=${type}`;
    } else {
        if (type) url += `?type=${type}`;
    }

    // If "All Food" (empty type), we fetch food. 
    // If user wants ALL resources... we don't have a "All Resources" filter yet, just specific categories.

    try {
        const res = await authFetch(url);
        const posts = await res.json();

        if (posts.length === 0) {
            container.innerHTML = '<p>No items found.</p>';
            return;
        }

        container.innerHTML = posts.map(post => {
            if (isResource) {
                // Render Resource Card
                const imagesHtml = post.images && post.images.length > 0
                    ? `<div style="display:flex; gap:5px; overflow-x:auto; margin-bottom:10px;">
                        ${post.images.map(img => `<img src="${img}" style="width:100px; height:100px; object-fit:cover; border-radius:5px;">`).join('')}
                       </div>`
                    : '<p>No images</p>';

                return `
                <div class="card food-item" style="border-top-color: var(--secondary-color);">
                    <h3>${post.item_name || post.itemName} <small>(${post.category})</small></h3>
                    <p>${post.description}</p>
                    ${imagesHtml}
                    <p><strong>Quantity:</strong> ${post.quantity}</p>
                    <p><strong>Location:</strong> ${post.location}</p>
                    <p><strong>Contact:</strong> ${post.contact_phone || post.contactPhone}</p>
                    <p><strong>Donor:</strong> ${post.donor?.name || 'Anonymous'}</p>
                    
                    <div class="post-actions" style="margin-top:10px;">
                        <button class="btn btn-sm btn-block" onclick="placeResourceRequest('${post.id || post._id}')">Request Item</button>
                    </div>
                </div>
                `;
            } else {
                // Render Food Card
                return `
                <div class="card food-item">
                    <h3>${post.food_type || post.foodType}</h3>
                    <p><strong>Donor:</strong> ${post.donor?.marketing_name || post.donor?.name || 'Anonymous'}</p>
                    <p><strong>Location:</strong> ${post.location}</p>
                    <p><strong>Contact:</strong> ${post.contact_phone || post.contactPhone}</p>
                    <p><strong>Expiry:</strong> ${new Date(post.expiry_time || post.expiryTime).toLocaleString()}</p>
                    <p><strong>Quantity:</strong> ${post.quantity}</p>
                    
                    <div class="items-list-container">
                        <strong>Select Items to Request:</strong><br>
                        ${(post.food_items || post.foodItems || []).map(item => `
                            <label>
                                <input type="checkbox" class="post-item-${post.id || post._id}" value="${item}" checked> ${item}
                            </label><br>
                        `).join('')}
                    </div>

                    <div class="post-actions">
                        <button class="btn btn-sm btn-block" onclick="placeFoodRequest('${post.id || post._id}')">Request Food</button>
                    </div>
                </div>
                `;
            }
        }).join('');
    } catch (err) {
        // container.innerHTML = '<p>Error loading items.</p>';
        console.error(err);
    }
}

async function placeFoodRequest(postId) {
    const checkboxes = document.querySelectorAll(`.post-item-${postId}:checked`);
    const selectedItems = Array.from(checkboxes).map(cb => cb.value);

    if (selectedItems.length === 0) {
        alert('Please select at least one item.');
        return;
    }

    if (!confirm(`Requesting ${selectedItems.length} items. Confirm?`)) return;

    try {
        const res = await authFetch('/requests', {
            method: 'POST',
            body: JSON.stringify({
                foodPostId: postId,
                selectedItems
            })
        });

        if (res.ok) {
            alert('Request place successfully! Waiting for donor approval.');
            loadMyRequests();
            loadAvailableItems();
        } else {
            const data = await res.json();
            alert(data.message || 'Error placing request');
        }
    } catch (err) {
        console.error(err);
    }
}

async function placeResourceRequest(postId) {
    if (!confirm(`Request this item?`)) return;

    try {
        const res = await authFetch('/requests', {
            method: 'POST',
            body: JSON.stringify({
                resourcePostId: postId,
                message: 'I would like to request this item.'
            })
        });

        if (res.ok) {
            alert('Request place successfully!');
            loadMyRequests();
            loadAvailableItems();
        } else {
            const data = await res.json();
            alert(data.message || 'Error placing request');
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadMyRequests() {
    const container = document.getElementById('my-requests-list');
    if (!container) return;

    try {
        const res = await authFetch('/requests/my');
        const requests = await res.json();

        if (requests.length === 0) {
            container.innerHTML = '<p>No requests made yet.</p>';
            return;
        }

        container.innerHTML = requests.map(req => {
            let title = '';
            let detail = '';

            if (req.foodPost) {
                title = `[Food] ${req.foodPost.food_type || req.foodPost.foodType}`;
                detail = `Items: ${req.selected_items || req.selectedItems ? (req.selected_items || req.selectedItems).join(', ') : 'All'}`;
            } else if (req.resourcePost) {
                title = `[${req.resourcePost.category}] ${req.resourcePost.item_name || req.resourcePost.itemName}`;
                detail = req.resourcePost.description || '';
            } else {
                title = 'Unknown Post';
            }

            return `
            <div class="card" style="padding: 10px;">
                <p><strong>${title}</strong></p>
                <p><small>${detail}</small></p>
                <p><strong>Status:</strong> 
                    <span style="color: ${req.status === 'Accepted' ? 'green' : req.status === 'Rejected' ? 'red' : 'orange'}">
                        ${req.status}
                    </span>
                </p>
                <p><small>${new Date(req.created_at || req.createdAt).toLocaleDateString()}</small></p>
            </div>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
    }
}
