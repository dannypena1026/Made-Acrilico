import { BUSINESS_CONFIG } from '../core/business-config.js';
import { appState, setUploadedFile } from '../core/state.js';
import { addImageToCanvas } from './canvas.js';
import { showToast } from './ui.js';

function handleImageUpload(event) {
    const files =
        event.target.files;

    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            showToast(
                'Solo puedes agregar imágenes al diseñador visual.',
                'error'
            );
            return;
        }

        readImageFile(
            file,
            addImageToCanvas
        );
    });

    event.target.value = '';
}

function readImageFile(file, callback) {
    const reader =
        new FileReader();

    reader.onload = event => {
        const image =
            new Image();

        image.onload = () => {
            callback(
                event.target.result,
                image
            );
        };

        image.src =
            event.target.result;
    };

    reader.readAsDataURL(file);
}

function setupDragAndDrop() {
    const nestingCanvas =
        document.getElementById('nesting-canvas');

    if (!nestingCanvas) return;

    nestingCanvas.addEventListener(
        'dragover',
        event => {
            event.preventDefault();

            nestingCanvas.classList.add(
                'border-logoMagenta',
                'bg-pink-50'
            );
        }
    );

    nestingCanvas.addEventListener(
        'dragleave',
        () => {
            nestingCanvas.classList.remove(
                'border-logoMagenta',
                'bg-pink-50'
            );
        }
    );

    nestingCanvas.addEventListener(
        'drop',
        event => {
            event.preventDefault();

            nestingCanvas.classList.remove(
                'border-logoMagenta',
                'bg-pink-50'
            );

            const files =
                event.dataTransfer.files;

            if (!files.length) return;

            Array.from(files).forEach(file => {
                if (!file.type.startsWith('image/')) {
                    showToast(
                        'Solo puedes soltar imágenes en el diseñador visual.',
                        'error'
                    );
                    return;
                }

                readImageFile(
                    file,
                    addImageToCanvas
                );
            });
        }
    );
}

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

function validateQuoteFile(file) {
    if (!file) {
        return {
            valid: false,
            message: 'Selecciona un archivo para continuar.'
        };
    }

    const extension =
        getFileExtension(file);

    if (
        !BUSINESS_CONFIG.quoteFileExtensions.includes(extension)
    ) {
        return {
            valid: false,
            message: `Formato no permitido. Usa ${BUSINESS_CONFIG.quoteFileExtensions.join(', ').toUpperCase()}.`
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

    return await response.json();
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
                    'No se pudo subir el archivo. Intenta otra vez o contactanos por WhatsApp.',
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
    const imageUploadInput =
        document.getElementById(
            'image-upload-input'
        );

    if (imageUploadInput) {
        imageUploadInput.setAttribute(
            'multiple',
            true
        );

        imageUploadInput.addEventListener(
            'change',
            handleImageUpload
        );

        setupDragAndDrop();
    }

    initializeQuoteUpload();
}
