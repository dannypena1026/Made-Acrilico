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

export function calculateStickerDiscount(quantity, discountConfig = MATERIALS.stickers.autoDiscount) {
    const stepCount =
        Math.floor(quantity / discountConfig.quantityStep);

    return Math.min(
        stepCount * discountConfig.increment,
        discountConfig.maxRate
    );
}

export function calculateStickerQuote({
    materialKey = 'white',
    width,
    height,
    quantity = 1
}) {
    const stickersConfig =
        MATERIALS.stickers;

    const material =
        stickersConfig.materials[materialKey] ||
        stickersConfig.materials.white;

    const baseQuantity =
        Number.isFinite(quantity) && quantity > 0
            ? quantity
            : 1;

    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
    ) {
        return {
            invalid: true,
            materialKey: 'stickers',
            material: `Stickers / ${material.label}`,
            quantity: baseQuantity
        };
    }

    const requiresSmallStickerMinimum =
        width <= 3 && height <= 3;

    const minimumQuantity =
        requiresSmallStickerMinimum
            ? stickersConfig.minQuantity
            : 1;

    const normalizedQuantity =
        Math.max(baseQuantity, minimumQuantity);

    const effectiveWidth =
        width + stickersConfig.separation;

    const effectiveHeight =
        height + stickersConfig.separation;

    const perRowNormal =
        Math.floor(stickersConfig.rollWidth / effectiveWidth);

    const perRowRotated =
        Math.floor(stickersConfig.rollWidth / effectiveHeight);

    const orientations = [
        {
            stickersPerRow: perRowNormal,
            rowLength: effectiveHeight,
            rotated: false
        },
        {
            stickersPerRow: perRowRotated,
            rowLength: effectiveWidth,
            rotated: true
        }
    ]
        .filter(option => option.stickersPerRow > 0)
        .map(option => ({
            ...option,
            rowsNeeded: Math.ceil(normalizedQuantity / option.stickersPerRow)
        }))
        .map(option => ({
            ...option,
            requiredLength: option.rowsNeeded * option.rowLength
        }))
        .sort((a, b) => a.requiredLength - b.requiredLength);

    const bestOrientation = orientations[0];

    const stickersPerRow =
        bestOrientation?.stickersPerRow || 0;

    if (stickersPerRow <= 0) {
        return {
            invalid: true,
            materialKey: 'stickers',
            warningId: 'stickers-warning',
            material: `Stickers / ${material.label}`,
            quantity: normalizedQuantity
        };
    }

    const requiredLength =
        bestOrientation.requiredLength;

    const totalSqFtUsed =
        (stickersConfig.rollWidth * requiredLength) / 144;

    const initialCost =
        Math.ceil(totalSqFtUsed * material.pricePerSqFt);

    const configuredDiscountRate =
        calculateStickerDiscount(normalizedQuantity);

    const calculatedTotal =
        Math.ceil(initialCost * (1 - configuredDiscountRate));

    const total =
        requiresSmallStickerMinimum
            ? Math.max(stickersConfig.minTotal, calculatedTotal)
            : calculatedTotal;

    const discountAmount =
        Math.max(0, initialCost - total);

    const discountRate =
        initialCost > 0
            ? discountAmount / initialCost
            : 0;

    return {
        invalid: false,
        materialKey: 'stickers',
        material: `Stickers / ${material.label}`,
        width,
        height,
        size: `${width} x ${height} in`,
        quantity: normalizedQuantity,
        chargedLength: requiredLength,
        yards: requiredLength / 36,
        pricePerYard: material.pricePerSqFt,
        unitPrice: total / normalizedQuantity,
        total,
        discountRate,
        configuredDiscountRate,
        discountAmount,
        rotated: bestOrientation.rotated,
        stickerMaterialKey: materialKey,
        minimumApplied: requiresSmallStickerMinimum && total === stickersConfig.minTotal,
        labelQuantity: `${normalizedQuantity} ${normalizedQuantity === 1 ? 'sticker' : 'stickers'}`
    };
}

export function buildQuoteFromInput({
    materialKey = 'textil',
    height,
    quantity = 1,
    uvWidth = 16,
    stickerMaterial = 'white',
    stickerWidth,
    stickerHeight
}) {
    const normalizedQuantity =
        Number.isFinite(quantity) && quantity > 0
            ? quantity
            : 1;

    if (!Number.isFinite(height) || height <= 0) {
        if (materialKey === 'stickers') {
            return calculateStickerQuote({
                materialKey: stickerMaterial,
                width: stickerWidth,
                height: stickerHeight,
                quantity: normalizedQuantity
            });
        }

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

    if (!material?.enabled) {
        return {
            invalid: true,
            materialKey: 'uv',
            material: material?.label || 'DTF UV',
            quantity: normalizedQuantity,
            reason: 'uv_width_disabled'
        };
    }

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
