import { getSecureApiUrl } from '../core/secure-api.js';

export async function submitOrder(orderPayload, signal) {
    const response =
        await fetch(
            getSecureApiUrl('/api/orders'),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderPayload),
                signal
            }
        );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'No se pudo enviar la orden.');
    }

    return result;
}
