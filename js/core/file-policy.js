const FILE_SIGNATURES = {
    png: bytes => startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    jpg: bytes => startsWith(bytes, [0xff, 0xd8, 0xff]),
    webp: bytes =>
        startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8),
    tiff: bytes =>
        startsWith(bytes, [0x49, 0x49, 0x2a, 0x00]) ||
        startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a]),
    pdf: bytes => includesAscii(bytes, '%PDF-'),
    psd: bytes => startsWith(bytes, [0x38, 0x42, 0x50, 0x53]),
    ai: bytes =>
        includesAscii(bytes, '%PDF-') ||
        includesAscii(bytes, '%!PS-Adobe')
};

const SIGNATURE_ALIASES = {
    jpeg: 'jpg',
    jpe: 'jpg',
    tif: 'tiff'
};

function startsWith(bytes, signature, offset = 0) {
    return signature.every(
        (value, index) => bytes[offset + index] === value
    );
}

function includesAscii(bytes, text) {
    const signature =
        Array.from(text, character => character.charCodeAt(0));

    return bytes.some((_, startIndex) =>
        startsWith(bytes, signature, startIndex)
    );
}

export function getFileExtension(fileName = '') {
    const segments =
        String(fileName).trim().toLowerCase().split('.');

    return segments.length > 1
        ? segments.pop()
        : '';
}

export function getAllowedExtensions(material, config) {
    const baseExtensions =
        Array.isArray(config.quoteFileExtensions)
            ? config.quoteFileExtensions
            : [];

    if (material !== 'stickers') {
        return [...new Set(baseExtensions)];
    }

    return [
        ...new Set([
            ...baseExtensions.filter(extension => extension !== 'psd'),
            ...(config.stickerQuoteFileExtensions || [])
        ])
    ];
}

export function validateFileMetadata(file, {
    material,
    config
}) {
    if (!file) {
        return {
            valid: false,
            message: 'Selecciona un archivo para continuar.'
        };
    }

    if (!Number.isFinite(file.size) || file.size <= 0) {
        return {
            valid: false,
            message: 'El archivo está vacío o no se pudo leer.'
        };
    }

    const extension =
        getFileExtension(file.name);

    const allowedExtensions =
        getAllowedExtensions(material, config);

    if (!allowedExtensions.includes(extension)) {
        return {
            valid: false,
            message: `Formato no permitido. Usa ${allowedExtensions.join(', ').toUpperCase()}.`
        };
    }

    const maxBytes =
        config.maxUploadSizeMb * 1024 * 1024;

    if (file.size > maxBytes) {
        return {
            valid: false,
            message: `El archivo supera ${config.maxUploadSizeMb} MB. Reduce el peso del diseño o envíalo directamente por WhatsApp.`
        };
    }

    return {
        valid: true,
        extension
    };
}

export function matchesFileSignature(bytes, extension) {
    const normalizedExtension =
        SIGNATURE_ALIASES[extension] || extension;

    const matcher =
        FILE_SIGNATURES[normalizedExtension];

    return Boolean(matcher?.(bytes));
}

export async function validateFileSignature(file, extension) {
    const header =
        new Uint8Array(
            await file.slice(0, 1024).arrayBuffer()
        );

    return matchesFileSignature(header, extension)
        ? { valid: true }
        : {
            valid: false,
            message: 'El contenido del archivo no coincide con su extensión. Exporta el diseño nuevamente antes de subirlo.'
        };
}
