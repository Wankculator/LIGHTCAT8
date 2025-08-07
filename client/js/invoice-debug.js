// Debug helper for invoice creation
window.debugInvoiceCreation = true;

// Override fetch to log requests/responses
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    if (window.debugInvoiceCreation && args[0] && args[0].includes('/api/rgb/invoice')) {
        console.log('🔍 Invoice Request:', args[0], args[1]);
    }
    
    const response = await originalFetch.apply(this, args);
    
    if (window.debugInvoiceCreation && args[0] && args[0].includes('/api/rgb/invoice')) {
        const clone = response.clone();
        try {
            const data = await clone.json();
            console.log('📦 Invoice Response:', {
                status: response.status,
                ok: response.ok,
                data: data
            });
        } catch (e) {
            console.log('📦 Invoice Response (non-JSON):', response.status);
        }
    }
    
    return response;
};