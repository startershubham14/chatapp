"""
Database migration to add profile fields to users table
"""

from sqlalchemy import create_engine, text
from database import DATABASE_URL

def upgrade():
    """Add profile fields to users table"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
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

def downgrade():
    """Remove profile fields from users table"""
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

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "downgrade":
        downgrade()
    else:
        upgrade()
