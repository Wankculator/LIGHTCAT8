#!/usr/bin/env node

/**
 * Context7 - Advanced Context Management MCP
 * Analyzes code relationships, dependencies, and impact of changes
 */

const fs = require('fs');
const path = require('path');

console.log('🧠 Context7 - Advanced Context Analysis');
console.log('=====================================\n');

const issues = [];
const dependencies = new Map();
const codeRelationships = [];

// Analyze file dependencies
function analyzeDependencies() {
    console.log('📊 Analyzing Dependencies...');
    
    const files = getAllFiles('../client', '.js')
        .concat(getAllFiles('../server', '.js'));
    
    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const imports = extractImports(content);
        dependencies.set(file, imports);
        
        // Check for circular dependencies
        checkCircularDependencies(file, imports);
    });
    
    console.log(`✅ Analyzed ${files.length} files`);
    console.log(`📦 Found ${dependencies.size} modules with dependencies\n`);
}

// Extract imports from file
function extractImports(content) {
    const imports = [];
    const requireRegex = /require\(['"](.+?)['"]\)/g;
    const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
    
    let match;
    while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }
    while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }
    
    return imports;
}

// Check for circular dependencies
function checkCircularDependencies(file, imports, visited = new Set()) {
    if (visited.has(file)) {
        issues.push({
            type: 'circular-dependency',
            severity: 'high',
            file: file,
            message: `Circular dependency detected: ${Array.from(visited).join(' -> ')} -> ${file}`
        });
        return;
    }
    
    visited.add(file);
    imports.forEach(imp => {
        const resolvedPath = resolveImportPath(file, imp);
        if (dependencies.has(resolvedPath)) {
            checkCircularDependencies(resolvedPath, dependencies.get(resolvedPath), new Set(visited));
        }
    });
}

// Analyze code relationships
function analyzeCodeRelationships() {
    console.log('🔗 Analyzing Code Relationships...');
    
    // Check RGB payment flow dependencies
    const rgbFiles = [
        '../server/controllers/rgbPaymentController.js',
        '../server/services/rgbService.js',
        '../server/services/lightningService.js',
        '../client/index.html'
    ];
    
    rgbFiles.forEach(file => {
        if (fs.existsSync(path.join(__dirname, file))) {
            const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
            
            // Check for critical patterns
            if (file.includes('rgbPaymentController')) {
                if (!content.includes('rgb:utxob:')) {
                    issues.push({
                        type: 'missing-pattern',
                        severity: 'critical',
                        file: file,
                        message: 'RGB invoice validation pattern missing'
                    });
                }
            }
            
            codeRelationships.push({
                file: file,
                type: 'payment-critical',
                dependencies: dependencies.get(file) || []
            });
        }
    });
    
    console.log(`✅ Analyzed ${codeRelationships.length} critical relationships\n`);
}

// Analyze impact of changes
function analyzeImpact() {
    console.log('💥 Analyzing Change Impact...');
    
    // Find files that import critical modules
    const criticalModules = [
        'rgbService',
        'lightningService',
        'rgbPaymentController'
    ];
    
    const impactMap = new Map();
    
    dependencies.forEach((imports, file) => {
        imports.forEach(imp => {
            criticalModules.forEach(critical => {
                if (imp.includes(critical)) {
                    if (!impactMap.has(critical)) {
                        impactMap.set(critical, []);
                    }
                    impactMap.get(critical).push(file);
                }
            });
        });
    });
    
    impactMap.forEach((files, module) => {
        console.log(`📍 ${module}: impacts ${files.length} files`);
    });
    
    console.log('');
}

// Helper functions
function getAllFiles(dir, ext) {
    const files = [];
    const baseDir = path.join(__dirname, dir);
    
    if (!fs.existsSync(baseDir)) return files;
    
    function traverse(currentDir) {
        const items = fs.readdirSync(currentDir);
        items.forEach(item => {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.includes('node_modules')) {
                traverse(fullPath);
            } else if (stat.isFile() && item.endsWith(ext)) {
                files.push(fullPath);
            }
        });
    }
    
    traverse(baseDir);
    return files;
}

function resolveImportPath(fromFile, importPath) {
    if (importPath.startsWith('.')) {
        return path.resolve(path.dirname(fromFile), importPath);
    }
    return importPath;
}

// Run analysis
analyzeDependencies();
analyzeCodeRelationships();
analyzeImpact();

// Report results
console.log('============================================');
console.log('📊 CONTEXT7 ANALYSIS SUMMARY');
console.log('============================================');
console.log(`✅ Dependencies Analyzed: ${dependencies.size}`);
console.log(`🔗 Relationships Found: ${codeRelationships.length}`);
console.log(`⚠️  Issues Found: ${issues.length}`);

if (issues.length > 0) {
    console.log('\n⚠️  CRITICAL ISSUES:');
    issues.forEach(issue => {
        console.log(`   • [${issue.severity.toUpperCase()}] ${issue.file}: ${issue.message}`);
    });
}

// Recommendations
console.log('\n💡 RECOMMENDATIONS:');
console.log('1. Always run Context7 before modifying payment flows');
console.log('2. Check dependency impact before major refactors');
console.log('3. Monitor circular dependencies regularly');
console.log('4. Keep critical modules isolated with clear interfaces');

// Exit with error if critical issues found
const criticalCount = issues.filter(i => i.severity === 'critical').length;
if (criticalCount > 0) {
    console.log(`\n❌ ${criticalCount} critical issues found!`);
    process.exit(1);
} else {
    console.log('\n✅ No critical issues found');
    process.exit(0);
}