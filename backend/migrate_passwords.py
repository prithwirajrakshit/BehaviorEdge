import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Add parent dir to path if running directly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def is_bcrypt_hash(value: str) -> bool:
    if not value:
        return False
    # Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
    return (value.startswith("$2a$") or value.startswith("$2b$") or value.startswith("$2y$")) and len(value) == 60

def migrate_passwords():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        migrated_count = 0
        
        for user in users:
            if not user.password_hash:
                print(f"User {user.username} has no password set (OAuth user). Skipping.")
                continue
                
            if is_bcrypt_hash(user.password_hash):
                # Hash is already bcrypt
                continue
                
            print(f"Migrating weak/legacy password hash for user: {user.username}")
            # Securely re-hash the current value with Bcrypt (12 rounds)
            new_hash = pwd_context.hash(user.password_hash)
            user.password_hash = new_hash
            migrated_count += 1
            
        if migrated_count > 0:
            db.commit()
            print(f"Successfully migrated {migrated_count} legacy password hashes to bcrypt (12 rounds).")
        else:
            print("No legacy password hashes found. All passwords are secure.")
            
    except Exception as e:
        db.rollback()
        print(f"Error during password migration: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    migrate_passwords()
