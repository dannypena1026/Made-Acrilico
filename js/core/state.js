export const appState = {
    currentMaterial: 'textil',
    currentTab: 'inicio',
    uploadedFile: null
};

export function setCurrentMaterial(material) {
    appState.currentMaterial = material;
}

export function setCurrentTab(tab) {
    appState.currentTab = tab;
}

export function setUploadedFile(file) {
    appState.uploadedFile = file;
}
