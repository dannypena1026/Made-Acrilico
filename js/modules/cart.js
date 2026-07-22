import { BUSINESS_CONFIG } from '../core/business-config.js';
import { calculateStickerQuote } from '../core/pricing-engine.js';
import {
    escapeHTML,
    formatCurrency,
    generateId
} from '../utils/helpers.js';
import {
    createOrderIntentFingerprint,
    getCartItemMinimumQuantity,
    getCartItemTotal,
    generateOrderId,
    isValidDominicanPhone,
    normalizeCartItem
} from './cart-utils.js';
import {
    loadCartItems,
    loadShippingPreference as loadStoredShippingPreference,
    saveCartItems,
    saveShippingPreference as saveStoredShippingPreference
} from './cart-storage.js';
import { submitOrder } from './order-service.js';
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

const ORDER_TIMEOUT_MS = 20000;
const PENDING_ORDER_KEY = 'madeAcrilicoPendingOrder';

let cart = [];
let includeShipping = false;
let orderReviewResolver = null;
let orderReviewFocusOrigin = null;
let orderSuccessFocusOrigin = null;

function lockModalScroll() {
    document.documentElement.classList.add('overflow-hidden');
    document.body.classList.add('overflow-hidden');
}

function unlockModalScroll() {
    const dialogOpen =
        Array.from(document.querySelectorAll('[role="dialog"]'))
            .some(modal => !modal.classList.contains('hidden'));

    const cartOpen =
        !document.getElementById('cart-sidebar')?.classList.contains('translate-x-full');

    if (dialogOpen || cartOpen) return;

    document.documentElement.classList.remove('overflow-hidden');
    document.body.classList.remove('overflow-hidden');
}


function saveCart() {
    saveCartItems(cart);
}


function loadCart() {
    cart = loadCartItems(normalizeCartItem);
}


function saveShippingPreference() {
    saveStoredShippingPreference(includeShipping);
}


function loadShippingPreference() {
    includeShipping = loadStoredShippingPreference();
}


function getCartSubtotal() {

    return cart.reduce(
        (sum, item) => sum + getCartItemTotal(item),
        0
    );

}


function getCartTotal() {

    return getCartSubtotal();

}


function hasMissingFileLinks() {

    return cart.some(
        item => !item.fileToken
    );

}


function renderStatusRow({
    icon,
    label,
    message,
    ready
}) {

    return `
        <span title="${escapeHTML(message)}" class="inline-flex items-center gap-1 ${
            ready
                ? 'text-emerald-600'
                : 'text-gray-500'
        }">
            <i class="site-icon ${icon} ${
                ready
                    ? 'text-emerald-500'
                    : 'text-logoYellow'
            }"></i>
            <span>${label}: ${message}</span>
        </span>
    `;

}


function getOrderStatusRows() {

    const {
        customerName,
        customerPhone,
        customerAddress
    } = getCheckoutDetails();

    const hasItems =
        cart.length > 0;

    const filesReady =
        hasItems && !hasMissingFileLinks();

    const hasName =
        Boolean(customerName);

    const hasPhone =
        Boolean(customerPhone);

    const validPhone =
        hasPhone && isValidDominicanPhone(customerPhone);

    const deliveryReady =
        !includeShipping || Boolean(customerAddress);

    const dataReady =
        hasName && validPhone && deliveryReady;

    const orderReady =
        hasItems && filesReady && dataReady;

    return [
        {
            icon: filesReady ? 'site-icon-file-circle-check' : 'site-icon-file-circle-exclamation',
            label: 'Archivo',
            message: filesReady
                ? 'Listo'
                : hasItems
                    ? 'Pendiente'
                    : 'Sin ítem',
            ready: filesReady
        },
        {
            icon: dataReady ? 'site-icon-user-check' : 'site-icon-user-pen',
            label: 'Datos',
            message: dataReady
                ? 'Completos'
                : !hasName
                    ? 'Falta nombre'
                    : !hasPhone
                        ? 'Falta WhatsApp'
                        : !validPhone
                            ? 'Teléfono inválido'
                            : 'Falta dirección',
            ready: dataReady
        },
        {
            icon: includeShipping ? 'site-icon-truck-fast' : 'site-icon-store',
            label: 'Entrega',
            message: includeShipping
                ? deliveryReady
                    ? 'Envío a cotizar'
                    : 'Falta dirección'
                : 'Retiro',
            ready: deliveryReady
        },
        {
            icon: orderReady ? 'site-icon-envelope-circle-check' : 'site-icon-circle-info',
            label: 'Orden',
            message: orderReady
                ? 'Lista'
                : 'Pendiente',
            ready: orderReady
        }
    ];

}


function updateOrderStatusUI() {

    const statusList =
        document.getElementById('cart-order-status-list');

    if (!statusList) return;

    statusList.innerHTML =
        getOrderStatusRows()
            .map(renderStatusRow)
            .join('');

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

    if (quote.materialKey === 'stickers') {
        const quantityInput =
            document.getElementById('quantity');

        const enteredQuantity =
            parseInt(quantityInput?.value || 0, 10);

        if (
            quantityInput?.getAttribute('aria-invalid') === 'true' ||
            !Number.isFinite(enteredQuantity) ||
            enteredQuantity < quote.quantity
        ) {
            showToast(
                `La cantidad mínima para esta medida es ${quote.quantity} stickers.`,
                'error'
            );
            quantityInput?.focus();
            return;
        }
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
        materialKey: quote.materialKey,
        stickerMaterialKey: quote.stickerMaterialKey,
        width: quote.width,
        height: quote.height,
        size: quote.size,
        chargedLength: quote.chargedLength,
        yards: quote.yards,
        quantity: quote.quantity,
        unitPrice: quote.unitPrice,
        total: quote.total,
        discountRate: quote.discountRate || 0,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileToken: uploadedFile?.assetToken || ''

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

            <i class="site-icon site-icon-basket-shopping text-4xl block"></i>

            <span class="text-sm">
                Cotización vacía.
                Calcula un producto o solicita una orden personalizada.
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
                        ${escapeHTML(item.size)} • ${
                            item.materialKey === 'stickers'
                                ? `${escapeHTML((item.chargedLength || 0).toFixed(2))} in de material`
                                : `${escapeHTML(item.yards.toFixed(2))} yd cobradas`
                        }
                    </p>

                    <p class="text-xs text-gray-500 mt-2 leading-relaxed">
                        Archivo: ${escapeHTML(item.fileName)}
                    </p>

                    <p class="mt-2 text-xs font-bold text-logoCyan">Archivo validado y adjunto a la orden</p>

                </div>

                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        data-cart-action="duplicate"
                        data-cart-id="${escapeHTML(item.id)}"
                        class="text-gray-400 hover:text-logoCyan transition-all"
                        title="Duplicar ítem"
                        aria-label="Duplicar ${escapeHTML(item.material)}"
                    >
                        <i class="site-icon site-icon-copy"></i>
                    </button>

                    <button
                        type="button"
                        data-cart-action="remove"
                        data-cart-id="${escapeHTML(item.id)}"
                        class="text-red-500 hover:text-red-700 transition-all"
                        title="Eliminar ítem"
                        aria-label="Eliminar ${escapeHTML(item.material)}"
                    >
                        <i class="site-icon site-icon-trash"></i>
                    </button>
                </div>

            </div>

            <div class="grid grid-cols-[1fr_auto] gap-3 items-end border-t border-gray-200 pt-3">

                ${
                    item.materialKey === 'stickers'
                        ? `<div class="text-xs uppercase tracking-wider text-gray-400 font-bold">
                            Stickers
                            <p class="mt-1 text-sm normal-case tracking-normal font-black text-logoDark">
                                Stickers: ${escapeHTML(item.quantity)}
                            </p>
                        </div>`
                        : `<label class="text-xs uppercase tracking-wider text-gray-400 font-bold">
                            Copias
                            <input
                                type="number"
                                min="${getCartItemMinimumQuantity(item)}"
                                max="1000000"
                                value="${escapeHTML(item.quantity)}"
                                data-cart-quantity="${escapeHTML(item.id)}"
                                class="mt-1 w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-logoDark outline-none focus:border-logoMagenta"
                            >
                        </label>`
                }

                <div class="text-right">
                    <span class="block text-xs uppercase tracking-wider text-gray-400 font-bold">
                        Total
                    </span>

                    <span class="text-sm font-black text-logoMagenta">
                        ${formatCurrency(itemTotal)}
                    </span>
                    <span class="mt-1 block text-[11px] text-gray-400">
                        Unitario: ${formatCurrency(item.unitPrice || 0)}
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
        cart.length;

    countEl.innerText =
        itemCount;

    document.getElementById('cart-toggle-btn')
        ?.setAttribute(
            'aria-label',
            `Abrir carrito, ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`
        );

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
        includeShipping
            ? 'A cotizar'
            : 'Opcional';

    updateOrderStatusUI();

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

    updateOrderStatusUI();

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
            ? Math.min(1000000, quantity)
            : 1;

    if (item.materialKey === 'stickers') {
        const quote =
            calculateStickerQuote({
                materialKey: item.stickerMaterialKey || 'white',
                width: item.width,
                height: item.height,
                quantity: item.quantity
            });

        if (!quote.invalid) {
            item.quantity = quote.quantity;
            item.size = quote.size;
            item.chargedLength = quote.chargedLength;
            item.yards = quote.yards;
            item.unitPrice = quote.unitPrice;
            item.total = quote.total;
            item.discountRate = quote.discountRate || 0;
        }
    }

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
        customerName: document.getElementById('checkout-name')?.value.trim().slice(0, 100) || '',
        customerPhone: document.getElementById('checkout-phone')?.value.trim().slice(0, 20) || '',
        customerAddress: document.getElementById('checkout-address')?.value.trim().slice(0, 300) || '',
        customerNotes: document.getElementById('checkout-notes')?.value.trim().slice(0, 1000) || ''
    };

}


function renderReviewItems() {

    return cart.map((item, index) => `
        <div class="rounded-xl bg-white border border-gray-100 p-3">
            <p class="font-extrabold text-logoDark">${index + 1}. ${escapeHTML(item.material)}</p>
            <p>Medida: ${escapeHTML(item.size)}</p>
            <p>${item.materialKey === 'stickers' ? 'Stickers' : 'Repeticiones'}: ${escapeHTML(item.quantity)}</p>
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
            <div class="flex justify-between"><span>Subtotal productos</span><strong>${formatCurrency(getCartSubtotal())}</strong></div>
            <div class="flex justify-between"><span>Impuestos / ITBIS</span><strong>Se confirma</strong></div>
            <div class="flex justify-between"><span>${includeShipping ? 'Envío' : 'Retiro'}</span><strong>${includeShipping ? 'A cotizar' : 'Sin envío'}</strong></div>
            <div class="flex justify-between text-logoMagenta text-base border-t border-gray-100 mt-2 pt-2"><span>Total estimado inicial</span><strong>${formatCurrency(getCartTotal())}</strong></div>
        </div>
        ${
            includeShipping
                ? `<div><p class="text-xs uppercase tracking-wider text-gray-400 font-bold">Dirección</p><p>${escapeHTML(customerAddress)}</p></div>`
                : ''
        }
        ${
            customerNotes
                ? `<div><p class="text-xs uppercase tracking-wider text-gray-400 font-bold">Nota</p><p>${escapeHTML(customerNotes)}</p></div>`
                : ''
        }
        <div class="space-y-2">
            <p class="text-xs uppercase tracking-wider text-gray-400 font-bold">Producción</p>
            ${renderReviewItems()}
        </div>
        <p class="text-xs text-gray-500 leading-relaxed">La orden queda pendiente de revisión. Confirmamos archivo, impuestos, entrega, total final y pago antes de producir.</p>
    `;

}


function resolveOrderReview(value) {

    const modal =
        document.getElementById('order-review-modal');

    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    unlockModalScroll();
    orderReviewFocusOrigin?.focus?.();
    orderReviewFocusOrigin = null;

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

    orderReviewFocusOrigin = document.activeElement;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lockModalScroll();
    window.requestAnimationFrame(
        () => document.getElementById('order-review-cancel')?.focus()
    );

    return new Promise(resolve => {
        orderReviewResolver = resolve;
    });

}


function buildWhatsAppFollowUp(orderId) {

    return `Hola ${BUSINESS_CONFIG.name}, acabo de enviar la orden ${orderId} desde la página.`;

}


function showOrderSuccess(orderId) {

    const modal =
        document.getElementById('order-success-modal');

    const message =
        document.getElementById('order-success-message');

    const details =
        document.getElementById('order-success-details');

    const whatsappLink =
        document.getElementById('order-success-whatsapp');

    if (!modal || !message || !whatsappLink) {
        showToast(
            'Orden enviada. Te contactaremos por WhatsApp para confirmar producción.',
            'info'
        );

        return;
    }

    message.innerText =
        `Orden ${orderId} enviada. Te contactaremos por WhatsApp para confirmar producción.`;

    if (details) {
        details.innerHTML = `
            <p><strong class="text-logoDark">Número de orden:</strong> ${escapeHTML(orderId)}</p>
            <p class="mt-2">Revisaremos tu archivo antes de producir para confirmar calidad, medida y acabado.</p>
            <p class="mt-2">Si el pedido es urgente, avísanos por WhatsApp con este número de orden.</p>
        `;
    }

    whatsappLink.href =
        `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(buildWhatsAppFollowUp(orderId))}`;

    orderSuccessFocusOrigin = document.activeElement;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lockModalScroll();
    window.requestAnimationFrame(
        () => document.getElementById('order-success-close')?.focus()
    );

}


function buildSecureOrderPayload({
    customerName,
    customerPhone,
    customerAddress,
    customerNotes,
    orderId
}) {
    return {
        orderId,
        customer: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            notes: customerNotes
        },
        fulfillment: includeShipping ? 'shipping' : 'pickup',
        items: cart.map(item => ({
            materialKey: item.materialKey,
            stickerMaterialKey: item.stickerMaterialKey || '',
            width: item.width,
            height: item.height,
            quantity: item.quantity,
            fileName: item.fileName,
            fileToken: item.fileToken
        }))
    };
}

function readPendingOrder() {
    try {
        const pendingOrder = JSON.parse(sessionStorage.getItem(PENDING_ORDER_KEY) || 'null');
        return pendingOrder &&
            /^MA-\d{8}-\d{6}-[A-Z0-9]{6}$/.test(pendingOrder.orderId) &&
            /^[a-f0-9]{64}$/.test(pendingOrder.fingerprint)
            ? pendingOrder
            : null;
    } catch {
        return null;
    }
}

function savePendingOrder(pendingOrder) {
    try {
        sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pendingOrder));
    } catch {
        // El checkout sigue funcionando aunque el navegador bloquee sessionStorage.
    }
}

function clearPendingOrder(orderId) {
    const pendingOrder = readPendingOrder();
    if (!pendingOrder || pendingOrder.orderId !== orderId) return;

    try {
        sessionStorage.removeItem(PENDING_ORDER_KEY);
    } catch {
        // No hace falta interrumpir una orden confirmada por un fallo de almacenamiento.
    }
}

async function getOrderIdForCheckout(checkoutDetails) {
    const unsignedPayload = buildSecureOrderPayload({
        ...checkoutDetails,
        orderId: ''
    });
    const fingerprint = await createOrderIntentFingerprint(unsignedPayload);
    const pendingOrder = readPendingOrder();

    if (pendingOrder?.fingerprint === fingerprint) {
        return pendingOrder.orderId;
    }

    const orderId = generateOrderId();
    savePendingOrder({ orderId, fingerprint });
    return orderId;
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
            !customerName
                ? 'Agrega el nombre del cliente para enviar la orden.'
                : 'Agrega el WhatsApp del cliente para enviar la orden.',
            'error'
        );

        return;

    }

    if (!isValidDominicanPhone(customerPhone)) {

        showToast(
            'Ingresa un WhatsApp dominicano válido: 809, 829 o 849.',
            'error'
        );

        return;

    }

    if (includeShipping && !customerAddress) {

        showToast(
            'Agrega la dirección para coordinar el envío.',
            'error'
        );

        return;

    }

    if (hasMissingFileLinks()) {

        showToast(
            'Hay un archivo sin enlace listo. Vuelve a subirlo antes de enviar.',
            'error'
        );

        return;

    }

    const orderId =
        await getOrderIdForCheckout(checkoutDetails);

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
        checkoutBtn.setAttribute('aria-busy', 'true');
        checkoutBtn.innerHTML =
            '<i class="site-icon site-icon-spinner site-icon-spin"></i> Enviando orden...';
    }

    const orderPayload =
        buildSecureOrderPayload(orderData);

    const controller =
        new AbortController();

    const timeoutId =
        window.setTimeout(
            () => controller.abort(),
            ORDER_TIMEOUT_MS
        );

    try {
        await submitOrder(orderPayload, controller.signal);

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

        clearPendingOrder(orderId);

        showOrderSuccess(orderId);

    } catch (error) {
        showToast(
            error?.name === 'AbortError'
                ? 'La solicitud tardó demasiado. Tu carrito se conserva para intentar de nuevo.'
                : 'No se pudo enviar la orden. Tu carrito se conserva para intentar de nuevo.',
            'error'
        );

    } finally {

        window.clearTimeout(timeoutId);

        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.removeAttribute('aria-busy');
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

    [
        'checkout-name',
        'checkout-phone',
        'checkout-address',
        'checkout-notes'
    ].forEach(id => {
        document.getElementById(id)
            ?.addEventListener(
                'input',
                updateOrderStatusUI
            );
    });

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
                unlockModalScroll();
                orderSuccessFocusOrigin?.focus?.();
                orderSuccessFocusOrigin = null;
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
