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

    if (appState.currentMaterial === 'stickers') {
        const stickerMaterial =
            document.getElementById('sticker-material')?.value || 'white';

        const stickerWidth =
            parseFloat(
                document.getElementById('sticker-width')?.value
            );

        const stickerHeight =
            parseFloat(
                document.getElementById('sticker-height')?.value
            );

        const quote =
            buildQuoteFromInput({
                materialKey: 'stickers',
                stickerMaterial,
                stickerWidth,
                stickerHeight,
                quantity
            });

        if (quote.invalid) {
            return {
                ...quote,
                warningId: 'stickers-warning',
                material: quote.material || 'Stickers / Etiquetas',
                quantity
            };
        }

        return quote;
    }

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

    const stickersWarning =
        document.getElementById('stickers-warning');

    textilWarning?.classList.toggle(
        'hidden',
        quote.warningId !== 'textil-warning'
    );

    uvWarning?.classList.toggle(
        'hidden',
        quote.warningId !== 'uv-warning'
    );

    stickersWarning?.classList.toggle(
        'hidden',
        quote.warningId !== 'stickers-warning'
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

    const summaryYardsLabel =
        document.getElementById('summary-yards-label');

    const summaryPriceYard =
        document.getElementById('summary-price-yard');

    const summaryPriceLabel =
        document.getElementById('summary-price-label');

    const summaryTotal =
        document.getElementById('summary-total');

    const summaryDeliveryEstimate =
        document.getElementById('summary-delivery-estimate');

    if (
        !summaryMaterial ||
        !summarySize ||
        !summaryQty ||
        !summaryYards ||
        !summaryYardsLabel ||
        !summaryPriceYard ||
        !summaryPriceLabel ||
        !summaryTotal
    ) {
        return;
    }

    setWarningState(quote);

    const materialKey = quote.materialKey || appState.currentMaterial;

    if (summaryDeliveryEstimate) {
        summaryDeliveryEstimate.innerText =
            materialKey === 'stickers'
                ? '24-48 horas'
                : '8-24 horas';
    }

    const quantityLabel =
        materialKey === 'stickers'
            ? `${quote.quantity} ${quote.quantity === 1 ? 'sticker' : 'stickers'}`
            : `${quote.quantity} ${quote.quantity === 1 ? 'repetición' : 'repeticiones'}`;

    if (quote.invalid) {
        summaryMaterial.innerText =
            quote.material;

        summaryYardsLabel.innerText =
            materialKey === 'stickers'
                ? 'Precio unitario'
                : 'Yardas necesarias';

        summaryPriceLabel.innerText =
            materialKey === 'stickers'
                ? 'Descuento aplicado'
                : 'Precio por tramo';

        summarySize.innerText =
            'Medida pendiente';

        summaryQty.innerText =
            quantityLabel;

        summaryYards.innerText =
            materialKey === 'stickers'
                ? formatCurrency(0)
                : '0.00 yd';

        summaryPriceYard.innerText =
            formatCurrency(0);

        summaryTotal.innerText =
            formatCurrency(0);

        return;
    }

    summaryMaterial.innerText =
        quote.material;

    summaryYardsLabel.innerText =
        materialKey === 'stickers'
            ? 'Precio unitario'
            : 'Yardas necesarias';

    summaryPriceLabel.innerText =
        materialKey === 'stickers'
            ? 'Descuento aplicado'
            : 'Precio por tramo';

    summarySize.innerText =
        quote.size;

    summaryQty.innerText =
        quote.labelQuantity || quantityLabel;

    summaryYards.innerText =
        materialKey === 'stickers'
            ? formatCurrency(quote.unitPrice)
            : `${quote.yards.toFixed(2)} yd`;

    summaryPriceYard.innerText =
        materialKey === 'stickers'
            ? `${((quote.discountRate || 0) * 100).toFixed(0)}%`
            : formatCurrency(quote.pricePerYard);

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
