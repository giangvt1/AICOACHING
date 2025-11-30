"""
Test script for admin API endpoints
"""
import sys
import os
import requests
from typing import Optional

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

API_BASE = "http://127.0.0.1:8000"

def login(email: str, password: str) -> Optional[tuple[str, str]]:
    """Login and return (token, role)"""
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            data={"username": email, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Login successful: {email}")
            print(f"  Role: {data.get('role', 'unknown')}")
            return (data["access_token"], data.get("role", "student"))
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"  {response.text}")
            return None
    except Exception as e:
        print(f"✗ Login error: {e}")
        return None


def test_admin_stats(token: str):
    """Test admin stats endpoint"""
    print("\n--- Testing Admin Stats ---")
    try:
        response = requests.get(
            f"{API_BASE}/admin/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Admin stats retrieved successfully")
            print(f"  Total Students: {data.get('total_students')}")
            print(f"  Active Students: {data.get('active_students')}")
            print(f"  Total Sessions: {data.get('total_sessions')}")
            print(f"  Avg Completion: {data.get('avg_completion_rate')}%")
            return True
        else:
            print(f"✗ Failed to get stats: {response.status_code}")
            print(f"  {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_admin_students(token: str):
    """Test admin students list endpoint"""
    print("\n--- Testing Admin Students List ---")
    try:
        response = requests.get(
            f"{API_BASE}/admin/students?limit=5",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Retrieved {len(data)} students")
            for student in data[:3]:  # Show first 3
                print(f"  - {student.get('email')} (ID: {student.get('id')})")
            return data
        else:
            print(f"✗ Failed to get students: {response.status_code}")
            print(f"  {response.text}")
            return []
    except Exception as e:
        print(f"✗ Error: {e}")
        return []


def test_student_detail(token: str, student_id: int):
    """Test student detail endpoints"""
    print(f"\n--- Testing Student Detail (ID: {student_id}) ---")
    
    # Student info
    try:
        response = requests.get(
            f"{API_BASE}/admin/students/{student_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Student info retrieved")
            print(f"  Email: {data.get('email')}")
            print(f"  Name: {data.get('full_name')}")
        else:
            print(f"✗ Failed to get student info: {response.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Student progress
    try:
        response = requests.get(
            f"{API_BASE}/admin/students/{student_id}/progress",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Student progress retrieved")
            print(f"  Sessions: {data.get('completed_sessions')}/{data.get('total_sessions')}")
            print(f"  Completion Rate: {data.get('completion_rate')}%")
        else:
            print(f"✗ Failed to get progress: {response.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Student diagnostic
    try:
        response = requests.get(
            f"{API_BASE}/admin/students/{student_id}/diagnostic",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Student diagnostic retrieved")
            print(f"  Chapters tested: {len(data.get('chapters', []))}")
        else:
            print(f"✗ Failed to get diagnostic: {response.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Student exercises
    try:
        response = requests.get(
            f"{API_BASE}/admin/students/{student_id}/exercises",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Student exercises retrieved")
            print(f"  Total: {data.get('total_exercises')}")
            print(f"  Accuracy: {data.get('accuracy')}%")
        else:
            print(f"✗ Failed to get exercises: {response.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")


def test_student_cannot_access_admin(token: str):
    """Test that student token cannot access admin endpoints"""
    print("\n--- Testing Student Authorization (Should Fail) ---")
    try:
        response = requests.get(
            f"{API_BASE}/admin/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 403:
            print("✓ Student correctly blocked from admin endpoints")
            return True
        else:
            print(f"✗ Student should not have access! Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def main():
    print("=" * 70)
    print("Testing Admin API Endpoints")
    print("=" * 70)
    
    # Test 1: Admin Login
    print("\n[1] Testing Admin Login")
    admin_result = login("admin@aicoach.com", "admin123")
    if not admin_result:
        print("\n✗ Admin login failed. Make sure admin user exists.")
        print("  Run: python scripts/seed_admin.py")
        return
    
    admin_token, admin_role = admin_result
    
    if admin_role != "admin":
        print(f"\n✗ Expected role 'admin', got '{admin_role}'")
        return
    
    # Test 2: Admin Stats
    print("\n[2] Testing Admin Stats Endpoint")
    test_admin_stats(admin_token)
    
    # Test 3: Admin Students List
    print("\n[3] Testing Admin Students List")
    students = test_admin_students(admin_token)
    
    # Test 4: Student Detail (if students exist)
    if students:
        print("\n[4] Testing Student Detail Endpoints")
        test_student_detail(admin_token, students[0]["id"])
    else:
        print("\n[4] Skipping student detail tests (no students found)")
    
    # Test 5: Student Authorization
    print("\n[5] Testing Student Authorization")
    # Try to login as a student
    student_result = login("demo@example.com", "demo123")
    if student_result:
        student_token, student_role = student_result
        if student_role == "student":
            test_student_cannot_access_admin(student_token)
        else:
            print("⚠️ demo@example.com is not a student account")
    else:
        print("⚠️ No student account available for authorization test")
    
    print("\n" + "=" * 70)
    print("Admin API Testing Complete!")
    print("=" * 70)


if __name__ == "__main__":
    print("\n⚠️  Make sure the backend server is running on http://127.0.0.1:8000")
    print("⚠️  Make sure you've run the database migration and seed_admin.py\n")
    
    input("Press Enter to continue...")
    main()

