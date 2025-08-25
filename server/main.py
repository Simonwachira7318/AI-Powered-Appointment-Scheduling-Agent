import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from flask import Flask, request, jsonify, g
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

app = Flask(__name__)
CORS(app)

# Configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://localhost/scheduler_db')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GOOGLE_CALENDAR_CREDENTIALS = os.environ.get('GOOGLE_CALENDAR_CREDENTIALS')

# Configure Gemini AI
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')

class DatabaseManager:
    def __init__(self):
        self.connection = None
    
    def connect(self):
        if not self.connection or self.connection.closed:
            self.connection = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return self.connection
    
    def execute_query(self, query: str, params: tuple = ()):
        conn = self.connect()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            if query.strip().upper().startswith('SELECT'):
                return cursor.fetchall()
            conn.commit()
            return cursor.rowcount

db = DatabaseManager()

class AppointmentService:
    @staticmethod
    def create_appointment(data: Dict) -> Dict:
        try:
            appointment_id = str(uuid.uuid4())
            query = """
                INSERT INTO appointments (id, title, description, start_time, end_time, 
                                       attendees, location, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            start_time = datetime.fromisoformat(data['startTime'].replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(data['endTime'].replace('Z', '+00:00'))
            
            params = (
                appointment_id,
                data.get('title', ''),
                data.get('description', ''),
                start_time,
                end_time,
                json.dumps(data.get('attendees', [])),
                data.get('location', ''),
                'scheduled',
                datetime.now()
            )
            
            db.execute_query(query, params)
            
            # Get the created appointment
            return AppointmentService.get_appointment(appointment_id)
            
        except Exception as e:
            print(f"Error creating appointment: {e}")
            return None
    
    @staticmethod
    def get_appointments(start_date: Optional[datetime] = None, 
                        end_date: Optional[datetime] = None) -> List[Dict]:
        try:
            query = "SELECT * FROM appointments WHERE status = 'scheduled'"
            params = []
            
            if start_date:
                query += " AND start_time >= %s"
                params.append(start_date)
                
            if end_date:
                query += " AND end_time <= %s"
                params.append(end_date)
            
            query += " ORDER BY start_time ASC"
            
            results = db.execute_query(query, tuple(params))
            
            appointments = []
            for row in results:
                appointment = dict(row)
                appointment['attendees'] = json.loads(appointment['attendees'] or '[]')
                appointment['startTime'] = appointment['start_time'].isoformat()
                appointment['endTime'] = appointment['end_time'].isoformat()
                appointments.append(appointment)
                
            return appointments
            
        except Exception as e:
            print(f"Error fetching appointments: {e}")
            return []
    
    @staticmethod
    def get_appointment(appointment_id: str) -> Optional[Dict]:
        try:
            query = "SELECT * FROM appointments WHERE id = %s"
            results = db.execute_query(query, (appointment_id,))
            
            if results:
                appointment = dict(results[0])
                appointment['attendees'] = json.loads(appointment['attendees'] or '[]')
                appointment['startTime'] = appointment['start_time'].isoformat()
                appointment['endTime'] = appointment['end_time'].isoformat()
                return appointment
            
            return None
            
        except Exception as e:
            print(f"Error fetching appointment: {e}")
            return None
    
    @staticmethod
    def check_availability(target_date: datetime, duration: int) -> List[Dict]:
        try:
            # Get existing appointments for the day
            start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)
            
            existing_appointments = AppointmentService.get_appointments(start_of_day, end_of_day)
            
            # Define working hours (9 AM to 6 PM)
            work_start = start_of_day.replace(hour=9)
            work_end = start_of_day.replace(hour=18)
            
            # Generate available slots
            available_slots = []
            current_time = work_start
            
            while current_time + timedelta(minutes=duration) <= work_end:
                slot_end = current_time + timedelta(minutes=duration)
                
                # Check if this slot conflicts with existing appointments
                is_available = True
                for apt in existing_appointments:
                    apt_start = datetime.fromisoformat(apt['startTime'].replace('Z', '+00:00'))
                    apt_end = datetime.fromisoformat(apt['endTime'].replace('Z', '+00:00'))
                    
                    # Check for overlap
                    if (current_time < apt_end and slot_end > apt_start):
                        is_available = False
                        current_time = apt_end  # Skip to after this appointment
                        break
                
                if is_available:
                    available_slots.append({
                        'start': current_time.isoformat(),
                        'end': slot_end.isoformat(),
                        'available': True
                    })
                    current_time += timedelta(minutes=30)  # 30-minute intervals
                
            return available_slots
            
        except Exception as e:
            print(f"Error checking availability: {e}")
            return []

class GeminiAIService:
    @staticmethod
    def process_message(message: str) -> Dict:
        try:
            # Define the prompt for appointment scheduling
            prompt = f"""
            You are a helpful appointment scheduling assistant. Analyze the following user message and extract relevant information for appointment scheduling.

            User message: "{message}"

            Please respond in JSON format with the following structure:
            {{
                "intent": "schedule|check_availability|list_appointments|update|cancel|other",
                "reply": "A friendly response to the user",
                "extracted_info": {{
                    "title": "meeting title if mentioned",
                    "date": "date in ISO format if extractable",
                    "time": "time if mentioned",
                    "duration": "duration in minutes (default 60)",
                    "attendees": ["list of attendees if mentioned"],
                    "location": "location if mentioned"
                }},
                "action_needed": "What action should be taken",
                "requires_confirmation": true/false
            }}

            Examples:
            - "Schedule a meeting with John tomorrow at 2 PM" -> intent: "schedule"
            - "Am I free Friday at 3 PM?" -> intent: "check_availability"  
            - "What's on my calendar next week?" -> intent: "list_appointments"
            - "Cancel my 10 AM meeting" -> intent: "cancel"

            Be conversational and helpful. If information is missing, ask for clarification.
            """

            response = model.generate_content(prompt)
            
            try:
                # Try to parse as JSON
                result = json.loads(response.text)
                return result
            except json.JSONDecodeError:
                # If not valid JSON, return a basic response
                return {
                    "intent": "other",
                    "reply": response.text,
                    "extracted_info": {},
                    "action_needed": "respond",
                    "requires_confirmation": False
                }
                
        except Exception as e:
            print(f"Error processing message with Gemini: {e}")
            return {
                "intent": "other",
                "reply": "I'm sorry, I'm having trouble understanding your request right now. Could you please try again?",
                "extracted_info": {},
                "action_needed": "retry",
                "requires_confirmation": False
            }

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({'success': False, 'error': 'Message is required'}), 400
        
        # Process with Gemini AI
        ai_response = GeminiAIService.process_message(message)
        
        # Handle different intents
        intent = ai_response.get('intent', 'other')
        extracted_info = ai_response.get('extracted_info', {})
        
        response_data = {
            'reply': ai_response.get('reply', 'I understand your request.'),
            'action': intent
        }
        
        # Execute actions based on intent
        if intent == 'schedule':
            if all(key in extracted_info for key in ['date', 'time']):
                # Try to create appointment
                appointment_data = {
                    'title': extracted_info.get('title', 'New Appointment'),
                    'startTime': f"{extracted_info['date']}T{extracted_info['time']}:00",
                    'endTime': f"{extracted_info['date']}T{extracted_info['time']}:00",  # Will add duration
                    'attendees': extracted_info.get('attendees', []),
                    'location': extracted_info.get('location', '')
                }
                
                # Add duration to end time
                start_time = datetime.fromisoformat(appointment_data['startTime'])
                duration = int(extracted_info.get('duration', 60))
                end_time = start_time + timedelta(minutes=duration)
                appointment_data['endTime'] = end_time.isoformat()
                
                created_appointment = AppointmentService.create_appointment(appointment_data)
                if created_appointment:
                    response_data['data'] = created_appointment
                    response_data['reply'] = f"Great! I've scheduled your appointment: {appointment_data['title']} on {start_time.strftime('%B %d, %Y at %I:%M %p')}."
                else:
                    response_data['reply'] = "I had trouble creating that appointment. Please try again."
        
        elif intent == 'check_availability':
            if 'date' in extracted_info:
                target_date = datetime.fromisoformat(extracted_info['date'])
                duration = int(extracted_info.get('duration', 60))
                available_slots = AppointmentService.check_availability(target_date, duration)
                
                response_data['data'] = available_slots
                if available_slots:
                    response_data['reply'] = f"I found {len(available_slots)} available time slots on {target_date.strftime('%B %d, %Y')}."
                else:
                    response_data['reply'] = f"I don't see any available slots on {target_date.strftime('%B %d, %Y')}. Would you like to try a different date?"
        
        elif intent == 'list_appointments':
            # Default to next 7 days
            start_date = datetime.now()
            end_date = start_date + timedelta(days=7)
            
            appointments = AppointmentService.get_appointments(start_date, end_date)
            response_data['data'] = appointments
            
            if appointments:
                count = len(appointments)
                response_data['reply'] = f"You have {count} appointment{'s' if count != 1 else ''} coming up in the next week."
            else:
                response_data['reply'] = "You don't have any appointments scheduled for the next week."
        
        return jsonify({'success': True, 'data': response_data})
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({
            'success': False, 
            'error': 'Internal server error'
        }), 500

@app.route('/api/appointments', methods=['GET', 'POST'])
def appointments():
    if request.method == 'GET':
        try:
            start_date = request.args.get('start')
            end_date = request.args.get('end')
            
            start_dt = datetime.fromisoformat(start_date) if start_date else None
            end_dt = datetime.fromisoformat(end_date) if end_date else None
            
            appointments = AppointmentService.get_appointments(start_dt, end_dt)
            return jsonify({'success': True, 'data': appointments})
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            appointment = AppointmentService.create_appointment(data)
            
            if appointment:
                return jsonify({'success': True, 'data': appointment}), 201
            else:
                return jsonify({'success': False, 'error': 'Failed to create appointment'}), 400
                
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/availability', methods=['POST'])
def check_availability():
    try:
        data = request.get_json()
        date = datetime.fromisoformat(data['date'])
        duration = data.get('duration', 60)
        
        available_slots = AppointmentService.check_availability(date, duration)
        return jsonify({'success': True, 'data': available_slots})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/appointments/<appointment_id>', methods=['DELETE', 'PUT'])
def appointment_detail(appointment_id):
    if request.method == 'DELETE':
        try:
            query = "UPDATE appointments SET status = 'cancelled' WHERE id = %s"
            rows_affected = db.execute_query(query, (appointment_id,))
            
            if rows_affected > 0:
                return jsonify({'success': True, 'message': 'Appointment cancelled successfully'})
            else:
                return jsonify({'success': False, 'error': 'Appointment not found'}), 404
                
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    elif request.method == 'PUT':
        try:
            data = request.get_json()
            
            # Build update query dynamically
            update_fields = []
            params = []
            
            for field in ['title', 'description', 'location']:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    params.append(data[field])
            
            if 'startTime' in data:
                update_fields.append("start_time = %s")
                params.append(datetime.fromisoformat(data['startTime']))
            
            if 'endTime' in data:
                update_fields.append("end_time = %s")
                params.append(datetime.fromisoformat(data['endTime']))
            
            if 'attendees' in data:
                update_fields.append("attendees = %s")
                params.append(json.dumps(data['attendees']))
            
            if not update_fields:
                return jsonify({'success': False, 'error': 'No fields to update'}), 400
            
            update_fields.append("updated_at = %s")
            params.append(datetime.now())
            params.append(appointment_id)
            
            query = f"UPDATE appointments SET {', '.join(update_fields)} WHERE id = %s"
            rows_affected = db.execute_query(query, tuple(params))
            
            if rows_affected > 0:
                updated_appointment = AppointmentService.get_appointment(appointment_id)
                return jsonify({'success': True, 'data': updated_appointment})
            else:
                return jsonify({'success': False, 'error': 'Appointment not found'}), 404
                
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Initialize database
    from database import init_database
    init_database()
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)