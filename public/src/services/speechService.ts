import { VoiceSettings } from '../types';

class SpeechService {
  private synthesis: SpeechSynthesis;
  private recognition: SpeechRecognition | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionConstructor = 
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionConstructor();
      this.setupRecognition();
    }

    // Load voices when they become available
    this.synthesis.addEventListener('voiceschanged', this.loadVoices.bind(this));
  }

  private loadVoices(): void {
    this.voices = this.synthesis.getVoices();
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('en'));
  }

  speak(text: string, settings: VoiceSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!settings.enabled) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      if (settings.voice) {
        utterance.voice = settings.voice;
      }
      
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking(): void {
    this.synthesis.cancel();
  }

  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const handleResult = (event: SpeechRecognitionEvent) => {
        const result = event.results[0][0].transcript;
        resolve(result);
      };

      const handleError = (error: SpeechRecognitionErrorEvent) => {
        reject(new Error(`Speech recognition error: ${error.error}`));
      };

      const handleEnd = () => {
        this.recognition?.removeEventListener('result', handleResult);
        this.recognition?.removeEventListener('error', handleError);
        this.recognition?.removeEventListener('end', handleEnd);
      };

      this.recognition.addEventListener('result', handleResult);
      this.recognition.addEventListener('error', handleError);
      this.recognition.addEventListener('end', handleEnd);

      this.recognition.start();
    });
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window && 
           ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }
}

export const speechService = new SpeechService();

// Extend window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}