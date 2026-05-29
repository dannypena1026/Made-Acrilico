// =========================================
// PRICING
// =========================================

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
            isCustom: true,
            isValid: Number.isFinite(customHeight) && customHeight >= 36
        };

    }

    const height =
        parseFloat(size || 0);

    return {
        height,
        isCustom: false,
        isValid: Number.isFinite(height) && height > 0
    };

}


function getTierForLength(lengthInches, tiers) {

    return tiers.find(
        tier => lengthInches <= tier.length
    ) || tiers[tiers.length - 1];

}


function buildQuote() {

    const quantity =
        getQuantityValue();

    if (currentMaterial === 'textil') {

        const material =
            MATERIALS.textil;

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

        const tier =
            getTierForLength(
                heightData.height,
                material.tiers
            );

        const customOverYard =
            heightData.isCustom && heightData.height > 36;

        const chargedLength =
            customOverYard
                ? heightData.height
                : tier.length;

        const unitPrice =
            customOverYard
                ? Math.ceil(
                    (heightData.height / 36) *
                    material.tiers[material.tiers.length - 1].price
                )
                : tier.price;

        return {
            invalid: false,
            materialKey: 'textil',
            material: 'DTF Textil',
            width: material.width,
            height: heightData.height,
            size: `${material.width} x ${heightData.height} in`,
            quantity,
            chargedLength,
            yards: chargedLength / 36,
            pricePerYard: customOverYard
                ? material.tiers[material.tiers.length - 1].price
                : tier.price,
            unitPrice,
            total: unitPrice * quantity
        };

    }

    const uvWidth =
        String(
            parseFloat(
                document.getElementById('uv-width')?.value || 16
            )
        );

    const material =
        MATERIALS.uv.widths[uvWidth] ||
        MATERIALS.uv.widths['16'];

    const heightData =
        getSelectedHeight(
            'uv-size',
            'uv-custom-height'
        );

    if (!heightData.isValid) {

        return {
            invalid: true,
            warningId: 'uv-warning',
            material: material.label,
            quantity
        };

    }

    const tier =
        getTierForLength(
            heightData.height,
            material.tiers
        );

    const customOverYard =
        heightData.isCustom && heightData.height > 36;

    const chargedLength =
        customOverYard
            ? heightData.height
            : tier.length;

    const unitPrice =
        customOverYard
            ? Math.ceil(
                (heightData.height / 36) *
                material.tiers[material.tiers.length - 1].price
            )
            : tier.price;

    return {
        invalid: false,
        materialKey: 'uv',
        material: material.label,
        width: parseFloat(uvWidth),
        height: heightData.height,
        size: `${parseFloat(uvWidth)} x ${heightData.height} in`,
        quantity,
        chargedLength,
        yards: chargedLength / 36,
        pricePerYard: customOverYard
            ? material.tiers[material.tiers.length - 1].price
            : tier.price,
        unitPrice,
        total: unitPrice * quantity
    };

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

        summaryQty.innerText =
            `${quote.quantity} repetición(es)`;

        summaryYards.innerText =
            '0.00 yd';

        summaryPriceYard.innerText =
            '$0 DOP';

        summaryTotal.innerText =
            '$0 DOP';

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
        `$${quote.pricePerYard} DOP`;

    summaryTotal.innerText =
        `$${quote.total.toLocaleString()} DOP`;

}


function calculatePrice() {

    currentQuote =
        buildQuote();

    renderQuote(
        currentQuote
    );

    return currentQuote;

}


function getCurrentQuote() {

    if (!currentQuote) {

        return calculatePrice();

    }

    return currentQuote;

}
