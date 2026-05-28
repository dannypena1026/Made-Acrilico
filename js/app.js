// =========================================
// APP INITIALIZATION
// =========================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        // =============================
        // INIT UI
        // =============================

        if (
            typeof initializeUI === 'function'
        ) {

            initializeUI();

        }

        // =============================
        // INIT CANVAS
        // =============================

        if (
            typeof initializeCanvas === 'function'
        ) {

            initializeCanvas();

        }

        // =============================
        // INITIAL PRICE
        // =============================

        if (
            typeof calculatePrice === 'function'
        ) {

            calculatePrice();

        }

        // =============================
        // INPUTS
        // =============================

        const inputs = [

            'print-height',
            'quantity',
            'uv-width',
            'uv-size',
            'uv-custom-height'

        ];

        inputs.forEach(id => {

            const el =
                document.getElementById(id);

            if (!el) return;

            el.addEventListener(
                'input',
                calculatePrice
            );

            el.addEventListener(
                'change',
                calculatePrice
            );

        });

    }
);

document.addEventListener(
    'DOMContentLoaded',
    () => {

        if (
            typeof calculatePrice
            === 'function'
        ) {

            calculatePrice();

        }

    }
);

// =========================================
// TOGGLE CART
// =========================================

function toggleCart() {

    const sidebar =
        $id('cart-sidebar');

    const overlay =
        $id('cart-overlay');

    if (!sidebar || !overlay) return;

    const isOpen =
        !sidebar.classList.contains(
            'translate-x-full'
        );

    if (isOpen) {

        sidebar.classList.add(
            'translate-x-full'
        );

        overlay.classList.add(
            'hidden'
        );

    }

    else {

        sidebar.classList.remove(
            'translate-x-full'
        );

        overlay.classList.remove(
            'hidden'
        );

    }

}

// =========================================
// INIT APP
// =========================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        // ================================
        // ADD TO CART
        // ================================

        $id(
            'add-to-cart-btn'
        )?.addEventListener(
            'click',
            addNestingToCart
        );


        // ================================
        // WHATSAPP
        // ================================

        $id(
            'whatsapp-quote-btn'
        )?.addEventListener(
            'click',
            checkoutOrder
        );


        // ================================
        // OPEN CART
        // ================================

        $id(
            'cart-toggle-btn'
        )?.addEventListener(
            'click',
            toggleCart
        );


        // ================================
        // CLOSE CART
        // ================================

        $id(
            'cart-close-btn'
        )?.addEventListener(
            'click',
            toggleCart
        );


        // ================================
        // OVERLAY
        // ================================

        $id(
            'cart-overlay'
        )?.addEventListener(
            'click',
            toggleCart
        );

    }
);

// =========================================
// BUTTON EVENTS
// =========================================

document.addEventListener('DOMContentLoaded', () => {

    // ADD TO CART
    const addBtn =
        document.getElementById(
            'add-to-cart-btn'
        );

    if (addBtn) {

        addBtn.addEventListener(
            'click',
            addNestingToCart
        );

    }

});