// =========================================
// FORMAT CURRENCY
// =========================================

function formatCurrency(value) {

    return new Intl.NumberFormat(
        'es-DO',
        {

            style: 'currency',

            currency: 'DOP',

            minimumFractionDigits: 0

        }
    ).format(value);

}


// =========================================
// GENERATE ID
// =========================================

function generateId() {

    return crypto.randomUUID();

}


// =========================================
// SAVE TO LOCAL STORAGE
// =========================================

function saveToStorage(key, value) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );

}


// =========================================
// LOAD FROM LOCAL STORAGE
// =========================================

function loadFromStorage(key, fallback = null) {

    const data =
        localStorage.getItem(key);

    if (!data) return fallback;

    try {

        return JSON.parse(data);

    } catch {

        return fallback;

    }

}