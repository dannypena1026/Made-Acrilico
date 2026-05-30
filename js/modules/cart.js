import { BUSINESS_CONFIG } from '../core/business-config.js';
import {
    escapeHTML,
    formatCurrency,
    generateId,
    loadFromStorage,
    saveToStorage
} from '../utils/helpers.js';
import { getCurrentQuote } from './pricing.js';
import {
    getUploadedFile,
    getUploadedFileMetadata,
    hasUploadedFile
} from './upload.js';
import {
    confirmAction,
    openCart,
    showToast
} from './ui.js';

const CART_STORAGE_KEY = 'made-acrilico-cart';
const CART_SHIPPING_STORAGE_KEY = 'made-acrilico-shipping-enabled';
const SHIPPING_PRICE = BUSINESS_CONFIG.shippingPrice;

let cart = [];
let includeShipping = false;
let orderReviewResolver = null;


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
            fileSize: item.fileSize || 'N/A',
            fileUrl: item.fileUrl || ''
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
            fileSize: item.fileSize || 'N/A',
            fileUrl: item.fileUrl || ''
        };

    }

    return null;

}


function getCartItemTotal(item) {

    return item.unitPrice * item.quantity;

}


function getCartSubtotal() {

    return cart.reduce(
        (sum, item) => sum + getCartItemTotal(item),
        0
    );

}


function getCartTotal() {

    return getCartSubtotal() +
        (
            includeShipping
                ? SHIPPING_PRICE
                : 0
        );

}


function generateOrderId(date = new Date()) {

    const stamp =
        date.toISOString()
            .slice(0, 10)
            .replace(/-/g, '');

    const suffix =
        Math.random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase();

    return `MA-${stamp}-${suffix}`;

}


function normalizeDominicanPhone(phone) {

    const digits =
        String(phone || '').replace(/\D/g, '');

    if (digits.length === 11 && digits.startsWith('1')) {
        return digits.slice(1);
    }

    return digits;

}


function isValidDominicanPhone(phone) {

    const digits =
        normalizeDominicanPhone(phone);

    return /^8(?:09|29|49)\d{7}$/.test(digits);

}


function hasMissingFileLinks() {

    return cart.some(
        item => !item.fileUrl
    );

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

        showToast(
            'Debes completar una cotización válida.',
            'error'
        );

        return;

    }

    if (!hasUploadedFile()) {

        showToast(
            'Sube el archivo del diseño antes de agregarlo al carrito.',
            'error'
        );

        return;

    }

    const file =
        getQuoteFileMetadata();

    const uploadedFile =
        getUploadedFile();

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
        fileSize: file.size,
        fileUrl: uploadedFile?.cloudinaryUrl || file.url || ''

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

                    ${
                        item.fileUrl
                            ? `<a href="${escapeHTML(item.fileUrl)}" target="_blank" rel="noopener" class="inline-flex mt-2 text-xs font-bold text-logoCyan hover:text-logoMagenta">Ver archivo subido</a>`
                            : ''
                    }

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

    const addressEl =
        document.getElementById('checkout-address');

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

    addressEl?.classList.toggle(
        'hidden',
        !includeShipping
    );

    if (!includeShipping && addressEl) {
        addressEl.value = '';
    }

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
        getCartSubtotal();

    container.innerHTML =
        cart.map(renderCartItem).join('');

    subtotalEl.innerText =
        formatCurrency(subtotal);

    totalEl.innerText =
        formatCurrency(getCartTotal());

}


// =========================================
// CART ACTIONS
// =========================================

async function removeCartItem(itemId) {

    const item =
        cart.find(
            entry => entry.id === itemId
        );

    if (
        item &&
        !await confirmAction({
            title: 'Eliminar producto',
            message: `¿Eliminar ${item.material} del carrito?`,
            confirmLabel: 'Eliminar'
        })
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


async function clearCart() {

    if (cart.length === 0) return;

    if (
        !await confirmAction({
            title: 'Vaciar carrito',
            message: '¿Vaciar todo el carrito?',
            confirmLabel: 'Vaciar'
        })
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


async function handleCartClick(event) {

    const actionButton =
        event.target.closest('[data-cart-action]');

    if (!actionButton) return;

    const itemId =
        actionButton.dataset.cartId;

    if (actionButton.dataset.cartAction === 'remove') {

        await removeCartItem(itemId);

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

function getCheckoutDetails() {

    return {
        customerName: document.getElementById('checkout-name')?.value.trim() || '',
        customerPhone: document.getElementById('checkout-phone')?.value.trim() || '',
        customerAddress: document.getElementById('checkout-address')?.value.trim() || '',
        customerNotes: document.getElementById('checkout-notes')?.value.trim() || ''
    };

}


function renderReviewItems() {

    return cart.map((item, index) => `
        <div class="rounded-xl bg-white border border-gray-100 p-3">
            <p class="font-extrabold text-logoDark">${index + 1}. ${escapeHTML(item.material)}</p>
            <p>Medida: ${escapeHTML(item.size)}</p>
            <p>Copias: ${escapeHTML(item.quantity)}</p>
            <p>Total: <strong>${formatCurrency(getCartItemTotal(item))}</strong></p>
            <p class="truncate">Archivo: ${escapeHTML(item.fileName)}</p>
        </div>
    `).join('');

}


function buildOrderReviewHTML({
    customerName,
    customerPhone,
    customerAddress,
    customerNotes,
    orderId
}) {

    return `
        <div>
            <p class="text-xs uppercase tracking-wider text-gray-400 font-bold">Orden</p>
            <p class="font-extrabold text-logoDark">${escapeHTML(orderId)}</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <p class="text-xs uppercase tracking-wider text-gray-400 font-bold">Cliente</p>
                <p class="font-bold text-logoDark">${escapeHTML(customerName)}</p>
            </div>
            <div>
                <p class="text-xs uppercase tracking-wider text-gray-400 font-bold">WhatsApp</p>
                <p class="font-bold text-logoDark">${escapeHTML(customerPhone)}</p>
            </div>
        </div>
        <div class="rounded-xl bg-white border border-gray-100 p-3">
            <div class="flex justify-between"><span>Subtotal</span><strong>${formatCurrency(getCartSubtotal())}</strong></div>
            <div class="flex justify-between"><span>${includeShipping ? 'Envio' : 'Retiro'}</span><strong>${includeShipping ? formatCurrency(SHIPPING_PRICE) : 'Sin envio'}</strong></div>
            <div class="flex justify-between text-logoMagenta text-base border-t border-gray-100 mt-2 pt-2"><span>Total estimado</span><strong>${formatCurrency(getCartTotal())}</strong></div>
        </div>
        ${
            includeShipping
                ? `<div><p class="text-xs uppercase tracking-wider text-gray-400 font-bold">Direccion</p><p>${escapeHTML(customerAddress)}</p></div>`
                : ''
        }
        ${
            customerNotes
                ? `<div><p class="text-xs uppercase tracking-wider text-gray-400 font-bold">Nota</p><p>${escapeHTML(customerNotes)}</p></div>`
                : ''
        }
        <div class="space-y-2">
            <p class="text-xs uppercase tracking-wider text-gray-400 font-bold">Produccion</p>
            ${renderReviewItems()}
        </div>
    `;

}


function resolveOrderReview(value) {

    const modal =
        document.getElementById('order-review-modal');

    modal?.classList.add('hidden');
    modal?.classList.remove('flex');

    if (orderReviewResolver) {
        orderReviewResolver(value);
        orderReviewResolver = null;
    }

}


function openOrderReview(orderData) {

    const modal =
        document.getElementById('order-review-modal');

    const content =
        document.getElementById('order-review-content');

    if (!modal || !content) {
        return Promise.resolve(true);
    }

    content.innerHTML =
        buildOrderReviewHTML(orderData);

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    return new Promise(resolve => {
        orderReviewResolver = resolve;
    });

}


function buildWhatsAppFollowUp(orderId) {

    return `Hola ${BUSINESS_CONFIG.name}, acabo de enviar la orden ${orderId} desde la pagina.`;

}


function showOrderSuccess(orderId) {

    const modal =
        document.getElementById('order-success-modal');

    const message =
        document.getElementById('order-success-message');

    const whatsappLink =
        document.getElementById('order-success-whatsapp');

    if (!modal || !message || !whatsappLink) {
        showToast(
            'Orden enviada. Te contactaremos por WhatsApp para confirmar produccion.',
            'info'
        );

        return;
    }

    message.innerText =
        `Orden ${orderId} enviada. Te contactaremos por WhatsApp para confirmar produccion.`;

    whatsappLink.href =
        `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(buildWhatsAppFollowUp(orderId))}`;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

}


function buildOrderMessage({
    customerName,
    customerPhone,
    customerAddress,
    customerNotes,
    orderId
}) {
    const subtotal =
        getCartSubtotal();

    const total =
        getCartTotal();

    const orderDate =
        new Date().toLocaleString(
            'es-DO',
            {
                dateStyle: 'short',
                timeStyle: 'short'
            }
        );

    let message =
`ORDEN DTF

ID de orden: ${orderId}
Fecha: ${orderDate}

CLIENTE
Nombre: ${customerName}
Telefono / WhatsApp: ${customerPhone}

TOTAL
Subtotal: ${formatCurrency(subtotal)}
Envío: ${includeShipping ? formatCurrency(SHIPPING_PRICE) : 'No incluido'}
Total estimado: ${formatCurrency(total)}
Entrega: ${includeShipping ? 'Envio' : 'Retiro en tienda'}
${includeShipping ? `Direccion: ${customerAddress}` : ''}
${customerNotes ? `Nota del cliente: ${customerNotes}` : ''}

PRODUCCIÓN

`;

    cart.forEach((item, index) => {

        const itemTotal =
            getCartItemTotal(item);

        message +=
`${index + 1}. ${item.material}
Medida: ${item.size}
Copias: ${item.quantity}
Precio: ${formatCurrency(itemTotal)}
Archivo: ${item.fileName}
Tipo: ${item.fileType}
Tamaño: ${item.fileSize}
Ver archivo: ${item.fileUrl || 'No disponible'}

`;

    });

    message +=
`------------------------------
ENTREGA
Producción regular: ${BUSINESS_CONFIG.deliveryEstimate}.

REVISIÓN
${BUSINESS_CONFIG.estimateNotice}

NOTA INTERNA
Revisar el archivo final antes de confirmar producción.`;

    return message;
}


async function checkoutOrder() {

    if (cart.length === 0) {

        showToast(
            'Tu carrito está vacío.',
            'error'
        );

        return;

    }

    const checkoutDetails =
        getCheckoutDetails();

    const {
        customerName,
        customerPhone,
        customerAddress,
        customerNotes
    } = checkoutDetails;

    if (!customerName || !customerPhone) {

        showToast(
            'Completa nombre y teléfono para enviar la orden.',
            'error'
        );

        return;

    }

    if (!isValidDominicanPhone(customerPhone)) {

        showToast(
            'Ingresa un telefono dominicano valido.',
            'error'
        );

        return;

    }

    if (includeShipping && !customerAddress) {

        showToast(
            'Agrega la direccion para coordinar el envio.',
            'error'
        );

        return;

    }

    if (hasMissingFileLinks()) {

        showToast(
            'Hay un archivo sin link listo. Vuelve a subirlo antes de enviar.',
            'error'
        );

        return;

    }

    if (!BUSINESS_CONFIG.web3FormsAccessKey) {

        showToast(
            'Falta configurar la clave de Web3Forms.',
            'error'
        );

        return;

    }

    const orderId =
        generateOrderId();

    const orderData = {
        ...checkoutDetails,
        orderId
    };

    const confirmed =
        await openOrderReview(orderData);

    if (!confirmed) return;

    const checkoutBtn =
        document.getElementById('cart-checkout-btn');

    const originalText =
        checkoutBtn?.innerHTML;

    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Enviando orden...';
    }

    const message =
        buildOrderMessage(orderData);

    const orderTotal =
        getCartTotal();

    const formData =
        new FormData();

    formData.append(
        'access_key',
        BUSINESS_CONFIG.web3FormsAccessKey
    );

    formData.append(
        'subject',
        `Nueva orden DTF ${orderId} - ${customerName} - ${formatCurrency(orderTotal)}`
    );

    formData.append(
        'from_name',
        `${BUSINESS_CONFIG.name} Web`
    );

    formData.append(
        'name',
        customerName
    );

    formData.append(
        'phone',
        customerPhone
    );

    formData.append(
        'order_id',
        orderId
    );

    formData.append(
        'delivery',
        includeShipping ? 'Envio' : 'Retiro en tienda'
    );

    if (includeShipping) {
        formData.append(
            'address',
            customerAddress
        );
    }

    if (customerNotes) {
        formData.append(
            'notes',
            customerNotes
        );
    }

    formData.append(
        'message',
        message
    );

    try {

        const response =
            await fetch(
                'https://api.web3forms.com/submit',
                {
                    method: 'POST',
                    body: formData
                }
            );

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || 'No se pudo enviar la orden.'
            );
        }

        cart = [];
        includeShipping = false;

        [
            'checkout-name',
            'checkout-phone',
            'checkout-address',
            'checkout-notes'
        ].forEach(id => {
            const field =
                document.getElementById(id);

            if (field) {
                field.value = '';
            }
        });

        saveCart();
        saveShippingPreference();
        updateCartUI();

        showOrderSuccess(orderId);

    } catch (error) {

        console.error(error);

        showToast(
            'No se pudo enviar la orden por correo.',
            'error'
        );

    } finally {

        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML =
                originalText;
        }

    }

}


// =========================================
// INIT
// =========================================

export function initializeCart() {

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

    document.getElementById('order-review-cancel')
        ?.addEventListener(
            'click',
            () => resolveOrderReview(false)
        );

    document.getElementById('order-review-close')
        ?.addEventListener(
            'click',
            () => resolveOrderReview(false)
        );

    document.getElementById('order-review-confirm')
        ?.addEventListener(
            'click',
            () => resolveOrderReview(true)
        );

    document.getElementById('order-review-modal')
        ?.addEventListener(
            'click',
            event => {
                if (event.target.id === 'order-review-modal') {
                    resolveOrderReview(false);
                }
            }
        );

    document.getElementById('order-success-close')
        ?.addEventListener(
            'click',
            () => {
                const modal =
                    document.getElementById('order-success-modal');

                modal?.classList.add('hidden');
                modal?.classList.remove('flex');
            }
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
