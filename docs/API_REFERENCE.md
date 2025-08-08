# 📚 RGB Light Cat - Complete API Reference

## Version 2.0.0 - Enterprise Edition

---

## 📋 **TABLE OF CONTENTS**

1. [🏗️ Core Infrastructure APIs](#core-infrastructure-apis)
2. [🎮 Game Engine APIs](#game-engine-apis)
3. [💻 UI System APIs](#ui-system-apis)
4. [🛡️ Security APIs](#security-apis)
5. [📊 Performance APIs](#performance-apis)
6. [🔧 Utility APIs](#utility-apis)
7. [📈 Analytics APIs](#analytics-apis)
8. [🎯 Integration Examples](#integration-examples)

---

## 🏗️ **CORE INFRASTRUCTURE APIS**

### **IoContainer**

Enterprise dependency injection container for managing object lifecycles and dependencies.

#### **Constructor**
```typescript
constructor(config?: ContainerConfig)
```

**Parameters:**
- `config` *(optional)*: Container configuration options
  - `enableCircularDependencyDetection`: boolean (default: true)
  - `enableLifecycleManagement`: boolean (default: true)
  - `maxResolutionDepth`: number (default: 50)

**Example:**
```typescript
const container = new IoContainer({
  enableCircularDependencyDetection: true,
  maxResolutionDepth: 100
});
```

#### **Methods**

##### `register<T>(token: Token<T>, factory: Factory<T>, options?: RegistrationOptions): void`

Registers a service with the container.

**Parameters:**
- `token`: Unique identifier for the service
- `factory`: Function that creates the service instance
- `options` *(optional)*: Registration configuration
  - `singleton`: boolean - Register as singleton
  - `dependencies`: Token[] - Service dependencies
  - `lifecycle`: LifecycleType - Service lifecycle management

**Throws:**
- `DuplicateRegistrationError`: If token is already registered
- `CircularDependencyError`: If circular dependency detected

**Example:**
```typescript
container.register('logger', Logger, {
  singleton: true,
  dependencies: ['config']
});
```

##### `resolve<T>(token: Token<T>): Promise<T>`

Resolves a service from the container.

**Parameters:**
- `token`: Service identifier to resolve

**Returns:**
- `Promise<T>`: The resolved service instance

**Throws:**
- `ServiceNotFoundError`: If service is not registered
- `ResolutionError`: If service cannot be resolved

**Example:**
```typescript
const logger = await container.resolve('logger');
logger.info('Service resolved successfully');
```

##### `createScope(): IContainer`

Creates a new container scope for isolated service resolution.

**Returns:**
- `IContainer`: New container scope

**Example:**
```typescript
const scopedContainer = container.createScope();
scopedContainer.register('scopedService', ScopedService);
```

---

### **Logger**

Multi-transport logging system with performance timing and structured logging.

#### **Constructor**
```typescript
constructor(name: string, config?: LoggerConfig)
```

**Parameters:**
- `name`: Logger instance name
- `config` *(optional)*: Logger configuration
  - `level`: LogLevel - Minimum log level (default: INFO)
  - `enableColors`: boolean - Enable colored output (default: true)
  - `enableTimestamps`: boolean - Add timestamps (default: true)
  - `transports`: Transport[] - Log output destinations

#### **Methods**

##### `info(message: string, data?: LogData): void`

Logs an informational message.

**Parameters:**
- `message`: Log message
- `data` *(optional)*: Additional structured data

**Example:**
```typescript
logger.info('User logged in', { userId: 123, timestamp: Date.now() });
```

##### `error(message: string, error?: Error, data?: LogData): void`

Logs an error message with optional error object.

**Parameters:**
- `message`: Error message
- `error` *(optional)*: Error object
- `data` *(optional)*: Additional context data

**Example:**
```typescript
try {
  riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, { operation: 'riskyOperation' });
}
```

##### `startTimer(name: string): void`

Starts a performance timer.

**Parameters:**
- `name`: Timer identifier

**Example:**
```typescript
logger.startTimer('database-query');
// ... perform operation
logger.endTimer('database-query'); // Logs duration
```

##### `endTimer(name: string): number`

Ends a performance timer and logs the duration.

**Parameters:**
- `name`: Timer identifier

**Returns:**
- `number`: Duration in milliseconds

---

### **EventEmitter**

High-performance, type-safe event system with priority handling.

#### **Constructor**
```typescript
constructor<T extends EventMap>(config?: EventEmitterConfig)
```

**Parameters:**
- `config` *(optional)*: Event emitter configuration
  - `maxListeners`: number - Maximum listeners per event (default: 100)
  - `enablePriority`: boolean - Enable priority handling (default: true)
  - `captureRejections`: boolean - Capture promise rejections (default: true)

#### **Methods**

##### `on<K extends keyof T>(event: K, listener: EventListener<T[K]>, priority?: number): Subscription`

Registers an event listener.

**Parameters:**
- `event`: Event name
- `listener`: Event handler function
- `priority` *(optional)*: Listener priority (higher = earlier execution)

**Returns:**
- `Subscription`: Subscription object with unsubscribe method

**Example:**
```typescript
const subscription = eventEmitter.on('userAction', (action) => {
  console.log('User performed action:', action.type);
}, 10); // High priority

// Later...
subscription.unsubscribe();
```

##### `emit<K extends keyof T>(event: K, ...args: T[K]): boolean`

Emits an event to all registered listeners.

**Parameters:**
- `event`: Event name
- `args`: Event arguments

**Returns:**
- `boolean`: True if event had listeners

**Example:**
```typescript
const handled = eventEmitter.emit('userAction', {
  type: 'click',
  target: 'button',
  timestamp: Date.now()
});
```

##### `once<K extends keyof T>(event: K, listener: EventListener<T[K]>): Subscription`

Registers a one-time event listener.

**Parameters:**
- `event`: Event name
- `listener`: Event handler function

**Returns:**
- `Subscription`: Subscription object

**Example:**
```typescript
eventEmitter.once('gameStart', () => {
  console.log('Game started!');
});
```

---

## 🎮 **GAME ENGINE APIS**

### **GameEngine**

Central game engine orchestrator managing all game systems.

#### **Constructor**
```typescript
constructor(container: IContainer, config?: GameEngineConfig)
```

**Parameters:**
- `container`: Dependency injection container
- `config` *(optional)*: Engine configuration
  - `targetFPS`: number - Target frame rate (default: 60)
  - `enableVSync`: boolean - Enable vertical sync (default: true)
  - `maxDeltaTime`: number - Maximum delta time clamp (default: 0.1)

#### **Methods**

##### `async initialize(): Promise<void>`

Initializes all game systems and prepares the engine for execution.

**Throws:**
- `InitializationError`: If system initialization fails
- `DependencyError`: If required dependencies are missing

**Example:**
```typescript
const engine = new GameEngine(container);
await engine.initialize();
console.log('Game engine ready!');
```

##### `async start(): Promise<void>`

Starts the game loop and begins game execution.

**Throws:**
- `StartupError`: If engine cannot start
- `StateError`: If engine is not initialized

**Example:**
```typescript
await engine.start();
// Game loop is now running
```

##### `update(deltaTime: number): void`

Updates all game systems for one frame.

**Parameters:**
- `deltaTime`: Time elapsed since last frame (in seconds)

**Example:**
```typescript
// Called automatically by game loop
// Manual usage:
engine.update(0.016); // 16ms = 60fps
```

##### `getStats(): PerformanceStats`

Retrieves current engine performance statistics.

**Returns:**
- `PerformanceStats`: Current performance metrics

**Example:**
```typescript
const stats = engine.getStats();
console.log(`FPS: ${stats.fps}, Memory: ${stats.memoryUsage.percentage}%`);
```

---

### **RenderSystem**

Advanced Three.js rendering system with device optimization and post-processing.

#### **Constructor**
```typescript
constructor(canvas: HTMLCanvasElement, config?: RenderConfig)
```

**Parameters:**
- `canvas`: HTML canvas element for rendering
- `config` *(optional)*: Rendering configuration
  - `enableShadows`: boolean - Enable shadow mapping (default: true)
  - `shadowMapSize`: number - Shadow map resolution (default: 2048)
  - `enablePostProcessing`: boolean - Enable post-processing (default: true)
  - `antialias`: boolean - Enable antialiasing (default: true)

#### **Methods**

##### `render(scene: Scene, camera: Camera): void`

Renders a scene with the specified camera.

**Parameters:**
- `scene`: Three.js scene to render
- `camera`: Camera to render from

**Example:**
```typescript
renderSystem.render(gameScene, playerCamera);
```

##### `setSize(width: number, height: number): void`

Updates the renderer size and aspect ratio.

**Parameters:**
- `width`: New width in pixels
- `height`: New height in pixels

**Example:**
```typescript
renderSystem.setSize(1920, 1080);
```

##### `enablePostProcessing(enabled: boolean): void`

Enables or disables post-processing effects.

**Parameters:**
- `enabled`: Whether to enable post-processing

**Example:**
```typescript
renderSystem.enablePostProcessing(true);
```

---

### **PhysicsSystem**

Mario 64-style physics engine with advanced collision detection.

#### **Constructor**
```typescript
constructor(config?: PhysicsConfig)
```

**Parameters:**
- `config` *(optional)*: Physics configuration
  - `gravity`: Vector3 - Gravity vector (default: [0, -9.81, 0])
  - `timeStep`: number - Physics time step (default: 1/60)
  - `enableCCD`: boolean - Continuous collision detection (default: true)

#### **Methods**

##### `addRigidBody(body: RigidBody): void`

Adds a rigid body to the physics simulation.

**Parameters:**
- `body`: Rigid body to add

**Example:**
```typescript
const playerBody = new RigidBody({
  mass: 1,
  shape: new BoxShape(1, 2, 1),
  position: [0, 10, 0]
});
physicsSystem.addRigidBody(playerBody);
```

##### `step(deltaTime: number): void`

Advances the physics simulation by one time step.

**Parameters:**
- `deltaTime`: Time step duration

**Example:**
```typescript
physicsSystem.step(1/60); // 60 FPS physics
```

##### `raycast(origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult`

Performs a raycast query in the physics world.

**Parameters:**
- `origin`: Ray starting point
- `direction`: Ray direction (normalized)
- `maxDistance`: Maximum ray distance

**Returns:**
- `RaycastResult`: Raycast hit information

**Example:**
```typescript
const hit = physicsSystem.raycast([0, 10, 0], [0, -1, 0], 20);
if (hit.hasHit) {
  console.log('Ground found at:', hit.point);
}
```

---

## 💻 **UI SYSTEM APIS**

### **GameUI**

Responsive game interface with screen management and animations.

#### **Constructor**
```typescript
constructor(container: HTMLElement, config?: UIConfig)
```

**Parameters:**
- `container`: Root HTML element for UI
- `config` *(optional)*: UI configuration
  - `enableAnimations`: boolean - Enable UI animations (default: true)
  - `animationDuration`: number - Default animation duration (default: 300)
  - `theme`: string - UI theme name (default: 'default')

#### **Methods**

##### `showScreen(screenName: string): Promise<void>`

Displays a specific UI screen with animation.

**Parameters:**
- `screenName`: Name of screen to show

**Returns:**
- `Promise<void>`: Resolves when animation completes

**Example:**
```typescript
await gameUI.showScreen('mainMenu');
console.log('Main menu displayed');
```

##### `updateScore(score: number, animate?: boolean): void`

Updates the score display with optional animation.

**Parameters:**
- `score`: New score value
- `animate` *(optional)*: Whether to animate the change (default: true)

**Example:**
```typescript
gameUI.updateScore(1500, true); // Animates from current to 1500
```

##### `showNotification(message: string, type?: NotificationType, duration?: number): string`

Displays a notification message.

**Parameters:**
- `message`: Notification text
- `type` *(optional)*: Notification type (default: 'info')
- `duration` *(optional)*: Display duration in ms (default: 5000)

**Returns:**
- `string`: Notification ID for dismissal

**Example:**
```typescript
const notificationId = gameUI.showNotification(
  'Achievement unlocked!', 
  'success', 
  3000
);
```

---

### **MobileControls**

Advanced touch control system with gesture recognition.

#### **Constructor**
```typescript
constructor(config?: MobileControlConfig)
```

**Parameters:**
- `config` *(optional)*: Control configuration
  - `joystickSize`: number - Virtual joystick size (default: 100)
  - `joystickDeadzone`: number - Deadzone radius (default: 0.1)
  - `enableHapticFeedback`: boolean - Enable vibration (default: true)
  - `opacity`: number - Control opacity (default: 0.7)

#### **Methods**

##### `setVisible(visible: boolean): void`

Shows or hides the mobile controls.

**Parameters:**
- `visible`: Whether controls should be visible

**Example:**
```typescript
mobileControls.setVisible(isMobileDevice());
```

##### `onInputChange(callback: InputCallback): void`

Registers callback for input changes.

**Parameters:**
- `callback`: Function called when input changes

**Example:**
```typescript
mobileControls.onInputChange((input) => {
  player.move(input.movement.x, input.movement.y);
  if (input.buttons.jump) {
    player.jump();
  }
});
```

---

## 🛡️ **SECURITY APIS**

### **InputValidator**

Comprehensive input validation and sanitization system.

#### **Constructor**
```typescript
constructor(config?: ValidationConfig)
```

**Parameters:**
- `config` *(optional)*: Validation configuration
  - `enableSanitization`: boolean - Auto-sanitize inputs (default: true)
  - `strictMode`: boolean - Strict validation rules (default: false)
  - `maxStringLength`: number - Maximum string length (default: 1000)

#### **Methods**

##### `validate(data: any, schema: ValidationSchema): ValidationResult`

Validates data against a schema.

**Parameters:**
- `data`: Data to validate
- `schema`: Validation schema

**Returns:**
- `ValidationResult`: Validation outcome with errors

**Example:**
```typescript
const result = validator.validate(userInput, {
  username: { type: 'string', minLength: 3, maxLength: 20 },
  email: { type: 'email', required: true },
  age: { type: 'number', min: 13, max: 120 }
});

if (result.isValid) {
  processUserData(result.data);
} else {
  console.error('Validation errors:', result.errors);
}
```

##### `sanitize(input: string): string`

Sanitizes a string input for security.

**Parameters:**
- `input`: String to sanitize

**Returns:**
- `string`: Sanitized string

**Example:**
```typescript
const safeInput = validator.sanitize(userInput);
```

---

### **AuthManager**

JWT-based authentication and authorization system.

#### **Constructor**
```typescript
constructor(config: AuthConfig)
```

**Parameters:**
- `config`: Authentication configuration
  - `jwtSecret`: string - JWT signing secret
  - `tokenExpiry`: string - Token expiration time
  - `refreshTokenExpiry`: string - Refresh token expiration
  - `issuer`: string - Token issuer

#### **Methods**

##### `async authenticate(credentials: Credentials): Promise<AuthResult>`

Authenticates user credentials.

**Parameters:**
- `credentials`: User login credentials
  - `username`: string
  - `password`: string

**Returns:**
- `Promise<AuthResult>`: Authentication result with tokens

**Example:**
```typescript
const authResult = await authManager.authenticate({
  username: 'player123',
  password: 'securePassword'
});

if (authResult.success) {
  localStorage.setItem('token', authResult.token);
}
```

##### `verifyToken(token: string): TokenValidation`

Verifies a JWT token.

**Parameters:**
- `token`: JWT token to verify

**Returns:**
- `TokenValidation`: Token validation result

**Example:**
```typescript
const validation = authManager.verifyToken(userToken);
if (validation.valid) {
  console.log('User ID:', validation.payload.userId);
}
```

---

## 📊 **PERFORMANCE APIS**

### **PerformanceMonitor**

Real-time performance monitoring with intelligent alerting.

#### **Constructor**
```typescript
constructor(config?: PerformanceConfig)
```

**Parameters:**
- `config` *(optional)*: Monitoring configuration
  - `enableRealTimeMonitoring`: boolean - Enable continuous monitoring
  - `samplingInterval`: number - Sample collection interval (default: 1000ms)
  - `thresholds`: PerformanceThresholds - Alert thresholds

#### **Methods**

##### `getStats(): IPerformanceStats`

Retrieves current performance statistics.

**Returns:**
- `IPerformanceStats`: Current performance metrics

**Example:**
```typescript
const stats = performanceMonitor.getStats();
console.log(`FPS: ${stats.fps}`);
console.log(`Memory: ${stats.memoryUsage.percentage}%`);
console.log(`Frame Time: ${stats.frameTime}ms`);
```

##### `startTimer(name: string): void`

Starts a custom performance timer.

**Parameters:**
- `name`: Timer identifier

**Example:**
```typescript
performanceMonitor.startTimer('level_load');
await loadLevel();
const duration = performanceMonitor.endTimer('level_load');
```

##### `on(event: string, callback: AlertCallback): Subscription`

Registers for performance alerts.

**Parameters:**
- `event`: Alert event name
- `callback`: Alert handler function

**Returns:**
- `Subscription`: Event subscription

**Example:**
```typescript
performanceMonitor.on('alertTriggered', (alert) => {
  if (alert.level === 'critical') {
    console.error('Critical performance issue:', alert.message);
    console.log('Suggestions:', alert.suggestions);
  }
});
```

---

## 🔧 **UTILITY APIS**

### **MathUtils**

Mathematical utility functions for game development.

#### **Static Methods**

##### `clamp(value: number, min: number, max: number): number`

Clamps a value between minimum and maximum bounds.

**Parameters:**
- `value`: Value to clamp
- `min`: Minimum value
- `max`: Maximum value

**Returns:**
- `number`: Clamped value

**Example:**
```typescript
const health = MathUtils.clamp(playerHealth, 0, 100);
```

##### `lerp(a: number, b: number, t: number): number`

Linear interpolation between two values.

**Parameters:**
- `a`: Start value
- `b`: End value  
- `t`: Interpolation factor (0-1)

**Returns:**
- `number`: Interpolated value

**Example:**
```typescript
const smoothPosition = MathUtils.lerp(currentX, targetX, 0.1);
```

##### `randomRange(min: number, max: number): number`

Generates random number within range.

**Parameters:**
- `min`: Minimum value
- `max`: Maximum value

**Returns:**
- `number`: Random value in range

**Example:**
```typescript
const spawnX = MathUtils.randomRange(-10, 10);
```

---

## 📈 **ANALYTICS APIS**

### **GameAnalytics**

Comprehensive game analytics and user behavior tracking.

#### **Constructor**
```typescript
constructor(config: AnalyticsConfig)
```

**Parameters:**
- `config`: Analytics configuration
  - `trackingId`: string - Analytics tracking ID
  - `enableUserTiming`: boolean - Track performance timing
  - `enableExceptionTracking`: boolean - Track errors
  - `sampleRate`: number - Sampling rate (0-1)

#### **Methods**

##### `trackEvent(event: GameEvent): void`

Tracks a game event.

**Parameters:**
- `event`: Game event data
  - `type`: string - Event type
  - `category`: string - Event category
  - `value`: number - Event value
  - `metadata`: object - Additional data

**Example:**
```typescript
gameAnalytics.trackEvent({
  type: 'level_completed',
  category: 'progression',
  value: levelNumber,
  metadata: { 
    duration: completionTime,
    score: finalScore,
    deaths: deathCount
  }
});
```

##### `trackPerformance(metrics: PerformanceMetrics): void`

Tracks performance metrics.

**Parameters:**
- `metrics`: Performance data
  - `fps`: number - Frame rate
  - `loadTime`: number - Loading duration
  - `memoryUsage`: number - Memory consumption

**Example:**
```typescript
gameAnalytics.trackPerformance({
  fps: 60,
  loadTime: 2500,
  memoryUsage: 150
});
```

---

## 🎯 **INTEGRATION EXAMPLES**

### **Complete Game Setup**

```typescript
// 1. Initialize container and register services
const container = new IoContainer();

container.register('logger', Logger);
container.register('eventEmitter', EventEmitter);
container.register('performanceMonitor', PerformanceMonitor);
container.register('renderSystem', RenderSystem, ['canvas']);
container.register('physicsSystem', PhysicsSystem);
container.register('inputSystem', InputSystem);
container.register('audioSystem', AudioSystem);
container.register('gameEngine', GameEngine, [
  'renderSystem', 'physicsSystem', 'inputSystem', 'audioSystem'
]);

// 2. Initialize and start game
const engine = await container.resolve('gameEngine');
await engine.initialize();
await engine.start();

// 3. Setup UI and controls
const gameUI = new GameUI(document.getElementById('ui-container'));
const mobileControls = new MobileControls({
  enableHapticFeedback: true
});

// 4. Setup analytics and monitoring
const analytics = new GameAnalytics({
  trackingId: 'GA-XXXX-X'
});

const performanceMonitor = await container.resolve('performanceMonitor');
performanceMonitor.on('alertTriggered', (alert) => {
  analytics.trackEvent({
    type: 'performance_alert',
    category: 'technical',
    value: alert.level === 'critical' ? 1 : 0,
    metadata: alert
  });
});

console.log('🎮 Game initialized successfully!');
```

### **Custom System Integration**

```typescript
// Create custom game system
class CustomGameSystem implements ILifecycle {
  constructor(
    private logger: ILogger,
    private eventEmitter: IEventEmitter,
    private performanceMonitor: IPerformanceMonitor
  ) {}
  
  async initialize(): Promise<void> {
    this.logger.info('Initializing custom system');
    
    // Setup performance monitoring
    this.performanceMonitor.startTimer('custom_system_init');
    
    // Initialize system components
    await this.setupComponents();
    
    const duration = this.performanceMonitor.endTimer('custom_system_init');
    this.logger.info(`Custom system initialized in ${duration}ms`);
    
    // Emit initialization complete event
    this.eventEmitter.emit('customSystemReady', { duration });
  }
  
  private async setupComponents(): Promise<void> {
    // Custom initialization logic
  }
}

// Register with container
container.register('customSystem', CustomGameSystem, [
  'logger', 'eventEmitter', 'performanceMonitor'
]);
```

---

## ⚠️ **ERROR HANDLING**

All API methods that can fail will throw specific error types:

- `InitializationError`: System initialization failures
- `ValidationError`: Input validation failures  
- `AuthenticationError`: Authentication/authorization failures
- `PerformanceError`: Performance threshold violations
- `NetworkError`: Network communication failures
- `ConfigurationError`: Configuration/setup errors

**Example Error Handling:**
```typescript
try {
  await gameEngine.initialize();
} catch (error) {
  if (error instanceof InitializationError) {
    logger.error('Game engine initialization failed', error);
    gameUI.showError('Failed to start game. Please refresh and try again.');
  } else {
    logger.error('Unexpected error during initialization', error);
    gameUI.showError('An unexpected error occurred.');
  }
}
```

---

## 📊 **PERFORMANCE CONSIDERATIONS**

- All async operations support cancellation tokens
- Event emitters support priority-based execution
- Performance monitoring has configurable sampling rates
- Memory management includes automatic cleanup
- Network requests include timeout and retry logic

---

*API Reference generated for RGB Light Cat v2.0 Enterprise Edition*
*Last updated: August 4, 2025*