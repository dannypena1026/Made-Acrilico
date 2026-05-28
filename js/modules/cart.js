// =========================================
// CART STATE
// =========================================

let cart = [];


// =========================================
// ADD TO CART
// =========================================

function addNestingToCart() {

    const material =
        document.getElementById(
            'summary-material'
        );

    const size =
        document.getElementById(
            'summary-size'
        );

    const qty =
        document.getElementById(
            'summary-qty'
        );

    const total =
        document.getElementById(
            'summary-total'
        );

    if (
        !material ||
        !size ||
        !qty ||
        !total
    ) return;


    // =====================================
    // PRICE
    // =====================================

    const price =
        parseInt(
            total.innerText
            .replace('$', '')
            .replace('DOP', '')
            .replace(/,/g, '')
            .trim()
        );

    if (!price || price <= 0) {

        alert(
            'Debes completar una cotización válida.'
        );

        return;

    }


    // =====================================
// FILE
// =====================================

const uploadInput =
    document.getElementById(
        'upload-design'
    );

const file =
    uploadInput?.files?.[0];


// =====================================
// ITEM
// =====================================

const newItem = {

    id: Date.now(),

    title:
        material.innerText,

    details:
        `${size.innerText} • ${qty.innerText}`,

    price: price,

    fileName:
        file?.name || 'Sin archivo',

    fileType:
        file?.type || 'N/A',

    fileSize:
        file
            ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
            : 'N/A'

};
    // =====================================
    // SAVE
    // =====================================

    cart.push(newItem);

    updateCartUI();

    toggleCart();

}


// =========================================
// UPDATE CART UI
// =========================================

function updateCartUI() {

    const countEl =
        document.getElementById(
            'cart-count'
        );

    const container =
        document.getElementById(
            'cart-items-container'
        );

    const subtotalEl =
        document.getElementById(
            'cart-subtotal'
        );

    const totalEl =
        document.getElementById(
            'cart-total'
        );

    if (
        !countEl ||
        !container ||
        !subtotalEl ||
        !totalEl
    ) return;


    // =====================================
    // COUNT
    // =====================================

    countEl.innerText =
        cart.length;


    // =====================================
    // EMPTY
    // =====================================

    if (cart.length === 0) {

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
            '$0 DOP';

        totalEl.innerText =
            '$0 DOP';

        return;

    }


    // =====================================
    // ITEMS
    // =====================================

    let html = '';

    let subtotal = 0;

    cart.forEach(item => {

        subtotal += item.price;

        html += `

            <div class="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4">

                <div class="flex justify-between items-start gap-3">

                    <div class="flex-1">

                        <h4 class="text-sm font-extrabold text-logoDark">
                            ${item.title}
                        </h4>

                        <p class="text-xs text-gray-500 mt-1 leading-relaxed">
                            ${item.details}
                        </p>

                    </div>

                    <button
                        onclick="removeCartItem(${item.id})"
                        class="text-red-500 hover:text-red-700 transition-all"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

                <div class="flex justify-between items-center border-t border-gray-200 pt-3">

                    <span class="text-xs uppercase tracking-wider text-gray-400 font-bold">
                        Total
                    </span>

                    <span class="text-sm font-black text-logoMagenta">
                        ${formatCurrency(item.price)}
                    </span>

                </div>

            </div>

        `;

    });

    container.innerHTML = html;


    // =====================================
    // TOTALS
    // =====================================

    subtotalEl.innerText =
        formatCurrency(subtotal);

    totalEl.innerText =
        formatCurrency(subtotal);

}


// =========================================
// REMOVE ITEM
// =========================================

function removeCartItem(itemId) {

    cart = cart.filter(
        item => item.id !== itemId
    );

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
`Hola MADE ACRÍLICO 👋

Deseo cotizar esta orden DTF:

`;

    let total = 0;

    cart.forEach(item => {

        total += item.price;

        message +=
`━━━━━━━━━━━━━━

${item.title}

${item.details}

Precio:
${formatCurrency(item.price)}

Archivo adjunto:
${item.fileName}

Tipo:
${item.fileType}

Tamaño:
${item.fileSize}

`;

    });

    message +=
`━━━━━━━━━━━━━━

TOTAL ESTIMADO:
${formatCurrency(total)}

Gracias.`;

    const whatsappURL =
`https://wa.me/18297078582?text=${encodeURIComponent(message)}`;

    window.open(
        whatsappURL,
        '_blank'
    );

}


// =========================================
// FORMAT CURRENCY
// =========================================

function formatCurrency(value) {

    return new Intl.NumberFormat(
        'es-DO',
        {
            style: 'currency',
            currency: 'DOP',
            maximumFractionDigits: 0
        }
    ).format(value);

}