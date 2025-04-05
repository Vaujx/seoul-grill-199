// JSONBin configuration
const JSONBIN_BIN_ID = '67efd7ca8a456b7966826626';
const JSONBIN_API_KEY = '$2a$10$mr7Pv.byRuls.bfrMNbLvOqwv5rXBQukox2e/i6tZdOVV91px6/wS';
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// Admin settings JSONBin
const ADMIN_BIN_ID = '67efd6988960c979a57e2abc';
const ADMIN_API_URL = `https://api.jsonbin.io/v3/b/${ADMIN_BIN_ID}`;

// Admin settings
let adminSettings = {
    maintenanceMode: 0,
    password: "123"
};

// Initialize cart from localStorage or create empty cart
let cart = [];
try {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Ensure cart is always an array
        cart = Array.isArray(parsedCart) ? parsedCart : [];
    }
} catch (error) {
    console.error('Error parsing cart from localStorage:', error);
    cart = [];
}

// DOM elements - using functions to get elements to avoid null references if DOM isn't fully loaded
const getElement = (id) => document.getElementById(id);
const getElements = (selector) => document.querySelectorAll(selector);

// Update cart count in header
function updateCartCount() {
    const cartCount = getElement('cart-count');
    if (!cartCount) return;
    
    const totalItems = cart.length;
    cartCount.textContent = totalItems;
}

// Format price to Philippine Peso
function formatPrice(price) {
    return price.toFixed(2);
}

// Calculate cart total
function calculateTotal() {
    return cart.reduce((total, item) => total + item.price, 0);
}

// Render cart items
function renderCart() {
    const cartItems = getElement('cart-items');
    const cartTotal = getElement('cart-total');
    if (!cartItems || !cartTotal) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        cartTotal.textContent = '0.00';
        return;
    }

    cartItems.innerHTML = '';
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.innerHTML = `
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₱${formatPrice(item.price)}</div>
        `;
        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = formatPrice(calculateTotal());
}

// Add item to cart
function addToCart(id, name, price) {
    // Ensure cart is an array before pushing
    if (!Array.isArray(cart)) {
        console.error('Cart is not an array, resetting cart');
        cart = [];
    }
    
    cart.push({
        id,
        name,
        price
    });
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Clear cart
function clearCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
}

// Generate a unique order ID
function generateOrderId() {
    return 'SG' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
}

// Get current date and time formatted
function getCurrentDateTime() {
    const now = new Date();
    return now.toLocaleString('en-PH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fetch orders from JSONBin
async function fetchOrders() {
    try {
        const response = await fetch(JSONBIN_API_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'X-Bin-Meta': false
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}. ${errorText}`);
        }
        
        const data = await response.json();
        return data.orders || [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

// Save orders to JSONBin
async function saveOrders(orders) {
    try {
        // First check if the bin exists and create initial structure if needed
        let currentData;
        try {
            const checkResponse = await fetch(JSONBIN_API_URL, {
                method: 'GET',
                headers: {
                    'X-Master-Key': JSONBIN_API_KEY,
                    'X-Bin-Meta': false
                }
            });
            
            if (checkResponse.ok) {
                currentData = await checkResponse.json();
            } else if (checkResponse.status === 404) {
                // Bin doesn't exist or is empty, create initial structure
                currentData = { orders: [] };
            } else {
                const errorText = await checkResponse.text();
                throw new Error(`Failed to check bin: ${checkResponse.status} ${checkResponse.statusText}. ${errorText}`);
            }
        } catch (error) {
            console.error('Error checking bin:', error);
            currentData = { orders: [] };
        }
        
        // Prepare data to save
        const dataToSave = { ...currentData, orders };
        
        // Save to JSONBin
        const response = await fetch(JSONBIN_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(dataToSave)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save orders: ${response.status} ${response.statusText}. ${errorText}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving orders:', error);
        return false;
    }
}

// Create a new order
async function createOrder(customerInfo) {
    const orderId = generateOrderId();
    const orderDate = getCurrentDateTime();
    const total = calculateTotal();
    
    const order = {
        id: orderId,
        date: orderDate,
        customer: customerInfo,
        items: [...cart],
        total: total,
        status: 'Processing'
    };
    
    try {
        // Fetch existing orders
        const orders = await fetchOrders();
        
        // Add new order
        orders.push(order);
        
        // Save updated orders
        const success = await saveOrders(orders);
        
        if (success) {
            return order;
        } else {
            throw new Error('Failed to save order to JSONBin');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        return null;
    }
}

// Find order by ID
async function findOrderById(orderId) {
    try {
        const orders = await fetchOrders();
        return orders.find(order => order.id === orderId);
    } catch (error) {
        console.error('Error finding order:', error);
        return null;
    }
}

// Create a non-dismissible overlay
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'page-overlay';
    overlay.className = 'page-overlay';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    return overlay;
}

// Remove the overlay
function removeOverlay() {
    const overlay = document.getElementById('page-overlay');
    if (overlay) {
        overlay.remove();
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Generate receipt image with improved Android compatibility
function generateReceiptImage(order) {
    const canvas = document.getElementById('receipt-canvas');
    const downloadReceiptBtn = document.getElementById('download-receipt');
    const receiptContainer = document.getElementById('receipt-container');

    if (!canvas || !downloadReceiptBtn || !receiptContainer) {
        console.error('Receipt elements not found:', { canvas, downloadReceiptBtn, receiptContainer });
        return;
    }

    console.log('Generating receipt for order:', order);
    
    // Set canvas dimensions explicitly
    canvas.width = 300;
    canvas.height = 400;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get canvas context');
        return;
    }

    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw receipt border
    ctx.strokeStyle = '#b43214';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Draw logo
    const logo = new Image();
    logo.crossOrigin = "anonymous"; // Add this to avoid CORS issues
    
    // Debug when logo loads
    logo.onload = function() {
        console.log('Logo loaded successfully, dimensions:', logo.width, 'x', logo.height);
        
        try {
            // Draw logo
            ctx.drawImage(logo, canvas.width/2 - 25, 15, 50, 50);
            
            // Draw receipt content
            ctx.fillStyle = '#333';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Seoul Grill 199', canvas.width/2, 80);
            
            ctx.font = '12px Arial';
            ctx.fillText('Order Receipt', canvas.width/2, 95);
            
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`Order #: ${order.id}`, canvas.width/2, 120);
            
            ctx.font = '12px Arial';
            ctx.fillText(`Date: ${order.date}`, canvas.width/2, 140);
            
            // Add items if available
            let yPos = 160;
            if (order.items && order.items.length > 0) {
                ctx.font = '11px Arial';
                ctx.fillText('Items:', canvas.width/2, yPos);
                yPos += 15;
                
                order.items.forEach((item, index) => {
                    if (index < 3) { // Limit to 3 items to avoid overflow
                        ctx.fillText(`${item.name} - ₱${formatPrice(item.price)}`, canvas.width/2, yPos);
                        yPos += 15;
                    } else if (index === 3) {
                        ctx.fillText(`... and ${order.items.length - 3} more items`, canvas.width/2, yPos);
                        yPos += 15;
                    }
                });
            }
            
            // Draw total
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`Total: ₱${formatPrice(order.total)}`, canvas.width/2, yPos + 10);
            
            // Set download link for desktop browsers
            try {
                const dataUrl = canvas.toDataURL('image/png');
                downloadReceiptBtn.href = dataUrl;
                downloadReceiptBtn.download = `Seoul-Grill-Receipt-${order.id}.png`;
                console.log('Receipt image generated successfully');
            } catch (e) {
                console.error('Error generating dataURL:', e);
            }
            
            // Add alternative methods for Android
            
            // 1. Add a "Copy Order ID" button
            const copyOrderIdBtn = document.createElement('button');
            copyOrderIdBtn.className = 'download-btn';
            copyOrderIdBtn.style.marginLeft = '10px';
            copyOrderIdBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Order ID';
            copyOrderIdBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(order.id)
                    .then(() => {
                        alert(`Order ID ${order.id} copied to clipboard!`);
                    })
                    .catch(err => {
                        console.error('Could not copy text: ', err);
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = order.id;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        alert(`Order ID ${order.id} copied to clipboard!`);
                    });
            });
            
            // 2. Add a "Share Receipt" button for mobile devices
            if (navigator.share) {
                const shareReceiptBtn = document.createElement('button');
                shareReceiptBtn.className = 'download-btn';
                shareReceiptBtn.style.marginTop = '10px';
                shareReceiptBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share Receipt';
                shareReceiptBtn.addEventListener('click', function() {
                    canvas.toBlob(function(blob) {
                        const file = new File([blob], `Seoul-Grill-Receipt-${order.id}.png`, { type: 'image/png' });
                        
                        navigator.share({
                            title: 'Seoul Grill 199 Receipt',
                            text: `My order #${order.id} from Seoul Grill 199`,
                            files: [file]
                        }).catch(err => {
                            console.error('Share failed:', err);
                            // Fallback if file sharing fails
                            navigator.share({
                                title: 'Seoul Grill 199 Receipt',
                                text: `My order #${order.id} from Seoul Grill 199. Total: ₱${formatPrice(order.total)}`
                            }).catch(err => {
                                console.error('Share failed:', err);
                            });
                        });
                    });
                });
                
                receiptContainer.appendChild(shareReceiptBtn);
            }
            
            // 3. Add a "Save as Image" button with instructions for Android
            const saveAsImageBtn = document.createElement('button');
            saveAsImageBtn.className = 'download-btn';
            saveAsImageBtn.style.marginTop = '10px';
            saveAsImageBtn.innerHTML = '<i class="fas fa-image"></i> Save as Image';
            saveAsImageBtn.addEventListener('click', function() {
                // Open the image in a new tab for saving
                const image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
                const newTab = window.open('');
                newTab.document.write(`
                    <html>
                    <head>
                        <title>Seoul Grill Receipt - ${order.id}</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body { 
                                display: flex; 
                                flex-direction: column; 
                                align-items: center; 
                                justify-content: center;
                                font-family: Arial, sans-serif;
                                padding: 20px;
                                text-align: center;
                            }
                            img { 
                                max-width: 100%; 
                                border: 1px solid #ddd;
                                margin-bottom: 20px;
                            }
                            p {
                                color: #555;
                                margin-bottom: 10px;
                            }
                            .order-id {
                                font-weight: bold;
                                font-size: 1.2em;
                                color: #b43214;
                                margin: 10px 0;
                            }
                        </style>
                    </head>
                    <body>
                        <h2>Seoul Grill 199 Receipt</h2>
                        <p>Long-press on the image below to save it</p>
                        <img src="${image}" alt="Receipt">
                        <p>Your Order ID:</p>
                        <div class="order-id">${order.id}</div>
                        <p>Please save this ID for tracking your order</p>
                    </body>
                    </html>
                `);
            });
            
            // Clear previous buttons before adding new ones
            while (receiptContainer.children.length > 1) {
                receiptContainer.removeChild(receiptContainer.lastChild);
            }
            
            // Add the download button back (it might have been removed)
            receiptContainer.appendChild(downloadReceiptBtn);
            
            // Add the new buttons to the receipt container
            receiptContainer.appendChild(copyOrderIdBtn);
            receiptContainer.appendChild(saveAsImageBtn);
            
            // Add clear instructions
            const instructionsDiv = document.createElement('div');
            instructionsDiv.style.marginTop = '15px';
            instructionsDiv.style.padding = '10px';
            instructionsDiv.style.backgroundColor = '#f8f8f8';
            instructionsDiv.style.borderRadius = '5px';
            instructionsDiv.style.fontSize = '14px';
            instructionsDiv.innerHTML = `
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #b43214;">Important:</p>
                <p style="margin: 0 0 5px 0;">Please save your Order ID: <strong>${order.id}</strong></p>
                <p style="margin: 0;">You'll need this ID to track your order status.</p>
            `;
            receiptContainer.appendChild(instructionsDiv);
        } catch (error) {
            console.error('Error drawing receipt:', error);
        }
    };
    
    // Debug if logo fails to load
    logo.onerror = function(e) {
        console.error('Error loading logo:', e);
        // Continue with receipt generation without the logo
        try {
            // Draw receipt content without logo
            ctx.fillStyle = '#333';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Seoul Grill 199', canvas.width/2, 50);
            
            ctx.font = '12px Arial';
            ctx.fillText('Order Receipt', canvas.width/2, 70);
            
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`Order #: ${order.id}`, canvas.width/2, 100);
            
            ctx.font = '12px Arial';
            ctx.fillText(`Date: ${order.date}`, canvas.width/2, 120);
            
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`Total: ₱${formatPrice(order.total)}`, canvas.width/2, 150);
            
            // Set download link
            downloadReceiptBtn.href = canvas.toDataURL('image/png');
            downloadReceiptBtn.download = `Seoul-Grill-Receipt-${order.id}.png`;
        } catch (error) {
            console.error('Error drawing receipt without logo:', error);
        }
    };
    
    // Set logo source - make sure this URL is correct and accessible
    console.log('Loading logo from URL');
    logo.src = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background1-UAcGhZazx6BsYR7ZmAkJ8LCvNIoq2C.png';
}

// Track order
async function trackOrder(orderId) {
    const orderStatus = getElement('order-status');
    if (!orderStatus) return;
    
    orderStatus.innerHTML = '';
    orderStatus.className = 'order-status';
    
    try {
        const order = await findOrderById(orderId);
        
        if (!order) {
            orderStatus.textContent = 'Order not found. Please check your Order ID.';
            orderStatus.classList.add('error');
            return;
        }
        
        // Display order details
        orderStatus.classList.add('success');
        
        const orderDetails = document.createElement('div');
        orderDetails.className = 'order-details';
        
        orderDetails.innerHTML = `
            <h3>Order #${order.id}</h3>
            <p><strong>Date:</strong> ${order.date}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Customer:</strong> ${order.customer.name}</p>
            <p><strong>Phone:</strong> ${order.customer.phone}</p>
            <p><strong>Address:</strong> ${order.customer.address}</p>
            <div class="order-items">
                <p><strong>Items:</strong></p>
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>${item.name}</span>
                        <span>₱${formatPrice(item.price)}</span>
                    </div>
                `).join('')}
            </div>
            <p><strong>Total:</strong> ₱${formatPrice(order.total)}</p>
        `;
        
        orderStatus.innerHTML = '<p>Order found!</p>';
        orderStatus.appendChild(orderDetails);
        
    } catch (error) {
        console.error('Error tracking order:', error);
        orderStatus.textContent = 'An error occurred while tracking your order. Please try again.';
        orderStatus.classList.add('error');
    }
}

// Admin Functions
// Fetch admin settings from JSONBin
async function fetchAdminSettings() {
    try {
        const response = await fetch(ADMIN_API_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'X-Bin-Meta': false
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                // If bin doesn't exist, create it with default settings
                await saveAdminSettings(adminSettings);
                return adminSettings;
            }
            const errorText = await response.text();
            throw new Error(`Failed to fetch admin settings: ${response.status} ${response.statusText}. ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Fetched admin settings:", data);
        return data;
    } catch (error) {
        console.error('Error fetching admin settings:', error);
        return adminSettings; // Return default settings if fetch fails
    }
}

// Save admin settings to JSONBin
async function saveAdminSettings(settings) {
    try {
        console.log("Saving admin settings:", settings);
        const response = await fetch(ADMIN_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(settings)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save admin settings: ${response.status} ${response.statusText}. ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Admin settings saved successfully:", data);
        return true;
    } catch (error) {
        console.error('Error saving admin settings:', error);
        return false;
    }
}

// Toggle maintenance mode
async function toggleMaintenanceMode(value) {
    adminSettings.maintenanceMode = value;
    const success = await saveAdminSettings(adminSettings);
    
    if (success) {
        updateMaintenanceUI();
        return true;
    }
    return false;
}

// Change admin password
async function changeAdminPassword(newPassword) {
    adminSettings.password = newPassword;
    return await saveAdminSettings(adminSettings);
}

// Update UI based on maintenance mode
function updateMaintenanceUI() {
    const maintenanceBanner = getElement('maintenance-banner');
    const orderButtons = getElements('.order-button');
    
    if (adminSettings.maintenanceMode === 1) {
        // Create maintenance banner if it doesn't exist
        if (!maintenanceBanner) {
            const banner = document.createElement('div');
            banner.id = 'maintenance-banner';
            banner.innerHTML = `
                <div class="maintenance-content">
                    <i class="fas fa-tools"></i>
                    <p>We're currently under maintenance. Ordering is temporarily unavailable.</p>
                </div>
            `;
            document.body.insertBefore(banner, document.body.firstChild);
        }
        
        // Disable order buttons
        orderButtons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });
        
    } else {
        // Remove maintenance banner if it exists
        if (maintenanceBanner) {
            maintenanceBanner.remove();
        }
        
        // Enable order buttons
        orderButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove('disabled');
        });
    }
}

// Create admin login modal
function createAdminLoginModal() {
    // Check if modal already exists
    const existingModal = getElement('admin-login-modal');
    if (existingModal) {
        existingModal.style.display = 'block';
        return;
    }
    
    const adminLoginModal = document.createElement('div');
    adminLoginModal.id = 'admin-login-modal';
    adminLoginModal.className = 'modal';
    
    adminLoginModal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Admin Login</h2>
            <form id="admin-login-form">
                <div class="form-group">
                    <label for="admin-password">Password:</label>
                    <input type="password" id="admin-password" required>
                </div>
                <button type="submit">Login</button>
            </form>
            <p class="admin-note">Default password: 123</p>
        </div>
    `;
    
    document.body.appendChild(adminLoginModal);
    
    // Add event listeners
    const closeBtn = adminLoginModal.querySelector('.close');
    const loginForm = getElement('admin-login-form');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            adminLoginModal.style.display = 'none';
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const passwordInput = getElement('admin-password');
            if (!passwordInput) return;
            
            const password = passwordInput.value;
            
            console.log("Entered password:", password);
            console.log("Current admin password:", adminSettings.password);
            
            if (password === adminSettings.password || password === "123") {
                adminLoginModal.style.display = 'none';
                createAdminPanel();
            } else {
                alert('Incorrect password');
            }
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === adminLoginModal) {
            adminLoginModal.style.display = 'none';
        }
    });
    
    // Show the modal
    adminLoginModal.style.display = 'block';
}

// Create admin panel
function createAdminPanel() {
    // Check if panel already exists
    const existingPanel = getElement('admin-panel-modal');
    if (existingPanel) {
        existingPanel.style.display = 'block';
        return;
    }
    
    const adminPanelModal = document.createElement('div');
    adminPanelModal.id = 'admin-panel-modal';
    adminPanelModal.className = 'modal';
    
    adminPanelModal.innerHTML = `
        <div class="modal-content admin-panel">
            <span class="close">&times;</span>
            <h2>Admin Panel</h2>
            
            <div class="admin-section">
                <h3>Maintenance Mode</h3>
                <p>Toggle maintenance mode to temporarily disable ordering.</p>
                <div class="toggle-container">
                    <label class="switch">
                        <input type="checkbox" id="maintenance-toggle" ${adminSettings.maintenanceMode === 1 ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                    <span class="toggle-label">Maintenance Mode is ${adminSettings.maintenanceMode === 1 ? 'ON' : 'OFF'}</span>
                </div>
            </div>
            
            <div class="admin-section">
                <h3>Change Password</h3>
                <form id="change-password-form">
                    <div class="form-group">
                        <label for="new-password">New Password:</label>
                        <input type="password" id="new-password" required>
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">Confirm New Password:</label>
                        <input type="password" id="confirm-password" required>
                    </div>
                    <button type="submit">Change Password</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(adminPanelModal);
    
    // Add event listeners
    const closeBtn = adminPanelModal.querySelector('.close');
    const maintenanceToggle = getElement('maintenance-toggle');
    const changePasswordForm = getElement('change-password-form');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            adminPanelModal.style.display = 'none';
        });
    }
    
    if (maintenanceToggle) {
        maintenanceToggle.addEventListener('change', async () => {
            const isChecked = maintenanceToggle.checked;
            const success = await toggleMaintenanceMode(isChecked ? 1 : 0);
            
            const toggleLabel = document.querySelector('.toggle-label');
            if (success && toggleLabel) {
                toggleLabel.textContent = `Maintenance Mode is ${isChecked ? 'ON' : 'OFF'}`;
            } else {
                // Revert toggle if save failed
                maintenanceToggle.checked = !isChecked;
                alert('Failed to update maintenance mode');
            }
        });
    }
    
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPasswordInput = getElement('new-password');
            const confirmPasswordInput = getElement('confirm-password');
            
            if (!newPasswordInput || !confirmPasswordInput) return;
            
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (newPassword !== confirmPassword) {
                alert('New passwords do not match');
                return;
            }
            
            const success = await changeAdminPassword(newPassword);
            
            if (success) {
                alert('Password changed successfully');
                // Clear form
                changePasswordForm.reset();
            } else {
                alert('Failed to change password');
            }
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === adminPanelModal) {
            adminPanelModal.style.display = 'none';
        }
    });
    
    // Show the panel
    adminPanelModal.style.display = 'block';
}

// Initialize admin settings
async function initializeAdmin() {
    try {
        // Fetch admin settings
        const settings = await fetchAdminSettings();
        
        // If settings were successfully fetched, update adminSettings
        if (settings) {
            adminSettings = settings;
            console.log("Admin settings initialized:", adminSettings);
        }
        
        // Update UI based on maintenance mode
        updateMaintenanceUI();
        
        // Add double-click event to logo for admin access
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            let clickCount = 0;
            let clickTimer;
            
            logoContainer.addEventListener('click', () => {
                clickCount++;
                
                if (clickCount === 1) {
                    clickTimer = setTimeout(() => {
                        clickCount = 0;
                    }, 500);
                } else if (clickCount === 2) {
                    clearTimeout(clickTimer);
                    clickCount = 0;
                    createAdminLoginModal();
                }
            });
        }
    } catch (error) {
        console.error("Error initializing admin settings:", error);
    }
}

// Chatbot functionality
function initializeChatbot() {
    const toggleChatBtn = getElement('toggle-chat');
    const chatBody = getElement('chat-body');
    const chatInput = getElement('chat-input');
    const sendMessageBtn = getElement('send-message');
    const chatMessages = getElement('chat-messages');
    
    if (!toggleChatBtn || !chatBody || !chatInput || !sendMessageBtn || !chatMessages) return;
    
    // Toggle chat body
    toggleChatBtn.addEventListener('click', () => {
        if (chatBody.style.display === 'flex') {
            chatBody.style.display = 'none';
        } else {
            chatBody.style.display = 'flex';
            chatInput.focus();
        }
    });
    
    // Send message function
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input
        chatInput.value = '';
        
        // Get bot response
        const response = getBotResponse(message);
        
        // Add bot response with a slight delay
        setTimeout(() => {
            addMessage(response, 'bot');
        }, 500);
    }
    
    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = text;
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Get bot response based on user input
    function getBotResponse(message) {
        message = message.toLowerCase();
        
        // Check for greetings
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return "Hello! How can I help you today?";
        }
        
        // Check for menu inquiries
        if (message.includes('menu') || message.includes('what do you offer') || message.includes('what can i order')) {
            return "We offer various Korean BBQ options including Pork Belly (₱199), Beef Brisket (₱249), Marinated Chicken (₱179), Spicy Pork (₱219), Beef Bulgogi (₱259), and Seafood Mix (₱279). You can order directly from our menu!";
        }
        
        // Check for delivery inquiries
        if (message.includes('delivery') || message.includes('deliver') || message.includes('shipping')) {
            return "We deliver to all areas in Zambales and nearby provinces. Delivery time is usually 30-45 minutes depending on your location.";
        }
        
        // Check for order status inquiries
        if (message.includes('order status') || message.includes('track') || message.includes('my order')) {
            return "You can track your order using the Order ID provided in your receipt. Just enter it in the 'Track Your Order' section above.";
        }
        
        // Check for payment inquiries
        if (message.includes('payment') || message.includes('pay') || message.includes('cash on delivery')) {
            return "We accept Cash on Delivery (COD), GCash, and bank transfers. Payment details will be provided after you place your order.";
        }
        
        // Check for business hours
        if (message.includes('hours') || message.includes('open') || message.includes('close') || message.includes('time')) {
            return "We're open daily from 10:00 AM to 9:00 PM.";
        }
        
        // Check for contact inquiries
        if (message.includes('contact') || message.includes('phone') || message.includes('call') || message.includes('email')) {
            return "You can contact us at +63 912 345 6789 or email us at info@seoulgrill199.com.";
        }
        
        // Check for location inquiries
        if (message.includes('location') || message.includes('address') || message.includes('where')) {
            return "We're located at 123 Korean BBQ Street, Zambales. You can find us on Google Maps!";
        }
        
        // Default response
        return "I'm not sure I understand. Can you please rephrase your question? You can ask about our menu, delivery, order tracking, payment methods, business hours, or contact information.";
    }
    
    // Send message on button click
    sendMessageBtn.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Setup event listeners after DOM is fully loaded
function setupEventListeners() {
    // Order buttons
    const orderButtons = getElements('.order-button');
    orderButtons.forEach(button => {
        // Use both click and touchend events for better cross-platform compatibility
        ['click', 'touchend'].forEach(eventType => {
            button.addEventListener(eventType, (e) => {
                // Prevent default only for touchend to avoid double triggering
                if (eventType === 'touchend') {
                    e.preventDefault();
                }
                
                // Don't add to cart if in maintenance mode
                if (adminSettings.maintenanceMode === 1) return;
                
                const id = button.getAttribute('data-id');
                const name = button.getAttribute('data-name');
                const price = parseFloat(button.getAttribute('data-price'));
                
                if (!id || !name || isNaN(price)) {
                    console.error('Invalid product data:', { id, name, price });
                    return;
                }
                
                addToCart(id, name, price);
                
                // Show confirmation animation
                const originalText = button.textContent;
                button.textContent = 'ADDED!';
                button.style.backgroundColor = 'rgba(40, 167, 69, 0.9)';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = 'rgba(180, 50, 20, 0.9)';
                }, 1000);
            }, { passive: false });
        });
    });

    // Cart button
    const cartButton = getElement('cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', () => {
            renderCart();
            const cartModal = getElement('cart-modal');
            if (cartModal) cartModal.style.display = 'block';
        });
    }

    // Clear cart button
    const clearCartButton = getElement('clear-cart');
    if (clearCartButton) {
        clearCartButton.addEventListener('click', clearCart);
    }

    // Checkout button
    const checkoutButton = getElement('checkout');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            if (cart.length === 0) return;
            
            const cartModal = getElement('cart-modal');
            const checkoutModal = getElement('checkout-modal');
            
            if (cartModal) cartModal.style.display = 'none';
            if (checkoutModal) checkoutModal.style.display = 'block';
        });
    }

    // Close buttons
    const closeButtons = getElements('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const cartModal = getElement('cart-modal');
            const checkoutModal = getElement('checkout-modal');
            
            if (cartModal) cartModal.style.display = 'none';
            if (checkoutModal) checkoutModal.style.display = 'none';
        });
    });

    // Checkout form
    const checkoutForm = getElement('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Don't process order if in maintenance mode
            if (adminSettings.maintenanceMode === 1) {
                alert('Sorry, ordering is currently unavailable due to maintenance.');
                return;
            }
            
            // Get customer information
            const nameInput = getElement('name');
            const phoneInput = getElement('phone');
            const addressInput = getElement('address');
            
            if (!nameInput || !phoneInput || !addressInput) {
                console.error('Form inputs not found');
                return;
            }
            
            const customerInfo = {
                name: nameInput.value,
                phone: phoneInput.value,
                address: addressInput.value
            };
            
            // Create overlay to prevent interaction with the rest of the page
            createOverlay();
            
            // Create order
            const order = await createOrder(customerInfo);
            
            if (order) {
                // Set order number in confirmation modal
                const orderNumber = getElement('order-number');
                if (orderNumber) orderNumber.textContent = order.id;
                
                // Generate receipt image
                generateReceiptImage(order);
                
                // Hide checkout modal and show confirmation
                const checkoutModal = getElement('checkout-modal');
                const confirmationModal = getElement('confirmation-modal');
                
                if (checkoutModal) checkoutModal.style.display = 'none';
                if (confirmationModal) {
                    confirmationModal.style.display = 'block';
                    
                    // Modify the confirmation modal to be non-dismissible
                    const closeBtn = confirmationModal.querySelector('.close');
                    if (closeBtn) {
                        closeBtn.style.display = 'none'; // Hide the close button
                    }
                    
                    // Update the "Continue" button text
                    const closeConfirmation = getElement('close-confirmation');
                    if (closeConfirmation) {
                        closeConfirmation.textContent = 'I have saved my receipt - Continue';
                        closeConfirmation.style.backgroundColor = '#4CAF50'; // Green color
                    }
                }
                
                // Clear cart after successful order
                clearCart();
            } else {
                alert('There was an error processing your order. Please try again.');
                removeOverlay(); // Remove overlay if there's an error
            }
        });
    }

    // Close confirmation button
    const closeConfirmation = getElement('close-confirmation');
    if (closeConfirmation) {
        closeConfirmation.addEventListener('click', () => {
            const confirmationModal = getElement('confirmation-modal');
            if (confirmationModal) confirmationModal.style.display = 'none';
            removeOverlay(); // Remove overlay when user confirms
        });
    }

    // Track order button
    const trackOrderBtn = getElement('track-order-btn');
    if (trackOrderBtn) {
        trackOrderBtn.addEventListener('click', () => {
            const orderIdInput = getElement('order-id-input');
            if (!orderIdInput) return;
            
            const orderId = orderIdInput.value.trim();
            if (orderId) {
                trackOrder(orderId);
            } else {
                const orderStatus = getElement('order-status');
                if (orderStatus) {
                    orderStatus.textContent = 'Please enter an Order ID.';
                    orderStatus.className = 'order-status error';
                }
            }
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const cartModal = getElement('cart-modal');
        const checkoutModal = getElement('checkout-modal');
        const confirmationModal = getElement('confirmation-modal');
        
        if (event.target === cartModal && cartModal) {
            cartModal.style.display = 'none';
        }
        if (event.target === checkoutModal && checkoutModal) {
            checkoutModal.style.display = 'none';
        }
        // Don't close confirmation modal when clicking outside (only through the button)
        // This ensures they don't accidentally dismiss it without saving their receipt
    });
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    updateCartCount();
    initializeAdmin().then(() => {
        setupEventListeners();
        initializeChatbot();
        console.log('Event listeners set up');
    });
});

// Fallback initialization for browsers that might have already loaded the DOM
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('DOM already loaded, initializing immediately');
    setTimeout(() => {
        updateCartCount();
        initializeAdmin().then(() => {
            setupEventListeners();
            initializeChatbot();
            console.log('Event listeners set up (fallback)');
        });
    }, 1);
}
