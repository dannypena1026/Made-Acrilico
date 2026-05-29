import { MATERIALS, PX_PER_INCH } from '../core/business-config.js';
import { calculateTieredPrice } from '../core/pricing-engine.js';
import { generateId } from '../utils/helpers.js';

let canvasElements = [];
let nestingCanvas = null;
let nestingMaterial = 'textil';
let dtfUvWidthOption = 16;

export function initializeCanvas() {
    nestingCanvas =
        document.getElementById(
            'nesting-canvas'
        );

    document.getElementById(
        'width-options-container'
    )?.addEventListener(
        'click',
        event => {
            const button =
                event.target.closest('[data-dtf-width]');

            if (!button) return;

            setDtfUvWidth(
                parseFloat(button.dataset.dtfWidth)
            );
        }
    );

    renderWidthControlOptions();
    updateNestingCalculation();
    renderRulers();
}

function getActiveCanvasData() {
    if (nestingMaterial === 'textil') {
        return {
            width: MATERIALS.textil.width,
            label: MATERIALS.textil.label,
            tiers: MATERIALS.textil.tiers,
            accent: 'logoMagenta'
        };
    }

    const widthKey =
        String(dtfUvWidthOption);

    const material =
        MATERIALS.uv.widths[widthKey] ||
        MATERIALS.uv.widths['16'];

    return {
        width: dtfUvWidthOption,
        label: material.label,
        tiers: material.tiers,
        accent: 'logoCyan'
    };
}

function getProximateTierInfo(lengthInches) {
    const canvasData =
        getActiveCanvasData();

    return calculateTieredPrice(
        Math.max(lengthInches, 0),
        canvasData.tiers
    );
}

export function renderWidthControlOptions() {
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

    const canvasData =
        getActiveCanvasData();

    nestingCanvas.style.width =
        `${canvasData.width * PX_PER_INCH}px`;

    canvasWidthLabel.innerText =
        `${canvasData.width} in`;

    materialLabel.innerText =
        canvasData.label;

    if (nestingMaterial === 'textil') {
        container.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="font-semibold text-gray-600">Ancho Fijo:</span>
                <span class="bg-logoMagenta/10 text-logoMagenta px-3 py-1 rounded-lg font-bold">
                    22 Pulgadas
                </span>
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <span class="font-semibold text-gray-600 block mb-2">
            Selecciona Ancho UV
        </span>

        <div class="grid grid-cols-2 gap-2">
            <button
                type="button"
                data-dtf-width="16"
                class="py-2 rounded-lg border-2 font-bold transition-all ${
                    dtfUvWidthOption === 16
                        ? 'border-logoCyan bg-cyan-50 text-logoCyan'
                        : 'border-gray-200 text-gray-500'
                }"
            >
                16"
            </button>

            <button
                type="button"
                data-dtf-width="11.5"
                class="py-2 rounded-lg border-2 font-bold transition-all ${
                    dtfUvWidthOption === 11.5
                        ? 'border-logoCyan bg-cyan-50 text-logoCyan'
                        : 'border-gray-200 text-gray-500'
                }"
            >
                11.5"
            </button>
        </div>
    `;
}

export function setNestingMaterial(type) {
    nestingMaterial = type;
    renderWidthControlOptions();
    updateNestingCalculation();
}

export function setDtfUvWidth(width) {
    dtfUvWidthOption = width;

    const uvWidthSelect =
        document.getElementById(
            'uv-width'
        );

    if (uvWidthSelect) {
        uvWidthSelect.value =
            String(width);
    }

    renderWidthControlOptions();
    updateNestingCalculation();
}

export function addImageToCanvas(src, image) {
    if (!nestingCanvas) return;

    const canvasData =
        getActiveCanvasData();

    const maxWidthPx =
        (canvasData.width * PX_PER_INCH) * 0.8;

    let width =
        maxWidthPx;

    let height =
        width /
        (image.naturalWidth / image.naturalHeight);

    if (height > 350) {
        height = 350;
        width =
            height *
            (image.naturalWidth / image.naturalHeight);
    }

    const item = {
        id: generateId(),
        type: 'image',
        src,
        x: 60,
        y: canvasElements.length * 40,
        width,
        height,
        aspect: image.naturalWidth / image.naturalHeight,
        rotation: 0
    };

    canvasElements.push(item);

    createGraphicElement(item);
    updateNestingCalculation();
    renderRulers();
}

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

    const image =
        document.createElement('img');

    image.src = item.src;
    image.className =
        'w-full h-full object-contain pointer-events-none';

    const resizeHandle =
        document.createElement('div');

    resizeHandle.className =
        'absolute bottom-0 right-0 w-5 h-5 bg-logoYellow border-2 border-white rounded-full cursor-se-resize shadow-lg';

    element.appendChild(image);
    element.appendChild(resizeHandle);
    nestingCanvas.appendChild(element);

    makeElementDraggable(element, item);
    makeElementResizable(element, item, resizeHandle);
}

function makeElementDraggable(element, item) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    element.addEventListener(
        'mousedown',
        event => {
            if (
                event.target.classList.contains(
                    'cursor-se-resize'
                )
            ) return;

            isDragging = true;
            offsetX = event.clientX - item.x;
            offsetY = event.clientY - item.y;
        }
    );

    document.addEventListener(
        'mousemove',
        event => {
            if (!isDragging) return;

            item.x =
                event.clientX - offsetX;

            item.y =
                event.clientY - offsetY;

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

function makeElementResizable(element, item, handle) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    handle.addEventListener(
        'mousedown',
        event => {
            event.stopPropagation();

            isResizing = true;
            startX = event.clientX;
            startWidth = item.width;
        }
    );

    document.addEventListener(
        'mousemove',
        event => {
            if (!isResizing) return;

            const dx =
                event.clientX - startX;

            item.width =
                Math.max(
                    40,
                    startWidth + dx
                );

            item.height =
                item.width / item.aspect;

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

export function updateNestingCalculation() {
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
        getProximateTierInfo(inches);

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
            `$${tierData.unitPrice}`;
    }
}

export function clearCanvas() {
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
