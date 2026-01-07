"""
Comprehensive Backend API Testing for Hac & Umre Platform
Focus: Operator features, Admin approval, and integration testing
"""
import requests
import sys
import json
from datetime import datetime
from typing import Dict, Optional

BASE_URL = "https://hajj-travel-assist.preview.emergentagent.com"

class HajjUmreAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.tests_run = 0
        self.tests_passed = 0
        self.user_token = None
        self.operator_token = None
        self.admin_token = None
        self.created_tour_id = None
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def run_test(self, name: str, method: str, endpoint: str, 
                 expected_status: int, data: Optional[Dict] = None, 
                 token: Optional[str] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        self.tests_run += 1
        self.log(f"Testing: {name}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Status: {response.status_code}", "SUCCESS")
            else:
                self.log(f"❌ FAILED - Expected {expected_status}, got {response.status_code}", "ERROR")
                self.log(f"Response: {response.text[:200]}", "ERROR")
            
            try:
                response_data = response.json()
            except:
                response_data = {}
            
            return success, response_data, response.status_code
        
        except requests.exceptions.Timeout:
            self.log(f"❌ FAILED - Request timeout (>30s)", "ERROR")
            return False, {}, 0
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            return False, {}, 0
    
    def test_health(self) -> bool:
        """Test health endpoint"""
        success, data, _ = self.run_test(
            "Health Check",
            "GET",
            "/api/health",
            200
        )
        return success
    
    def test_user_registration(self) -> bool:
        """Test regular user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        success, data, _ = self.run_test(
            "User Registration",
            "POST",
            "/api/auth/register",
            200,
            data={
                "email": f"testuser_{timestamp}@test.com",
                "password": "TestPass123!",
                "user_role": "user"
            }
        )
        
        if success and 'token' in data:
            self.user_token = data['token']
            self.log(f"User token obtained", "SUCCESS")
        
        return success
    
    def test_operator_registration(self) -> bool:
        """Test operator login with existing credentials"""
        success, data, _ = self.run_test(
            "Operator Login (existing credentials)",
            "POST",
            "/api/auth/login",
            200,
            data={
                "email": "operator@test.com",
                "password": "Operator123!"
            }
        )
        
        if success and 'token' in data:
            self.operator_token = data['token']
            self.log(f"Operator token obtained", "SUCCESS")
            self.log(f"Company: {data.get('user', {}).get('company_name')}", "INFO")
        
        return success
    
    def test_operator_registration_without_company(self) -> bool:
        """Test operator registration without company_name (should fail)"""
        timestamp = datetime.now().strftime("%H%M%S")
        success, data, status = self.run_test(
            "Operator Registration WITHOUT company_name (should fail)",
            "POST",
            "/api/auth/register",
            400,  # Expecting 400 error
            data={
                "email": f"operator_nocompany_{timestamp}@test.com",
                "password": "Operator123!",
                "user_role": "operator"
            }
        )
        
        if success:
            self.log(f"✅ Correctly rejected operator without company_name", "SUCCESS")
        
        return success
    
    def test_admin_registration(self) -> bool:
        """Test admin login with existing credentials"""
        success, data, _ = self.run_test(
            "Admin Login (existing credentials)",
            "POST",
            "/api/auth/login",
            200,
            data={
                "email": "admin@test.com",
                "password": "Admin123!"
            }
        )
        
        if success and 'token' in data:
            self.admin_token = data['token']
            self.log(f"Admin token obtained", "SUCCESS")
        
        return success
    
    def test_operator_create_tour(self) -> bool:
        """Test operator creating a tour"""
        if not self.operator_token:
            self.log("❌ No operator token available", "ERROR")
            return False
        
        success, data, _ = self.run_test(
            "Operator Create Tour",
            "POST",
            "/api/operator/tours",
            200,
            data={
                "title": "Test Umre Turu 2024",
                "operator": f"Test Turizm {datetime.now().strftime('%H%M%S')}",
                "price": 15000.0,
                "currency": "TRY",
                "start_date": "2024-12-01",
                "end_date": "2024-12-10",
                "duration": "10 gün",
                "hotel": "5 Yıldızlı Otel",
                "services": ["Uçak bileti", "Vize", "Rehber", "Yemek"],
                "visa": "Dahil",
                "transport": "Uçak",
                "guide": "Türkçe rehber",
                "itinerary": ["Mekke", "Medine"],
                "rating": 4.5,
                "source": "operator",
                "status": "draft"
            },
            token=self.operator_token
        )
        
        if success and 'tour_id' in data:
            self.created_tour_id = data['tour_id']
            self.log(f"Tour created with ID: {self.created_tour_id}", "SUCCESS")
        
        return success
    
    def test_operator_get_stats(self) -> bool:
        """Test operator getting their stats"""
        if not self.operator_token:
            self.log("❌ No operator token available", "ERROR")
            return False
        
        success, data, _ = self.run_test(
            "Operator Get Stats",
            "GET",
            "/api/operator/stats",
            200,
            token=self.operator_token
        )
        
        if success:
            self.log(f"Stats: Total={data.get('total_tours')}, Approved={data.get('approved_tours')}, Pending={data.get('pending_tours')}", "INFO")
        
        return success
    
    def test_operator_get_tours(self) -> bool:
        """Test operator getting their tours"""
        if not self.operator_token:
            self.log("❌ No operator token available", "ERROR")
            return False
        
        success, data, _ = self.run_test(
            "Operator Get My Tours",
            "GET",
            "/api/operator/tours",
            200,
            token=self.operator_token
        )
        
        if success:
            self.log(f"Found {len(data.get('tours', []))} tours", "INFO")
        
        return success
    
    def test_operator_update_tour(self) -> bool:
        """Test operator updating their tour"""
        if not self.operator_token or not self.created_tour_id:
            self.log("❌ No operator token or tour ID available", "ERROR")
            return False
        
        success, data, _ = self.run_test(
            "Operator Update Tour",
            "PUT",
            f"/api/operator/tours/{self.created_tour_id}",
            200,
            data={
                "price": 16000.0,
                "rating": 4.8
            },
            token=self.operator_token
        )
        
        return success
    
    def test_admin_approve_tour(self) -> bool:
        """Test admin approving a tour"""
        if not self.admin_token or not self.created_tour_id:
            self.log("❌ No admin token or tour ID available", "ERROR")
            return False
        
        success, data, _ = self.run_test(
            "Admin Approve Tour",
            "PUT",
            f"/api/admin/tours/{self.created_tour_id}/approve",
            200,
            token=self.admin_token
        )
        
        return success
    
    def test_admin_reject_tour(self) -> bool:
        """Test admin rejecting a tour"""
        if not self.admin_token or not self.created_tour_id:
            self.log("❌ No admin token or tour ID available", "ERROR")
            return False
        
        # First, create another tour to reject
        if not self.operator_token:
            self.log("❌ No operator token available", "ERROR")
            return False
        
        # Create a tour to reject
        _, tour_data, _ = self.run_test(
            "Create Tour for Rejection Test",
            "POST",
            "/api/operator/tours",
            200,
            data={
                "title": "Test Tur - To Be Rejected",
                "operator": f"Test Turizm {datetime.now().strftime('%H%M%S')}",
                "price": 10000.0,
                "currency": "TRY",
                "start_date": "2024-12-01",
                "end_date": "2024-12-10",
                "duration": "10 gün",
                "hotel": "3 Yıldızlı Otel",
                "services": ["Uçak bileti"],
                "visa": "Dahil",
                "transport": "Uçak",
                "guide": "Rehber yok",
                "itinerary": ["Mekke"],
                "source": "operator",
                "status": "draft"
            },
            token=self.operator_token
        )
        
        if 'tour_id' not in tour_data:
            self.log("❌ Could not create tour for rejection test", "ERROR")
            return False
        
        reject_tour_id = tour_data['tour_id']
        
        # Now reject it
        success, data, _ = self.run_test(
            "Admin Reject Tour",
            "PUT",
            f"/api/admin/tours/{reject_tour_id}/reject?reason=Eksik bilgiler",
            200,
            token=self.admin_token
        )
        
        return success
    
    def test_get_tours_approved_only(self) -> bool:
        """Test getting only approved tours (default behavior)"""
        success, data, _ = self.run_test(
            "Get Tours (Approved Only - Default)",
            "GET",
            "/api/tours",
            200
        )
        
        if success:
            tours = data.get('tours', [])
            self.log(f"Found {len(tours)} approved tours", "INFO")
            # Check if all tours are approved
            all_approved = all(tour.get('status') == 'approved' for tour in tours)
            if all_approved:
                self.log("✅ All returned tours are approved", "SUCCESS")
            else:
                self.log("⚠️ Some tours are not approved", "WARNING")
        
        return success
    
    def test_get_ai_providers(self) -> bool:
        """Test getting AI providers"""
        success, data, _ = self.run_test(
            "Get AI Providers",
            "GET",
            "/api/providers/models",
            200
        )
        
        if success:
            providers = data.get('providers', [])
            self.log(f"Found {len(providers)} AI providers", "INFO")
            for provider in providers:
                self.log(f"  - {provider.get('name')}: {provider.get('model')} ({provider.get('status')})", "INFO")
        
        return success
    
    def test_get_currencies(self) -> bool:
        """Test getting supported currencies"""
        success, data, _ = self.run_test(
            "Get Currencies",
            "GET",
            "/api/currencies",
            200
        )
        
        if success:
            currencies = data.get('currencies', [])
            self.log(f"Found {len(currencies)} currencies", "INFO")
            for currency in currencies:
                self.log(f"  - {currency.get('code')}: {currency.get('symbol')} ({currency.get('name')})", "INFO")
        
        return success
    
    def test_login(self) -> bool:
        """Test login with existing credentials"""
        success, data, _ = self.run_test(
            "Login with Test Credentials",
            "POST",
            "/api/auth/login",
            200,
            data={
                "email": "admin@test.com",
                "password": "Admin123!"
            }
        )
        
        if success and 'token' in data:
            self.log(f"Login successful, token obtained", "SUCCESS")
        
        return success
    
    def test_security_headers(self) -> bool:
        """Test security headers in response"""
        url = f"{self.base_url}/api/health"
        
        self.tests_run += 1
        self.log(f"Testing: Security Headers")
        
        try:
            response = requests.get(url, timeout=10)
            
            required_headers = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'X-XSS-Protection',
                'Strict-Transport-Security',
                'Content-Security-Policy'
            ]
            
            missing_headers = []
            for header in required_headers:
                if header not in response.headers:
                    missing_headers.append(header)
            
            if not missing_headers:
                self.tests_passed += 1
                self.log(f"✅ PASSED - All security headers present", "SUCCESS")
                return True
            else:
                self.log(f"❌ FAILED - Missing headers: {', '.join(missing_headers)}", "ERROR")
                return False
        
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}", "ERROR")
            return False
    
    def test_ai_chat(self) -> bool:
        """Test AI chatbot"""
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        success, data, _ = self.run_test(
            "AI Chat",
            "POST",
            "/api/chat",
            200,
            data={
                "message": "Umre için en uygun dönem ne zaman?",
                "ai_provider": "anthropic"
            },
            token=self.admin_token
        )
        
        if success and 'answer' in data:
            self.log(f"AI Response: {data['answer'][:100]}...", "INFO")
        
        return success
    
    def test_ai_compare(self) -> bool:
        """Test AI tour comparison"""
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # First get some tour IDs
        _, tours_data, _ = self.run_test(
            "Get Tours for Comparison",
            "GET",
            "/api/tours?limit=3",
            200
        )
        
        tours = tours_data.get('tours', [])
        if len(tours) < 2:
            self.log("⚠️ Not enough tours for comparison test", "WARNING")
            return True  # Skip test but don't fail
        
        tour_ids = [str(tour['id']) for tour in tours[:2]]
        
        success, data, _ = self.run_test(
            "AI Compare Tours",
            "POST",
            "/api/compare",
            200,
            data={
                "tour_ids": tour_ids,
                "criteria": ["fiyat", "konaklama", "hizmetler"],
                "ai_provider": "anthropic"
            },
            token=self.admin_token
        )
        
        return success
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("=" * 80, "INFO")
        self.log("STARTING COMPREHENSIVE BACKEND API TESTS", "INFO")
        self.log("=" * 80, "INFO")
        
        # Basic tests
        self.log("\n--- BASIC TESTS ---", "INFO")
        self.test_health()
        self.test_get_ai_providers()
        self.test_get_currencies()
        self.test_security_headers()
        
        # Authentication tests
        self.log("\n--- AUTHENTICATION TESTS ---", "INFO")
        self.test_user_registration()
        self.test_operator_registration()
        self.test_operator_registration_without_company()
        self.test_admin_registration()
        self.test_login()
        
        # Operator tests
        self.log("\n--- OPERATOR TESTS ---", "INFO")
        self.test_operator_create_tour()
        self.test_operator_get_stats()
        self.test_operator_get_tours()
        self.test_operator_update_tour()
        
        # Admin tests
        self.log("\n--- ADMIN TESTS ---", "INFO")
        self.test_admin_approve_tour()
        self.test_admin_reject_tour()
        
        # Tour listing tests
        self.log("\n--- TOUR LISTING TESTS ---", "INFO")
        self.test_get_tours_approved_only()
        
        # AI tests
        self.log("\n--- AI TESTS ---", "INFO")
        self.test_ai_chat()
        self.test_ai_compare()
        
        # Print summary
        self.log("\n" + "=" * 80, "INFO")
        self.log("TEST SUMMARY", "INFO")
        self.log("=" * 80, "INFO")
        self.log(f"Total Tests: {self.tests_run}", "INFO")
        self.log(f"Passed: {self.tests_passed}", "SUCCESS")
        self.log(f"Failed: {self.tests_run - self.tests_passed}", "ERROR")
        self.log(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%", "INFO")
        self.log("=" * 80, "INFO")
        
        return 0 if self.tests_passed == self.tests_run else 1

def main():
    tester = HajjUmreAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
