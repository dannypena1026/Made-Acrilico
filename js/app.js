import { initializeCart } from './modules/cart.js';
import { initializeUI } from './modules/ui.js';
import { initializeUploads } from './modules/upload.js';

document.addEventListener(
    'DOMContentLoaded',
    () => {
        initializeUI();
        initializeUploads();
        initializeCart();
    }
);
