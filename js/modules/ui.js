// =========================================
// UI.JS
// =========================================

// =========================================
// SWITCH TABS
// =========================================

function switchTab(tabId) {

    // Ocultar tabs
    $all('.tab-content')
    .forEach(tab => {

        tab.classList.add('hidden');
        tab.classList.remove('block');

    });

    // Mostrar activa
    const activeTab =
        $id(`tab-${tabId}`);

    if (activeTab) {

        activeTab.classList.remove('hidden');
        activeTab.classList.add('block');

        currentTab = tabId;

    }

    // Reset nav desktop
    $all('.nav-btn')
    .forEach(button => {

        button.classList.remove(
            'text-logoMagenta',
            'bg-pink-50',
            'font-bold'
        );

        button.classList.add(
            'text-gray-600',
            'font-semibold'
        );

    });

    // Activar botón actual
    const activeButton =
        $id(`nav-${tabId}`);

    if (activeButton) {

        activeButton.classList.add(
            'text-logoMagenta',
            'bg-pink-50',
            'font-bold'
        );

        activeButton.classList.remove(
            'text-gray-600',
            'font-semibold'
        );

    }

    // Actualizaciones especiales
    if (tabId === 'planilla') {

        if (typeof renderWidthControlOptions === 'function') {
            renderWidthControlOptions();
        }

        if (typeof updateNestingCalculation === 'function') {
            updateNestingCalculation();
        }

    }

    // Scroll top
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

}


// =========================================
// MOBILE MENU
// =========================================

function toggleMobileMenu() {

    const mobileMenu =
        $id('mobile-menu');

    if (!mobileMenu) return;

    mobileMenu.classList.toggle('hidden');

}


// =========================================
// CART SIDEBAR
// =========================================

function toggleCart() {

    const cartSidebar =
        $id('cart-sidebar');

    const cartOverlay =
        $id('cart-overlay');

    if (!cartSidebar || !cartOverlay)
        return;

    cartSidebar.classList.toggle(
        'translate-x-full'
    );

    cartOverlay.classList.toggle(
        'hidden'
    );

}


// =========================================
// MATERIAL UI CONTROL
// =========================================

function activateTextilMode() {

    currentMaterial = 'textil';

    // BOTONES
    btnTextil?.classList.add(
        'border-logoMagenta',
        'bg-pink-50',
        'text-logoMagenta'
    );

    btnTextil?.classList.remove(
        'border-gray-200',
        'text-gray-600'
    );

    btnUv?.classList.remove(
        'border-logoCyan',
        'bg-cyan-50',
        'text-logoCyan'
    );

    btnUv?.classList.add(
        'border-gray-200',
        'text-gray-600'
    );

    // WIDTH
    if (textilWidthBox) {
        textilWidthBox.classList.remove('hidden');
    }

    if (uvWidthSelector) {
        uvWidthSelector.classList.add('hidden');
    }

    // HEIGHT
    if (textilHeightBox) {
        textilHeightBox.classList.remove('hidden');
    }

    if (uvSelector) {
        uvSelector.classList.add('hidden');
    }

    if (typeof calculatePrice === 'function') {

        calculatePrice();
    
    }

}


function activateUvMode() {

    currentMaterial = 'uv';

    // BOTONES
    btnUv?.classList.add(
        'border-logoCyan',
        'bg-cyan-50',
        'text-logoCyan'
    );

    btnUv?.classList.remove(
        'border-gray-200',
        'text-gray-600'
    );

    btnTextil?.classList.remove(
        'border-logoMagenta',
        'bg-pink-50',
        'text-logoMagenta'
    );

    btnTextil?.classList.add(
        'border-gray-200',
        'text-gray-600'
    );

    // WIDTH
    if (textilWidthBox) {
        textilWidthBox.classList.add('hidden');
    }

    if (uvWidthSelector) {
        uvWidthSelector.classList.remove('hidden');
    }

    // HEIGHT
    if (textilHeightBox) {
        textilHeightBox.classList.add('hidden');
    }

    if (uvSelector) {
        uvSelector.classList.remove('hidden');
    }

    calculatePrice();

}


// =========================================
// INITIALIZE UI
// =========================================

function initializeUI() {

    // =====================================
    // NAVIGATION
    // =====================================

    $all('[data-tab]')
    .forEach(button => {

        button.addEventListener(
            'click',
            () => {

                const tab =
                    button.dataset.tab;

                switchTab(tab);

                if (
                    button.dataset.mobileClose
                    === 'true'
                ) {

                    toggleMobileMenu();

                }

            }
        );

    });


    // =====================================
    // GO TAB BUTTONS
    // =====================================

    $all('[data-go-tab]')
    .forEach(button => {

        button.addEventListener(
            'click',
            () => {

                switchTab(
                    button.dataset.goTab
                );

            }
        );

    });


    // =====================================
    // LOGO
    // =====================================

    const logoTrigger =
        $id('logo-trigger');

    if (logoTrigger) {

        logoTrigger.addEventListener(
            'click',
            () => switchTab('inicio')
        );

    }


    // =====================================
    // MOBILE BUTTON
    // =====================================

    const mobileMenuToggle =
        $id('mobile-menu-toggle');

    if (mobileMenuToggle) {

        mobileMenuToggle.addEventListener(
            'click',
            toggleMobileMenu
        );

    }


    // =====================================
    // CART BUTTONS
    // =====================================

    const cartToggleBtn =
        $id('cart-toggle-btn');

    const cartCloseBtn =
        $id('cart-close-btn');

    const cartOverlay =
        $id('cart-overlay');

    if (cartToggleBtn) {

        cartToggleBtn.addEventListener(
            'click',
            toggleCart
        );

    }

    if (cartCloseBtn) {

        cartCloseBtn.addEventListener(
            'click',
            toggleCart
        );

    }

    if (cartOverlay) {

        cartOverlay.addEventListener(
            'click',
            toggleCart
        );

    }


    // =====================================
    // CLEAR CANVAS
    // =====================================

    const clearCanvasBtn =
        $id('clear-canvas-btn');

    if (clearCanvasBtn) {

        clearCanvasBtn.addEventListener(
            'click',
            clearCanvas
        );

    }


    // =====================================
    // MATERIAL BUTTONS
    // =====================================

    if (btnTextil) {

        btnTextil.addEventListener(
            'click',
            () => {

                activateTextilMode();

                if (typeof setNestingMaterial === 'function') {

                    setNestingMaterial('textil');

                }

                if (typeof updateNestingCalculation === 'function') {

                    updateNestingCalculation();

                }

            }
        );

    }

    if (btnUv) {

        btnUv.addEventListener(
            'click',
            () => {

                activateUvMode();

                if (typeof setNestingMaterial === 'function') {

                    setNestingMaterial('uv');

                }

                if (typeof updateNestingCalculation === 'function') {

                    updateNestingCalculation();

                }

            }
        );

    }


    // =====================================
    // UV CUSTOM SIZE
    // =====================================

    if (uvSize) {

        uvSize.addEventListener(
            'change',
            () => {

                if (uvSize.value === 'custom') {

                    uvCustomBox?.classList.remove(
                        'hidden'
                    );

                } else {

                    uvCustomBox?.classList.add(
                        'hidden'
                    );

                }

                if (typeof updateNestingCalculation === 'function') {

                    updateNestingCalculation();
                    calculatePrice();

                }

            }
        );

    }

    // =====================================
// TEXTIL CUSTOM SIZE
// =====================================

const textilSize =
document.getElementById(
    'textil-size'
);

const textilCustomBox =
document.getElementById(
    'textil-custom-box'
);

if (textilSize) {

textilSize.addEventListener(
    'change',
    () => {

        if (
            textilSize.value === 'custom'
        ) {

            textilCustomBox?.classList.remove(
                'hidden'
            );

        } else {

            textilCustomBox?.classList.add(
                'hidden'
            );

        }

        if (
            typeof calculatePrice
            === 'function'
        ) {

            calculatePrice();

        }

    }
);

}

// =====================================
// TEXTIL CUSTOM HEIGHT
// =====================================

const textilCustomHeight =
    document.getElementById(
        'textil-custom-height'
    );

if (textilCustomHeight) {

    textilCustomHeight.addEventListener(
        'input',
        () => {

            if (
                typeof calculatePrice
                === 'function'
            ) {

                calculatePrice();

            }

        }
    );

}


    // =====================================
    // UV WIDTH SELECT
    // =====================================

    const uvWidth =
        $id('uv-width');

    if (uvWidth) {

        uvWidth.addEventListener(
            'change',
            () => {

                if (typeof updateNestingCalculation === 'function') {

                    updateNestingCalculation();
                    calculatePrice();

                }

            }
        );

    }


    // =====================================
    // CUSTOM UV INPUT
    // =====================================

    const uvCustomHeight =
        $id('uv-custom-height');

    if (uvCustomHeight) {

        uvCustomHeight.addEventListener(
            'input',
            () => {

                if (typeof updateNestingCalculation === 'function') {

                    updateNestingCalculation();
                    calculatePrice();

                }

            }
        );

    }

    // =====================================
// QUANTITY INPUT
// =====================================

const quantityInput =
$id('quantity');

if (quantityInput) {

quantityInput.addEventListener(
    'input',
    () => {

        calculatePrice();

    }
);

}

    // =====================================
    // DEFAULT MODE
    // =====================================

    activateTextilMode();

}

// =====================================
// INITIAL PRICE
// =====================================

if (typeof calculatePrice === 'function') {

    calculatePrice();

}


// =========================================
// ELEMENTS
// =========================================

const btnTextil =
    document.getElementById("btn-textil");

const btnUv =
    document.getElementById("btn-uv");


// HEIGHT
const textilHeightBox =
    document.getElementById("textil-height-box");

const uvSelector =
    document.getElementById("uv-size-selector");


// WIDTH
const textilWidthBox =
    document.getElementById("textil-width-box");

const uvWidthSelector =
    document.getElementById("uv-width-selector");


// UV SELECT
const uvSize =
    document.getElementById("uv-size");

const uvCustomBox =
    document.getElementById("uv-custom-box");


// =========================================
// AUTO INIT
// =========================================

document.addEventListener(
    'DOMContentLoaded',
    initializeUI
);