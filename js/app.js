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