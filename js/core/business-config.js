export const BUSINESS_CONFIG = {
    name: 'MADE ACRÍLICO',
    whatsappNumber: '18298824820',
    phoneDisplay: '+1 (829) 882-4820',
    phoneHref: '+18298824820',
    email: 'info@madeacrilico.com',
    address: 'Plaza Comercial Herrera, Av. Isabel Aguiar, Santo Domingo',
    mapsUrl: 'https://www.google.com/maps/place/Made+Acrílico/data=!4m2!3m1!1s0x0:0x5e3e2a9a6b659d5f?sa=X&ved=1t:2428&ictx=111',
    deliveryEstimate: '24-48 horas según volumen',
    paymentMethods: 'Transferencia o efectivo',
    estimateNotice: 'La cotización es estimada hasta revisar el archivo final.',
    maxUploadSizeMb: 10,
    quoteFileExtensions: ['png', 'pdf', 'ai', 'psd'],
    stickerQuoteFileExtensions: ['jpg', 'jpeg', 'jpe', 'webp', 'tif', 'tiff'],
    web3FormsAccessKey: '31f462c5-1520-4135-94cd-9d4ad1ee28a1',
    cloudinaryCloudName: 'dlk09m4yx',
    cloudinaryUploadPreset: 'madeacrilico_uploads'
};

export const MATERIALS = {
    textil: {
        width: 22,
        label: 'DTF TEXTIL (22")',
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
