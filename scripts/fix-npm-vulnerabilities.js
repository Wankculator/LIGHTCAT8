#!/usr/bin/env node

/**
 * Fix critical npm vulnerabilities
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Fixing NPM vulnerabilities...\n');

// Read package.json
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Update vulnerable packages
const updates = {
    // Critical vulnerabilities
    "cypress": "^14.5.3",
    
    // High vulnerabilities
    "nodemon": "^3.1.10",
    "live-server": "^1.2.0",
    
    // Other security updates
    "axios": "^1.7.0",
    "express": "^4.21.0",
    "ws": "^8.18.0"
};

// Apply updates to devDependencies
Object.entries(updates).forEach(([pkg, version]) => {
    if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
        console.log(`📦 Updating ${pkg} to ${version}`);
        packageJson.devDependencies[pkg] = version;
    } else if (packageJson.dependencies && packageJson.dependencies[pkg]) {
        console.log(`📦 Updating ${pkg} to ${version}`);
        packageJson.dependencies[pkg] = version;
    }
});

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('\n✅ Updated package.json');
console.log('\n⚠️  You need to run: npm install');
console.log('   to install the updated packages\n');