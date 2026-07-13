import { initializeCart } from './modules/cart.js';
import { calculatePrice } from './modules/pricing.js';
import { initializeUI } from './modules/ui.js?v=1.7.0.4';
import { initializeUploads } from './modules/upload.js?v=1.7.0.4';

document.addEventListener(
    'DOMContentLoaded',
    () => {
        initializeUI();
        initializeUploads();
        initializeCart();
        calculatePrice();
    }
);
