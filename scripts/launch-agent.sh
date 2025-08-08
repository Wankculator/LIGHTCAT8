#!/bin/bash

# LIGHTCAT Agent Launcher Script - Enhanced for 28 Agents
# Usage: ./launch-agent.sh [agent-type]

AGENT_TYPE=${1:-menu}
PROJECT_ROOT="/mnt/c/Users/sk84l/Downloads/RGB LIGHT CAT/litecat-website"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🤖 LIGHTCAT Agent Launcher v2.0${NC}"
echo -e "${YELLOW}28 Specialized Agents Ready${NC}"
echo "================================"

# Function to launch specific agent
launch_agent() {
    local agent_type=$1
    local agent_name=$2
    local template_file="${PROJECT_ROOT}/agent-templates/${agent_type}.md"
    
    if [ ! -f "$template_file" ]; then
        echo -e "${RED}❌ Agent template not found: $template_file${NC}"
        echo -e "${YELLOW}Creating template for $agent_name...${NC}"
        # Create a basic template if it doesn't exist
        mkdir -p "${PROJECT_ROOT}/agent-templates"
        echo "# $agent_name Template" > "$template_file"
        echo "Agent Activation Command: \"You are the $agent_name. Begin your assigned tasks.\"" >> "$template_file"
    fi
    
    echo -e "${GREEN}🚀 Launching $agent_name...${NC}"
    echo ""
    echo "Instructions for Claude:"
    echo "------------------------"
    cat "$template_file" | grep "Agent Activation Command" -A 2
    echo ""
    echo -e "${YELLOW}📋 Agent should now:${NC}"
    echo "1. Read MULTI_AGENT_PLAN.md for current tasks"
    echo "2. Update AGENT_COMM.md with status"
    echo "3. Document results in AGENT_RESULTS.md"
    echo "4. Collaborate via shared documents"
    echo ""
    echo -e "${GREEN}✅ Agent launched successfully!${NC}"
}

# Function to launch team
launch_team() {
    local team_name=$1
    shift
    local agents=("$@")
    
    echo -e "${PURPLE}🚀 Launching $team_name${NC}"
    echo "Agents in this team: ${#agents[@]}"
    echo ""
    
    for agent in "${agents[@]}"; do
        IFS='|' read -r agent_file agent_name <<< "$agent"
        echo -e "${CYAN}→ $agent_name${NC}"
    done
    
    echo ""
    echo -e "${YELLOW}Launch these agents in parallel terminals:${NC}"
    local count=1
    for agent in "${agents[@]}"; do
        IFS='|' read -r agent_file agent_name <<< "$agent"
        echo "Terminal $count: ./launch-agent.sh direct $agent_file \"$agent_name\""
        ((count++))
    done
}

# Show enhanced menu
if [ "$AGENT_TYPE" = "menu" ]; then
    echo "Select an option:"
    echo ""
    echo -e "${PURPLE}=== TEAMS ===${NC}"
    echo "  1) RGB Protocol Team (4 agents)"
    echo "  2) Frontend Team (5 agents)"
    echo "  3) Security Team (4 agents)"
    echo "  4) Quality Assurance Team (4 agents)"
    echo "  5) DevOps Team (4 agents)"
    echo "  6) Analytics Team (3 agents)"
    echo "  7) Integration Team (4 agents)"
    echo ""
    echo -e "${CYAN}=== INDIVIDUAL AGENTS ===${NC}"
    echo "  10) Select Individual Agent"
    echo ""
    echo -e "${YELLOW}=== SPECIAL OPERATIONS ===${NC}"
    echo "  20) Launch ALL 28 Agents"
    echo "  21) Emergency Response Team"
    echo "  22) Performance Optimization Squad"
    echo "  23) Security Sweep Team"
    echo "  24) Testing Blitz Team"
    echo ""
    echo -e "${GREEN}=== UTILITIES ===${NC}"
    echo "  30) View Agent Status (Monitor)"
    echo "  31) Emergency Stop All Agents"
    echo "  32) Generate Agent Report"
    echo ""
    echo "  0) Exit"
    echo ""
    read -p "Enter selection: " selection
    
    case $selection in
        # Teams
        1) # RGB Protocol Team
            agents=(
                "RGB_PROTOCOL_AGENT|RGB Protocol Specialist"
                "LIGHTNING_AGENT|Lightning Integration Agent"
                "CONSIGNMENT_AGENT|Consignment Generator Agent"
                "BLOCKCHAIN_MONITOR_AGENT|Blockchain Monitor Agent"
            )
            launch_team "RGB Protocol Team" "${agents[@]}"
            ;;
        2) # Frontend Team
            agents=(
                "MOBILE_UI_AGENT|Mobile UI Guardian"
                "GAME_AGENT|Game Mechanics Agent"
                "PERFORMANCE_AGENT|Performance Agent"
                "ACCESSIBILITY_AGENT|Accessibility Agent"
                "ANIMATION_AGENT|Animation Agent"
            )
            launch_team "Frontend Team" "${agents[@]}"
            ;;
        3) # Security Team
            agents=(
                "SECURITY_AUDIT_AGENT|Security Audit Agent"
                "CODE_AUDIT_AGENT|Code Audit Agent"
                "CRYPTO_SAFETY_AGENT|Crypto Safety Agent"
                "PENETRATION_TEST_AGENT|Penetration Test Agent"
            )
            launch_team "Security Team" "${agents[@]}"
            ;;
        4) # QA Team
            agents=(
                "TEST_WRITER_AGENT|Test Writer Agent"
                "TEST_RUNNER_AGENT|Test Runner Agent"
                "DOCUMENTATION_AGENT|Documentation Agent"
                "CODE_REVIEW_AGENT|Code Review Agent"
            )
            launch_team "Quality Assurance Team" "${agents[@]}"
            ;;
        5) # DevOps Team
            agents=(
                "DEPLOYMENT_AGENT|Deployment Agent"
                "MONITORING_AGENT|Monitoring Agent"
                "INFRASTRUCTURE_AGENT|Infrastructure Agent"
                "BACKUP_AGENT|Backup Agent"
            )
            launch_team "DevOps Team" "${agents[@]}"
            ;;
        6) # Analytics Team
            agents=(
                "USER_BEHAVIOR_AGENT|User Behavior Agent"
                "PERFORMANCE_ANALYTICS_AGENT|Performance Analytics Agent"
                "ERROR_TRACKING_AGENT|Error Tracking Agent"
            )
            launch_team "Analytics Team" "${agents[@]}"
            ;;
        7) # Integration Team
            agents=(
                "WALLET_INTEGRATION_AGENT|Wallet Integration Agent"
                "EXCHANGE_API_AGENT|Exchange API Agent"
                "SOCIAL_MEDIA_AGENT|Social Media Agent"
                "SEO_OPTIMIZATION_AGENT|SEO Optimization Agent"
            )
            launch_team "Integration Team" "${agents[@]}"
            ;;
        
        # Individual agent selection
        10)
            echo -e "${CYAN}Select individual agent:${NC}"
            echo "1) RGB Protocol Specialist"
            echo "2) Mobile UI Guardian"
            echo "3) Test Writer Agent"
            echo "4) Accessibility Agent"
            echo "5) Blockchain Monitor Agent"
            read -p "Selection: " agent_selection
            case $agent_selection in
                1) launch_agent "RGB_PROTOCOL_AGENT" "RGB Protocol Specialist" ;;
                2) launch_agent "MOBILE_UI_AGENT" "Mobile UI Guardian" ;;
                3) launch_agent "TEST_WRITER_AGENT" "Test Writer Agent" ;;
                4) launch_agent "ACCESSIBILITY_AGENT" "Accessibility Agent" ;;
                5) launch_agent "BLOCKCHAIN_MONITOR_AGENT" "Blockchain Monitor Agent" ;;
                *) echo -e "${RED}Invalid selection${NC}" ;;
            esac
            ;;
        
        # Special Operations
        20) # Launch ALL agents
            echo -e "${RED}🚀 LAUNCHING ALL 28 AGENTS!${NC}"
            echo ""
            echo "This requires 28 terminal windows/tabs."
            echo "Consider using tmux or screen for management."
            echo ""
            echo -e "${YELLOW}Quick launch script:${NC}"
            echo "for agent in RGB_PROTOCOL LIGHTNING CONSIGNMENT BLOCKCHAIN_MONITOR MOBILE_UI GAME PERFORMANCE ACCESSIBILITY ANIMATION SECURITY_AUDIT CODE_AUDIT CRYPTO_SAFETY PENETRATION_TEST TEST_WRITER TEST_RUNNER DOCUMENTATION CODE_REVIEW DEPLOYMENT MONITORING INFRASTRUCTURE BACKUP USER_BEHAVIOR PERFORMANCE_ANALYTICS ERROR_TRACKING WALLET_INTEGRATION EXCHANGE_API SOCIAL_MEDIA SEO_OPTIMIZATION; do"
            echo "  gnome-terminal --tab -- bash -c \"./launch-agent.sh direct \${agent}_AGENT 'Agent'; exec bash\" &"
            echo "done"
            ;;
        21) # Emergency Response
            echo -e "${RED}🚨 EMERGENCY RESPONSE TEAM ACTIVATED${NC}"
            echo "Priority agents:"
            echo "- Payment Security Agent"
            echo "- RGB Protocol Specialist"
            echo "- Mobile UI Guardian"
            echo "- Monitoring Agent"
            echo ""
            echo "Check AGENT_COMM.md for critical issues!"
            ;;
        22) # Performance Squad
            echo -e "${YELLOW}⚡ Performance Optimization Squad${NC}"
            echo "Deploying:"
            echo "- Performance Agent"
            echo "- Game Mechanics Agent"
            echo "- Infrastructure Agent"
            echo "- Performance Analytics Agent"
            echo ""
            echo "Mission: Achieve <1s load time"
            ;;
        23) # Security Sweep
            echo -e "${RED}🔒 Security Sweep Team${NC}"
            echo "Deploying entire Security Team + Penetration Tester"
            echo "Full system audit initiated..."
            ;;
        24) # Testing Blitz
            echo -e "${GREEN}🧪 Testing Blitz Team${NC}"
            echo "Deploying QA Team for comprehensive testing"
            echo "Target: 80%+ code coverage"
            ;;
        
        # Utilities
        30) # View Status
            echo -e "${BLUE}Opening Agent Monitor...${NC}"
            echo "http://localhost:8082/agent-monitor.html"
            ;;
        31) # Emergency Stop
            echo -e "${RED}🛑 EMERGENCY STOP${NC}"
            if [ -f "${PROJECT_ROOT}/scripts/agent-emergency-stop.sh" ]; then
                bash "${PROJECT_ROOT}/scripts/agent-emergency-stop.sh"
            else
                echo "Creating emergency stop flag..."
                echo "EMERGENCY STOP" > "${PROJECT_ROOT}/agent-plans/EMERGENCY_STOP.flag"
            fi
            ;;
        32) # Generate Report
            echo -e "${GREEN}📊 Generating Agent Report...${NC}"
            echo "Check AGENT_RESULTS.md for comprehensive report"
            ;;
        
        0) # Exit
            echo "Exiting..."
            exit 0
            ;;
        *) 
            echo -e "${RED}Invalid selection${NC}"
            ;;
    esac
elif [ "$AGENT_TYPE" = "direct" ]; then
    # Direct agent launch with parameters
    launch_agent "$2" "$3"
else
    # Legacy direct launch
    case $AGENT_TYPE in
        rgb) launch_agent "RGB_PROTOCOL_AGENT" "RGB Protocol Specialist" ;;
        ui) launch_agent "MOBILE_UI_AGENT" "Mobile UI Guardian" ;;
        security) launch_agent "SECURITY_AUDIT_AGENT" "Security Audit Agent" ;;
        game) launch_agent "GAME_AGENT" "Game Mechanics Agent" ;;
        test) launch_agent "TEST_WRITER_AGENT" "Test Writer Agent" ;;
        *) echo -e "${RED}Unknown agent type: $AGENT_TYPE${NC}" ;;
    esac
fi

echo ""
echo -e "${BLUE}📁 Agent Resources:${NC}"
echo "  Planning: ${PROJECT_ROOT}/agent-plans/MULTI_AGENT_PLAN.md"
echo "  Comms: ${PROJECT_ROOT}/agent-plans/AGENT_COMM.md"
echo "  Results: ${PROJECT_ROOT}/agent-plans/AGENT_RESULTS.md"
echo "  Monitor: http://localhost:8082/agent-monitor.html"
echo ""
echo -e "${GREEN}💡 Tip:${NC} Use tmux or screen to manage multiple agents"