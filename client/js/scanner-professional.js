/**
 * Professional QR Scanner Implementation for RGBLIGHTCAT
 * Fixes all common QR scanner issues with proper error handling
 */

class QRScannerManager {
    constructor() {
        this.scanner = null;
        this.isScanning = false;
        this.elementId = "qrReaderDiv"; // Using existing element ID
        this.modalId = "qrScannerModal";
    }
    
    async initScanner() {
        try {
            // Ensure DOM element exists
            if (!document.getElementById(this.elementId)) {
                throw new Error("QR scanner container not found");
            }
            
            // Create scanner instance with proper error handling
            this.scanner = new Html5Qrcode(this.elementId);
            return true;
        } catch (error) {
            console.error("Scanner initialization failed:", error);
            this.showError("Failed to initialize camera scanner");
            return false;
        }
    }
    
    async startScanning() {
        if (this.isScanning) return;
        
        try {
            // Show scanner UI
            const readerDiv = document.getElementById(this.elementId);
            const permDiv = document.getElementById('cameraPermissionDiv');
            
            if (permDiv) permDiv.style.display = 'none';
            if (readerDiv) {
                readerDiv.style.display = 'block';
                readerDiv.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--yellow);">Initializing camera...</div>';
            }
            
            // Get available cameras
            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                throw new Error("No cameras found on this device");
            }
            
            // Select optimal camera
            const cameraId = this.selectOptimalCamera(cameras);
            
            // Clear loading message
            if (readerDiv) readerDiv.innerHTML = '';
            
            // Camera configuration
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                disableFlip: false,
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            };
            
            // Start scanning with proper callbacks
            await this.scanner.start(
                cameraId,
                config,
                this.onScanSuccess.bind(this),
                this.onScanFailure.bind(this)
            );
            
            this.isScanning = true;
            this.updateUI('scanning');
            
            // Add camera selector if multiple cameras
            if (cameras.length > 1) {
                this.showCameraSelector(cameras, cameraId);
            }
            
        } catch (error) {
            console.error("Failed to start scanning:", error);
            this.handleCameraError(error);
        }
    }
    
    selectOptimalCamera(cameras) {
        // Prefer rear camera for QR scanning
        const rearCamera = cameras.find(camera => 
            camera.label.toLowerCase().includes('back') ||
            camera.label.toLowerCase().includes('rear') ||
            camera.label.toLowerCase().includes('environment')
        );
        
        return rearCamera ? rearCamera.id : cameras[cameras.length - 1].id;
    }
    
    showCameraSelector(cameras, currentCameraId) {
        const selectDiv = document.getElementById('cameraSelectDiv');
        if (!selectDiv) return;
        
        const select = document.getElementById('cameraSelect');
        if (!select) return;
        
        // Clear existing options
        select.innerHTML = '';
        
        // Add camera options
        cameras.forEach(camera => {
            const option = document.createElement('option');
            option.value = camera.id;
            option.text = camera.label || `Camera ${camera.id}`;
            option.selected = camera.id === currentCameraId;
            select.appendChild(option);
        });
        
        // Show selector
        selectDiv.style.display = 'block';
        
        // Handle camera change
        select.onchange = async (e) => {
            await this.switchCamera(e.target.value);
        };
    }
    
    async switchCamera(cameraId) {
        if (!this.scanner || !this.isScanning) return;
        
        try {
            // Stop current scanning
            await this.scanner.stop();
            
            // Start with new camera
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };
            
            await this.scanner.start(
                cameraId,
                config,
                this.onScanSuccess.bind(this),
                this.onScanFailure.bind(this)
            );
        } catch (error) {
            console.error("Failed to switch camera:", error);
            this.showError("Failed to switch camera");
        }
    }
    
    onScanSuccess(decodedText, decodedResult) {
        console.log('QR Code detected:', decodedText);
        
        // Vibrate on success if available
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        // Auto-fill the RGB invoice field
        const invoiceInput = document.getElementById('rgbInvoice');
        if (invoiceInput) {
            invoiceInput.value = decodedText;
            invoiceInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Show success message
        this.showSuccess("QR Code scanned successfully!");
        
        // Stop scanning and close modal after delay
        setTimeout(() => {
            this.stopScanning();
            this.closeModal();
        }, 1500);
    }
    
    onScanFailure(error) {
        // Handle scan failures silently (normal for continuous scanning)
        // Only log actual errors, not "No QR code found" messages
        if (!error.includes("NotFoundException") && !error.includes("No MultiFormat Readers")) {
            console.warn("Scan error:", error);
        }
    }
    
    async stopScanning() {
        if (this.scanner && this.isScanning) {
            try {
                await this.scanner.stop();
                this.isScanning = false;
                this.updateUI('stopped');
            } catch (error) {
                console.error("Error stopping scanner:", error);
            }
        }
    }
    
    handleCameraError(error) {
        const readerDiv = document.getElementById(this.elementId);
        if (!readerDiv) return;
        
        let message = 'Unable to access camera';
        let solution = '';
        
        if (error.name === 'NotAllowedError' || error.message.includes('NotAllowed')) {
            message = 'Camera permission denied';
            solution = 'Please allow camera access in your browser settings and reload the page.';
        } else if (error.name === 'NotFoundError' || error.message.includes('NotFound')) {
            message = 'No camera found';
            solution = 'Your device may not have a camera, or it may not be accessible.';
        } else if (error.name === 'NotReadableError' || error.message.includes('NotReadable')) {
            message = 'Camera is busy';
            solution = 'Please close other apps using the camera and try again.';
        } else if (error.message.includes('Secure context required')) {
            message = 'HTTPS required';
            solution = 'Camera access requires a secure connection (HTTPS).';
        }
        
        readerDiv.innerHTML = `
            <div style="padding: 30px; text-align: center;">
                <h3 style="color: #ff6b6b;">${message}</h3>
                <p style="color: rgba(255,255,255,0.8); margin: 20px 0;">${solution}</p>
                
                <div style="margin-top: 30px;">
                    <p style="color: var(--yellow); margin-bottom: 15px;">Try Alternative Method:</p>
                    <button onclick="document.getElementById('qrFileInput').click()" style="
                        background: var(--yellow);
                        color: #000;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 1rem;
                    ">Upload QR Image</button>
                </div>
                
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    background: transparent;
                    color: var(--yellow);
                    border: 1px solid var(--yellow);
                    padding: 10px 25px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: block;
                    width: 200px;
                    margin: 20px auto 0;
                ">Reload Page</button>
            </div>
        `;
    }
    
    updateUI(state) {
        const startBtn = document.getElementById('startScannerBtn');
        if (!startBtn) return;
        
        switch(state) {
            case 'scanning':
                startBtn.textContent = 'Camera Active';
                startBtn.disabled = true;
                break;
            case 'stopped':
                startBtn.textContent = 'Enable Camera & Scan';
                startBtn.disabled = false;
                break;
        }
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showMessage(message, type) {
        const readerDiv = document.getElementById(this.elementId);
        if (!readerDiv) return;
        
        const color = type === 'success' ? '#4caf50' : '#ff6b6b';
        const messageHtml = `
            <div style="
                padding: 20px;
                margin: 10px;
                background: ${type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 107, 107, 0.1)'};
                border: 2px solid ${color};
                border-radius: 8px;
                color: ${color};
                text-align: center;
                font-weight: 600;
            ">${message}</div>
        `;
        
        if (this.isScanning && this.scanner) {
            // Overlay message on scanner
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; z-index: 100;';
            overlay.innerHTML = messageHtml;
            readerDiv.appendChild(overlay);
            
            setTimeout(() => overlay.remove(), 3000);
        } else {
            readerDiv.innerHTML = messageHtml;
        }
    }
    
    closeModal() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.style.display = 'none';
        }
        this.stopScanning();
    }
    
    async handleFileUpload(file) {
        if (!file) return;
        
        console.log('Processing uploaded QR image...');
        
        const readerDiv = document.getElementById(this.elementId);
        if (readerDiv) {
            readerDiv.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--yellow);">Processing image...</div>';
        }
        
        try {
            // Ensure scanner is initialized
            if (!this.scanner) {
                await this.initScanner();
            }
            
            // Scan the file
            const result = await this.scanner.scanFile(file, true);
            console.log('File scan success:', result);
            this.onScanSuccess(result);
            
        } catch (err) {
            console.error('File scan error:', err);
            if (readerDiv) {
                readerDiv.innerHTML = `
                    <div style="padding: 40px; text-align: center; color: #ff6b6b;">
                        <h3>Could not read QR code</h3>
                        <p>Make sure the image contains a clear QR code and try again.</p>
                        <button onclick="document.getElementById('qrFileInput').click()" style="
                            margin-top: 20px;
                            background: var(--yellow);
                            color: #000;
                            border: none;
                            padding: 10px 25px;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Try Another Image</button>
                    </div>
                `;
            }
        }
    }
}

// Initialize scanner when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const qrManager = new QRScannerManager();
    
    // Initialize scanner
    await qrManager.initScanner();
    
    // Main scan button
    const scanBtn = document.getElementById('scanQRBtn');
    if (scanBtn) {
        scanBtn.onclick = function(e) {
            e.preventDefault();
            const modal = document.getElementById('qrScannerModal');
            if (modal) modal.style.display = 'flex';
        };
    }
    
    // Enable camera button
    const startBtn = document.getElementById('startScannerBtn');
    if (startBtn) {
        startBtn.onclick = async function(e) {
            e.preventDefault();
            await qrManager.startScanning();
        };
    }
    
    // Close button
    const closeBtn = document.getElementById('closeQRScanner');
    if (closeBtn) {
        closeBtn.onclick = function() {
            qrManager.closeModal();
        };
    }
    
    // Manual input button
    const manualBtn = document.getElementById('manualInputBtn');
    if (manualBtn) {
        manualBtn.onclick = function() {
            qrManager.closeModal();
            const input = document.getElementById('rgbInvoice');
            if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };
    }
    
    // Upload button
    const uploadBtn = document.getElementById('uploadQRBtn');
    if (uploadBtn) {
        uploadBtn.onclick = function() {
            const fileInput = document.getElementById('qrFileInput');
            if (fileInput) fileInput.click();
        };
    }
    
    // File input handler
    const fileInput = document.getElementById('qrFileInput');
    if (fileInput) {
        fileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file) qrManager.handleFileUpload(file);
        };
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        qrManager.stopScanning();
    });
    
    // Make manager globally accessible for debugging
    window.qrScannerManager = qrManager;
});

// Global function for inline onclick handlers
window.closeQRScanner = function() {
    if (window.qrScannerManager) {
        window.qrScannerManager.closeModal();
    }
};