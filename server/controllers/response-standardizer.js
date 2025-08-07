/**
 * Response Standardizer for LIGHTCAT API
 * Ensures consistent response format across all controllers
 */

class ResponseStandardizer {
  /**
   * Standardize invoice creation response
   */
  static formatInvoiceResponse(data) {
    return {
      success: true,
      invoiceId: data.invoiceId || data.invoice_id || data.id,
      lightningInvoice: data.lightningInvoice || data.lightning_invoice || data.payment_request,
      bitcoinAddress: data.bitcoinAddress || data.bitcoin_address || null,
      amount: data.amount || data.amount_sats,
      expiresAt: data.expiresAt || data.expires_at,
      qrCode: data.qrCode || data.qr_code || `lightning:${data.lightningInvoice || data.payment_request}`,
      description: data.description || null,
      remainingBatches: data.remainingBatches || data.remaining_batches || null,
      tier: data.tier || null,
      idempotencyKey: data.idempotencyKey || data.idempotency_key || null
    };
  }

  /**
   * Standardize status check response
   */
  static formatStatusResponse(data) {
    return {
      success: true,
      status: data.status,
      message: data.message || this.getStatusMessage(data.status),
      consignment: data.consignment || null,
      expiresAt: data.expiresAt || data.expires_at || null,
      paymentHash: data.paymentHash || data.payment_hash || null
    };
  }

  /**
   * Standardize error response
   */
  static formatErrorResponse(error, statusCode = 500) {
    return {
      success: false,
      error: typeof error === 'string' ? error : error.message || 'An error occurred',
      statusCode: statusCode,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Standardize stats response
   */
  static formatStatsResponse(data) {
    return {
      success: true,
      totalSupply: data.totalSupply || data.total_supply,
      availableTokens: data.availableTokens || data.available_tokens,
      soldTokens: data.soldTokens || data.sold_tokens,
      availableBatches: data.availableBatches || data.available_batches,
      soldBatches: data.soldBatches || data.sold_batches,
      salesProgress: data.salesProgress || data.sales_progress,
      lastUpdate: data.lastUpdate || data.last_update || new Date().toISOString()
    };
  }

  /**
   * Get user-friendly status message
   */
  static getStatusMessage(status) {
    const messages = {
      'pending': 'Waiting for payment...',
      'processing': 'Processing payment...',
      'paid': 'Payment confirmed! Generating RGB tokens...',
      'delivered': 'Payment complete! Your RGB tokens are ready.',
      'expired': 'Invoice expired. Please create a new one.',
      'failed': 'Payment failed. Please try again.'
    };
    return messages[status] || 'Unknown status';
  }

  /**
   * Convert snake_case to camelCase
   */
  static toCamelCase(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;
    if (obj instanceof Array) return obj.map(item => this.toCamelCase(item));
    
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = this.toCamelCase(obj[key]);
      return result;
    }, {});
  }
}

module.exports = ResponseStandardizer;