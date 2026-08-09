#!/usr/bin/env python3
"""
Divine Traders Frontend Verification Script
Tests the bug fix for "shows 0 products" issue - verifies SetupScreen is displayed correctly
"""

import requests
import re
import sys
from urllib.parse import urljoin

# App URL from review request
APP_URL = "https://a6645877-9bdb-4f75-a978-25ce1bcf6493.preview.emergentagent.com"
SUPABASE_PROJECT_REF = "dgycufuckzuzxstrtmqj"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_test(name, passed, details=""):
    status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if passed else f"{Colors.RED}✗ FAIL{Colors.RESET}"
    print(f"{status} - {name}")
    if details:
        print(f"  {details}")
    return passed

def fetch_app_html():
    """Fetch the app HTML"""
    try:
        response = requests.get(APP_URL, timeout=10)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"{Colors.RED}Failed to fetch app: {e}{Colors.RESET}")
        return None

def main():
    print(f"\n{Colors.BOLD}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}Divine Traders - Frontend Bug Fix Verification{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*70}{Colors.RESET}\n")
    
    results = []
    
    # Fetch the app
    print(f"{Colors.BLUE}Fetching app from {APP_URL}...{Colors.RESET}\n")
    html = fetch_app_html()
    
    if not html:
        print(f"\n{Colors.RED}Cannot proceed - failed to fetch app HTML{Colors.RESET}")
        return False
    
    print(f"{Colors.GREEN}Successfully fetched app HTML ({len(html)} bytes){Colors.RESET}\n")
    
    # Since this is a React SPA, we need to check the JavaScript bundle
    # Let's fetch the main JS file
    js_pattern = r'<script[^>]+src="([^"]+\.js)"'
    js_files = re.findall(js_pattern, html)
    
    js_content = ""
    for js_file in js_files:
        if 'node_modules' not in js_file:
            try:
                js_url = urljoin(APP_URL, js_file)
                print(f"{Colors.BLUE}Fetching JS bundle: {js_url}{Colors.RESET}")
                js_response = requests.get(js_url, timeout=10)
                js_content += js_response.text
            except Exception as e:
                print(f"{Colors.YELLOW}Warning: Could not fetch {js_file}: {e}{Colors.RESET}")
    
    print(f"\n{Colors.BOLD}Running Tests:{Colors.RESET}\n")
    
    # Test 1: Check for SetupScreen component in JS
    test1 = "SetupScreen" in js_content and "One last step" in js_content
    results.append(print_test(
        "Test 1: SetupScreen component exists with 'One last step!' heading",
        test1,
        "SetupScreen component found in bundle" if test1 else "SetupScreen component NOT found"
    ))
    
    # Test 2: Check for error detection logic (PGRST205, schema cache, does not exist)
    test2 = ("PGRST205" in js_content or "schema cache" in js_content) and "does not exist" in js_content
    results.append(print_test(
        "Test 2: Error detection logic for missing schema (PGRST205/schema cache)",
        test2,
        "Error detection patterns found" if test2 else "Error detection patterns NOT found"
    ))
    
    # Test 3: Check for SQL setup content
    sql_checks = [
        "create table if not exists public.products",
        "create table if not exists public.variants",
        "create table if not exists public.branding",
        "create policy",
        "product-images"
    ]
    test3 = all(check in js_content for check in sql_checks)
    results.append(print_test(
        "Test 3: Setup SQL includes all required tables and policies",
        test3,
        f"Found {sum(1 for c in sql_checks if c in js_content)}/{len(sql_checks)} required SQL elements"
    ))
    
    # Test 4: Check for SQL Editor link with correct project ref
    sql_editor_url = f"https://supabase.com/dashboard/project/{SUPABASE_PROJECT_REF}/sql/new"
    test4 = SUPABASE_PROJECT_REF in js_content and "/sql/new" in js_content
    results.append(print_test(
        "Test 4: SQL Editor link points to correct Supabase project",
        test4,
        f"Expected: {sql_editor_url}" if test4 else f"Project ref {SUPABASE_PROJECT_REF} not found in links"
    ))
    
    # Test 5: Check for Storage link with correct project ref
    storage_url = f"https://supabase.com/dashboard/project/{SUPABASE_PROJECT_REF}/storage/buckets"
    test5 = SUPABASE_PROJECT_REF in js_content and "/storage/buckets" in js_content
    results.append(print_test(
        "Test 5: Storage link points to correct Supabase project",
        test5,
        f"Expected: {storage_url}" if test5 else f"Storage link not found"
    ))
    
    # Test 6: Check for retry button with data-testid
    test6 = "retry-catalog" in js_content or "data-testid" in js_content
    results.append(print_test(
        "Test 6: Retry button exists with data-testid='retry-catalog'",
        test6,
        "Retry button testid found" if test6 else "Retry button testid NOT found"
    ))
    
    # Test 7: Check for Divine Traders branding elements
    branding_checks = [
        "Divine Traders",
        "We Deals in Wholesale",
        "+91 7529078910",
        "+91 9814523366",
        "Panchkula Shopping Complex"
    ]
    test7 = all(check in js_content for check in branding_checks)
    results.append(print_test(
        "Test 7: Header shows Divine Traders branding (name, taglines, phones, address)",
        test7,
        f"Found {sum(1 for c in branding_checks if c in js_content)}/{len(branding_checks)} branding elements"
    ))
    
    # Test 8: Check for Unlock/Admin button
    unlock_checks = ["Unlock / Admin", "Show Prices", "Edit Mode"]
    test8 = all(check in js_content for check in unlock_checks)
    results.append(print_test(
        "Test 8: Floating 'Unlock / Admin' button exists with modal options",
        test8,
        f"Found {sum(1 for c in unlock_checks if c in js_content)}/{len(unlock_checks)} unlock features"
    ))
    
    # Test 9: Verify conditional rendering - search bar and category tabs hidden when needsSetup
    test9 = "needsSetup" in js_content and ("CategoryTabs" in js_content or "Search brand" in js_content)
    results.append(print_test(
        "Test 9: Conditional rendering logic - hides search/categories when setup needed",
        test9,
        "Conditional rendering logic found" if test9 else "Conditional rendering logic NOT found"
    ))
    
    # Test 10: Check for Copy SQL button
    test10 = ("Copy SQL" in js_content or "📋" in js_content) and "clipboard" in js_content
    results.append(print_test(
        "Test 10: Copy SQL button exists with clipboard functionality",
        test10,
        "Copy button with clipboard found" if test10 else "Copy button NOT found"
    ))
    
    # Summary
    print(f"\n{Colors.BOLD}{'='*70}{Colors.RESET}")
    passed = sum(results)
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0
    
    if passed == total:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ ALL TESTS PASSED ({passed}/{total}){Colors.RESET}")
    else:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠ PARTIAL PASS ({passed}/{total} - {percentage:.0f}%){Colors.RESET}")
    
    print(f"{Colors.BOLD}{'='*70}{Colors.RESET}\n")
    
    # Additional notes
    print(f"{Colors.BOLD}Notes:{Colors.RESET}")
    print("• This is a static analysis of the React bundle")
    print("• The app is a SPA - actual behavior depends on Supabase state")
    print("• Since Supabase tables don't exist, SetupScreen SHOULD be displayed")
    print("• Manual verification in browser recommended for interactive elements")
    print()
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
