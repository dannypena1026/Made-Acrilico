import { BUSINESS_CONFIG } from '../core/business-config.js';
import { appState, setUploadedFile } from '../core/state.js';
import { getTrustedURL } from '../utils/helpers.js';
import { showToast } from './ui.js';

function formatFileSize(bytes) {
    if (!bytes) return 'N/A';

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getFileExtension(file) {
    return file.name
        .split('.')
        .pop()
        ?.toLowerCase();
}

function getAllowedExtensions() {
    if (appState.currentMaterial === 'stickers') {
        return [
            ...BUSINESS_CONFIG.quoteFileExtensions.filter(
                extension => extension !== 'psd'
            ),
            ...BUSINESS_CONFIG.stickerQuoteFileExtensions
        ];
    }

    return [...BUSINESS_CONFIG.quoteFileExtensions];
}

function updateUploadRequirements() {
    const uploadInput = document.getElementById('upload-design');
    const copy = document.getElementById('upload-format-copy');
    const stickerFormatLabels = document.querySelectorAll(
        '[data-sticker-upload-format]'
    );
    const nonStickerFormatLabels = document.querySelectorAll(
        '[data-hide-for-stickers]'
    );
    const isStickers = appState.currentMaterial === 'stickers';

    if (uploadInput) {
        uploadInput.accept = isStickers
            ? '.png,.jpg,.jpeg,.jpe,.webp,.tif,.tiff,.pdf,.ai,image/png,image/jpeg,image/webp,image/tiff,application/pdf'
            : '.png,.pdf,.ai,.psd,image/png,application/pdf';
    }

    if (copy) {
        copy.textContent = isStickers
            ? 'PNG, JPG, JPEG, WEBP, TIFF, PDF o AI. Usa buena resolución.'
            : 'PNG transparente, PDF, AI o PSD. Evita capturas pixeladas.';
    }

    stickerFormatLabels.forEach(label => {
        label.classList.toggle('hidden', !isStickers);
    });

    nonStickerFormatLabels.forEach(label => {
        label.classList.toggle('hidden', isStickers);
    });
}

function validateQuoteFile(file) {
    if (!file) {
        return {
            valid: false,
            message: 'Selecciona un archivo para continuar.'
        };
    }

    const extension =
        getFileExtension(file);

    const allowedExtensions = getAllowedExtensions();

    if (!allowedExtensions.includes(extension)) {
        return {
            valid: false,
            message: `Formato no permitido. Usa ${allowedExtensions.join(', ').toUpperCase()}.`
        };
    }

    const maxBytes =
        BUSINESS_CONFIG.maxUploadSizeMb * 1024 * 1024;

    if (file.size > maxBytes) {
        return {
            valid: false,
            message: `El archivo supera ${BUSINESS_CONFIG.maxUploadSizeMb} MB. Reduce el peso del diseño o envíalo directamente por WhatsApp.`
        };
    }

    return {
        valid: true
    };
}

function isCloudinaryConfigured() {
    return Boolean(
        BUSINESS_CONFIG.cloudinaryCloudName &&
        BUSINESS_CONFIG.cloudinaryUploadPreset
    );
}

function getCloudinaryResourceType(file) {
    return file.type.startsWith('image/')
        ? 'auto'
        : 'raw';
}

async function uploadFileToCloudinary(file) {
    if (!isCloudinaryConfigured()) {
        throw new Error(
            'Cloudinary no está configurado.'
        );
    }

    const resourceType =
        getCloudinaryResourceType(file);

    const formData =
        new FormData();

    formData.append(
        'file',
        file
    );

    formData.append(
        'upload_preset',
        BUSINESS_CONFIG.cloudinaryUploadPreset
    );

    const response =
        await fetch(
            `https://api.cloudinary.com/v1_1/${BUSINESS_CONFIG.cloudinaryCloudName}/${resourceType}/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

    if (!response.ok) {
        throw new Error(
            'No se pudo subir el archivo.'
        );
    }

    const uploaded = await response.json();
    const trustedURL = getTrustedURL(
        uploaded.secure_url,
        ['res.cloudinary.com']
    );

    if (!trustedURL || !uploaded.public_id) {
        throw new Error('Cloudinary devolvió una respuesta inválida.');
    }

    return {
        ...uploaded,
        secure_url: trustedURL
    };
}

export function hasUploadedFile() {
    return Boolean(appState.uploadedFile);
}

export function getUploadedFile() {
    return appState.uploadedFile;
}

export function getUploadedFileMetadata() {
    if (!appState.uploadedFile) {
        return {
            name: 'Sin archivo',
            type: 'N/A',
            size: 'N/A'
        };
    }

    return {
        name: appState.uploadedFile.name,
        type: appState.uploadedFile.type || getFileExtension(appState.uploadedFile)?.toUpperCase() || 'N/A',
        size: formatFileSize(appState.uploadedFile.size),
        url: appState.uploadedFile.cloudinaryUrl || ''
    };
}

function renderUploadedFile() {
    const summary =
        document.getElementById('upload-file-summary');

    const nameEl =
        document.getElementById('upload-file-name');

    const metaEl =
        document.getElementById('upload-file-meta');

    if (!summary || !nameEl || !metaEl) return;

    if (!appState.uploadedFile) {
        summary.classList.add('hidden');
        nameEl.innerText = '';
        metaEl.innerText = '';
        return;
    }

    const file =
        getUploadedFileMetadata();

    summary.classList.remove('hidden');
    nameEl.innerText = file.name;
    metaEl.innerText =
        file.url
            ? `${file.type} • ${file.size} • Archivo listo`
            : `${file.type} • ${file.size}`;
}

function clearUploadedFile() {
    setUploadedFile(null);

    const uploadInput =
        document.getElementById('upload-design');

    if (uploadInput) {
        uploadInput.value = '';
    }

    renderUploadedFile();
}

function initializeQuoteUpload() {
    const uploadInput =
        document.getElementById('upload-design');

    if (!uploadInput) return;

    uploadInput.addEventListener(
        'change',
        async event => {
            const file =
                event.target.files?.[0] || null;

            const validation =
                validateQuoteFile(file);

            if (!validation.valid) {
                showToast(
                    validation.message,
                    'error'
                );
                event.target.value = '';
                setUploadedFile(null);
                renderUploadedFile();
                return;
            }

            showToast(
                'Subiendo archivo...',
                'info'
            );

            try {
                const uploaded =
                    await uploadFileToCloudinary(file);

                setUploadedFile({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    cloudinaryUrl: uploaded.secure_url,
                    cloudinaryPublicId: uploaded.public_id
                });

                renderUploadedFile();

                showToast(
                    'Archivo subido correctamente.',
                    'info'
                );
            } catch (error) {
                console.error(error);

                event.target.value = '';
                setUploadedFile(null);
                renderUploadedFile();

                showToast(
                    'No se pudo subir el archivo. Intenta otra vez o contáctanos por WhatsApp.',
                    'error'
                );
            }
        }
    );

    document.getElementById('upload-file-remove')
        ?.addEventListener(
            'click',
            clearUploadedFile
        );

    renderUploadedFile();
}

export function initializeUploads() {
    initializeQuoteUpload();
    updateUploadRequirements();

    document.addEventListener(
        'calculator:material-change',
        updateUploadRequirements
    );
}
