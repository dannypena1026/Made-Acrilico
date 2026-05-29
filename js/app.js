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
        // INIT UPLOADS
        // =============================

        if (
            typeof initializeUploads === 'function'
        ) {

            initializeUploads();

        }


        // =============================
        // INIT CART
        // =============================

        if (
            typeof initializeCart === 'function'
        ) {

            initializeCart();

        }


        // =============================
        // INITIAL PRICE
        // =============================

        if (
            typeof calculatePrice === 'function'
        ) {

            calculatePrice();

        }

    }
);
