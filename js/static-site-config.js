import { loadRuntimeSiteConfiguration, markSiteConfigurationReady } from './core/site-config.js';

document.addEventListener('DOMContentLoaded', () => {
    loadRuntimeSiteConfiguration().finally(markSiteConfigurationReady);
});
