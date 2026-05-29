import { MATERIALS } from './business-config.js';

export function getTierForLength(lengthInches, tiers) {
    return tiers.find(
        tier => lengthInches <= tier.length
    ) || tiers[tiers.length - 1];
}

export function calculateTieredPrice(lengthInches, tiers) {
    const tier =
        getTierForLength(
            lengthInches,
            tiers
        );

    const lastTier =
        tiers[tiers.length - 1];

    const customOverLastTier =
        lengthInches > lastTier.length;

    if (!customOverLastTier) {
        return {
            chargedLength: tier.length,
            pricePerYard: tier.price,
            unitPrice: tier.price
        };
    }

    return {
        chargedLength: lengthInches,
        pricePerYard: lastTier.price,
        unitPrice: Math.ceil(
            (lengthInches / lastTier.length) *
            lastTier.price
        )
    };
}

export function buildQuoteFromInput({
    materialKey = 'textil',
    height,
    quantity = 1,
    uvWidth = 16
}) {
    const normalizedQuantity =
        Number.isFinite(quantity) && quantity > 0
            ? quantity
            : 1;

    if (!Number.isFinite(height) || height <= 0) {
        return {
            invalid: true,
            material: materialKey === 'uv' ? MATERIALS.uv.widths[String(uvWidth)]?.label || 'DTF UV' : 'DTF Textil',
            quantity: normalizedQuantity
        };
    }

    if (materialKey === 'textil') {
        const material =
            MATERIALS.textil;

        const priceData =
            calculateTieredPrice(
                height,
                material.tiers
            );

        return {
            invalid: false,
            materialKey: 'textil',
            material: material.displayName,
            width: material.width,
            height,
            size: `${material.width} x ${height} in`,
            quantity: normalizedQuantity,
            chargedLength: priceData.chargedLength,
            yards: priceData.chargedLength / 36,
            pricePerYard: priceData.pricePerYard,
            unitPrice: priceData.unitPrice,
            total: priceData.unitPrice * normalizedQuantity
        };
    }

    const normalizedUvWidth =
        String(parseFloat(uvWidth) || 16);

    const material =
        MATERIALS.uv.widths[normalizedUvWidth] ||
        MATERIALS.uv.widths['16'];

    const priceData =
        calculateTieredPrice(
            height,
            material.tiers
        );

    return {
        invalid: false,
        materialKey: 'uv',
        material: material.label,
        width: parseFloat(normalizedUvWidth),
        height,
        size: `${parseFloat(normalizedUvWidth)} x ${height} in`,
        quantity: normalizedQuantity,
        chargedLength: priceData.chargedLength,
        yards: priceData.chargedLength / 36,
        pricePerYard: priceData.pricePerYard,
        unitPrice: priceData.unitPrice,
        total: priceData.unitPrice * normalizedQuantity
    };
}
