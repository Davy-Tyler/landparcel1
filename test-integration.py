#!/usr/bin/env python3
"""
Integration test script to verify FastAPI backend endpoints
"""
import requests
import json
import sys
import time

# Configuration
BASE_URL = "http://localhost:8000/api"
TEST_USER = {
    "first_name": "Test",
    "last_name": "User", 
    "email": "test@example.com",
    "password": "testpass123",
    "phone_number": "+1234567890"
}

def test_health_check():
    """Test if the backend is running"""
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✅ Backend health check passed")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on localhost:8000")
        return False

def test_user_registration():
    """Test user registration endpoint"""
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=TEST_USER)
        if response.status_code == 200:
            print("✅ User registration successful")
            return True
        elif response.status_code == 400:
            error_detail = response.json().get('detail', '')
            if 'Email already registered' in error_detail:
                print("✅ User registration (user already exists)")
                return True
        print(f"❌ User registration failed: {response.status_code} - {response.text}")
        return False
    except Exception as e:
        print(f"❌ User registration error: {e}")
        return False

def test_user_login():
    """Test user login endpoint"""
    try:
        login_data = {
            "username": TEST_USER["email"],
            "password": TEST_USER["password"]
        }
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            if 'access_token' in token_data:
                print("✅ User login successful")
                return token_data['access_token']
        print(f"❌ User login failed: {response.status_code} - {response.text}")
        return None
    except Exception as e:
        print(f"❌ User login error: {e}")
        return None

def test_get_current_user(token):
    """Test get current user endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/users/me", headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Get current user successful: {user_data.get('email')}")
            return user_data
        print(f"❌ Get current user failed: {response.status_code} - {response.text}")
        return None
    except Exception as e:
        print(f"❌ Get current user error: {e}")
        return None

def test_get_plots():
    """Test get plots endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/plots")
        if response.status_code == 200:
            plots = response.json()
            print(f"✅ Get plots successful: Found {len(plots)} plots")
            return plots
        print(f"❌ Get plots failed: {response.status_code} - {response.text}")
        return None
    except Exception as e:
        print(f"❌ Get plots error: {e}")
        return None

def test_get_locations():
    """Test get locations endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/plots/locations")
        if response.status_code == 200:
            locations = response.json()
            print(f"✅ Get locations successful: Found {len(locations)} locations")
            return True
        print(f"❌ Get locations failed: {response.status_code} - {response.text}")
        return False
    except Exception as e:
        print(f"❌ Get locations error: {e}")
        return False

def test_location_hierarchy():
    """Test location hierarchy endpoints"""
    try:
        # Test regions
        response = requests.get(f"{BASE_URL}/plots/locations/regions")
        if response.status_code == 200:
            regions = response.json()
            print(f"✅ Get regions successful: Found {len(regions)} regions")
            
            # Test districts
            if regions:
                region = regions[0]
                response = requests.get(f"{BASE_URL}/plots/locations/districts", params={"region": region})
                if response.status_code == 200:
                    districts = response.json()
                    print(f"✅ Get districts successful: Found {len(districts)} districts")
            return True
        print(f"❌ Get regions failed: {response.status_code} - {response.text}")
        return False
    except Exception as e:
        print(f"❌ Location hierarchy error: {e}")
        return False

def main():
    """Run all integration tests"""
    print("🚀 Starting FastAPI Backend Integration Tests\n")
    
    # Test backend health
    if not test_health_check():
        print("\n❌ Backend is not running. Please start the backend first.")
        sys.exit(1)
    
    # Test user registration
    test_user_registration()
    
    # Test user login
    token = test_user_login()
    if not token:
        print("\n❌ Login failed. Cannot continue with authenticated tests.")
        sys.exit(1)
    
    # Test authenticated endpoints
    test_get_current_user(token)
    
    # Test public endpoints
    test_get_plots()
    test_get_locations()
    test_location_hierarchy()
    
    print("\n🎉 Integration tests completed!")

if __name__ == "__main__":
    main()
