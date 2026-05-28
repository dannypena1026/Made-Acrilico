// =========================================
// CANVAS STATE
// =========================================

let canvasElements = [];

let nestingCanvas = null;

let nestingMaterial = 'textil';

let dtfUvWidthOption = 16;


// =========================================
// INITIALIZE CANVAS
// =========================================

function initializeCanvas() {

    nestingCanvas =
        document.getElementById(
            'nesting-canvas'
        );

    renderWidthControlOptions();

    updateNestingCalculation();

    renderRulers();

}


// =========================================
// GET PRICE DATA
// =========================================

function getProximateTierInfo(
    lengthInches,
    material,
    uvWidth
) {

    // =====================================
    // TEXTIL
    // =====================================

    if (material === 'textil') {

        if (lengthInches <= 18) {

            return {

                chargedLength: 18,
                price: 300

            };

        }

        return {

            chargedLength: 36,
            price: 500

        };

    }


    // =====================================
    // UV 11.5
    // =====================================

    if (uvWidth === 11.5) {

        if (lengthInches <= 11) {

            return {

                chargedLength: 11,
                price: 300

            };

        }

        if (lengthInches <= 18) {

            return {

                chargedLength: 18,
                price: 500

            };

        }

        if (lengthInches <= 24) {

            return {

                chargedLength: 24,
                price: 700

            };

        }

        return {

            chargedLength: 36,
            price: 900

        };

    }


    // =====================================
    // UV 16
    // =====================================

    if (lengthInches <= 11) {

        return {

            chargedLength: 11,
            price: 425

        };

    }

    if (lengthInches <= 18) {

        return {

            chargedLength: 18,
            price: 700

        };

    }

    if (lengthInches <= 24) {

        return {

            chargedLength: 24,
            price: 900

        };

    }

    return {

        chargedLength: 36,
        price: 1300

    };

}


// =========================================
// WIDTH CONTROLS
// =========================================

function renderWidthControlOptions() {

    const container =
        document.getElementById(
            'width-options-container'
        );

    const canvasWidthLabel =
        document.getElementById(
            'canvas-width-indicator'
        );

    const materialLabel =
        document.getElementById(
            'res-mat-label'
        );

    if (
        !container ||
        !nestingCanvas ||
        !canvasWidthLabel ||
        !materialLabel
    ) return;


    // =====================================
    // TEXTIL
    // =====================================

    if (nestingMaterial === 'textil') {

        nestingCanvas.style.width =
            `${22 * PX_PER_INCH}px`;

        container.innerHTML = `

            <div class="flex items-center justify-between">

                <span class="font-semibold text-gray-600">
                    Ancho Fijo:
                </span>

                <span class="bg-logoMagenta/10 text-logoMagenta px-3 py-1 rounded-lg font-bold">
                    22 Pulgadas
                </span>

            </div>

        `;

        canvasWidthLabel.innerText =
            '22 in';

        materialLabel.innerText =
            'DTF TEXTIL (22")';

    }


    // =====================================
    // UV
    // =====================================

    else {

        nestingCanvas.style.width =
            `${dtfUvWidthOption * PX_PER_INCH}px`;

        container.innerHTML = `

            <span class="font-semibold text-gray-600 block mb-2">
                Selecciona Ancho UV
            </span>

            <div class="grid grid-cols-2 gap-2">

                <button
                    onclick="setDtfUvWidth(16)"
                    class="py-2 rounded-lg border-2 font-bold transition-all
                    ${
                        dtfUvWidthOption === 16
                        ? 'border-logoCyan bg-cyan-50 text-logoCyan'
                        : 'border-gray-200 text-gray-500'
                    }"
                >
                    16"
                </button>

                <button
                    onclick="setDtfUvWidth(11.5)"
                    class="py-2 rounded-lg border-2 font-bold transition-all
                    ${
                        dtfUvWidthOption === 11.5
                        ? 'border-logoCyan bg-cyan-50 text-logoCyan'
                        : 'border-gray-200 text-gray-500'
                    }"
                >
                    11.5"
                </button>

            </div>

        `;

        canvasWidthLabel.innerText =
            `${dtfUvWidthOption} in`;

        materialLabel.innerText =
            `DTF UV (${dtfUvWidthOption}")`;

    }

}


// =========================================
// MATERIAL
// =========================================

function setNestingMaterial(type) {

    nestingMaterial = type;

    renderWidthControlOptions();

    updateNestingCalculation();

}


// =========================================
// UV WIDTH
// =========================================

function setDtfUvWidth(width) {

    dtfUvWidthOption = width;

    renderWidthControlOptions();

    updateNestingCalculation();

}


// =========================================
// CREATE ELEMENT
// =========================================

function createGraphicElement(item) {

    if (!nestingCanvas) return;

    const element =
        document.createElement('div');

    element.id =
        `item-${item.id}`;

    element.className =
        'absolute border-2 border-dashed border-logoMagenta bg-white/40 backdrop-blur-sm cursor-move shadow-md';

    element.style.left =
        `${item.x}px`;

    element.style.top =
        `${item.y}px`;

    element.style.width =
        `${item.width}px`;

    element.style.height =
        `${item.height}px`;


    // =====================================
    // IMAGE
    // =====================================

    const image =
        document.createElement('img');

    image.src = item.src;

    image.className =
        'w-full h-full object-contain pointer-events-none';


    // =====================================
    // RESIZE HANDLE
    // =====================================

    const resizeHandle =
        document.createElement('div');

    resizeHandle.className =
        'absolute bottom-0 right-0 w-5 h-5 bg-logoYellow border-2 border-white rounded-full cursor-se-resize shadow-lg';


    element.appendChild(image);

    element.appendChild(resizeHandle);

    nestingCanvas.appendChild(element);


    // =====================================
    // DRAG
    // =====================================

    makeElementDraggable(
        element,
        item
    );


    // =====================================
    // RESIZE
    // =====================================

    makeElementResizable(
        element,
        item,
        resizeHandle
    );

}


// =========================================
// DRAGGABLE
// =========================================

function makeElementDraggable(
    element,
    item
) {

    let isDragging = false;

    let offsetX = 0;

    let offsetY = 0;

    element.addEventListener(
        'mousedown',
        e => {

            if (
                e.target.classList.contains(
                    'cursor-se-resize'
                )
            ) return;

            isDragging = true;

            offsetX =
                e.clientX - item.x;

            offsetY =
                e.clientY - item.y;

        }
    );

    document.addEventListener(
        'mousemove',
        e => {

            if (!isDragging) return;

            item.x =
                e.clientX - offsetX;

            item.y =
                e.clientY - offsetY;

            element.style.left =
                `${item.x}px`;

            element.style.top =
                `${item.y}px`;

            updateNestingCalculation();

        }
    );

    document.addEventListener(
        'mouseup',
        () => {

            isDragging = false;

        }
    );

}


// =========================================
// RESIZABLE
// =========================================

function makeElementResizable(
    element,
    item,
    handle
) {

    let isResizing = false;

    let startX = 0;

    let startWidth = 0;

    let startHeight = 0;

    handle.addEventListener(
        'mousedown',
        e => {

            e.stopPropagation();

            isResizing = true;

            startX = e.clientX;

            startWidth = item.width;

            startHeight = item.height;

        }
    );

    document.addEventListener(
        'mousemove',
        e => {

            if (!isResizing) return;

            const dx =
                e.clientX - startX;

            item.width =
                Math.max(
                    40,
                    startWidth + dx
                );

            item.height =
                item.width;

            element.style.width =
                `${item.width}px`;

            element.style.height =
                `${item.height}px`;

            updateNestingCalculation();

        }
    );

    document.addEventListener(
        'mouseup',
        () => {

            isResizing = false;

        }
    );

}


// =========================================
// RULERS
// =========================================

function renderRulers() {

    const ruler =
        document.getElementById(
            'ruler-container'
        );

    if (
        !ruler ||
        !nestingCanvas
    ) return;

    ruler.innerHTML = '';

    const height =
        nestingCanvas.offsetHeight;

    for (
        let y = 0;
        y < height;
        y += PX_PER_INCH * 2
    ) {

        const marker =
            document.createElement('div');

        marker.className =
            'absolute left-1 text-[8px] text-gray-500 font-bold border-t border-gray-300 pt-0.5 w-full';

        marker.style.top =
            `${y}px`;

        marker.innerHTML =
            `<span>${Math.round(y / PX_PER_INCH)}"</span>`;

        ruler.appendChild(marker);

    }

}


// =========================================
// UPDATE CALCULATION
// =========================================

function updateNestingCalculation() {

    if (!nestingCanvas) return;

    let maxBottom = 0;

    canvasElements.forEach(item => {

        const bottom =
            item.y + item.height;

        if (bottom > maxBottom) {

            maxBottom = bottom;

        }

    });

    const inches =
        Math.ceil(
            maxBottom / PX_PER_INCH
        );

    const tierData =
        getProximateTierInfo(
            inches,
            nestingMaterial,
            dtfUvWidthOption
        );


    // =====================================
    // HEIGHT LABEL
    // =====================================

    const heightLabel =
        document.getElementById(
            'canvas-height-indicator'
        );

    if (heightLabel) {

        heightLabel.innerHTML =
            `<i class="fa-solid fa-arrows-up-down mr-1"></i>
            Alto de Corte:
            <strong class="text-logoMagenta">
                ${tierData.chargedLength} in
            </strong>`;

    }


    // =====================================
    // RESULTS
    // =====================================

    const realLength =
        document.getElementById(
            'res-real-length'
        );

    const proxTier =
        document.getElementById(
            'res-prox-tier'
        );

    const totalPrice =
        document.getElementById(
            'calc-total-price'
        );

    if (realLength) {

        realLength.innerText =
            `${inches} in`;

    }

    if (proxTier) {

        proxTier.innerText =
            `${tierData.chargedLength} in`;

    }

    if (totalPrice) {

        totalPrice.innerText =
            `$${tierData.price}`;

    }

}


// =========================================
// CLEAR CANVAS
// =========================================

function clearCanvas() {

    canvasElements = [];

    if (!nestingCanvas) return;

    nestingCanvas.innerHTML = `

        <div
            id="ruler-container"
            class="absolute left-0 top-0 bottom-0 w-10 border-r border-gray-300 bg-white/60 text-[10px] text-gray-500 flex flex-col p-1 pointer-events-none select-none z-10 overflow-hidden"
        ></div>

    `;

    renderRulers();

    updateNestingCalculation();

}