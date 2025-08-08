/**
 * Global Test Setup - Vitest Configuration
 * Setup global mocks, utilities, and test environment
 */

import '@testing-library/jest-dom';

// Mock WebGL context for Three.js testing
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: (contextType: string) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        canvas: document.createElement('canvas'),
        drawingBufferWidth: 1024,
        drawingBufferHeight: 768,
        getParameter: () => '',
        getExtension: () => null,
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        createProgram: () => ({}),
        attachShader: () => {},
        linkProgram: () => {},
        useProgram: () => {},
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        enableVertexAttribArray: () => {},
        vertexAttribPointer: () => {},
        clear: () => {},
        clearColor: () => {},
        enable: () => {},
        disable: () => {},
        drawArrays: () => {},
        drawElements: () => {},
        viewport: () => {},
      };
    }
    return null;
  },
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    clearMarks: () => {},
    clearMeasures: () => {},
    memory: {
      usedJSHeapSize: 50000000,
      totalJSHeapSize: 100000000,
      jsHeapSizeLimit: 200000000,
    },
  },
});

// Mock AudioContext for audio testing
Object.defineProperty(window, 'AudioContext', {
  value: class MockAudioContext {
    state = 'running';
    sampleRate = 44100;
    destination = {};
    
    createGain() {
      return {
        gain: { value: 1 },
        connect: () => {},
        disconnect: () => {},
      };
    }
    
    createOscillator() {
      return {
        frequency: { value: 440 },
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    }
    
    createBuffer() {
      return {
        getChannelData: () => new Float32Array(1024),
      };
    }
    
    createBufferSource() {
      return {
        buffer: null,
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    }
    
    decodeAudioData() {
      return Promise.resolve({
        getChannelData: () => new Float32Array(1024),
      });
    }
    
    close() {
      return Promise.resolve();
    }
  },
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 16);
  },
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: (id: number) => {
    clearTimeout(id);
  },
});

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  value: class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Test Environment)',
});

Object.defineProperty(navigator, 'vibrate', {
  value: () => true,
});

// Global test utilities
declare global {
  interface Window {
    testUtils: {
      createMockCanvas: () => HTMLCanvasElement;
      createMockWebGLContext: () => WebGLRenderingContext;
      mockLocalStorage: () => void;
    };
  }
}

window.testUtils = {
  createMockCanvas: () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    return canvas;
  },
  
  createMockWebGLContext: () => {
    return {} as WebGLRenderingContext;
  },
  
  mockLocalStorage: () => {
    const storage: Record<string, string> = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storage[key] || null,
        setItem: (key: string, value: string) => {
          storage[key] = value;
        },
        removeItem: (key: string) => {
          delete storage[key];
        },
        clear: () => {
          Object.keys(storage).forEach(key => delete storage[key]);
        },
      },
    });
  },
};