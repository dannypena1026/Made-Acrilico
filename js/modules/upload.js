import { BUSINESS_CONFIG } from '../core/business-config.js';
import {
    getAllowedExtensions,
    getFileExtension,
    validateFileMetadata,
    validateFileSignature
} from '../core/file-policy.js';
import { appState, setUploadedFile } from '../core/state.js';
import { getTrustedURL } from '../utils/helpers.js';
import { showToast } from './ui.js';

const UPLOAD_TIMEOUT_MS = 30000;

let activeUploadController = null;
let uploadRequestId = 0;

function formatFileSize(bytes) {
    if (!bytes) return 'N/A';

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
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
    const allowedExtensions =
        getAllowedExtensions(
            appState.currentMaterial,
            BUSINESS_CONFIG
        );

    if (uploadInput) {
        const mimeTypes = isStickers
            ? ['image/png', 'image/jpeg', 'image/webp', 'image/tiff', 'application/pdf']
            : ['image/png', 'application/pdf'];

        uploadInput.accept = [
            ...allowedExtensions.map(extension => `.${extension}`),
            ...mimeTypes
        ].join(',');
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

    const uploadedExtension =
        getFileExtension(appState.uploadedFile?.name);

    if (
        uploadedExtension &&
        !allowedExtensions.includes(uploadedExtension)
    ) {
        clearUploadedFile();
        showToast(
            'El archivo anterior no es compatible con el material seleccionado. Sube uno nuevo.',
            'error'
        );
    }
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

async function uploadFileToCloudinary(file, signal) {
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
                body: formData,
                signal
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
        type: appState.uploadedFile.type || getFileExtension(appState.uploadedFile.name)?.toUpperCase() || 'N/A',
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

function setUploadBusy(isBusy) {
    const uploadInput =
        document.getElementById('upload-design');

    const dropzone =
        document.getElementById('upload-dropzone');

    const status =
        document.getElementById('upload-progress-status');

    if (uploadInput) {
        uploadInput.disabled = isBusy;
    }

    dropzone?.setAttribute('aria-busy', String(isBusy));
    dropzone?.classList.toggle('opacity-70', isBusy);
    dropzone?.classList.toggle('cursor-wait', isBusy);

    if (status) {
        status.textContent = isBusy
            ? 'Subiendo archivo. No cierres esta página.'
            : '';
    }
}

function abortActiveUpload() {
    activeUploadController?.abort();
    activeUploadController = null;
}

function clearUploadedFile() {
    uploadRequestId += 1;
    abortActiveUpload();
    setUploadBusy(false);
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

            uploadRequestId += 1;
            const requestId = uploadRequestId;
            abortActiveUpload();

            const metadataValidation =
                validateFileMetadata(
                    file,
                    {
                        material: appState.currentMaterial,
                        config: BUSINESS_CONFIG
                    }
                );

            if (!metadataValidation.valid) {
                showToast(
                    metadataValidation.message,
                    'error'
                );
                event.target.value = '';
                setUploadedFile(null);
                renderUploadedFile();
                return;
            }

            let signatureValidation;

            try {
                signatureValidation =
                    await validateFileSignature(
                        file,
                        metadataValidation.extension
                    );
            } catch {
                signatureValidation = {
                    valid: false,
                    message: 'No se pudo leer el archivo. Exporta el diseño nuevamente e intenta otra vez.'
                };
            }

            if (requestId !== uploadRequestId) return;

            if (!signatureValidation.valid) {
                showToast(
                    signatureValidation.message,
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

            const controller =
                new AbortController();

            activeUploadController = controller;
            setUploadBusy(true);

            const timeoutId =
                window.setTimeout(
                    () => controller.abort(),
                    UPLOAD_TIMEOUT_MS
                );

            try {
                const uploaded =
                    await uploadFileToCloudinary(
                        file,
                        controller.signal
                    );

                if (requestId !== uploadRequestId) return;

                setUploadedFile({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    material: appState.currentMaterial,
                    cloudinaryUrl: uploaded.secure_url,
                    cloudinaryPublicId: uploaded.public_id
                });

                renderUploadedFile();

                showToast(
                    'Archivo subido correctamente.',
                    'info'
                );
            } catch (error) {
                if (requestId !== uploadRequestId) return;

                event.target.value = '';
                setUploadedFile(null);
                renderUploadedFile();

                showToast(
                    error?.name === 'AbortError'
                        ? 'La subida tardó demasiado. Revisa tu conexión e intenta otra vez.'
                        : 'No se pudo subir el archivo. Intenta otra vez o contáctanos por WhatsApp.',
                    'error'
                );
            } finally {
                window.clearTimeout(timeoutId);

                if (requestId === uploadRequestId) {
                    activeUploadController = null;
                    setUploadBusy(false);
                }
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
        () => {
            const uploadInput =
                document.getElementById('upload-design');

            const uploadPending =
                Boolean(activeUploadController) ||
                Boolean(
                    uploadInput?.files?.length &&
                    !appState.uploadedFile
                );

            if (uploadPending) {
                uploadRequestId += 1;
                abortActiveUpload();
                setUploadBusy(false);

                if (uploadInput) {
                    uploadInput.value = '';
                }
            }

            updateUploadRequirements();
        }
    );
}
