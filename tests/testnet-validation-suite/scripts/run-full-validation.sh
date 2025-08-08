#!/bin/bash

#################################################
# LIGHTCAT Bitcoin Lightning Testnet Validation Suite
# Full Validation Runner Script
#################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"
TEST_SUITE_DIR="$PROJECT_ROOT/tests/testnet-validation-suite"
RESULTS_DIR="$TEST_SUITE_DIR/results"
LOGS_DIR="$TEST_SUITE_DIR/logs"

# Test configuration
TEST_ENV="${TEST_ENV:-testnet}"
BASE_URL="${BASE_URL:-http://localhost:3000}"
UI_URL="${UI_URL:-http://localhost:8082}"
PARALLEL_JOBS="${PARALLEL_JOBS:-1}"
TIMEOUT="${TIMEOUT:-300}"
VERBOSE="${VERBOSE:-false}"

# Create necessary directories
mkdir -p "$RESULTS_DIR" "$LOGS_DIR"

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "  LIGHTCAT Testnet Validation Suite"
    echo "  Full System Validation Runner"
    echo "=================================================="
    echo -e "${NC}"
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "  $1"
    echo "=================================================="
    echo -e "${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_section "Checking Prerequisites"
    
    local error_count=0
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        ((error_count++))
    else
        print_status "Node.js version: $(node --version)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        ((error_count++))
    else
        print_status "npm version: $(npm --version)"
    fi
    
    # Check Jest
    if ! npm list jest &> /dev/null; then
        print_warning "Jest not found, installing..."
        npm install --save-dev jest
    else
        print_status "Jest is available"
    fi
    
    # Check test environment variables
    if [[ -z "$BTCPAY_URL" ]]; then
        print_warning "BTCPAY_URL not set, using default"
    fi
    
    if [[ -z "$SUPABASE_URL" ]]; then
        print_warning "SUPABASE_URL not set"
    fi
    
    # Check API connectivity
    print_status "Checking API connectivity..."
    if curl -f -s "$BASE_URL/api/health" > /dev/null 2>&1; then
        print_status "API server is accessible at $BASE_URL"
    else
        print_error "API server is not accessible at $BASE_URL"
        print_error "Please ensure the server is running: npm run dev:server"
        ((error_count++))
    fi
    
    # Check UI connectivity
    print_status "Checking UI connectivity..."
    if curl -f -s "$UI_URL" > /dev/null 2>&1; then
        print_status "UI server is accessible at $UI_URL"
    else
        print_warning "UI server is not accessible at $UI_URL"
        print_warning "Some tests may fail. Please ensure UI is running: npm run dev:client"
    fi
    
    if [[ $error_count -gt 0 ]]; then
        print_error "Prerequisites check failed with $error_count errors"
        exit 1
    fi
    
    print_status "All prerequisites satisfied"
}

# Function to setup test environment
setup_test_environment() {
    print_section "Setting up Test Environment"
    
    # Set environment variables
    export NODE_ENV=test
    export TEST_BASE_URL="$BASE_URL"
    export TEST_UI_URL="$UI_URL"
    export TEST_TIMEOUT="$TIMEOUT"
    
    # Load environment file if exists
    if [[ -f "$PROJECT_ROOT/.env.$TEST_ENV" ]]; then
        print_status "Loading environment from .env.$TEST_ENV"
        source "$PROJECT_ROOT/.env.$TEST_ENV"
    elif [[ -f "$PROJECT_ROOT/.env.test" ]]; then
        print_status "Loading environment from .env.test"
        source "$PROJECT_ROOT/.env.test"
    else
        print_warning "No test environment file found"
    fi
    
    # Create test results directory structure
    mkdir -p "$RESULTS_DIR"/{payment-flow,business-logic,load-testing,edge-cases,monitoring}
    mkdir -p "$LOGS_DIR"/{payment-flow,business-logic,load-testing,edge-cases,monitoring}
    
    print_status "Test environment setup complete"
}

# Function to run payment flow tests
run_payment_flow_tests() {
    print_section "Running Payment Flow Tests"
    
    local test_file="$TEST_SUITE_DIR/payment-flow/full-payment-flow.test.js"
    local result_file="$RESULTS_DIR/payment-flow/results.json"
    local log_file="$LOGS_DIR/payment-flow/test.log"
    
    if [[ ! -f "$test_file" ]]; then
        print_error "Payment flow test file not found: $test_file"
        return 1
    fi
    
    print_status "Executing payment flow validation..."
    
    # Run Jest with proper configuration
    if npx jest "$test_file" \
        --testTimeout="$((TIMEOUT * 1000))" \
        --verbose="$VERBOSE" \
        --json \
        --outputFile="$result_file" \
        > "$log_file" 2>&1; then
        
        print_status "Payment flow tests: PASSED"
        return 0
    else
        print_error "Payment flow tests: FAILED"
        print_error "Check log file: $log_file"
        return 1
    fi
}

# Function to run business logic tests
run_business_logic_tests() {
    print_section "Running Business Logic Tests"
    
    local test_file="$TEST_SUITE_DIR/business-logic/token-supply-validation.test.js"
    local result_file="$RESULTS_DIR/business-logic/results.json"
    local log_file="$LOGS_DIR/business-logic/test.log"
    
    if [[ ! -f "$test_file" ]]; then
        print_error "Business logic test file not found: $test_file"
        return 1
    fi
    
    print_status "Executing business logic validation..."
    
    if npx jest "$test_file" \
        --testTimeout="$((TIMEOUT * 1000))" \
        --verbose="$VERBOSE" \
        --json \
        --outputFile="$result_file" \
        > "$log_file" 2>&1; then
        
        print_status "Business logic tests: PASSED"
        return 0
    else
        print_error "Business logic tests: FAILED"
        print_error "Check log file: $log_file"
        return 1
    fi
}

# Function to run load tests
run_load_tests() {
    print_section "Running Load Tests"
    
    local test_file="$TEST_SUITE_DIR/load-testing/concurrent-users.test.js"
    local result_file="$RESULTS_DIR/load-testing/results.json"
    local log_file="$LOGS_DIR/load-testing/test.log"
    
    if [[ ! -f "$test_file" ]]; then
        print_error "Load test file not found: $test_file"
        return 1
    fi
    
    print_status "Executing load testing (this may take several minutes)..."
    
    # Extended timeout for load tests
    local load_timeout=$((TIMEOUT * 3))
    
    if npx jest "$test_file" \
        --testTimeout="$((load_timeout * 1000))" \
        --verbose="$VERBOSE" \
        --json \
        --outputFile="$result_file" \
        --maxWorkers=1 \
        > "$log_file" 2>&1; then
        
        print_status "Load tests: PASSED"
        return 0
    else
        print_error "Load tests: FAILED"
        print_error "Check log file: $log_file"
        return 1
    fi
}

# Function to run edge case tests
run_edge_case_tests() {
    print_section "Running Edge Case Tests"
    
    local test_file="$TEST_SUITE_DIR/edge-cases/payment-edge-cases.test.js"
    local result_file="$RESULTS_DIR/edge-cases/results.json"
    local log_file="$LOGS_DIR/edge-cases/test.log"
    
    if [[ ! -f "$test_file" ]]; then
        print_error "Edge case test file not found: $test_file"
        return 1
    fi
    
    print_status "Executing edge case validation..."
    
    if npx jest "$test_file" \
        --testTimeout="$((TIMEOUT * 2))" \
        --verbose="$VERBOSE" \
        --json \
        --outputFile="$result_file" \
        > "$log_file" 2>&1; then
        
        print_status "Edge case tests: PASSED"
        return 0
    else
        print_error "Edge case tests: FAILED"
        print_error "Check log file: $log_file"
        return 1
    fi
}

# Function to run monitoring tests
run_monitoring_tests() {
    print_section "Running Monitoring Tests"
    
    local test_file="$TEST_SUITE_DIR/monitoring/real-time-monitoring.test.js"
    local result_file="$RESULTS_DIR/monitoring/results.json"
    local log_file="$LOGS_DIR/monitoring/test.log"
    
    if [[ ! -f "$test_file" ]]; then
        print_error "Monitoring test file not found: $test_file"
        return 1
    fi
    
    print_status "Executing monitoring validation..."
    
    if npx jest "$test_file" \
        --testTimeout="$((TIMEOUT * 2))" \
        --verbose="$VERBOSE" \
        --json \
        --outputFile="$result_file" \
        > "$log_file" 2>&1; then
        
        print_status "Monitoring tests: PASSED"
        return 0
    else
        print_error "Monitoring tests: FAILED"
        print_error "Check log file: $log_file"
        return 1
    fi
}

# Function to generate comprehensive report
generate_report() {
    print_section "Generating Validation Report"
    
    local report_file="$RESULTS_DIR/validation-report-$(date +%Y%m%d-%H%M%S).json"
    local summary_file="$RESULTS_DIR/validation-summary.txt"
    
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    local skipped_tests=0
    
    # Collect results from all test suites
    echo "{" > "$report_file"
    echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$report_file"
    echo "  \"environment\": \"$TEST_ENV\"," >> "$report_file"
    echo "  \"baseUrl\": \"$BASE_URL\"," >> "$report_file"
    echo "  \"testSuites\": [" >> "$report_file"
    
    local first_suite=true
    for suite in payment-flow business-logic load-testing edge-cases monitoring; do
        local result_file="$RESULTS_DIR/$suite/results.json"
        
        if [[ ! $first_suite ]]; then
            echo "," >> "$report_file"
        fi
        first_suite=false
        
        echo "    {" >> "$report_file"
        echo "      \"name\": \"$suite\"," >> "$report_file"
        
        if [[ -f "$result_file" ]]; then
            echo "      \"status\": \"completed\"," >> "$report_file"
            
            # Extract test statistics from Jest JSON output
            local suite_total=$(jq -r '.numTotalTests // 0' "$result_file" 2>/dev/null || echo "0")
            local suite_passed=$(jq -r '.numPassedTests // 0' "$result_file" 2>/dev/null || echo "0")
            local suite_failed=$(jq -r '.numFailedTests // 0' "$result_file" 2>/dev/null || echo "0")
            local suite_skipped=$(jq -r '.numPendingTests // 0' "$result_file" 2>/dev/null || echo "0")
            
            total_tests=$((total_tests + suite_total))
            passed_tests=$((passed_tests + suite_passed))
            failed_tests=$((failed_tests + suite_failed))
            skipped_tests=$((skipped_tests + suite_skipped))
            
            echo "      \"totalTests\": $suite_total," >> "$report_file"
            echo "      \"passedTests\": $suite_passed," >> "$report_file"
            echo "      \"failedTests\": $suite_failed," >> "$report_file"
            echo "      \"skippedTests\": $suite_skipped" >> "$report_file"
        else
            echo "      \"status\": \"not_run\"," >> "$report_file"
            echo "      \"totalTests\": 0," >> "$report_file"
            echo "      \"passedTests\": 0," >> "$report_file"
            echo "      \"failedTests\": 0," >> "$report_file"
            echo "      \"skippedTests\": 0" >> "$report_file"
        fi
        
        echo "    }" >> "$report_file"
    done
    
    echo "  ]," >> "$report_file"
    echo "  \"summary\": {" >> "$report_file"
    echo "    \"totalTests\": $total_tests," >> "$report_file"
    echo "    \"passedTests\": $passed_tests," >> "$report_file"
    echo "    \"failedTests\": $failed_tests," >> "$report_file"
    echo "    \"skippedTests\": $skipped_tests," >> "$report_file"
    echo "    \"successRate\": $(echo "scale=2; $passed_tests * 100 / $total_tests" | bc 2>/dev/null || echo "0")" >> "$report_file"
    echo "  }" >> "$report_file"
    echo "}" >> "$report_file"
    
    # Generate text summary
    cat > "$summary_file" << EOF
LIGHTCAT Bitcoin Lightning Testnet Validation Report
====================================================
Generated: $(date)
Environment: $TEST_ENV
Base URL: $BASE_URL

Test Results Summary:
  Total Tests: $total_tests
  Passed: $passed_tests
  Failed: $failed_tests  
  Skipped: $skipped_tests
  Success Rate: $(echo "scale=1; $passed_tests * 100 / $total_tests" | bc 2>/dev/null || echo "0")%

Production Readiness Assessment:
$(if [[ $failed_tests -eq 0 ]]; then
  echo "  ✅ READY FOR PRODUCTION"
  echo "  All critical validation tests passed successfully."
else
  echo "  ❌ NOT READY FOR PRODUCTION"
  echo "  $failed_tests test(s) failed. Review failed tests before deployment."
fi)

Test Suite Details:
$(for suite in payment-flow business-logic load-testing edge-cases monitoring; do
  if [[ -f "$RESULTS_DIR/$suite/results.json" ]]; then
    local status="✅ PASSED"
    if [[ $(jq -r '.numFailedTests // 0' "$RESULTS_DIR/$suite/results.json" 2>/dev/null || echo "0") -gt 0 ]]; then
      status="❌ FAILED"
    fi
    echo "  $suite: $status"
  else
    echo "  $suite: ⏭️  NOT RUN"
  fi
done)

Report Files:
  Detailed Report: $report_file
  Test Logs: $LOGS_DIR/
  
For detailed failure analysis, check individual log files in $LOGS_DIR/
EOF
    
    print_status "Validation report generated: $report_file"
    print_status "Summary report generated: $summary_file"
    
    # Display summary
    echo
    cat "$summary_file"
    
    # Return exit code based on test results
    if [[ $failed_tests -gt 0 ]]; then
        return 1
    else
        return 0
    fi
}

# Function to cleanup test environment
cleanup() {
    print_section "Cleanup"
    
    # Remove temporary files
    find "$RESULTS_DIR" -name "*.tmp" -delete 2>/dev/null || true
    find "$LOGS_DIR" -name "*.tmp" -delete 2>/dev/null || true
    
    # Compress old logs if they exist
    if [[ -n "$(find "$LOGS_DIR" -name "*.log" -mtime +7 2>/dev/null)" ]]; then
        print_status "Archiving old log files..."
        find "$LOGS_DIR" -name "*.log" -mtime +7 -exec gzip {} \; 2>/dev/null || true
    fi
    
    print_status "Cleanup completed"
}

# Function to display help
show_help() {
    cat << EOF
LIGHTCAT Bitcoin Lightning Testnet Validation Suite

Usage: $0 [OPTIONS]

Options:
  -h, --help              Show this help message
  -e, --env ENV           Test environment (default: testnet)
  -u, --url URL           Base API URL (default: http://localhost:3000)
  -t, --timeout SEC       Test timeout in seconds (default: 300)
  -v, --verbose           Enable verbose output
  -s, --suite SUITE       Run specific test suite only
  -p, --parallel JOBS     Number of parallel test jobs (default: 1)
  --skip-prereq          Skip prerequisites check
  --skip-setup           Skip test environment setup
  --report-only          Generate report from existing results only

Test Suites:
  payment-flow           Full payment flow validation
  business-logic         Token supply and business logic tests
  load-testing           Concurrent users and performance tests
  edge-cases             Edge cases and failure scenarios
  monitoring             Real-time monitoring validation
  all                    Run all test suites (default)

Examples:
  $0                                    # Run full validation suite
  $0 --suite payment-flow              # Run only payment flow tests
  $0 --env production --timeout 600    # Run with custom environment and timeout
  $0 --verbose --parallel 2            # Run with verbose output and parallel execution

Environment Variables:
  TEST_ENV               Test environment name
  BASE_URL              API server base URL
  UI_URL                UI server base URL
  BTCPAY_URL            BTCPay server URL
  SUPABASE_URL          Supabase database URL
  PARALLEL_JOBS         Number of parallel test jobs
  TIMEOUT               Test timeout in seconds
  VERBOSE               Enable verbose output (true/false)

EOF
}

# Main execution function
main() {
    local skip_prereq=false
    local skip_setup=false
    local report_only=false
    local specific_suite=""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -e|--env)
                TEST_ENV="$2"
                shift 2
                ;;
            -u|--url)
                BASE_URL="$2"
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -s|--suite)
                specific_suite="$2"
                shift 2
                ;;
            -p|--parallel)
                PARALLEL_JOBS="$2"
                shift 2
                ;;
            --skip-prereq)
                skip_prereq=true
                shift
                ;;
            --skip-setup)
                skip_setup=true
                shift
                ;;
            --report-only)
                report_only=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Change to project root directory
    cd "$PROJECT_ROOT"
    
    print_header
    print_status "Starting LIGHTCAT testnet validation suite..."
    print_status "Environment: $TEST_ENV"
    print_status "Base URL: $BASE_URL"
    print_status "Timeout: ${TIMEOUT}s"
    
    # Track overall success
    local overall_success=true
    
    # Skip to report generation if requested
    if [[ "$report_only" == "true" ]]; then
        print_status "Generating report from existing results..."
        if ! generate_report; then
            overall_success=false
        fi
        exit $?
    fi
    
    # Prerequisites check
    if [[ "$skip_prereq" != "true" ]]; then
        if ! check_prerequisites; then
            overall_success=false
            exit 1
        fi
    fi
    
    # Environment setup
    if [[ "$skip_setup" != "true" ]]; then
        if ! setup_test_environment; then
            overall_success=false
            exit 1
        fi
    fi
    
    # Run test suites
    if [[ -z "$specific_suite" || "$specific_suite" == "all" ]]; then
        # Run all test suites
        print_status "Running all test suites..."
        
        if ! run_payment_flow_tests; then
            overall_success=false
        fi
        
        if ! run_business_logic_tests; then
            overall_success=false
        fi
        
        if ! run_load_tests; then
            overall_success=false
        fi
        
        if ! run_edge_case_tests; then
            overall_success=false
        fi
        
        if ! run_monitoring_tests; then
            overall_success=false
        fi
        
    else
        # Run specific test suite
        print_status "Running test suite: $specific_suite"
        
        case "$specific_suite" in
            payment-flow)
                if ! run_payment_flow_tests; then
                    overall_success=false
                fi
                ;;
            business-logic)
                if ! run_business_logic_tests; then
                    overall_success=false
                fi
                ;;
            load-testing)
                if ! run_load_tests; then
                    overall_success=false
                fi
                ;;
            edge-cases)
                if ! run_edge_case_tests; then
                    overall_success=false
                fi
                ;;
            monitoring)
                if ! run_monitoring_tests; then
                    overall_success=false
                fi
                ;;
            *)
                print_error "Unknown test suite: $specific_suite"
                show_help
                exit 1
                ;;
        esac
    fi
    
    # Generate report
    if ! generate_report; then
        overall_success=false
    fi
    
    # Cleanup
    cleanup
    
    # Final status
    if [[ "$overall_success" == "true" ]]; then
        print_status "✅ All validation tests completed successfully!"
        print_status "🚀 System is READY for production deployment"
        exit 0
    else
        print_error "❌ Some validation tests failed"
        print_error "⚠️  System is NOT ready for production"
        print_error "Review test logs and fix issues before deployment"
        exit 1
    fi
}

# Handle script interruption
trap cleanup EXIT INT TERM

# Run main function with all arguments
main "$@"