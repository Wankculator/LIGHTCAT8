// Blockchain Monitor Service
// Real-time tracking of payments and distribution

const EventEmitter = require('events');
const WebSocket = require('ws');
const axios = require('axios');
const logger = require('../utils/logger');
const supabaseService = require('./supabaseService');

class BlockchainMonitorService extends EventEmitter {
  constructor() {
    super();
    
    // Configuration
    this.network = process.env.BITCOIN_NETWORK || 'mainnet';
    this.electrumServers = [
      'electrum.blockstream.info:50002',
      'electrum1.bluewallet.io:50002',
      'electrum2.bluewallet.io:50002'
    ];
    
    // Monitoring state
    this.watchedAddresses = new Map();
    this.watchedInvoices = new Map();
    this.isMonitoring = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    
    // Mempool.space WebSocket for real-time updates
    this.mempoolWsUrl = this.network === 'mainnet' 
      ? 'wss://mempool.space/api/v1/ws'
      : 'wss://mempool.space/testnet/api/v1/ws';
    
    // Initialize monitoring
    this.initialize();
  }

  async initialize() {
    try {
      logger.info('Initializing Blockchain Monitor Service...');
      
      // Load pending invoices from database
      await this.loadPendingInvoices();
      
      // Start monitoring
      this.startMonitoring();
      
      logger.info('Blockchain Monitor initialized', {
        network: this.network,
        watchedAddresses: this.watchedAddresses.size,
        watchedInvoices: this.watchedInvoices.size
      });
      
    } catch (error) {
      logger.error('Failed to initialize Blockchain Monitor:', error);
    }
  }

  async loadPendingInvoices() {
    try {
      // Get all pending invoices from database
      const pendingInvoices = await supabaseService.query('purchases', {
        filter: { status: 'pending' },
        select: '*'
      });
      
      // Add each to monitoring
      for (const invoice of pendingInvoices) {
        if (invoice.bitcoin_address) {
          this.watchAddress(invoice.bitcoin_address, {
            invoiceId: invoice.invoice_id,
            expectedAmount: invoice.amount_sats,
            type: 'payment'
          });
        }
        
        if (invoice.payment_hash) {
          this.watchInvoice(invoice.payment_hash, {
            invoiceId: invoice.invoice_id,
            type: 'lightning'
          });
        }
      }
      
      logger.info(`Loaded ${pendingInvoices.length} pending invoices for monitoring`);
      
    } catch (error) {
      logger.error('Failed to load pending invoices:', error);
    }
  }

  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = true;
    
    // Connect to Mempool WebSocket
    this.connectWebSocket();
    
    // Start periodic checks as backup
    this.startPeriodicChecks();
  }

  connectWebSocket() {
    try {
      this.ws = new WebSocket(this.mempoolWsUrl);
      
      this.ws.on('open', () => {
        logger.info('Connected to Mempool WebSocket');
        this.reconnectAttempts = 0;
        
        // Subscribe to watched addresses
        for (const [address, data] of this.watchedAddresses) {
          this.ws.send(JSON.stringify({
            action: 'want',
            data: ['address-transactions', address]
          }));
        }
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          logger.error('Failed to parse WebSocket message:', error);
        }
      });
      
      this.ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
      
      this.ws.on('close', () => {
        logger.warn('WebSocket disconnected');
        this.handleDisconnect();
      });
      
    } catch (error) {
      logger.error('Failed to connect WebSocket:', error);
      this.handleDisconnect();
    }
  }

  handleWebSocketMessage(message) {
    const { address, tx } = message;
    
    if (!address || !tx) {
      return;
    }
    
    const watchData = this.watchedAddresses.get(address);
    if (!watchData) {
      return;
    }
    
    logger.info('New transaction detected', {
      address: address.substring(0, 10) + '...',
      txId: tx.txid,
      invoiceId: watchData.invoiceId
    });
    
    // Emit transaction event
    this.emit('transaction:detected', {
      address,
      transaction: tx,
      invoiceId: watchData.invoiceId,
      expectedAmount: watchData.expectedAmount
    });
    
    // Check if payment is complete
    this.checkPaymentStatus(watchData.invoiceId, tx);
  }

  handleDisconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    logger.info(`Reconnecting in ${delay}ms...`);
    setTimeout(() => this.connectWebSocket(), delay);
  }

  startPeriodicChecks() {
    // Check pending payments every 30 seconds
    this.checkInterval = setInterval(async () => {
      try {
        await this.checkAllPendingPayments();
      } catch (error) {
        logger.error('Periodic check failed:', error);
      }
    }, 30000);
  }

  async checkAllPendingPayments() {
    const addresses = Array.from(this.watchedAddresses.keys());
    
    for (const address of addresses) {
      try {
        await this.checkAddressTransactions(address);
      } catch (error) {
        logger.error(`Failed to check address ${address}:`, error);
      }
    }
  }

  async checkAddressTransactions(address) {
    try {
      // Use Mempool.space API
      const response = await this.makeProxiedRequest(
        'mempool',
        `/api/address/${address}/txs`
      );
      
      const transactions = response.data;
      const watchData = this.watchedAddresses.get(address);
      
      if (!watchData) {
        return;
      }
      
      // Check for payment
      for (const tx of transactions) {
        const received = this.calculateReceivedAmount(tx, address);
        
        if (received >= watchData.expectedAmount) {
          logger.info('Payment detected via periodic check', {
            address: address.substring(0, 10) + '...',
            txId: tx.txid,
            amount: received,
            confirmations: tx.status.block_height ? 1 : 0
          });
          
          this.emit('payment:confirmed', {
            invoiceId: watchData.invoiceId,
            txId: tx.txid,
            amount: received,
            confirmations: tx.status.confirmed ? 1 : 0,
            address
          });
          
          // Remove from monitoring
          this.unwatchAddress(address);
        }
      }
      
    } catch (error) {
      logger.error(`Failed to check address transactions:`, error);
    }
  }

  calculateReceivedAmount(tx, address) {
    let received = 0;
    
    // Sum up all outputs to this address
    for (const output of tx.vout || []) {
      if (output.scriptpubkey_address === address) {
        received += output.value;
      }
    }
    
    return received;
  }

  async checkPaymentStatus(invoiceId, transaction) {
    try {
      // Update payment status in database
      await supabaseService.update('purchases', invoiceId, {
        status: 'paid',
        payment_txid: transaction.txid,
        paid_at: new Date(),
        confirmations: transaction.status?.confirmed ? 1 : 0
      });
      
      logger.info('Payment status updated', {
        invoiceId,
        txId: transaction.txid
      });
      
    } catch (error) {
      logger.error('Failed to update payment status:', error);
    }
  }

  /**
   * Watch a Bitcoin address for payments
   */
  watchAddress(address, metadata) {
    if (this.watchedAddresses.has(address)) {
      return;
    }
    
    this.watchedAddresses.set(address, {
      ...metadata,
      addedAt: new Date(),
      lastChecked: null
    });
    
    // Subscribe via WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'want',
        data: ['address-transactions', address]
      }));
    }
    
    logger.info('Started watching address', {
      address: address.substring(0, 10) + '...',
      invoiceId: metadata.invoiceId
    });
  }

  /**
   * Stop watching an address
   */
  unwatchAddress(address) {
    if (!this.watchedAddresses.has(address)) {
      return;
    }
    
    this.watchedAddresses.delete(address);
    
    // Unsubscribe via WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'dont-want',
        data: ['address-transactions', address]
      }));
    }
    
    logger.info('Stopped watching address', {
      address: address.substring(0, 10) + '...'
    });
  }

  /**
   * Watch a Lightning invoice
   */
  watchInvoice(paymentHash, metadata) {
    this.watchedInvoices.set(paymentHash, {
      ...metadata,
      addedAt: new Date()
    });
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      network: this.network,
      isMonitoring: this.isMonitoring,
      websocketConnected: this.ws?.readyState === WebSocket.OPEN,
      watchedAddresses: this.watchedAddresses.size,
      watchedInvoices: this.watchedInvoices.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.ws) {
      this.ws.close();
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    logger.info('Blockchain monitoring stopped');
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(txId) {
    try {
      const response = await this.makeProxiedRequest(
        'mempool',
        `/api/tx/${txId}`
      );
      
      return response.data;
      
    } catch (error) {
      logger.error('Failed to get transaction details:', error);
      throw error;
    }
  }

  /**
   * Estimate fee for transaction
   */
  async estimateFee(priority = 'normal') {
    try {
      const response = await this.makeProxiedRequest(
        'mempool',
        `/api/v1/fees/recommended`
      );
      
      const fees = response.data;
      
      const feeMap = {
        'slow': fees.hourFee,
        'normal': fees.halfHourFee,
        'fast': fees.fastestFee
      };
      
      return feeMap[priority] || fees.halfHourFee;
      
    } catch (error) {
      logger.error('Failed to estimate fee:', error);
      return 10; // Default fallback fee
    }
  }

  /**
   * Make proxied request to avoid CORS issues
   * @private
   */
  async makeProxiedRequest(service, path) {
    try {
      // For server-side, we can make direct requests
      const baseURL = service === 'mempool' 
        ? `https://mempool.space${this.network === 'testnet' ? '/testnet' : ''}`
        : `https://blockstream.info${this.network === 'testnet' ? '/testnet' : ''}`;
      
      const response = await axios.get(`${baseURL}${path}`);
      return response;
    } catch (error) {
      logger.error(`Request failed for ${service}${path}:`, error);
      throw error;
    }
  }
}

// Export singleton
module.exports = new BlockchainMonitorService();