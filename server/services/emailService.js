// Mock email service to avoid nodemailer dependency
const logger = require('../utils/logger');

class MockEmailService {
  async sendInvoiceCreated(email, data) {
    logger.info('Mock: Would send invoice created email', { email, data });
    return true;
  }

  async sendPaymentConfirmed(email, data) {
    logger.info('Mock: Would send payment confirmed email', { email, data });
    return true;
  }

  async sendAdminNotification(subject, content) {
    logger.info('Mock: Would send admin notification', { subject });
    return true;
  }
}

module.exports = new MockEmailService();