import { appState } from '../core/state.js';
import { buildQuoteFromInput } from '../core/pricing-engine.js';
import { formatCurrency } from '../utils/helpers.js';

let currentQuote = null;

function getQuantityValue() {
    const value =
        parseInt(
            document.getElementById('quantity')?.value || 1,
            10
        );

    return Number.isFinite(value) && value > 0
        ? value
        : 1;
}

function getSelectedHeight(sizeId, customHeightId) {
    const size =
        document.getElementById(sizeId)?.value;

    if (size === 'custom') {
        const customHeight =
            parseFloat(
                document.getElementById(customHeightId)?.value
            );

        return {
            height: customHeight,
            isValid: Number.isFinite(customHeight) && customHeight >= 36
        };
    }

    const height =
        parseFloat(size || 0);

    return {
        height,
        isValid: Number.isFinite(height) && height > 0
    };
}

function buildQuote() {
    const quantity =
        getQuantityValue();

    if (appState.currentMaterial === 'textil') {
        const heightData =
            getSelectedHeight(
                'textil-size',
                'textil-custom-height'
            );

        if (!heightData.isValid) {
            return {
                invalid: true,
                warningId: 'textil-warning',
                material: 'DTF Textil',
                quantity
            };
        }

        return buildQuoteFromInput({
            materialKey: 'textil',
            height: heightData.height,
            quantity
        });
    }

    const uvWidth =
        parseFloat(
            document.getElementById('uv-width')?.value || 16
        );

    const heightData =
        getSelectedHeight(
            'uv-size',
            'uv-custom-height'
        );

    if (!heightData.isValid) {
        return {
            invalid: true,
            warningId: 'uv-warning',
            material: `DTF UV (${uvWidth}")`,
            quantity
        };
    }

    return buildQuoteFromInput({
        materialKey: 'uv',
        height: heightData.height,
        quantity,
        uvWidth
    });
}

function setWarningState(quote) {
    const textilWarning =
        document.getElementById('textil-warning');

    const uvWarning =
        document.getElementById('uv-warning');

    textilWarning?.classList.toggle(
        'hidden',
        quote.warningId !== 'textil-warning'
    );

    uvWarning?.classList.toggle(
        'hidden',
        quote.warningId !== 'uv-warning'
    );
}

function renderQuote(quote) {
    const summaryMaterial =
        document.getElementById('summary-material');

    const summarySize =
        document.getElementById('summary-size');

    const summaryQty =
        document.getElementById('summary-qty');

    const summaryYards =
        document.getElementById('summary-yards');

    const summaryPriceYard =
        document.getElementById('summary-price-yard');

    const summaryTotal =
        document.getElementById('summary-total');

    if (
        !summaryMaterial ||
        !summarySize ||
        !summaryQty ||
        !summaryYards ||
        !summaryPriceYard ||
        !summaryTotal
    ) {
        return;
    }

    setWarningState(quote);

    if (quote.invalid) {
        summaryMaterial.innerText =
            quote.material;

        summarySize.innerText =
            'Medida pendiente';

        summaryQty.innerText =
            `${quote.quantity} repetición(es)`;

        summaryYards.innerText =
            '0.00 yd';

        summaryPriceYard.innerText =
            formatCurrency(0);

        summaryTotal.innerText =
            formatCurrency(0);

        return;
    }

    summaryMaterial.innerText =
        quote.material;

    summarySize.innerText =
        quote.size;

    summaryQty.innerText =
        `${quote.quantity} repetición(es)`;

    summaryYards.innerText =
        `${quote.yards.toFixed(2)} yd`;

    summaryPriceYard.innerText =
        formatCurrency(quote.pricePerYard);

    summaryTotal.innerText =
        formatCurrency(quote.total);
}

export function calculatePrice() {
    currentQuote =
        buildQuote();

    renderQuote(
        currentQuote
    );

    return currentQuote;
}

export function getCurrentQuote() {
    if (!currentQuote) {
        return calculatePrice();
    }

    return currentQuote;
}
