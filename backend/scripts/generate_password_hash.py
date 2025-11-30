"""Generate bcrypt password hash"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.security import hash_password

password = "123123"
hashed = hash_password(password)

print(f"Password: {password}")
print(f"Hash: {hashed}")
print(f"\nSQL Update:")
print(f"UPDATE admins SET password_hash = '{hashed}' WHERE email = 'admin@aicoach.com';")

