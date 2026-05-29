// =========================================
// CART STATE
// =========================================

const CART_STORAGE_KEY = 'made-acrilico-cart';
const CART_SHIPPING_STORAGE_KEY = 'made-acrilico-shipping-enabled';
const SHIPPING_PRICE = 250;

let cart = [];
let includeShipping = false;


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function saveCart() {

    saveToStorage(
        CART_STORAGE_KEY,
        cart
    );

}


function loadCart() {

    const storedCart =
        loadFromStorage(
            CART_STORAGE_KEY,
            []
        );

    cart =
        storedCart
        .map(normalizeCartItem)
        .filter(Boolean);

}


function saveShippingPreference() {

    saveToStorage(
        CART_SHIPPING_STORAGE_KEY,
        includeShipping
    );

}


function loadShippingPreference() {

    includeShipping =
        loadFromStorage(
            CART_SHIPPING_STORAGE_KEY,
            false
        ) === true;

}


function normalizeCartItem(item) {

    if (!item || typeof item !== 'object') {

        return null;

    }

    if (
        item.material &&
        Number.isFinite(item.unitPrice) &&
        Number.isFinite(item.quantity)
    ) {

        return {
            ...item,
            id: item.id ? String(item.id) : generateId(),
            yards: Number.isFinite(item.yards) ? item.yards : 0,
            chargedLength: Number.isFinite(item.chargedLength) ? item.chargedLength : 0,
            fileName: item.fileName || 'Sin archivo',
            fileType: item.fileType || 'N/A',
            fileSize: item.fileSize || 'N/A'
        };

    }

    if (item.title && Number.isFinite(item.price)) {

        return {
            id: item.id ? String(item.id) : generateId(),
            material: item.title,
            size: item.details || 'Medida no especificada',
            chargedLength: 0,
            yards: 0,
            quantity: 1,
            unitPrice: item.price,
            fileName: item.fileName || 'Sin archivo',
            fileType: item.fileType || 'N/A',
            fileSize: item.fileSize || 'N/A'
        };

    }

    return null;

}


function getCartItemTotal(item) {

    return item.unitPrice * item.quantity;

}


function getQuoteFileMetadata() {

    if (typeof getUploadedFileMetadata === 'function') {

        return getUploadedFileMetadata();

    }

    return {
        name: 'Sin archivo',
        type: 'N/A',
        size: 'N/A'
    };

}


// =========================================
// ADD TO CART
// =========================================

function addNestingToCart() {

    const quote =
        typeof getCurrentQuote === 'function'
            ? getCurrentQuote()
            : null;

    if (!quote || quote.invalid || quote.total <= 0) {

        alert(
            'Debes completar una cotización válida.'
        );

        return;

    }

    const file =
        getQuoteFileMetadata();

    const newItem = {

        id: generateId(),
        material: quote.material,
        size: quote.size,
        chargedLength: quote.chargedLength,
        yards: quote.yards,
        quantity: quote.quantity,
        unitPrice: quote.unitPrice,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size

    };

    cart.push(newItem);

    saveCart();

    updateCartUI();

    openCart();

}


// =========================================
// CART UI
// =========================================

function renderEmptyCart(
    container,
    subtotalEl,
    totalEl
) {

    container.innerHTML = `

        <div class="text-center py-12 text-gray-400 space-y-2">

            <i class="fa-solid fa-basket-shopping text-4xl block"></i>

            <span class="text-sm">
                Cotización vacía.
                ¡Arma tu planilla DTF!
            </span>

        </div>

    `;

    subtotalEl.innerText =
        formatCurrency(0);

    totalEl.innerText =
        formatCurrency(0);

}


function renderCartItem(item) {

    const itemTotal =
        getCartItemTotal(item);

    return `

        <div class="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4" data-cart-item="${escapeHTML(item.id)}">

            <div class="flex justify-between items-start gap-3">

                <div class="flex-1">

                    <h4 class="text-sm font-extrabold text-logoDark">
                        ${escapeHTML(item.material)}
                    </h4>

                    <p class="text-xs text-gray-500 mt-1 leading-relaxed">
                        ${escapeHTML(item.size)} • ${escapeHTML(item.yards.toFixed(2))} yd cobradas
                    </p>

                    <p class="text-xs text-gray-500 mt-2 leading-relaxed">
                        Archivo: ${escapeHTML(item.fileName)}
                    </p>

                </div>

                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        data-cart-action="duplicate"
                        data-cart-id="${escapeHTML(item.id)}"
                        class="text-gray-400 hover:text-logoCyan transition-all"
                        title="Duplicar item"
                    >
                        <i class="fa-solid fa-copy"></i>
                    </button>

                    <button
                        type="button"
                        data-cart-action="remove"
                        data-cart-id="${escapeHTML(item.id)}"
                        class="text-red-500 hover:text-red-700 transition-all"
                        title="Eliminar item"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>

            </div>

            <div class="grid grid-cols-[1fr_auto] gap-3 items-end border-t border-gray-200 pt-3">

                <label class="text-xs uppercase tracking-wider text-gray-400 font-bold">
                    Copias
                    <input
                        type="number"
                        min="1"
                        value="${escapeHTML(item.quantity)}"
                        data-cart-quantity="${escapeHTML(item.id)}"
                        class="mt-1 w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-logoDark outline-none focus:border-logoMagenta"
                    >
                </label>

                <div class="text-right">
                    <span class="block text-xs uppercase tracking-wider text-gray-400 font-bold">
                        Total
                    </span>

                    <span class="text-sm font-black text-logoMagenta">
                        ${formatCurrency(itemTotal)}
                    </span>
                </div>

            </div>

        </div>

    `;

}


function updateCartUI() {

    const countEl =
        document.getElementById('cart-count');

    const container =
        document.getElementById('cart-items-container');

    const subtotalEl =
        document.getElementById('cart-subtotal');

    const shippingToggle =
        document.getElementById('cart-shipping-toggle');

    const shippingEl =
        document.getElementById('cart-shipping');

    const clearCartBtn =
        document.getElementById('clear-cart-btn');

    const totalEl =
        document.getElementById('cart-total');

    if (
        !countEl ||
        !container ||
        !subtotalEl ||
        !shippingToggle ||
        !shippingEl ||
        !totalEl
    ) {

        return;

    }

    const itemCount =
        cart.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

    countEl.innerText =
        itemCount;

    clearCartBtn?.classList.toggle(
        'hidden',
        cart.length === 0
    );

    shippingToggle.checked =
        includeShipping;

    shippingEl.innerText =
        formatCurrency(SHIPPING_PRICE);

    if (cart.length === 0) {

        renderEmptyCart(
            container,
            subtotalEl,
            totalEl
        );

        return;

    }

    const subtotal =
        cart.reduce(
            (sum, item) => sum + getCartItemTotal(item),
            0
        );

    container.innerHTML =
        cart.map(renderCartItem).join('');

    subtotalEl.innerText =
        formatCurrency(subtotal);

    totalEl.innerText =
        formatCurrency(
            subtotal +
            (
                includeShipping
                    ? SHIPPING_PRICE
                    : 0
            )
        );

}


// =========================================
// CART ACTIONS
// =========================================

function removeCartItem(itemId) {

    const item =
        cart.find(
            entry => entry.id === itemId
        );

    if (
        item &&
        !confirm(`¿Eliminar ${item.material} del carrito?`)
    ) {

        return;

    }

    cart =
        cart.filter(
            entry => entry.id !== itemId
        );

    saveCart();

    updateCartUI();

}


function clearCart() {

    if (cart.length === 0) return;

    if (
        !confirm('¿Vaciar todo el carrito?')
    ) {

        return;

    }

    cart = [];
    includeShipping = false;

    saveCart();
    saveShippingPreference();

    updateCartUI();

}


function duplicateCartItem(itemId) {

    const item =
        cart.find(
            entry => entry.id === itemId
        );

    if (!item) return;

    cart.push({
        ...item,
        id: generateId()
    });

    saveCart();

    updateCartUI();

}


function updateCartItemQuantity(itemId, value) {

    const item =
        cart.find(
            entry => entry.id === itemId
        );

    if (!item) return;

    const quantity =
        parseInt(value, 10);

    item.quantity =
        Number.isFinite(quantity) && quantity > 0
            ? quantity
            : 1;

    saveCart();

    updateCartUI();

}


function handleCartClick(event) {

    const actionButton =
        event.target.closest('[data-cart-action]');

    if (!actionButton) return;

    const itemId =
        actionButton.dataset.cartId;

    if (actionButton.dataset.cartAction === 'remove') {

        removeCartItem(itemId);

    }

    if (actionButton.dataset.cartAction === 'duplicate') {

        duplicateCartItem(itemId);

    }

}


function handleCartInput(event) {

    const input =
        event.target.closest('[data-cart-quantity]');

    if (!input) return;

    updateCartItemQuantity(
        input.dataset.cartQuantity,
        input.value
    );

}


function handleShippingToggle(event) {

    includeShipping =
        event.target.checked;

    saveShippingPreference();

    updateCartUI();

}


// =========================================
// CHECKOUT
// =========================================

function checkoutOrder() {

    if (cart.length === 0) {

        alert(
            'Tu carrito está vacío.'
        );

        return;

    }

    let message =
`Hola MADE ACRÍLICO

Deseo cotizar esta orden DTF:

`;

    let subtotal = 0;

    cart.forEach(item => {

        const itemTotal =
            getCartItemTotal(item);

        subtotal += itemTotal;

        message +=
`------------------------------
${item.material}
Medida: ${item.size}
Copias: ${item.quantity}
Yardas cobradas: ${item.yards.toFixed(2)} yd
Precio: ${formatCurrency(itemTotal)}
Archivo: ${item.fileName}
Tipo: ${item.fileType}
Tamaño: ${item.fileSize}

`;

    });

    const shippingTotal =
        includeShipping
            ? SHIPPING_PRICE
            : 0;

    const total =
        subtotal + shippingTotal;

    message +=
`------------------------------
Subtotal:
${formatCurrency(subtotal)}

Envío:
${includeShipping ? formatCurrency(SHIPPING_PRICE) : 'No incluido'}

TOTAL ESTIMADO:
${formatCurrency(total)}

Entrega estimada:
Producción regular 24-48 horas según volumen.

Forma de pago:
Transferencia o efectivo.

Importante:
La cotización es estimada hasta revisar el archivo final.

Nota: los archivos no se adjuntan automáticamente desde la web. Te los enviaré por este chat si hace falta.

Gracias.`;

    const whatsappURL =
        `https://wa.me/18297078582?text=${encodeURIComponent(message)}`;

    window.open(
        whatsappURL,
        '_blank'
    );

}


// =========================================
// INIT
// =========================================

function initializeCart() {

    loadCart();

    loadShippingPreference();

    updateCartUI();

    document.getElementById('add-to-cart-btn')
        ?.addEventListener(
            'click',
            addNestingToCart
        );

    document.getElementById('cart-checkout-btn')
        ?.addEventListener(
            'click',
            checkoutOrder
        );

    document.getElementById('clear-cart-btn')
        ?.addEventListener(
            'click',
            clearCart
        );

    document.getElementById('cart-shipping-toggle')
        ?.addEventListener(
            'change',
            handleShippingToggle
        );

    const container =
        document.getElementById('cart-items-container');

    container?.addEventListener(
        'click',
        handleCartClick
    );

    container?.addEventListener(
        'input',
        handleCartInput
    );

}
