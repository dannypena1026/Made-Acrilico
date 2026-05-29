import { initializeCanvas } from './modules/canvas.js';
import { initializeCart } from './modules/cart.js';
import { calculatePrice } from './modules/pricing.js';
import { initializeUI } from './modules/ui.js';
import { initializeUploads } from './modules/upload.js';

document.addEventListener(
    'DOMContentLoaded',
    () => {
        initializeCanvas();
        initializeUI();
        initializeUploads();
        initializeCart();
        calculatePrice();
    }
);
