import { create } from 'zustand';
import { Message, ChatState, Appointment, VoiceSettings } from '../types';

interface ChatStore extends ChatState {
  // Message actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  
  // State actions
  setListening: (isListening: boolean) => void;
  setThinking: (isThinking: boolean) => void;
  setTyping: (isTyping: boolean) => void;
  setCurrentStep: (step?: string) => void;
  setPendingAppointment: (appointment?: Partial<Appointment>) => void;
  
  // Voice settings
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: Partial<VoiceSettings>) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  messages: [],
  isListening: false,
  isThinking: false,
  isTyping: false,
  currentStep: undefined,
  pendingAppointment: undefined,
  
  voiceSettings: {
    enabled: true,
    rate: 1,
    pitch: 1,
    volume: 1,
  },

  // Message actions
  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  clearMessages: () => set({ messages: [] }),

  // State actions
  setListening: (isListening) => set({ isListening }),
  setThinking: (isThinking) => set({ isThinking }),
  setTyping: (isTyping) => set({ isTyping }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setPendingAppointment: (pendingAppointment) => set({ pendingAppointment }),

  // Voice settings
  setVoiceSettings: (settings) => set((state) => ({
    voiceSettings: { ...state.voiceSettings, ...settings }
  })),
}));