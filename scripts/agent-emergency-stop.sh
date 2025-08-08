#!/bin/bash

# LIGHTCAT Agent Emergency Stop
# Immediately halts all agent operations

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}🛑 EMERGENCY STOP ACTIVATED${NC}"
echo "================================"
echo ""

# Create emergency stop flag
STOP_FILE="/mnt/c/Users/sk84l/Downloads/RGB LIGHT CAT/litecat-website/agent-plans/EMERGENCY_STOP.flag"
echo "EMERGENCY STOP - $(date)" > "$STOP_FILE"

# Update all agent plans
PLAN_FILE="/mnt/c/Users/sk84l/Downloads/RGB LIGHT CAT/litecat-website/agent-plans/MULTI_AGENT_PLAN.md"
COMM_FILE="/mnt/c/Users/sk84l/Downloads/RGB LIGHT CAT/litecat-website/agent-plans/AGENT_COMM.md"

# Prepend emergency message to plans
echo -e "# 🛑 EMERGENCY STOP - ALL AGENTS HALT IMMEDIATELY\n\n$(cat $PLAN_FILE)" > $PLAN_FILE
echo -e "# 🛑 EMERGENCY STOP - $(date)\n\n$(cat $COMM_FILE)" > $COMM_FILE

echo -e "${YELLOW}⚠️  Actions taken:${NC}"
echo "  ✓ Created emergency stop flag"
echo "  ✓ Updated agent planning documents"
echo "  ✓ All agents should halt operations"
echo ""

echo -e "${GREEN}To resume operations:${NC}"
echo "  1. Remove stop flag: rm \"$STOP_FILE\""
echo "  2. Update planning docs"
echo "  3. Restart agents with: ./launch-agent.sh"
echo ""

echo -e "${RED}All agent operations suspended.${NC}"