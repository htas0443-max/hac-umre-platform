"""
Backend API Testing for Hac & Umre Tour Comparison Platform
Tests all API endpoints including auth, tours, AI comparison, chatbot, and CSV import
"""

import requests
import sys
import json
from datetime import datetime
import io

class HajjUmrahAPITester:
    def __init__(self, base_url="https://hajj-travel-assist.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_tour_id = None

    def log_result(self, test_name, passed, message=""):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            status = "✅ PASSED"
        else:
            status = "❌ FAILED"
        
        result = f"{status} - {test_name}"
        if message:
            result += f": {message}"
        
        print(result)
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "message": message
        })
        return passed

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {}
        
        # Add auth token if available
        token = self.admin_token if use_admin and self.admin_token else self.token
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        # Only add Content-Type for JSON requests
        if data and not files:
            headers['Content-Type'] = 'application/json'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, headers=headers, files=files, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                print(f"   ✅ Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return self.log_result(name, True, f"Status {response.status_code}"), response_data
                except:
                    return self.log_result(name, True, f"Status {response.status_code}"), {}
            else:
                print(f"   ❌ Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                    return self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}: {error_detail}"), {}
                except:
                    return self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}"), {}

        except requests.exceptions.Timeout:
            print(f"   ❌ Request timeout")
            return self.log_result(name, False, "Request timeout"), {}
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return self.log_result(name, False, f"Exception: {str(e)}"), {}

    # ==================== HEALTH CHECK ====================
    def test_health(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        return success and response.get('status') == 'healthy'

    # ==================== AUTH TESTS ====================
    def test_register_user(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"testuser_{timestamp}@test.com",
                "password": "TestPass123!",
                "role": "user"
            }
        )
        if success and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_register_admin(self):
        """Test admin registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"admin_{timestamp}@test.com",
                "password": "AdminPass123!",
                "role": "admin"
            }
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            return True
        return False

    def test_login(self):
        """Test user login"""
        # First register a user
        timestamp = datetime.now().strftime('%H%M%S')
        email = f"logintest_{timestamp}@test.com"
        password = "LoginTest123!"
        
        # Register
        self.run_test(
            "Register for Login Test",
            "POST",
            "auth/register",
            200,
            data={"email": email, "password": password, "role": "user"}
        )
        
        # Login
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        return success and 'token' in response

    def test_get_me(self):
        """Test get current user"""
        if not self.token:
            return self.log_result("Get Current User", False, "No token available")
        
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success and 'email' in response

    # ==================== TOUR TESTS ====================
    def test_create_tour(self):
        """Test tour creation (Admin only)"""
        if not self.admin_token:
            return self.log_result("Create Tour", False, "No admin token available")
        
        success, response = self.run_test(
            "Create Tour",
            "POST",
            "tours",
            200,
            data={
                "title": "Test Ekonomik Umre Turu",
                "operator": "Test Turizm",
                "price": 15000.0,
                "currency": "TRY",
                "start_date": "2025-03-01",
                "end_date": "2025-03-08",
                "duration": "7 gün",
                "hotel": "Makkah Hotel 3*",
                "services": ["Ulaşım", "Rehber", "Havaalanı transferi"],
                "visa": "Dahil",
                "transport": "Türk Hava Yolları",
                "guide": "Türkçe rehber",
                "itinerary": ["Gün 1: Varış", "Gün 2: Umre", "Gün 3-6: Ziyaretler", "Gün 7: Dönüş"],
                "rating": 4.5,
                "source": "test"
            },
            use_admin=True
        )
        
        if success and 'tour_id' in response:
            self.created_tour_id = response['tour_id']
            return True
        return False

    def test_get_tours(self):
        """Test get all tours"""
        success, response = self.run_test(
            "Get All Tours",
            "GET",
            "tours?limit=10",
            200
        )
        return success and 'tours' in response

    def test_get_tours_with_filters(self):
        """Test get tours with filters"""
        success, response = self.run_test(
            "Get Tours with Filters",
            "GET",
            "tours?min_price=10000&max_price=50000&sort_by=price&sort_order=asc",
            200
        )
        return success and 'tours' in response

    def test_get_tour_by_id(self):
        """Test get single tour"""
        if not self.created_tour_id:
            return self.log_result("Get Tour by ID", False, "No tour ID available")
        
        success, response = self.run_test(
            "Get Tour by ID",
            "GET",
            f"tours/{self.created_tour_id}",
            200
        )
        return success and '_id' in response

    def test_update_tour(self):
        """Test update tour (Admin only)"""
        if not self.admin_token or not self.created_tour_id:
            return self.log_result("Update Tour", False, "No admin token or tour ID available")
        
        success, response = self.run_test(
            "Update Tour",
            "PUT",
            f"tours/{self.created_tour_id}",
            200,
            data={
                "price": 16000.0,
                "rating": 4.8
            },
            use_admin=True
        )
        return success

    # ==================== AI TESTS ====================
    def test_get_providers(self):
        """Test get AI providers"""
        success, response = self.run_test(
            "Get AI Providers",
            "GET",
            "providers/models",
            200
        )
        return success and 'providers' in response

    def test_compare_tours_openai(self):
        """Test AI tour comparison with OpenAI"""
        if not self.token:
            return self.log_result("Compare Tours (OpenAI)", False, "No token available")
        
        # First, get some tours
        _, tours_response = self.run_test(
            "Get Tours for Comparison",
            "GET",
            "tours?limit=2",
            200
        )
        
        if not tours_response.get('tours') or len(tours_response['tours']) < 2:
            return self.log_result("Compare Tours (OpenAI)", False, "Not enough tours available")
        
        tour_ids = [tour['_id'] for tour in tours_response['tours'][:2]]
        
        success, response = self.run_test(
            "Compare Tours (OpenAI)",
            "POST",
            "compare",
            200,
            data={
                "tour_ids": tour_ids,
                "criteria": ["fiyat", "konfor", "hizmetler"],
                "ai_provider": "openai"
            }
        )
        
        # Check if response has expected structure
        if success:
            has_summary = 'summary' in response or 'raw_response' in response
            return self.log_result("Compare Tours (OpenAI) - Response Structure", has_summary, 
                                  "Response contains summary or raw_response")
        return False

    def test_compare_tours_claude(self):
        """Test AI tour comparison with Claude"""
        if not self.token:
            return self.log_result("Compare Tours (Claude)", False, "No token available")
        
        # Get tours
        _, tours_response = self.run_test(
            "Get Tours for Claude Comparison",
            "GET",
            "tours?limit=2",
            200
        )
        
        if not tours_response.get('tours') or len(tours_response['tours']) < 2:
            return self.log_result("Compare Tours (Claude)", False, "Not enough tours available")
        
        tour_ids = [tour['_id'] for tour in tours_response['tours'][:2]]
        
        success, response = self.run_test(
            "Compare Tours (Claude)",
            "POST",
            "compare",
            200,
            data={
                "tour_ids": tour_ids,
                "criteria": ["fiyat", "süre", "konum"],
                "ai_provider": "anthropic"
            }
        )
        
        if success:
            has_summary = 'summary' in response or 'raw_response' in response
            return self.log_result("Compare Tours (Claude) - Response Structure", has_summary,
                                  "Response contains summary or raw_response")
        return False

    def test_chat_openai(self):
        """Test AI chatbot with OpenAI"""
        if not self.token:
            return self.log_result("Chat (OpenAI)", False, "No token available")
        
        success, response = self.run_test(
            "Chat (OpenAI)",
            "POST",
            "chat",
            200,
            data={
                "message": "Umre için en uygun dönem ne zaman?",
                "ai_provider": "openai"
            }
        )
        
        if success and 'answer' in response:
            answer_length = len(response['answer'])
            return self.log_result("Chat (OpenAI) - Answer Length", answer_length > 50,
                                  f"Answer length: {answer_length} characters")
        return False

    def test_chat_claude(self):
        """Test AI chatbot with Claude"""
        if not self.token:
            return self.log_result("Chat (Claude)", False, "No token available")
        
        success, response = self.run_test(
            "Chat (Claude)",
            "POST",
            "chat",
            200,
            data={
                "message": "Hac için vize işlemleri nasıl yapılır?",
                "ai_provider": "anthropic"
            }
        )
        
        if success and 'answer' in response:
            answer_length = len(response['answer'])
            return self.log_result("Chat (Claude) - Answer Length", answer_length > 50,
                                  f"Answer length: {answer_length} characters")
        return False

    # ==================== CSV IMPORT TEST ====================
    def test_csv_import(self):
        """Test CSV import (Admin only)"""
        if not self.admin_token:
            return self.log_result("CSV Import", False, "No admin token available")
        
        # Create a sample CSV
        csv_content = """title,operator,price,currency,duration,hotel,visa,services,transport,guide
Test CSV Tur 1,CSV Turizm,12000,TRY,7 gün,Test Hotel 3*,Dahil,Ulaşım,Rehber,Türk Hava Yolları,Türkçe rehber
Test CSV Tur 2,CSV Organizasyon,25000,TRY,10 gün,Luxury Hotel 5*,Dahil,VIP transfer,Yemek,Emirates,Uzman rehber"""
        
        # Create file-like object
        files = {
            'file': ('test_tours.csv', csv_content, 'text/csv')
        }
        
        url = f"{self.base_url}/api/import/csv"
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        print(f"\n🔍 Testing CSV Import...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, headers=headers, files=files, timeout=30)
            
            success = response.status_code == 200
            
            if success:
                print(f"   ✅ Status: {response.status_code}")
                response_data = response.json()
                imported = response_data.get('imported', 0)
                return self.log_result("CSV Import", imported > 0, 
                                      f"Imported {imported} tours")
            else:
                print(f"   ❌ Expected 200, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                    return self.log_result("CSV Import", False, 
                                          f"Status {response.status_code}: {error_detail}")
                except:
                    return self.log_result("CSV Import", False, 
                                          f"Status {response.status_code}")
        
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return self.log_result("CSV Import", False, f"Exception: {str(e)}")

    # ==================== CLEANUP ====================
    def test_delete_tour(self):
        """Test delete tour (Admin only)"""
        if not self.admin_token or not self.created_tour_id:
            return self.log_result("Delete Tour", False, "No admin token or tour ID available")
        
        success, response = self.run_test(
            "Delete Tour",
            "DELETE",
            f"tours/{self.created_tour_id}",
            200,
            use_admin=True
        )
        return success

    # ==================== MAIN TEST RUNNER ====================
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("\n" + "="*80)
        print("🚀 Starting Backend API Tests for Hac & Umre Platform")
        print("="*80)
        
        # Health Check
        print("\n" + "-"*80)
        print("HEALTH CHECK")
        print("-"*80)
        self.test_health()
        
        # Auth Tests
        print("\n" + "-"*80)
        print("AUTHENTICATION TESTS")
        print("-"*80)
        self.test_register_user()
        self.test_register_admin()
        self.test_login()
        self.test_get_me()
        
        # Tour Tests
        print("\n" + "-"*80)
        print("TOUR CRUD TESTS")
        print("-"*80)
        self.test_create_tour()
        self.test_get_tours()
        self.test_get_tours_with_filters()
        self.test_get_tour_by_id()
        self.test_update_tour()
        
        # AI Tests
        print("\n" + "-"*80)
        print("AI INTEGRATION TESTS")
        print("-"*80)
        self.test_get_providers()
        self.test_compare_tours_openai()
        self.test_compare_tours_claude()
        self.test_chat_openai()
        self.test_chat_claude()
        
        # CSV Import Test
        print("\n" + "-"*80)
        print("CSV IMPORT TEST")
        print("-"*80)
        self.test_csv_import()
        
        # Cleanup
        print("\n" + "-"*80)
        print("CLEANUP")
        print("-"*80)
        self.test_delete_tour()
        
        # Print Summary
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print("="*80)
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['passed']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return self.tests_passed == self.tests_run


def main():
    tester = HajjUmrahAPITester()
    success = tester.run_all_tests()
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
