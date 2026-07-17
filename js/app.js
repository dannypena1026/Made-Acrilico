import { initializeCart } from './modules/cart.js';
import { initializeUI } from './modules/ui.js';
import { initializeUploads } from './modules/upload.js';
import { initializeCustomerReviews } from './modules/customer-reviews.js';
import {
    getRuntimeSiteConfiguration,
    loadRuntimeSiteConfiguration,
    markSiteConfigurationReady
} from './core/site-config.js';

document.addEventListener(
    'DOMContentLoaded',
    async () => {
        await loadRuntimeSiteConfiguration();
        initializeUI();
        initializeUploads();
        initializeCart();
        initializeCustomerReviews(getRuntimeSiteConfiguration()?.reviews);
        markSiteConfigurationReady();
    }
);
