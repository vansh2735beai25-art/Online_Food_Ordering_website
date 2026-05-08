const formatMoney = (amount) => `Rs. ${Number(amount) || 0}`;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
}[character]));

const readStorage = (key, fallback) => {
    try {
        const savedValue = localStorage.getItem(key);
        return savedValue ? JSON.parse(savedValue) : fallback;
    } catch (error) {
        localStorage.removeItem(key);
        return fallback;
    }
};

const saveStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

const userKey = "cheesyMomentsUser";
const cartKey = "cheesyMomentsCart";
const orderKey = "cheesyMomentsOrder";

let currentUser = readStorage(userKey, null);
let cart = readStorage(cartKey, []);
let toastTimer;

const authActions = document.querySelector("[data-auth-actions]");
let authModal = document.querySelector("[data-auth-modal]");
let loginForm = document.querySelector("[data-login-form]");
let closeAuthButton = document.querySelector("[data-close-auth]");

const showToast = (message) => {
    let toast = document.querySelector("[data-toast]");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        toast.dataset.toast = "";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("is-visible");
    }, 2200);
};

const createAuthModal = () => {
    if (authModal) {
        return;
    }

    const modal = document.createElement("div");
    modal.className = "auth-modal";
    modal.dataset.authModal = "";
    modal.hidden = true;
    modal.innerHTML = `
        <form class="auth-box" data-login-form>
            <button class="close-modal" type="button" data-close-auth aria-label="Close login">x</button>
            <p class="eyebrow">Member Login</p>
            <h2>Welcome Back</h2>
            <label>Name<input type="text" name="name" placeholder="Enter your name" required></label>
            <label>Email<input type="email" name="email" placeholder="name@example.com" required></label>
            <label>Phone<input type="tel" name="phone" placeholder="10 digit mobile number" pattern="[0-9]{10}"></label>
            <button class="btn" type="submit">Login</button>
        </form>
    `;
    document.body.appendChild(modal);
    authModal = modal;
    loginForm = modal.querySelector("[data-login-form]");
    closeAuthButton = modal.querySelector("[data-close-auth]");
};

createAuthModal();

const renderAuth = () => {
    if (!authActions) {
        return;
    }

    if (currentUser) {
        authActions.innerHTML = `
            <span title="${escapeHtml(currentUser.email)}">Hi, ${escapeHtml(currentUser.name)}</span>
            <button class="small-btn" type="button" data-logout>Logout</button>
        `;
    } else {
        authActions.innerHTML = "<button class=\"small-btn\" type=\"button\" data-login-open>Login</button>";
    }
};

function fillCustomerDetails() {
    const orderForm = document.querySelector(".order-form");
    if (!orderForm || !currentUser) {
        return;
    }

    const nameInput = orderForm.querySelector("[name='customerName']");
    const emailInput = orderForm.querySelector("[name='email']");
    const phoneInput = orderForm.querySelector("[name='phone']");

    if (nameInput && !nameInput.value) {
        nameInput.value = currentUser.name || "";
    }

    if (emailInput && !emailInput.value) {
        emailInput.value = currentUser.email || "";
    }

    if (phoneInput && !phoneInput.value) {
        phoneInput.value = currentUser.phone || "";
    }
}

const openLogin = () => {
    if (!authModal || !loginForm) {
        return;
    }

    authModal.hidden = false;
    loginForm.querySelector("[name='name']").value = currentUser?.name || "";
    loginForm.querySelector("[name='email']").value = currentUser?.email || "";
    loginForm.querySelector("[name='phone']").value = currentUser?.phone || "";
    loginForm.querySelector("input")?.focus();
};

renderAuth();

authActions?.addEventListener("click", (event) => {
    const loginButton = event.target.closest("[data-login-open]");
    const logoutButton = event.target.closest("[data-logout]");

    if (loginButton) {
        openLogin();
    }

    if (logoutButton) {
        currentUser = null;
        localStorage.removeItem(userKey);
        renderAuth();
        showToast("Logged out successfully");
    }
});

closeAuthButton?.addEventListener("click", () => {
    authModal.hidden = true;
});

authModal?.addEventListener("click", (event) => {
    if (event.target === authModal) {
        authModal.hidden = true;
    }
});

loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!loginForm.checkValidity()) {
        loginForm.reportValidity();
        return;
    }

    const formData = new FormData(loginForm);
    currentUser = {
        name: formData.get("name").trim(),
        email: formData.get("email").trim(),
        phone: formData.get("phone").trim()
    };

    saveStorage(userKey, currentUser);
    authModal.hidden = true;
    renderAuth();
    fillCustomerDetails();
    showToast(`Welcome, ${currentUser.name}`);
});

const menuContainer = document.querySelector(".menu-container");
const menuCards = [...document.querySelectorAll("[data-food-card]")].map((card, index) => {
    card.dataset.index = index;
    return card;
});
const searchInput = document.querySelector("[data-search-menu]");
const categoryFilter = document.querySelector("[data-category-filter]");
const sortMenu = document.querySelector("[data-sort-menu]");
const menuResult = document.querySelector("[data-menu-result]");

const sortCards = () => {
    if (!menuContainer || !sortMenu) {
        return;
    }

    const sortedCards = [...menuCards];
    const sortValue = sortMenu.value;

    sortedCards.sort((first, second) => {
        const firstPrice = Number(first.dataset.price);
        const secondPrice = Number(second.dataset.price);

        if (sortValue === "price-low") {
            return firstPrice - secondPrice;
        }

        if (sortValue === "price-high") {
            return secondPrice - firstPrice;
        }

        if (sortValue === "name") {
            return first.dataset.name.localeCompare(second.dataset.name);
        }

        return Number(first.dataset.index) - Number(second.dataset.index);
    });

    sortedCards.forEach((card) => menuContainer.appendChild(card));
};

const filterMenu = () => {
    if (!menuCards.length) {
        return;
    }

    sortCards();

    const searchTerm = (searchInput?.value || "").trim().toLowerCase();
    const category = categoryFilter?.value || "all";
    let visibleCount = 0;

    menuCards.forEach((card) => {
        const cardText = `${card.dataset.name} ${card.dataset.category} ${card.dataset.tags} ${card.textContent}`.toLowerCase();
        const matchesSearch = cardText.includes(searchTerm);
        const matchesCategory = category === "all" || card.dataset.category === category;
        const isVisible = matchesSearch && matchesCategory;

        card.classList.toggle("is-hidden", !isVisible);
        if (isVisible) {
            visibleCount += 1;
        }
    });

    if (menuResult) {
        menuResult.textContent = visibleCount
            ? `${visibleCount} food item${visibleCount === 1 ? "" : "s"} found`
            : "No food items matched your search.";
    }
};

searchInput?.addEventListener("input", filterMenu);
categoryFilter?.addEventListener("change", filterMenu);
sortMenu?.addEventListener("change", filterMenu);
filterMenu();

const cartItemsOutput = document.querySelector("[data-cart-items]");
const cartTotalOutput = document.querySelector("[data-cart-total]");

const getCartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

const saveCart = () => {
    saveStorage(cartKey, cart);
};

const renderCart = () => {
    if (!cartItemsOutput || !cartTotalOutput) {
        return;
    }

    if (!cart.length) {
        cartItemsOutput.innerHTML = "<p>Your cart is empty. Add food from the menu.</p>";
        cartTotalOutput.textContent = formatMoney(0);
        return;
    }

    cartItemsOutput.innerHTML = cart.map((item) => `
        <div class="cart-item">
            <div>
                <strong>${escapeHtml(item.name)}</strong>
                <span>${formatMoney(item.price)} each</span>
            </div>
            <div class="quantity-controls" aria-label="${escapeHtml(item.name)} quantity controls">
                <button type="button" data-cart-minus data-name="${escapeHtml(item.name)}">-</button>
                <strong>${escapeHtml(item.quantity)}</strong>
                <button type="button" data-cart-plus data-name="${escapeHtml(item.name)}">+</button>
            </div>
            <strong>${formatMoney(item.price * item.quantity)}</strong>
            <button class="remove-btn" type="button" data-cart-remove data-name="${escapeHtml(item.name)}">Remove</button>
        </div>
    `).join("");
    cartTotalOutput.textContent = formatMoney(getCartTotal());
};

const addToCart = (name, price) => {
    const existingItem = cart.find((item) => item.name === name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }

    saveCart();
    renderCart();
};

document.addEventListener("click", (event) => {
    const quickAddButton = event.target.closest("[data-quick-add]");
    const clearCartButton = event.target.closest("[data-clear-cart]");
    const checkoutButton = event.target.closest("[data-cart-checkout]");
    const plusButton = event.target.closest("[data-cart-plus]");
    const minusButton = event.target.closest("[data-cart-minus]");
    const removeButton = event.target.closest("[data-cart-remove]");

    if (quickAddButton) {
        const name = quickAddButton.dataset.name;
        const price = Number(quickAddButton.dataset.price);

        addToCart(name, price);
        quickAddButton.textContent = "Added";
        showToast(`${name} added to cart`);
        setTimeout(() => {
            quickAddButton.textContent = "Add to Cart";
        }, 900);
    }

    if (plusButton || minusButton || removeButton) {
        const name = (plusButton || minusButton || removeButton).dataset.name;
        const item = cart.find((cartItem) => cartItem.name === name);

        if (item && plusButton) {
            item.quantity += 1;
        }

        if (item && minusButton) {
            item.quantity -= 1;
        }

        cart = cart.filter((cartItem) => cartItem.quantity > 0 && cartItem.name !== removeButton?.dataset.name);
        saveCart();
        renderCart();
    }

    if (clearCartButton) {
        cart = [];
        saveCart();
        renderCart();
        showToast("Cart cleared");
    }

    if (checkoutButton) {
        if (!cart.length) {
            showToast("Add food to your cart first");
            return;
        }

        const order = {
            id: `CM-${Date.now().toString().slice(-6)}`,
            type: "cart",
            items: cart,
            itemName: `${cart.length} cart item${cart.length === 1 ? "" : "s"}`,
            quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
            total: getCartTotal(),
            customerName: currentUser?.name || "Guest Customer",
            email: currentUser?.email || "Not provided",
            phone: currentUser?.phone || "Not provided",
            address: "To be confirmed at delivery counter",
            instructions: "Cart checkout from menu page",
            placedAt: new Date().toLocaleString()
        };

        saveStorage(orderKey, order);
        window.location.href = "confirmation.html";
    }
});

renderCart();

const orderSection = document.querySelector("[data-item-name]");
const orderForm = document.querySelector(".order-form");

if (orderSection && orderForm) {
    const itemName = orderSection.dataset.itemName;
    const itemPrice = Number(orderSection.dataset.itemPrice);
    const quantityInput = orderForm.querySelector("[name='quantity']");
    const totalOutput = orderForm.querySelector("[data-total]");

    const updateTotal = () => {
        const quantity = Math.max(1, Number(quantityInput.value) || 1);
        quantityInput.value = quantity;
        totalOutput.textContent = formatMoney(itemPrice * quantity);
    };

    fillCustomerDetails();
    quantityInput.addEventListener("input", updateTotal);
    updateTotal();

    orderForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!orderForm.checkValidity()) {
            orderForm.reportValidity();
            return;
        }

        const formData = new FormData(orderForm);
        const quantity = Number(formData.get("quantity"));
        const order = {
            id: `CM-${Date.now().toString().slice(-6)}`,
            type: "single",
            items: [{ name: itemName, price: itemPrice, quantity }],
            itemName,
            itemPrice,
            quantity,
            total: itemPrice * quantity,
            customerName: formData.get("customerName").trim(),
            email: formData.get("email").trim(),
            phone: formData.get("phone").trim(),
            address: formData.get("address").trim(),
            instructions: formData.get("instructions").trim() || "No special instructions",
            placedAt: new Date().toLocaleString()
        };

        saveStorage(orderKey, order);
        currentUser = {
            name: order.customerName,
            email: order.email,
            phone: order.phone
        };
        saveStorage(userKey, currentUser);
        window.location.href = "confirmation.html";
    });
}

const summary = document.querySelector("[data-summary]");

if (summary) {
    const order = readStorage(orderKey, null);

    if (order) {
        const itemList = Array.isArray(order.items) ? order.items.map((item) => (
            `${escapeHtml(item.name)} x ${escapeHtml(item.quantity)} (${formatMoney(item.price * item.quantity)})`
        )).join("<br>") : escapeHtml(order.itemName);

        summary.innerHTML = `
            <h2>Order Summary</h2>
            <ul>
                <li><span>Order ID</span><strong>${escapeHtml(order.id)}</strong></li>
                <li><span>Items</span><strong>${itemList}</strong></li>
                <li><span>Quantity</span><strong>${escapeHtml(order.quantity)}</strong></li>
                <li><span>Total</span><strong>${formatMoney(order.total)}</strong></li>
                <li><span>Name</span><strong>${escapeHtml(order.customerName)}</strong></li>
                <li><span>Email</span><strong>${escapeHtml(order.email)}</strong></li>
                <li><span>Phone</span><strong>${escapeHtml(order.phone)}</strong></li>
                <li><span>Address</span><strong>${escapeHtml(order.address)}</strong></li>
                <li><span>Instructions</span><strong>${escapeHtml(order.instructions)}</strong></li>
                <li><span>Placed At</span><strong>${escapeHtml(order.placedAt)}</strong></li>
            </ul>
            <p class="delivery-note">Estimated delivery: 30 to 40 minutes</p>
        `;
    }
}

const trackButton = document.querySelector("[data-track]");
const statusOutput = document.querySelector("[data-status]");

if (trackButton && statusOutput) {
    const statuses = [
        "Preparing your order",
        "Packing your meal",
        "Out for delivery",
        "Arriving soon"
    ];
    let statusIndex = 0;

    trackButton.addEventListener("click", () => {
        statusIndex = (statusIndex + 1) % statuses.length;
        statusOutput.textContent = statuses[statusIndex];
    });
}
