// =========================================
// HANDLE IMAGE UPLOAD
// =========================================

function handleImageUpload(event) {

    const files =
        event.target.files;

    if (!files || files.length === 0)
        return;


    // =====================================
    // LOOP FILES
    // =====================================

    Array.from(files).forEach(file => {

        // SOLO IMÁGENES
        if (
            !file.type.startsWith(
                'image/'
            )
        ) return;


        // =================================
        // READER
        // =================================

        const reader =
            new FileReader();

        reader.onload = function(e) {

            const image =
                new Image();

            image.onload = function() {

                createUploadedItem(
                    e.target.result,
                    image
                );

            };

            image.src =
                e.target.result;

        };

        reader.readAsDataURL(file);

    });


    // =====================================
    // RESET INPUT
    // =====================================

    event.target.value = '';

}


// =========================================
// CREATE ITEM
// =========================================

function createUploadedItem(
    src,
    image
) {

    if (!nestingCanvas) return;


    // =====================================
    // CANVAS WIDTH
    // =====================================

    const canvasWidth =
        nestingMaterial === 'textil'
        ? 22
        : dtfUvWidthOption;


    // =====================================
    // AUTO SCALE
    // =====================================

    const maxWidthPx =
        (canvasWidth * PX_PER_INCH) * 0.8;

    let width =
        maxWidthPx;

    let height =
        width /
        (image.naturalWidth /
        image.naturalHeight);


    // LIMIT HEIGHT
    if (height > 350) {

        height = 350;

        width =
            height *
            (image.naturalWidth /
            image.naturalHeight);

    }


    // =====================================
    // CREATE ITEM
    // =====================================

    const item = {

        id: Date.now() + Math.random(),

        type: 'image',

        src: src,

        x: 60,

        y:
            canvasElements.length * 40,

        width: width,

        height: height,

        aspect:
            image.naturalWidth /
            image.naturalHeight,

        rotation: 0

    };


    // =====================================
    // SAVE
    // =====================================

    canvasElements.push(item);


    // =====================================
    // RENDER
    // =====================================

    createGraphicElement(item);

    updateNestingCalculation();

    renderRulers();

}


// =========================================
// DRAG & DROP
// =========================================

function setupDragAndDrop() {

    if (!nestingCanvas) return;

    nestingCanvas.addEventListener(
        'dragover',
        e => {

            e.preventDefault();

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
        e => {

            e.preventDefault();

            nestingCanvas.classList.remove(
                'border-logoMagenta',
                'bg-pink-50'
            );

            const files =
                e.dataTransfer.files;

            if (!files.length) return;

            Array.from(files)
            .forEach(file => {

                if (
                    !file.type.startsWith(
                        'image/'
                    )
                ) return;

                const reader =
                    new FileReader();

                reader.onload = function(ev) {

                    const image =
                        new Image();

                    image.onload = function() {

                        createUploadedItem(
                            ev.target.result,
                            image
                        );

                    };

                    image.src =
                        ev.target.result;

                };

                reader.readAsDataURL(file);

            });

        }
    );

}


// =========================================
// INITIALIZE UPLOADS
// =========================================

function initializeUploads() {

    const imageUploadInput =
        document.getElementById(
            'image-upload-input'
        );

    if (imageUploadInput) {


        // MULTIPLE FILES
        imageUploadInput.setAttribute(
            'multiple',
            true
        );


        // CHANGE
        imageUploadInput.addEventListener(
            'change',
            handleImageUpload
        );


        // DRAG DROP
        setupDragAndDrop();

    }

    initializeQuoteUpload();

}

// =========================================
// FILE UPLOAD
// =========================================

function formatFileSize(bytes) {

    if (!bytes) return 'N/A';

    if (bytes < 1024 * 1024) {

        return `${(bytes / 1024).toFixed(1)} KB`;

    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;

}


function getUploadedFileMetadata() {

    if (!uploadedFile) {

        return {
            name: 'Sin archivo',
            type: 'N/A',
            size: 'N/A'
        };

    }

    return {
        name: uploadedFile.name,
        type: uploadedFile.type || 'N/A',
        size: formatFileSize(uploadedFile.size)
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

    if (!uploadedFile) {

        summary.classList.add('hidden');
        nameEl.innerText = '';
        metaEl.innerText = '';

        return;

    }

    const file =
        getUploadedFileMetadata();

    summary.classList.remove('hidden');
    nameEl.innerText = file.name;
    metaEl.innerText = `${file.type} • ${file.size}`;

}


function clearUploadedFile() {

    uploadedFile = null;

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
        event => {

            uploadedFile =
                event.target.files?.[0] || null;

            renderUploadedFile();

        }
    );

    document.getElementById('upload-file-remove')
    ?.addEventListener(
        'click',
        clearUploadedFile
    );

    renderUploadedFile();

}
