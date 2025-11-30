"""
Seed script to create default admin user in the admins table
Run this script to add an admin user to the database

Usage:
    python backend/scripts/seed_admin.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models import Admin
from app.security import hash_password

def seed_admin():
    """Create default admin user in admins table if not exists"""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        admin_email = "admin@aicoach.com"
        existing_admin = db.query(Admin).filter(Admin.email == admin_email).first()
        
        if existing_admin:
            print(f"✓ Admin user already exists: {admin_email}")
            print(f"  ID: {existing_admin.id}")
            print(f"  Created: {existing_admin.created_at}")
            return
        
        # Create new admin user
        admin = Admin(
            email=admin_email,
            password_hash=hash_password("admin123"),
            full_name="System Administrator"
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✓ Admin user created successfully in 'admins' table!")
        print(f"  ID: {admin.id}")
        print(f"  Email: {admin_email}")
        print(f"  Password: admin123")
        print(f"  Table: admins")
        print("\n⚠️  Please change the default password after first login!")
        print(f"\n🔗 Login at: http://localhost:3000/admin/login")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Creating Admin User in 'admins' Table")
    print("=" * 60)
    seed_admin()
    print("=" * 60)

