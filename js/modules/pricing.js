// =========================================
// PRICING
// =========================================

function calculatePrice() {

    // =====================================
    // ELEMENTS
    // =====================================

    const summaryMaterial =
        document.getElementById(
            'summary-material'
        );

    const summarySize =
        document.getElementById(
            'summary-size'
        );

    const summaryQty =
        document.getElementById(
            'summary-qty'
        );

    const summaryYards =
        document.getElementById(
            'summary-yards'
        );

    const summaryPriceYard =
        document.getElementById(
            'summary-price-yard'
        );

    const summaryTotal =
        document.getElementById(
            'summary-total'
        );

    // SI NO EXISTEN
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

    // =====================================
    // INPUTS
    // =====================================

    const quantity =
        parseInt(
            document.getElementById('quantity')?.value || 1
        );

    const textilSize =
        document.getElementById(
            'textil-size'
        )?.value || 18;
    
    const textilCustomHeight =
        parseFloat(
            document.getElementById(
                'textil-custom-height'
            )?.value || 36
        );

    const uvWidth =
        parseFloat(
            document.getElementById('uv-width')?.value || 16
        );

    const uvSize =
        document.getElementById('uv-size')?.value || 11;

    const uvCustomHeight =
        parseFloat(
            document.getElementById('uv-custom-height')?.value || 36
        );

    // =====================================
    // VARIABLES
    // =====================================

    let material = '';

    let size = '';

    let yards = 0;

    let pricePerYard = 0;

    let total = 0;

// =====================================
// TEXTIL
// =====================================

if (
    typeof nestingMaterial !== 'undefined'
    &&
    nestingMaterial === 'textil'
) {

    material =
        'DTF Textil';

    let height = 0;

    if (textilSize === 'custom') {

        height =
            textilCustomHeight;

    } else {

        height =
            parseFloat(textilSize);

    }

    size =
        `22 x ${height} in`;

    // =========================
    // 22x18
    // =========================

    if (height <= 18) {

        total = 300;

        yards = 0.5;

        pricePerYard = 300;

    }

    // =========================
    // 22x36
    // =========================

    else if (height <= 36) {

        total = 500;

        yards = 1;

        pricePerYard = 500;

    }

    // =========================
    // CUSTOM
    // =========================

    else {

        yards =
            height / 36;

        pricePerYard = 500;

        total =
            Math.ceil(yards * 500);

    }

}

// =====================================
// UV
// =====================================

else {

    material =
        `DTF UV ${uvWidth}"`;

    let height = 0;

    if (uvSize === 'custom') {

        height =
            uvCustomHeight;

    } else {

        height =
            parseFloat(uvSize);

    }

    size =
        `${uvWidth} x ${height} in`;

    // PRECIOS
    if (height <= 11) {

        total = 425;

    }

    else if (height <= 18) {

        total = 700;

    }

    else if (height <= 24) {

        total = 900;

    }

    else {

        total = 1300;

    }

    pricePerYard = total;

    yards =
        height / 36;

    }

    // =====================================
    // MULTIPLICAR CANTIDAD
    // =====================================

    total =
        total * quantity;

    // =====================================
    // UPDATE UI
    // =====================================

    summaryMaterial.innerText =
        material;

    summarySize.innerText =
        size;

    summaryQty.innerText =
        `${quantity} repetición(es)`;

    summaryYards.innerText =
        `${yards.toFixed(2)} yd`;

    summaryPriceYard.innerText =
        `$${pricePerYard} DOP`;

    summaryTotal.innerText =
        `$${total.toLocaleString()} DOP`;

}