import { BUSINESS_CONFIG } from '../core/business-config.js';
import { appState, setCurrentMaterial, setCurrentTab } from '../core/state.js';
import { $all, $id } from '../utils/dom.js';
import { calculatePrice } from './pricing.js';
import {
    clearCanvas,
    renderWidthControlOptions,
    setDtfUvWidth,
    setNestingMaterial,
    updateNestingCalculation
} from './canvas.js';

let confirmResolver = null;

export function showToast(message, type = 'info') {
    const container =
        $id('toast-container');

    if (!container) return;

    const toast =
        document.createElement('div');

    const toneClass =
        type === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-gray-200 bg-white text-logoDark';

    toast.className =
        `rounded-2xl border ${toneClass} shadow-xl px-4 py-3 text-sm font-bold max-w-xs transition-all`;

    toast.innerText =
        message;

    container.appendChild(toast);

    window.setTimeout(
        () => {
            toast.classList.add('opacity-0', 'translate-y-2');
            window.setTimeout(
                () => toast.remove(),
                250
            );
        },
        3500
    );
}

export function confirmAction({
    title = 'Confirmar acción',
    message = '¿Deseas continuar?',
    confirmLabel = 'Confirmar'
} = {}) {
    const modal =
        $id('confirm-modal');

    if (!modal) {
        showToast(
            message,
            'error'
        );

        return Promise.resolve(false);
    }

    $id('confirm-modal-title').innerText =
        title;

    $id('confirm-modal-message').innerText =
        message;

    $id('confirm-modal-confirm').innerText =
        confirmLabel;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    return new Promise(resolve => {
        confirmResolver = resolve;
    });
}

function resolveConfirmModal(value) {
    const modal =
        $id('confirm-modal');

    modal?.classList.add('hidden');
    modal?.classList.remove('flex');

    if (confirmResolver) {
        confirmResolver(value);
        confirmResolver = null;
    }
}

export function switchTab(tabId) {
    $all('.tab-content')
        .forEach(tab => {
            tab.classList.add('hidden');
            tab.classList.remove('block');
        });

    const activeTab =
        $id(`tab-${tabId}`);

    if (activeTab) {
        activeTab.classList.remove('hidden');
        activeTab.classList.add('block');
        setCurrentTab(tabId);
    }

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

    if (tabId === 'planilla') {
        renderWidthControlOptions();
        updateNestingCalculation();
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function applyBusinessConfig() {
    $all('[data-business-whatsapp]')
        .forEach(link => {
            link.href =
                `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}`;
        });

    $all('[data-business-phone]')
        .forEach(link => {
            link.href =
                `tel:${BUSINESS_CONFIG.phoneHref}`;
        });

    $all('[data-business-phone-text]')
        .forEach(element => {
            element.innerText =
                BUSINESS_CONFIG.phoneDisplay;
        });

    $all('[data-business-email]')
        .forEach(link => {
            link.href =
                `mailto:${BUSINESS_CONFIG.email}`;
            link.innerText =
                BUSINESS_CONFIG.email;
        });

    $all('[data-business-address]')
        .forEach(element => {
            element.innerText =
                BUSINESS_CONFIG.address;
        });

    $all('[data-business-maps]')
        .forEach(link => {
            link.href =
                BUSINESS_CONFIG.mapsUrl;
        });
}

function toggleMobileMenu() {
    $id('mobile-menu')?.classList.toggle('hidden');
}

export function toggleCart() {
    const cartSidebar =
        $id('cart-sidebar');

    const cartOverlay =
        $id('cart-overlay');

    if (!cartSidebar || !cartOverlay) return;

    cartSidebar.classList.toggle(
        'translate-x-full'
    );

    cartOverlay.classList.toggle(
        'hidden'
    );
}

export function openCart() {
    const cartSidebar =
        $id('cart-sidebar');

    const cartOverlay =
        $id('cart-overlay');

    if (!cartSidebar || !cartOverlay) return;

    cartSidebar.classList.remove(
        'translate-x-full'
    );

    cartOverlay.classList.remove(
        'hidden'
    );
}

export function closeCart() {
    const cartSidebar =
        $id('cart-sidebar');

    const cartOverlay =
        $id('cart-overlay');

    if (!cartSidebar || !cartOverlay) return;

    cartSidebar.classList.add(
        'translate-x-full'
    );

    cartOverlay.classList.add(
        'hidden'
    );
}

function handleFormSubmit(event) {
    event.preventDefault();

    const formData =
        new FormData(event.target);

    const reason =
        formData.get('reason') || 'Consulta';

    const name =
        formData.get('name') || 'No indicado';

    const phone =
        formData.get('phone') || 'No indicado';

    const email =
        formData.get('email') || 'No indicado';

    const message =
        formData.get('message') || 'Sin mensaje';

    const whatsappMessage =
`Hola ${BUSINESS_CONFIG.name}

Me gustaría contactarles.

Motivo: ${reason}
Nombre: ${name}
Teléfono: ${phone}
Correo: ${email}

Mensaje:
${message}

Gracias.`;

    const whatsappURL =
        `https://wa.me/${BUSINESS_CONFIG.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    window.open(
        whatsappURL,
        '_blank'
    );

    event.target?.reset();
}

function activateTextilMode() {
    setCurrentMaterial('textil');

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

    textilWidthBox?.classList.remove('hidden');
    uvWidthSelector?.classList.add('hidden');
    textilHeightBox?.classList.remove('hidden');
    uvSelector?.classList.add('hidden');

    calculatePrice();
}

function activateUvMode() {
    setCurrentMaterial('uv');

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

    textilWidthBox?.classList.add('hidden');
    uvWidthSelector?.classList.remove('hidden');
    textilHeightBox?.classList.add('hidden');
    uvSelector?.classList.remove('hidden');

    calculatePrice();
}

function initializeNavigation() {
    $all('[data-tab]')
        .forEach(button => {
            button.addEventListener(
                'click',
                () => {
                    switchTab(button.dataset.tab);

                    if (
                        button.dataset.mobileClose === 'true'
                    ) {
                        toggleMobileMenu();
                    }
                }
            );
        });

    $all('[data-go-tab]')
        .forEach(button => {
            button.addEventListener(
                'click',
                () => switchTab(button.dataset.goTab)
            );
        });

    $id('logo-trigger')?.addEventListener(
        'click',
        () => switchTab('inicio')
    );

    $id('mobile-menu-toggle')?.addEventListener(
        'click',
        toggleMobileMenu
    );
}

function initializeCartShell() {
    $id('cart-toggle-btn')?.addEventListener(
        'click',
        toggleCart
    );

    $id('cart-close-btn')?.addEventListener(
        'click',
        closeCart
    );

    $id('cart-overlay')?.addEventListener(
        'click',
        closeCart
    );
}

function initializeConfirmModal() {
    $id('confirm-modal-cancel')?.addEventListener(
        'click',
        () => resolveConfirmModal(false)
    );

    $id('confirm-modal-confirm')?.addEventListener(
        'click',
        () => resolveConfirmModal(true)
    );

    $id('confirm-modal')?.addEventListener(
        'click',
        event => {
            if (event.target.id === 'confirm-modal') {
                resolveConfirmModal(false);
            }
        }
    );
}

function initializeMaterialControls() {
    $id('clear-canvas-btn')?.addEventListener(
        'click',
        clearCanvas
    );

    btnTextil?.addEventListener(
        'click',
        () => {
            activateTextilMode();
            setNestingMaterial('textil');
            updateNestingCalculation();
        }
    );

    btnUv?.addEventListener(
        'click',
        () => {
            activateUvMode();
            setNestingMaterial('uv');
            updateNestingCalculation();
        }
    );

    uvSize?.addEventListener(
        'change',
        () => {
            uvCustomBox?.classList.toggle(
                'hidden',
                uvSize.value !== 'custom'
            );

            updateNestingCalculation();
            calculatePrice();
        }
    );

    const textilSize =
        $id('textil-size');

    const textilCustomBox =
        $id('textil-custom-box');

    textilSize?.addEventListener(
        'change',
        () => {
            textilCustomBox?.classList.toggle(
                'hidden',
                textilSize.value !== 'custom'
            );

            calculatePrice();
        }
    );

    $id('textil-custom-height')?.addEventListener(
        'input',
        calculatePrice
    );

    $id('uv-width')?.addEventListener(
        'change',
        event => {
            setDtfUvWidth(
                parseFloat(event.target.value)
            );

            updateNestingCalculation();
            calculatePrice();
        }
    );

    $id('uv-custom-height')?.addEventListener(
        'input',
        () => {
            updateNestingCalculation();
            calculatePrice();
        }
    );

    $id('quantity')?.addEventListener(
        'input',
        calculatePrice
    );

    activateTextilMode();
}

export function initializeUI() {
    applyBusinessConfig();
    initializeNavigation();
    initializeCartShell();
    initializeConfirmModal();

    $id('contact-form')?.addEventListener(
        'submit',
        handleFormSubmit
    );

    initializeMaterialControls();

    if (appState.currentTab !== 'inicio') {
        switchTab(appState.currentTab);
    }
}

const btnTextil =
    $id('btn-textil');

const btnUv =
    $id('btn-uv');

const textilHeightBox =
    $id('textil-height-box');

const uvSelector =
    $id('uv-size-selector');

const textilWidthBox =
    $id('textil-width-box');

const uvWidthSelector =
    $id('uv-width-selector');

const uvSize =
    $id('uv-size');

const uvCustomBox =
    $id('uv-custom-box');
