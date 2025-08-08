"""
Database migration to add profile fields to users table
"""

import os
import sys
from sqlalchemy import create_engine, text

# Add the parent directory to the path so we can import database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import DATABASE_URL

def upgrade():
    """Add profile fields to users table"""
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name IN ('display_name', 'bio', 'status_message', 'profile_image_url', 'profile_image_public_id')
            """))
            existing_columns = [row[0] for row in result.fetchall()]
            
            if existing_columns:
                print(f"✅ Profile columns already exist: {existing_columns}")
                return
            
            # Add new profile columns
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN display_name VARCHAR(100),
                ADD COLUMN bio TEXT,
                ADD COLUMN status_message VARCHAR(200),
                ADD COLUMN profile_image_url VARCHAR(500),
                ADD COLUMN profile_image_public_id VARCHAR(200)
            """))
            
            conn.commit()
            print("✅ Added profile fields to users table")
            
    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
        raise

def downgrade():
    """Remove profile fields from users table"""
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Remove profile columns
            conn.execute(text("""
                ALTER TABLE users 
                DROP COLUMN IF EXISTS display_name,
                DROP COLUMN IF EXISTS bio,
                DROP COLUMN IF EXISTS status_message,
                DROP COLUMN IF EXISTS profile_image_url,
                DROP COLUMN IF EXISTS profile_image_public_id
            """))
            
            conn.commit()
            print("✅ Removed profile fields from users table")
            
    except Exception as e:
        print(f"❌ Error during downgrade: {str(e)}")
        raise

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "downgrade":
        downgrade()
    else:
        upgrade()
