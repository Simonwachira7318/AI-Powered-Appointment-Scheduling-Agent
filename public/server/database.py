import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://localhost/scheduler_db')

def init_database():
    """Initialize the database with required tables."""
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        
        with conn.cursor() as cursor:
            # Create appointments table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS appointments (
                    id VARCHAR(36) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    attendees JSONB DEFAULT '[]'::jsonb,
                    location VARCHAR(255),
                    status VARCHAR(20) DEFAULT 'scheduled',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Create index on start_time for better query performance
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_appointments_start_time 
                ON appointments(start_time);
            """)
            
            # Create index on status
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_appointments_status 
                ON appointments(status);
            """)
            
            # Create users table (for future user management)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(36) PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    google_calendar_token JSONB,
                    preferences JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Create conversation_history table for AI context
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversation_history (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(36),
                    message TEXT NOT NULL,
                    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'agent')),
                    intent VARCHAR(50),
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Create appointment_participants table for many-to-many relationship
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS appointment_participants (
                    id SERIAL PRIMARY KEY,
                    appointment_id VARCHAR(36) REFERENCES appointments(id) ON DELETE CASCADE,
                    email VARCHAR(255) NOT NULL,
                    name VARCHAR(255),
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            conn.commit()
            print("✅ Database initialized successfully!")
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise

def create_sample_data():
    """Create sample appointments for testing."""
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        
        with conn.cursor() as cursor:
            # Check if sample data already exists
            cursor.execute("SELECT COUNT(*) FROM appointments")
            count = cursor.fetchone()[0]
            
            if count > 0:
                print("Sample data already exists, skipping...")
                return
            
            # Create sample appointments
            sample_appointments = [
                {
                    'id': 'sample-1',
                    'title': 'Team Standup',
                    'description': 'Daily team synchronization meeting',
                    'start_time': '2024-01-15 09:00:00',
                    'end_time': '2024-01-15 09:30:00',
                    'attendees': '["john@example.com", "jane@example.com"]',
                    'location': 'Conference Room A',
                    'status': 'scheduled'
                },
                {
                    'id': 'sample-2',
                    'title': 'Client Review',
                    'description': 'Review project progress with client',
                    'start_time': '2024-01-15 14:00:00',
                    'end_time': '2024-01-15 15:00:00',
                    'attendees': '["client@example.com"]',
                    'location': 'Zoom',
                    'status': 'scheduled'
                },
                {
                    'id': 'sample-3',
                    'title': 'Doctor Appointment',
                    'description': 'Annual checkup',
                    'start_time': '2024-01-16 10:00:00',
                    'end_time': '2024-01-16 11:00:00',
                    'attendees': '[]',
                    'location': 'Medical Center',
                    'status': 'scheduled'
                }
            ]
            
            for apt in sample_appointments:
                cursor.execute("""
                    INSERT INTO appointments 
                    (id, title, description, start_time, end_time, attendees, location, status)
                    VALUES (%(id)s, %(title)s, %(description)s, %(start_time)s, %(end_time)s, 
                           %(attendees)s::jsonb, %(location)s, %(status)s)
                """, apt)
            
            conn.commit()
            print("✅ Sample data created successfully!")
            
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")

if __name__ == '__main__':
    init_database()
    create_sample_data()