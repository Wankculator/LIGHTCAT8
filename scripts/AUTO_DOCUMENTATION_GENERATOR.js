#!/usr/bin/env node

/**
 * @fileoverview Automated Documentation Generator for RGB Light Cat
 * @description Scans codebase and generates comprehensive documentation automatically
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class DocumentationGenerator {
  constructor() {
    this.config = {
      sourceDir: path.join(__dirname, '..', 'src'),
      outputDir: path.join(__dirname, '..', 'docs', 'generated'),
      templateDir: path.join(__dirname, 'doc-templates'),
      ignorePatterns: [
        'node_modules',
        'dist',
        'build',
        '.git',
        'coverage',
        '*.test.ts',
        '*.spec.ts'
      ],
      fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
      outputFormats: ['markdown', 'html', 'json']
    };
    
    this.components = [];
    this.apis = [];
    this.services = [];
    this.types = [];
    this.hooks = [];
    this.utils = [];
  }

  async generate() {
    console.log('🚀 Starting Automated Documentation Generation...\n');
    
    try {
      // Ensure output directory exists
      await this.ensureDirectory(this.config.outputDir);
      
      // Step 1: Scan codebase
      console.log('📂 Scanning codebase...');
      await this.scanCodebase();
      
      // Step 2: Extract documentation
      console.log('📝 Extracting documentation...');
      await this.extractDocumentation();
      
      // Step 3: Generate documentation files
      console.log('📄 Generating documentation files...');
      await this.generateDocumentation();
      
      // Step 4: Generate index and navigation
      console.log('🗂️ Creating navigation structure...');
      await this.generateNavigation();
      
      // Step 5: Generate API reference
      console.log('📚 Generating API reference...');
      await this.generateAPIReference();
      
      // Step 6: Generate component catalog
      console.log('🎨 Creating component catalog...');
      await this.generateComponentCatalog();
      
      // Step 7: Generate architecture diagrams
      console.log('📐 Generating architecture diagrams...');
      await this.generateArchitectureDiagrams();
      
      // Step 8: Generate search index
      console.log('🔍 Building search index...');
      await this.generateSearchIndex();
      
      console.log('\n✅ Documentation generation complete!');
      console.log(`📁 Output directory: ${this.config.outputDir}`);
      
    } catch (error) {
      console.error('❌ Error generating documentation:', error);
      process.exit(1);
    }
  }

  async ensureDirectory(dir) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async scanCodebase() {
    const files = await this.getFiles(this.config.sourceDir);
    console.log(`  Found ${files.length} source files`);
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const parsed = this.parseFile(file, content);
      
      if (parsed) {
        // Categorize by type
        switch (parsed.type) {
          case 'component':
            this.components.push(parsed);
            break;
          case 'api':
            this.apis.push(parsed);
            break;
          case 'service':
            this.services.push(parsed);
            break;
          case 'type':
            this.types.push(parsed);
            break;
          case 'hook':
            this.hooks.push(parsed);
            break;
          case 'util':
            this.utils.push(parsed);
            break;
        }
      }
    }
  }

  async getFiles(dir, files = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!this.isIgnored(entry.name)) {
          await this.getFiles(fullPath, files);
        }
      } else if (entry.isFile()) {
        if (this.isSourceFile(entry.name) && !this.isIgnored(entry.name)) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  isIgnored(name) {
    return this.config.ignorePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(name);
      }
      return name === pattern;
    });
  }

  isSourceFile(name) {
    return this.config.fileExtensions.some(ext => name.endsWith(ext));
  }

  parseFile(filePath, content) {
    const relativePath = path.relative(this.config.sourceDir, filePath);
    const fileName = path.basename(filePath);
    
    // Extract JSDoc comments
    const jsdocPattern = /\/\*\*[\s\S]*?\*\//g;
    const jsdocs = content.match(jsdocPattern) || [];
    
    // Determine file type
    const type = this.determineFileType(filePath, content);
    if (!type) return null;
    
    // Extract exports
    const exports = this.extractExports(content);
    
    // Extract interfaces and types
    const interfaces = this.extractInterfaces(content);
    const typeAliases = this.extractTypeAliases(content);
    
    // Extract functions
    const functions = this.extractFunctions(content);
    
    // Extract classes
    const classes = this.extractClasses(content);
    
    return {
      filePath: relativePath,
      fileName,
      type,
      jsdocs,
      exports,
      interfaces,
      typeAliases,
      functions,
      classes,
      content,
      metadata: {
        lines: content.split('\n').length,
        size: Buffer.byteLength(content, 'utf8'),
        lastModified: new Date().toISOString()
      }
    };
  }

  determineFileType(filePath, content) {
    if (filePath.includes('/components/') || content.includes('React.FC')) {
      return 'component';
    } else if (filePath.includes('/api/') || filePath.includes('Controller')) {
      return 'api';
    } else if (filePath.includes('/services/') || filePath.includes('Service')) {
      return 'service';
    } else if (filePath.includes('/types/') || filePath.includes('interface')) {
      return 'type';
    } else if (filePath.includes('/hooks/') || content.includes('use')) {
      return 'hook';
    } else if (filePath.includes('/utils/') || filePath.includes('/helpers/')) {
      return 'util';
    }
    return null;
  }

  extractExports(content) {
    const exports = [];
    
    // Named exports
    const namedExportPattern = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
    let match;
    while (match = namedExportPattern.exec(content)) {
      exports.push({ name: match[1], type: 'named' });
    }
    
    // Default exports
    if (content.includes('export default')) {
      const defaultExportPattern = /export\s+default\s+(\w+)/;
      const defaultMatch = content.match(defaultExportPattern);
      if (defaultMatch) {
        exports.push({ name: defaultMatch[1], type: 'default' });
      }
    }
    
    return exports;
  }

  extractInterfaces(content) {
    const interfaces = [];
    const interfacePattern = /interface\s+(\w+)(?:<[^>]+>)?\s*{([^}]+)}/g;
    let match;
    
    while (match = interfacePattern.exec(content)) {
      const name = match[1];
      const body = match[2];
      const properties = this.parseInterfaceProperties(body);
      
      interfaces.push({
        name,
        properties,
        raw: match[0]
      });
    }
    
    return interfaces;
  }

  parseInterfaceProperties(body) {
    const properties = [];
    const propPattern = /(\w+)(\?)?:\s*([^;]+);/g;
    let match;
    
    while (match = propPattern.exec(body)) {
      properties.push({
        name: match[1],
        optional: !!match[2],
        type: match[3].trim()
      });
    }
    
    return properties;
  }

  extractTypeAliases(content) {
    const types = [];
    const typePattern = /type\s+(\w+)(?:<[^>]+>)?\s*=\s*([^;]+);/g;
    let match;
    
    while (match = typePattern.exec(content)) {
      types.push({
        name: match[1],
        definition: match[2].trim()
      });
    }
    
    return types;
  }

  extractFunctions(content) {
    const functions = [];
    const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?\s*{/g;
    let match;
    
    while (match = functionPattern.exec(content)) {
      const name = match[1];
      const params = match[2];
      const returnType = match[3]?.trim();
      
      // Find associated JSDoc
      const jsdoc = this.findAssociatedJSDoc(content, match.index);
      
      functions.push({
        name,
        params: this.parseParams(params),
        returnType,
        jsdoc,
        isAsync: match[0].includes('async'),
        isExported: match[0].includes('export')
      });
    }
    
    return functions;
  }

  parseParams(paramsString) {
    if (!paramsString.trim()) return [];
    
    return paramsString.split(',').map(param => {
      const [name, type] = param.split(':').map(s => s.trim());
      return { name, type };
    });
  }

  extractClasses(content) {
    const classes = [];
    const classPattern = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/g;
    let match;
    
    while (match = classPattern.exec(content)) {
      const name = match[1];
      const extends_ = match[2];
      
      // Extract class body
      const startIndex = match.index + match[0].length;
      const classBody = this.extractClassBody(content, startIndex);
      
      // Extract methods
      const methods = this.extractClassMethods(classBody);
      
      classes.push({
        name,
        extends: extends_,
        methods,
        isExported: match[0].includes('export')
      });
    }
    
    return classes;
  }

  extractClassBody(content, startIndex) {
    let braceCount = 1;
    let i = startIndex;
    
    while (braceCount > 0 && i < content.length) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    
    return content.substring(startIndex, i - 1);
  }

  extractClassMethods(classBody) {
    const methods = [];
    const methodPattern = /(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?\s*{/g;
    let match;
    
    while (match = methodPattern.exec(classBody)) {
      if (match[1] !== 'constructor') {
        methods.push({
          name: match[1],
          params: this.parseParams(match[2]),
          returnType: match[3]?.trim(),
          isAsync: match[0].includes('async')
        });
      }
    }
    
    return methods;
  }

  findAssociatedJSDoc(content, index) {
    const before = content.substring(0, index);
    const jsdocPattern = /\/\*\*([\s\S]*?)\*\/\s*$/;
    const match = before.match(jsdocPattern);
    
    if (match) {
      return this.parseJSDoc(match[0]);
    }
    
    return null;
  }

  parseJSDoc(jsdoc) {
    const lines = jsdoc.split('\n').map(line => line.trim());
    const parsed = {
      description: '',
      params: [],
      returns: null,
      examples: [],
      tags: {}
    };
    
    let currentSection = 'description';
    
    for (const line of lines) {
      if (line.startsWith('* @param')) {
        const paramMatch = line.match(/@param\s+{([^}]+)}\s+(\w+)\s*(.*)/);
        if (paramMatch) {
          parsed.params.push({
            type: paramMatch[1],
            name: paramMatch[2],
            description: paramMatch[3]
          });
        }
      } else if (line.startsWith('* @returns') || line.startsWith('* @return')) {
        const returnMatch = line.match(/@returns?\s+{([^}]+)}\s*(.*)/);
        if (returnMatch) {
          parsed.returns = {
            type: returnMatch[1],
            description: returnMatch[2]
          };
        }
      } else if (line.startsWith('* @example')) {
        currentSection = 'example';
      } else if (line.startsWith('* @')) {
        const tagMatch = line.match(/@(\w+)\s+(.*)/);
        if (tagMatch) {
          parsed.tags[tagMatch[1]] = tagMatch[2];
        }
      } else if (line.startsWith('*') && !line.startsWith('/**') && !line.startsWith('*/')) {
        const content = line.substring(1).trim();
        if (currentSection === 'example') {
          parsed.examples.push(content);
        } else if (content) {
          parsed.description += content + ' ';
        }
      }
    }
    
    parsed.description = parsed.description.trim();
    return parsed;
  }

  async extractDocumentation() {
    console.log(`  Components: ${this.components.length}`);
    console.log(`  APIs: ${this.apis.length}`);
    console.log(`  Services: ${this.services.length}`);
    console.log(`  Types: ${this.types.length}`);
    console.log(`  Hooks: ${this.hooks.length}`);
    console.log(`  Utils: ${this.utils.length}`);
  }

  async generateDocumentation() {
    // Generate component documentation
    if (this.components.length > 0) {
      await this.generateComponentDocs();
    }
    
    // Generate API documentation
    if (this.apis.length > 0) {
      await this.generateAPIDocs();
    }
    
    // Generate service documentation
    if (this.services.length > 0) {
      await this.generateServiceDocs();
    }
    
    // Generate type documentation
    if (this.types.length > 0) {
      await this.generateTypeDocs();
    }
    
    // Generate hook documentation
    if (this.hooks.length > 0) {
      await this.generateHookDocs();
    }
    
    // Generate utility documentation
    if (this.utils.length > 0) {
      await this.generateUtilDocs();
    }
  }

  async generateComponentDocs() {
    const outputPath = path.join(this.config.outputDir, 'components');
    await this.ensureDirectory(outputPath);
    
    // Create index
    let indexContent = '# Component Documentation\n\n';
    indexContent += 'This section contains documentation for all React components.\n\n';
    indexContent += '## Component List\n\n';
    
    for (const component of this.components) {
      const componentName = this.extractComponentName(component);
      indexContent += `- [${componentName}](./${componentName}.md)\n`;
      
      // Generate individual component doc
      const docContent = this.generateComponentMarkdown(component);
      await fs.writeFile(
        path.join(outputPath, `${componentName}.md`),
        docContent
      );
    }
    
    await fs.writeFile(path.join(outputPath, 'README.md'), indexContent);
  }

  extractComponentName(component) {
    // Try to find the main component export
    const defaultExport = component.exports.find(e => e.type === 'default');
    if (defaultExport) return defaultExport.name;
    
    // Otherwise use the first named export
    if (component.exports.length > 0) return component.exports[0].name;
    
    // Fallback to filename
    return path.basename(component.fileName, path.extname(component.fileName));
  }

  generateComponentMarkdown(component) {
    const componentName = this.extractComponentName(component);
    let content = `# ${componentName}\n\n`;
    
    // Add file info
    content += `**File:** \`${component.filePath}\`\n\n`;
    
    // Add description from JSDoc
    const mainJSDoc = component.jsdocs[0];
    if (mainJSDoc) {
      const parsed = this.parseJSDoc(mainJSDoc);
      if (parsed.description) {
        content += `${parsed.description}\n\n`;
      }
    }
    
    // Props interface
    const propsInterface = component.interfaces.find(i => 
      i.name.endsWith('Props') || i.name === `${componentName}Props`
    );
    
    if (propsInterface) {
      content += '## Props\n\n';
      content += '| Prop | Type | Required | Description |\n';
      content += '|------|------|----------|-------------|\n';
      
      for (const prop of propsInterface.properties) {
        content += `| ${prop.name} | \`${prop.type}\` | ${prop.optional ? 'No' : 'Yes'} | - |\n`;
      }
      content += '\n';
    }
    
    // Usage example
    content += '## Usage\n\n';
    content += '```tsx\n';
    content += `import { ${componentName} } from '${component.filePath.replace('.tsx', '')}';\n\n`;
    content += `function Example() {\n`;
    content += `  return <${componentName} />;\n`;
    content += `}\n`;
    content += '```\n\n';
    
    // Methods
    if (component.functions.length > 0) {
      content += '## Methods\n\n';
      for (const func of component.functions) {
        content += `### ${func.name}\n\n`;
        if (func.jsdoc?.description) {
          content += `${func.jsdoc.description}\n\n`;
        }
        content += `**Parameters:**\n`;
        for (const param of func.params) {
          content += `- \`${param.name}\`: ${param.type || 'any'}\n`;
        }
        if (func.returnType) {
          content += `\n**Returns:** \`${func.returnType}\`\n`;
        }
        content += '\n';
      }
    }
    
    return content;
  }

  async generateAPIDocs() {
    const outputPath = path.join(this.config.outputDir, 'api');
    await this.ensureDirectory(outputPath);
    
    let indexContent = '# API Documentation\n\n';
    indexContent += 'This section contains documentation for all API endpoints.\n\n';
    indexContent += '## Endpoints\n\n';
    
    // Group by controller
    const grouped = {};
    for (const api of this.apis) {
      const controller = path.dirname(api.filePath).split('/').pop();
      if (!grouped[controller]) grouped[controller] = [];
      grouped[controller].push(api);
    }
    
    for (const [controller, apis] of Object.entries(grouped)) {
      indexContent += `### ${controller}\n\n`;
      
      for (const api of apis) {
        // Extract endpoint information
        const endpoints = this.extractEndpoints(api);
        for (const endpoint of endpoints) {
          indexContent += `- \`${endpoint.method} ${endpoint.path}\` - ${endpoint.description || 'No description'}\n`;
        }
      }
      indexContent += '\n';
    }
    
    await fs.writeFile(path.join(outputPath, 'README.md'), indexContent);
  }

  extractEndpoints(api) {
    const endpoints = [];
    const content = api.content;
    
    // Look for Express route definitions
    const routePattern = /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;
    let match;
    
    while (match = routePattern.exec(content)) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
        description: ''
      });
    }
    
    return endpoints;
  }

  async generateServiceDocs() {
    const outputPath = path.join(this.config.outputDir, 'services');
    await this.ensureDirectory(outputPath);
    
    let indexContent = '# Service Documentation\n\n';
    indexContent += 'This section contains documentation for all service classes.\n\n';
    
    for (const service of this.services) {
      const serviceName = service.classes[0]?.name || 'UnknownService';
      indexContent += `- [${serviceName}](./${serviceName}.md)\n`;
      
      // Generate individual service doc
      const docContent = this.generateServiceMarkdown(service);
      await fs.writeFile(
        path.join(outputPath, `${serviceName}.md`),
        docContent
      );
    }
    
    await fs.writeFile(path.join(outputPath, 'README.md'), indexContent);
  }

  generateServiceMarkdown(service) {
    const serviceClass = service.classes[0];
    if (!serviceClass) return '# Service\n\nNo class found in this service file.\n';
    
    let content = `# ${serviceClass.name}\n\n`;
    content += `**File:** \`${service.filePath}\`\n\n`;
    
    if (serviceClass.extends) {
      content += `**Extends:** \`${serviceClass.extends}\`\n\n`;
    }
    
    // Methods
    content += '## Methods\n\n';
    for (const method of serviceClass.methods) {
      content += `### ${method.name}\n\n`;
      
      if (method.isAsync) {
        content += '**Async:** Yes\n\n';
      }
      
      content += '**Parameters:**\n';
      if (method.params.length === 0) {
        content += '- None\n';
      } else {
        for (const param of method.params) {
          content += `- \`${param.name}\`: ${param.type || 'any'}\n`;
        }
      }
      
      if (method.returnType) {
        content += `\n**Returns:** \`${method.returnType}\`\n`;
      }
      
      content += '\n---\n\n';
    }
    
    return content;
  }

  async generateTypeDocs() {
    const outputPath = path.join(this.config.outputDir, 'types');
    await this.ensureDirectory(outputPath);
    
    let content = '# Type Definitions\n\n';
    content += 'This section contains all TypeScript type definitions and interfaces.\n\n';
    
    // Interfaces
    content += '## Interfaces\n\n';
    for (const typeFile of this.types) {
      for (const interface_ of typeFile.interfaces) {
        content += `### ${interface_.name}\n\n`;
        content += `**File:** \`${typeFile.filePath}\`\n\n`;
        content += '```typescript\n';
        content += interface_.raw + '\n';
        content += '```\n\n';
      }
    }
    
    // Type Aliases
    content += '## Type Aliases\n\n';
    for (const typeFile of this.types) {
      for (const type of typeFile.typeAliases) {
        content += `### ${type.name}\n\n`;
        content += `**File:** \`${typeFile.filePath}\`\n\n`;
        content += '```typescript\n';
        content += `type ${type.name} = ${type.definition};\n`;
        content += '```\n\n';
      }
    }
    
    await fs.writeFile(path.join(outputPath, 'README.md'), content);
  }

  async generateHookDocs() {
    const outputPath = path.join(this.config.outputDir, 'hooks');
    await this.ensureDirectory(outputPath);
    
    let content = '# React Hooks Documentation\n\n';
    content += 'This section contains documentation for all custom React hooks.\n\n';
    
    for (const hook of this.hooks) {
      const hookName = hook.functions.find(f => f.name.startsWith('use'))?.name || 'unknown';
      content += `## ${hookName}\n\n`;
      content += `**File:** \`${hook.filePath}\`\n\n`;
      
      const hookFunc = hook.functions.find(f => f.name === hookName);
      if (hookFunc) {
        if (hookFunc.jsdoc?.description) {
          content += hookFunc.jsdoc.description + '\n\n';
        }
        
        content += '### Usage\n\n';
        content += '```typescript\n';
        content += `const result = ${hookName}(`;
        content += hookFunc.params.map(p => p.name).join(', ');
        content += ');\n';
        content += '```\n\n';
        
        if (hookFunc.params.length > 0) {
          content += '### Parameters\n\n';
          for (const param of hookFunc.params) {
            content += `- \`${param.name}\`: ${param.type || 'any'}\n`;
          }
          content += '\n';
        }
        
        if (hookFunc.returnType) {
          content += `### Returns\n\n\`${hookFunc.returnType}\`\n\n`;
        }
      }
      
      content += '---\n\n';
    }
    
    await fs.writeFile(path.join(outputPath, 'README.md'), content);
  }

  async generateUtilDocs() {
    const outputPath = path.join(this.config.outputDir, 'utilities');
    await this.ensureDirectory(outputPath);
    
    let content = '# Utility Functions Documentation\n\n';
    content += 'This section contains documentation for all utility functions.\n\n';
    
    // Group by file
    for (const util of this.utils) {
      const fileName = path.basename(util.fileName, path.extname(util.fileName));
      content += `## ${fileName}\n\n`;
      content += `**File:** \`${util.filePath}\`\n\n`;
      
      for (const func of util.functions) {
        if (func.isExported) {
          content += `### ${func.name}\n\n`;
          
          if (func.jsdoc?.description) {
            content += func.jsdoc.description + '\n\n';
          }
          
          content += '**Signature:**\n```typescript\n';
          content += `${func.isAsync ? 'async ' : ''}function ${func.name}(`;
          content += func.params.map(p => `${p.name}: ${p.type || 'any'}`).join(', ');
          content += `)${func.returnType ? `: ${func.returnType}` : ''}\n`;
          content += '```\n\n';
          
          if (func.jsdoc?.examples.length > 0) {
            content += '**Example:**\n```typescript\n';
            content += func.jsdoc.examples.join('\n');
            content += '\n```\n\n';
          }
        }
      }
      
      content += '---\n\n';
    }
    
    await fs.writeFile(path.join(outputPath, 'README.md'), content);
  }

  async generateNavigation() {
    const navContent = {
      title: 'RGB Light Cat Documentation',
      version: '1.0.0',
      sections: [
        {
          title: 'Getting Started',
          items: [
            { title: 'Installation', path: '/installation' },
            { title: 'Quick Start', path: '/quick-start' },
            { title: 'Configuration', path: '/configuration' }
          ]
        },
        {
          title: 'Components',
          path: '/components',
          items: this.components.map(c => ({
            title: this.extractComponentName(c),
            path: `/components/${this.extractComponentName(c)}`
          }))
        },
        {
          title: 'API Reference',
          path: '/api',
          items: []
        },
        {
          title: 'Services',
          path: '/services',
          items: this.services.map(s => ({
            title: s.classes[0]?.name || 'Service',
            path: `/services/${s.classes[0]?.name || 'service'}`
          }))
        },
        {
          title: 'Types',
          path: '/types',
          items: []
        },
        {
          title: 'Hooks',
          path: '/hooks',
          items: []
        },
        {
          title: 'Utilities',
          path: '/utilities',
          items: []
        }
      ]
    };
    
    await fs.writeFile(
      path.join(this.config.outputDir, 'navigation.json'),
      JSON.stringify(navContent, null, 2)
    );
  }

  async generateAPIReference() {
    const apiRef = {
      openapi: '3.0.0',
      info: {
        title: 'RGB Light Cat API',
        version: '1.0.0',
        description: 'Complete API reference for RGB Light Cat'
      },
      servers: [
        {
          url: 'http://localhost:8082',
          description: 'Development server'
        },
        {
          url: 'https://rgblightcat.com',
          description: 'Production server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };
    
    // Extract API paths from controllers
    for (const api of this.apis) {
      const endpoints = this.extractEndpoints(api);
      for (const endpoint of endpoints) {
        if (!apiRef.paths[endpoint.path]) {
          apiRef.paths[endpoint.path] = {};
        }
        apiRef.paths[endpoint.path][endpoint.method.toLowerCase()] = {
          summary: endpoint.description,
          responses: {
            '200': {
              description: 'Success'
            }
          }
        };
      }
    }
    
    await fs.writeFile(
      path.join(this.config.outputDir, 'openapi.json'),
      JSON.stringify(apiRef, null, 2)
    );
  }

  async generateComponentCatalog() {
    const catalog = {
      name: 'RGB Light Cat Component Library',
      version: '1.0.0',
      components: []
    };
    
    for (const component of this.components) {
      const componentName = this.extractComponentName(component);
      const propsInterface = component.interfaces.find(i => 
        i.name.endsWith('Props') || i.name === `${componentName}Props`
      );
      
      catalog.components.push({
        name: componentName,
        category: this.categorizeComponent(component.filePath),
        filePath: component.filePath,
        props: propsInterface?.properties || [],
        hasStory: false, // Would check for .stories.tsx file
        hasTests: false, // Would check for .test.tsx file
        examples: []
      });
    }
    
    await fs.writeFile(
      path.join(this.config.outputDir, 'component-catalog.json'),
      JSON.stringify(catalog, null, 2)
    );
  }

  categorizeComponent(filePath) {
    if (filePath.includes('/atoms/')) return 'Atoms';
    if (filePath.includes('/molecules/')) return 'Molecules';
    if (filePath.includes('/organisms/')) return 'Organisms';
    if (filePath.includes('/templates/')) return 'Templates';
    if (filePath.includes('/pages/')) return 'Pages';
    return 'Other';
  }

  async generateArchitectureDiagrams() {
    const mermaidContent = `# Architecture Diagrams

## System Overview

\`\`\`mermaid
graph TB
    subgraph "Frontend"
        UI[React UI]
        State[State Management]
        API[API Client]
    end
    
    subgraph "Backend"
        Server[Express Server]
        Auth[Auth Service]
        Payment[Payment Service]
        DB[(Database)]
    end
    
    subgraph "External"
        Lightning[Lightning Network]
        RGB[RGB Protocol]
    end
    
    UI --> State
    State --> API
    API --> Server
    Server --> Auth
    Server --> Payment
    Server --> DB
    Payment --> Lightning
    Payment --> RGB
\`\`\`

## Component Hierarchy

\`\`\`mermaid
graph TD
    App[App]
    App --> Layout[Layout]
    Layout --> Header[Header]
    Layout --> Main[Main]
    Layout --> Footer[Footer]
    
    Main --> Router[Router]
    Router --> Home[HomePage]
    Router --> Game[GamePage]
    Router --> Purchase[PurchasePage]
    Router --> Profile[ProfilePage]
\`\`\`

## Data Flow

\`\`\`mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant Server
    participant DB
    
    User->>UI: Action
    UI->>API: Request
    API->>Server: HTTP Request
    Server->>DB: Query
    DB-->>Server: Result
    Server-->>API: Response
    API-->>UI: Data
    UI-->>User: Update View
\`\`\`
`;
    
    await fs.writeFile(
      path.join(this.config.outputDir, 'architecture.md'),
      mermaidContent
    );
  }

  async generateSearchIndex() {
    const searchIndex = {
      version: 1,
      fields: ['title', 'content', 'category'],
      documents: []
    };
    
    // Index components
    for (const component of this.components) {
      searchIndex.documents.push({
        id: `component-${this.extractComponentName(component)}`,
        title: this.extractComponentName(component),
        category: 'Components',
        content: component.jsdocs.join(' '),
        path: `/components/${this.extractComponentName(component)}`
      });
    }
    
    // Index services
    for (const service of this.services) {
      const serviceName = service.classes[0]?.name || 'Service';
      searchIndex.documents.push({
        id: `service-${serviceName}`,
        title: serviceName,
        category: 'Services',
        content: service.jsdocs.join(' '),
        path: `/services/${serviceName}`
      });
    }
    
    // Index types
    for (const typeFile of this.types) {
      for (const interface_ of typeFile.interfaces) {
        searchIndex.documents.push({
          id: `type-${interface_.name}`,
          title: interface_.name,
          category: 'Types',
          content: interface_.raw,
          path: '/types'
        });
      }
    }
    
    await fs.writeFile(
      path.join(this.config.outputDir, 'search-index.json'),
      JSON.stringify(searchIndex, null, 2)
    );
  }
}

// Run the generator
if (require.main === module) {
  const generator = new DocumentationGenerator();
  generator.generate();
}

module.exports = DocumentationGenerator;