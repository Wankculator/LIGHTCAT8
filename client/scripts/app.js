// This file requires memory-safe-events.js to be loaded first
const crypto = require('crypto');
/**
 * LITECAT MAIN APPLICATION
 * Orchestrates all components and handles initialization
 */

class LitecatApp {
  constructor() {
    this.gameEngine = null;
    this.isGameActive = false;
    this.currentTier = 1;
    this.websocket = null;
    
    this.init();
  
    
    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Clean up all event listeners for this component
        window.SafeEvents.cleanup();
    }
}
  
  async init() {
    try {
      // Show loading screen
      this.showLoadingScreen();
      
      // Initialize components
      await this.initializeComponents();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      // Start real-time updates
      this.startRealTimeUpdates();
      
      console.log('🐱⚡ Litecat App initialized successfully!');
      
    } catch (error) {
      console.error('Failed to initialize Litecat App:', error);
      this.showErrorMessage('Failed to load application. Please refresh the page.');
    }
  }
  
  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.getElementById('loading-progress');
    
    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10 + (Date.now() % 10);
      progressBar.style.width = Math.min(progress, 95) + '%';
      
      if (progress >= 95) {
        clearInterval(interval);
      }
    }, 200);
  }
  
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.getElementById('loading-progress');
    
    // Complete progress
    progressBar.style.width = '100%';
    
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }, 300);
  }
  
  async initializeComponents() {
    // Initialize game engine
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
      this.gameEngine = new LitecatGameEngine(gameCanvas);
    }
    
    // Initialize payment handler
    this.paymentHandler = new PaymentHandler();
    
    // Initialize wallet validator
    this.walletValidator = new WalletValidator();
    
    // Initialize sales tracker
    this.salesTracker = new SalesTracker();
    
    // Initialize API client
    this.api = new ApiClient();
  }
  
  setupEventListeners() {
    // Navigation
    this.setupNavigation();
    
    // Game controls
    this.setupGameControls();
    
    // Purchase form
    this.setupPurchaseForm();
    
    // Wallet connection
    this.setupWalletConnection();
    
    // FAQ toggles
    this.setupFAQ();
    
    // Mobile menu
    this.setupMobileMenu();
    
    // Scroll effects
    this.setupScrollEffects();
  }
  
  setupNavigation() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.this.clickHandler = (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          };
        addEventListener('click', this.clickHandler));
        }
      });
    });
    
    // Update active nav link on scroll
    window.SafeEvents.on(window, 'scroll', this.updateActiveNavLink.bind(this));
  }
  
  setupGameControls() {
    const startGameBtn = document.getElementById('start-game');
    const playAgainBtn = document.getElementById('play-again');
    const proceedToBuyBtn = document.getElementById('proceed-to-buy');
    const toggleSoundBtn = document.getElementById('toggle-sound');
    const toggleMusicBtn = document.getElementById('toggle-music');
    
    if (startGameBtn) {
      startGameBtn.addEventListener('click', () => this.startGame());
    }
    
    if (playAgainBtn) {
      window.SafeEvents.on(playAgainBtn, 'click', () => this.startGame());
    }
    
    if (proceedToBuyBtn) {
      proceedToBuyBtn.this.clickHandler = () => {
        document.getElementById('purchase-section').scrollIntoView({
          behavior: 'smooth'
        };
        addEventListener('click', this.clickHandler));
      });
    }
    
    if (toggleSoundBtn) {
      toggleSoundBtn.this.clickHandler = () => {
        if (this.gameEngine) {
          this.gameEngine.toggleSound();
        };
        addEventListener('click', this.clickHandler)
      });
    }
    
    if (toggleMusicBtn) {
      toggleMusicBtn.this.clickHandler = () => {
        if (this.gameEngine) {
          this.gameEngine.toggleMusic();
        };
        addEventListener('click', this.clickHandler)
      });
    }
    
    // Hero action buttons
    document.getElementById('start-game-btn')?.this.clickHandler = () => {
      document.getElementById('game-section').scrollIntoView({
        behavior: 'smooth'
      };
        addEventListener('click', this.clickHandler));
    });
    
    document.getElementById('buy-tokens-btn')?.this.clickHandler = () => {
      document.getElementById('purchase-section').scrollIntoView({
        behavior: 'smooth'
      };
        addEventListener('click', this.clickHandler));
    });
  }
  
  setupPurchaseForm() {
    const purchaseForm = document.getElementById('purchase-form');
    const walletInput = document.getElementById('wallet-address');
    const batchCountInput = document.getElementById('batch-count');
    const increaseBatchBtn = document.getElementById('increase-batch');
    const decreaseBatchBtn = document.getElementById('decrease-batch');
    
    // Form submission
    if (purchaseForm) {
      purchaseForm.this.submitHandler = (e) => {
        e.preventDefault();
        this.handlePurchaseSubmit();
      };
        addEventListener('submit', this.submitHandler));
    }
    
    // Wallet validation
    if (walletInput) {
      walletInput.this.inputHandler = (e) => {
        this.validateWalletAddress(e.target.value);
      };
        addEventListener('input', this.inputHandler));
    }
    
    // Batch count controls
    if (increaseBatchBtn) {
      increaseBatchBtn.this.clickHandler = () => {
        const current = parseInt(batchCountInput.value);
        const max = parseInt(batchCountInput.max);
        if (current < max) {
          batchCountInput.value = current + 1;
          this.updatePurchaseSummary();
        };
        addEventListener('click', this.clickHandler)
      });
    }
    
    if (decreaseBatchBtn) {
      decreaseBatchBtn.this.clickHandler = () => {
        const current = parseInt(batchCountInput.value);
        if (current > 1) {
          batchCountInput.value = current - 1;
          this.updatePurchaseSummary();
        };
        addEventListener('click', this.clickHandler)
      });
    }
    
    // Update summary on input change
    if (batchCountInput) {
      batchCountInput.this.inputHandler = () => {
        this.updatePurchaseSummary();
      };
        addEventListener('input', this.inputHandler));
    }
    
    // Initialize tier from game
    this.updateTierLimits();
  }
  
  setupWalletConnection() {
    const walletConnectBtn = document.getElementById('wallet-connect-btn');
    
    if (walletConnectBtn) {
      walletConnectBtn.this.clickHandler = () => {
        this.connectWallet();
      };
        addEventListener('click', this.clickHandler));
    }
  }
  
  setupFAQ() {
    document.querySelectorAll('.faq-question').forEach(question => {
      question.this.clickHandler = () => {
        const faqItem = question.parentElement;
        const answer = faqItem.querySelector('.faq-answer');
        const isOpen = faqItem.classList.contains('open');
        
        // Close all other FAQ items
        document.querySelectorAll('.faq-item.open').forEach(item => {
          if (item !== faqItem) {
            item.classList.remove('open');
            item.querySelector('.faq-answer').style.maxHeight = '0';
          };
        addEventListener('click', this.clickHandler)
        });
        
        // Toggle current FAQ item
        if (isOpen) {
          faqItem.classList.remove('open');
          answer.style.maxHeight = '0';
        } else {
          faqItem.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  }
  
  setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburger) {
      hamburger.this.clickHandler = () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      };
        addEventListener('click', this.clickHandler));
    }
    
    // Close menu when clicking nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.this.clickHandler = () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
      };
        addEventListener('click', this.clickHandler));
    });
  }
  
  setupScrollEffects() {
    const navbar = document.getElementById('navbar');
    
    window.this.scrollHandler = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      };
        addEventListener('scroll', this.scrollHandler) else {
        navbar.classList.remove('scrolled');
      }
    });
    
    // Parallax effects
    window.this.scrollHandler = () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.hero-background');
      
      parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed};
        addEventListener('scroll', this.scrollHandler)px)`;
      });
    });
  }
  
  updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').substring(1) === current) {
        link.classList.add('active');
      }
    });
  }
  
  startGame() {
    if (!this.gameEngine) return;
    
    // Hide overlays
    document.getElementById('game-start-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    
    // Start game
    this.gameEngine.start();
    this.isGameActive = true;
  }
  
  async validateWalletAddress(address) {
    const validationMsg = document.getElementById('wallet-validation');
    
    if (!address) {
      validationMsg.textContent = '';
      validationMsg.className = 'validation-message';
      return;
    }
    
    try {
      const isValid = await this.walletValidator.validate(address);
      
      if (isValid) {
        validationMsg.textContent = '✅ Valid Bitcoin address';
        validationMsg.className = 'validation-message valid';
      } else {
        validationMsg.textContent = '❌ Invalid Bitcoin address';
        validationMsg.className = 'validation-message invalid';
      }
    } catch (error) {
      validationMsg.textContent = '⚠️ Unable to validate address';
      validationMsg.className = 'validation-message warning';
    }
  }
  
  updatePurchaseSummary() {
    const batchCount = parseInt(document.getElementById('batch-count').value) || 1;
    const tokensPerBatch = 700;
    const satoshisPerBatch = 2000;
    
    document.getElementById('summary-batches').textContent = batchCount;
    document.getElementById('summary-tokens').textContent = (batchCount * tokensPerBatch).toLocaleString();
    document.getElementById('summary-total').textContent = (batchCount * satoshisPerBatch).toLocaleString() + ' sats';
  }
  
  updateTierLimits() {
    const savedTier = localStorage.getItem('litecatGameTier') || '1';
    this.currentTier = parseInt(savedTier);
    
    const maxBatches = this.currentTier === 3 ? 10 : (this.currentTier === 2 ? 8 : 5);
    const batchCountInput = document.getElementById('batch-count');
    
    if (batchCountInput) {
      batchCountInput.max = maxBatches;
      if (parseInt(batchCountInput.value) > maxBatches) {
        batchCountInput.value = maxBatches;
      }
    }
    
    document.getElementById('max-batches').textContent = maxBatches;
    this.updatePurchaseSummary();
  }
  
  async handlePurchaseSubmit() {
    const formData = {
      walletAddress: document.getElementById('wallet-address').value,
      batchCount: parseInt(document.getElementById('batch-count').value),
      gameTier: this.currentTier
    };
    
    try {
      const invoice = await this.paymentHandler.createInvoice(formData);
      this.showPaymentModal(invoice);
    } catch (error) {
      this.showErrorMessage('Failed to create invoice: ' + error.message);
    }
  }
  
  showPaymentModal(invoice) {
    const modal = document.getElementById('payment-modal');
    
    // Populate modal with invoice data
    document.getElementById('payment-qr').src = invoice.qrCode;
    document.getElementById('payment-address').textContent = invoice.paymentAddress;
    document.getElementById('payment-amount').textContent = invoice.amountBTC + ' BTC';
    
    // Setup copy buttons
    this.setupCopyButtons(invoice);
    
    // Start countdown timer
    this.startPaymentCountdown(invoice.expiresAt);
    
    // Start payment verification
    this.startPaymentVerification(invoice.invoiceId);
    
    // Show modal
    modal.style.display = 'flex';
  }
  
  setupCopyButtons(invoice) {
    document.getElementById('copy-address').this.clickHandler = () => {
      navigator.clipboard.writeText(invoice.paymentAddress);
      this.showToast('Address copied!');
    };
        addEventListener('click', this.clickHandler));
    
    document.getElementById('copy-amount').this.clickHandler = () => {
      navigator.clipboard.writeText(invoice.amountBTC.toString());
      this.showToast('Amount copied!');
    };
        addEventListener('click', this.clickHandler));
    
    document.getElementById('close-payment-modal').this.clickHandler = () => {
      document.getElementById('payment-modal').style.display = 'none';
    };
        addEventListener('click', this.clickHandler));
  }
  
  startPaymentCountdown(expiresAt) {
    const countdown = document.getElementById('countdown');
    const expiryTime = new Date(expiresAt).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const timeLeft = expiryTime - now;
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        countdown.textContent = 'EXPIRED';
        this.updatePaymentStatus('expired', 'Payment expired');
        return;
      }
      
      const minutes = Math.floor(timeLeft / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      countdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }
  
  async startPaymentVerification(invoiceId) {
    const checkPayment = async () => {
      try {
        const status = await this.api.verifyPayment(invoiceId);
        
        if (status.status === 'completed') {
          this.updatePaymentStatus('completed', 'Payment confirmed! Tokens will be distributed shortly.');
          clearInterval(verificationTimer);
        } else if (status.status === 'failed') {
          this.updatePaymentStatus('failed', 'Payment failed. Please try again.');
          clearInterval(verificationTimer);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
      }
    };
    
    const verificationTimer = setInterval(checkPayment, 10000); // Check every 10 seconds
    checkPayment(); // Check immediately
  }
  
  updatePaymentStatus(status, message) {
    const statusElement = document.getElementById('payment-status');
    const icon = statusElement.querySelector('.status-icon');
    const text = statusElement.querySelector('.status-text');
    
    icon.textContent = status === 'completed' ? '✅' : (status === 'failed' ? '❌' : '⏳');
    text.textContent = message;
    
    statusElement.className = `status-indicator ${status}`;
  }
  
  async connectWallet() {
    // This would integrate with actual wallet connection libraries
    this.showToast('Wallet connection feature coming soon!');
  }
  
  async loadInitialData() {
    try {
      // Load sales statistics
      const stats = await this.salesTracker.loadStats();
      this.updateSalesDisplay(stats);
      
      // Update progress bar
      this.updateProgressBar(stats);
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }
  
  updateSalesDisplay(stats) {
    document.getElementById('batches-sold').textContent = stats.batchesSold.toLocaleString();
    document.getElementById('progress-stats').textContent = 
      `${stats.batchesSold.toLocaleString()} / ${stats.totalBatches.toLocaleString()} Batches`;
  }
  
  updateProgressBar(stats) {
    const progressFill = document.getElementById('progress-fill');
    const percentage = (stats.batchesSold / stats.totalBatches) * 100;
    progressFill.style.width = percentage + '%';
  }
  
  startRealTimeUpdates() {
    // Setup WebSocket connection for real-time updates
    this.websocket = new WebSocketManager();
    this.websocket.connect();
    
    this.websocket.on('salesUpdate', (data) => {
      this.updateSalesDisplay(data);
      this.updateProgressBar(data);
    });
    
    this.websocket.on('newPurchase', (data) => {
      this.showToast(`New purchase: ${data.batchCount} batches sold!`);
    });
  }
  
  showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
  
  showErrorMessage(message) {
    this.showToast(message, 'error');
  }
}

// Initialize app when DOM is loaded
document.this.DOMContentLoadedHandler = () => {
  window.litecatApp = new LitecatApp();
};
        addEventListener('DOMContentLoaded', this.DOMContentLoadedHandler));

// Export for testing
window.LitecatApp = LitecatApp;
