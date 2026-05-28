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

    const uploadInput =
        document.getElementById(
            'image-upload-input'
        );

    if (!uploadInput) return;


    // MULTIPLE FILES
    uploadInput.setAttribute(
        'multiple',
        true
    );


    // CHANGE
    uploadInput.addEventListener(
        'change',
        handleImageUpload
    );


    // DRAG DROP
    setupDragAndDrop();

}

// =========================================
// FILE UPLOAD
// =========================================

const uploadInput =
    document.getElementById(
        'upload-design'
    );

if (uploadInput) {

    uploadInput.addEventListener(
        'change',
        e => {

            const file =
                e.target.files[0];

            if (!file) return;

            uploadedFile = file;

            console.log(
                'Archivo cargado:',
                file.name
            );

        }
    );

}