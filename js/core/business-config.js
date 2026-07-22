export const DEFAULT_BUSINESS_CONFIG = {
    name: 'MADE ACRÍLICO',
    whatsappNumber: '18298824820',
    phoneDisplay: '+1 (829) 882-4820',
    phoneHref: '+18298824820',
    email: 'contacto@madeacrilico.com',
    address: 'Plaza Comercial Herrera, Av. Isabel Aguiar, Santo Domingo',
    mapsUrl: 'https://www.google.com/maps/place/Made+Acrílico/data=!4m2!3m1!1s0x0:0x5e3e2a9a6b659d5f?sa=X&ved=1t:2428&ictx=111',
    deliveryEstimate: '24-48 horas según volumen',
    paymentMethods: 'Transferencia o efectivo',
    estimateNotice: 'La cotización es estimada hasta revisar el archivo final.',
    maxUploadSizeMb: 10,
    quoteFileExtensions: ['png', 'pdf', 'ai', 'psd'],
    stickerQuoteFileExtensions: ['jpg', 'jpeg', 'jpe', 'webp', 'tif', 'tiff'],
    // En produccion se usa el mismo dominio mediante /api. Solo cambia esta URL
    // si el Worker se publica en un subdominio independiente.
    secureApiBaseUrl: ''
};

export const DEFAULT_MATERIALS = {
    textil: {
        width: 22,
        label: 'DTF Textil (22")',
        displayName: 'DTF Textil',
        tiers: [
            {
                length: 18,
                price: 300
            },
            {
                length: 36,
                price: 500
            }
        ]
    },
    uv: {
        label: 'DTF UV',
        widths: {
            '11.5': {
                enabled: false,
                label: 'DTF UV (11.5")',
                tiers: [
                    {
                        length: 11,
                        price: 300
                    },
                    {
                        length: 18,
                        price: 500
                    },
                    {
                        length: 24,
                        price: 700
                    },
                    {
                        length: 36,
                        price: 900
                    }
                ]
            },
            '16': {
                enabled: true,
                label: 'DTF UV (16")',
                tiers: [
                    {
                        length: 11,
                        price: 425
                    },
                    {
                        length: 18,
                        price: 700
                    },
                    {
                        length: 24,
                        price: 900
                    },
                    {
                        length: 36,
                        price: 1300
                    }
                ]
            }
        }
    },
    stickers: {
        rollWidth: 51,
        separation: 0.10,
        minQuantity: 100,
        minTotal: 500,
        displayName: 'Stickers / Etiquetas',
        materials: {
            white: {
                label: 'Vinil Blanco',
                pricePerSqFt: 100
            },
            transparent: {
                label: 'Vinil Transparente',
                pricePerSqFt: 100
            },
            holographic: {
                label: 'Vinil Holográfico',
                pricePerSqFt: 150
            }
        },
        autoDiscount: {
            quantityStep: 500,
            increment: 0.03,
            maxRate: 0.20
        }
    }
};

export const PX_PER_INCH = 24;

// The public site starts with these local values. The panel can safely replace
// them at runtime with the validated configuration stored in the Worker.
export let BUSINESS_CONFIG = structuredClone(DEFAULT_BUSINESS_CONFIG);
export let MATERIALS = structuredClone(DEFAULT_MATERIALS);

function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeKnownShape(defaultValue, incomingValue) {
    if (Array.isArray(defaultValue)) {
        return Array.isArray(incomingValue) ? incomingValue : structuredClone(defaultValue);
    }

    if (!isPlainObject(defaultValue)) {
        return incomingValue ?? defaultValue;
    }

    const merged = {};
    Object.entries(defaultValue).forEach(([key, value]) => {
        merged[key] = mergeKnownShape(value, incomingValue?.[key]);
    });
    return merged;
}

export function applyRuntimeBusinessConfig(configuration = {}) {
    if (!isPlainObject(configuration)) return false;

    const nextBusiness = mergeKnownShape(
        DEFAULT_BUSINESS_CONFIG,
        configuration.business
    );
    const nextMaterials = mergeKnownShape(
        DEFAULT_MATERIALS,
        configuration.materials
    );

    if (!nextBusiness.name || !nextBusiness.whatsappNumber || !nextMaterials.textil?.tiers?.length) {
        return false;
    }

    BUSINESS_CONFIG = nextBusiness;
    MATERIALS = nextMaterials;
    return true;
}
