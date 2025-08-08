const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('✅ WebSocket connected');
  
  // Test ping
  ws.send(JSON.stringify({ type: 'ping' }));
  
  // Close after 2 seconds
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 2000);
});

ws.on('message', (data) => {
  console.log('📨 Message received:', data.toString());
});

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔚 WebSocket closed');
});

// Timeout if no connection
setTimeout(() => {
  console.error('❌ Connection timeout');
  process.exit(1);
}, 5000);