export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'text' | 'appointment' | 'availability' | 'error';
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
  status: 'scheduled' | 'cancelled' | 'completed';
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface ChatState {
  messages: Message[];
  isListening: boolean;
  isThinking: boolean;
  isTyping: boolean;
  currentStep?: string;
  pendingAppointment?: Partial<Appointment>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface VoiceSettings {
  enabled: boolean;
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
}