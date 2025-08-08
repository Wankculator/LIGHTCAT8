# Multi-Agent Setup for LIGHTCAT Project

## Overview
Claude Code supports creating specialized agents that work together on complex tasks. This setup allows parallel processing and specialized expertise.

## Installation & Setup

### 1. Install Claude Code (if not already installed)
```bash
npm install -g @anthropic-ai/claude-code
```

### 2. Authenticate
```bash
claude login
```

### 3. Create Agent Directory Structure
```
.claude/
└── agents/
    ├── software-engineer.md    # Implements features
    ├── code-reviewer.md       # Reviews code quality
    ├── security-reviewer.md   # Security audit
    ├── ui-specialist.md       # Mobile UI/UX
    └── devops-engineer.md     # Deployment specialist
```

## Agent Creation Commands

### Using Claude Code CLI:
```bash
# Start Claude Code
claude

# Create new agent
/agents

# Select "Create new agent"
# Choose location: .claude/agents/ (project-specific)
# Describe the agent's role
# Select tools access
```

## Example Multi-Agent Workflow

### Sequential Workflow:
```bash
# 1. Implement feature
"Implement number formatting for mobile using software-engineer agent"

# 2. Review code
"Review the number formatting implementation using code-reviewer agent"

# 3. Security check
"Check for security issues in number formatting using security-reviewer agent"

# 4. Deploy
"Deploy the approved changes using devops-engineer agent"
```

### Parallel Workflow:
```bash
# Run multiple agents simultaneously
"Analyze mobile UI issues using ui-specialist, 
 check security vulnerabilities using security-reviewer,
 and optimize performance using software-engineer
 - all in parallel"
```

## Agent Definitions

### Software Engineer Agent
- **Role**: Implement features and fix bugs
- **Tools**: All (read, write, execute)
- **Focus**: Code quality, patterns, performance

### Code Reviewer Agent
- **Role**: Review code for quality and standards
- **Tools**: Read-only
- **Focus**: Best practices, readability, maintainability

### Security Reviewer Agent
- **Role**: Identify security vulnerabilities
- **Tools**: Read-only
- **Focus**: Payment security, crypto operations, input validation

### UI Specialist Agent
- **Role**: Mobile UI/UX optimization
- **Tools**: Read, write (CSS/JS only)
- **Focus**: Responsive design, touch targets, performance

### DevOps Engineer Agent
- **Role**: Deployment and infrastructure
- **Tools**: Execute, file operations
- **Focus**: CI/CD, server config, monitoring

## Best Practices

1. **Task Decomposition**: Break complex tasks into agent-specific subtasks
2. **Clear Communication**: Provide specific context to each agent
3. **Validation Chain**: Engineer → Reviewer → Security → Deploy
4. **Parallel Processing**: Use multiple agents for independent tasks
5. **Documentation**: Each agent should document their changes

## Example Commands for LIGHTCAT

### Fix Mobile UI:
```
"Deploy ui-specialist to fix overlapping elements in game.html,
 then have code-reviewer validate the changes,
 finally deploy using devops-engineer"
```

### Security Audit:
```
"Run security-reviewer on all payment flows,
 software-engineer to fix any issues found,
 code-reviewer to validate fixes"
```

### Full Feature Implementation:
```
"Implement token purchase limit using software-engineer,
 review with code-reviewer for quality,
 security-reviewer for payment validation,
 ui-specialist for mobile experience,
 then deploy with devops-engineer"
```

## Advantages

1. **Parallel Processing**: Multiple agents work simultaneously
2. **Specialized Expertise**: Each agent focuses on their domain
3. **Quality Assurance**: Built-in review process
4. **Faster Development**: Reduced context switching
5. **Better Documentation**: Each agent documents their work

## Current LIGHTCAT Agents

We've created:
- ✅ software-engineer.md
- ✅ code-reviewer.md  
- ✅ security-reviewer.md

Still needed:
- ui-specialist.md
- devops-engineer.md
- performance-optimizer.md
- documentation-writer.md