const fs = require('fs');
const path = require('path');

describe('Security: Crypto Random Number Generation', () => {
  const gameFiles = [
    'client/js/game/CatModel.js',
    'client/js/game/CollectibleManager.js',
    'client/js/game/GameWorld.js',
    'client/js/game/LightCatCharacter.js',
    'client/js/game/LightningRain.js',
    'client/js/game/ObjectPool.js',
    'client/js/game/ProEnvironment.js',
    'client/js/game/ProGame.js',
    'client/js/game/SimpleCatGame.js',
    'client/js/game/SoundManager.js'
  ];

  test('No Math.random() usage in game files', () => {
    const projectRoot = path.join(__dirname, '../../');
    
    gameFiles.forEach(file => {
      const filePath = path.join(projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for Math.random() usage
      const mathRandomMatches = content.match(/Math\.random\(\)/g);
      expect(mathRandomMatches).toBeNull();
      
      // Verify crypto.getRandomValues is used instead
      const cryptoUsage = content.includes('crypto.getRandomValues') || 
                         content.includes('window.crypto.getRandomValues');
      expect(cryptoUsage).toBe(true);
    });
  });

  test('Secure UUID generation implemented', () => {
    const projectRoot = path.join(__dirname, '../../');
    
    // Check UUID generation in key files
    const filesToCheck = [
      'server/controllers/rgbPaymentController.js',
      'server/services/rgbService.js'
    ];
    
    filesToCheck.forEach(file => {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Should use crypto.randomUUID or similar secure method
        const hasSecureUUID = content.includes('crypto.randomUUID') ||
                             content.includes('uuidv4()') ||
                             content.includes('randomBytes');
        
        // Should NOT use Math.random for ID generation
        const hasMathRandomID = /Math\.random\(\).*toString\(36\)/.test(content);
        
        expect(hasSecureUUID || !hasMathRandomID).toBe(true);
      }
    });
  });

  test('JWT secret is properly configured', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_SECRET.length).toBeGreaterThan(20);
  });
});