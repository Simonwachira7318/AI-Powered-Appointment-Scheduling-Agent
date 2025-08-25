import React, { useState, useRef } from 'react';
import { Send, Mic, MicOff, Settings } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { apiService } from '../services/api';
import { speechService } from '../services/speechService';

const InputArea: React.FC = () => {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    isThinking,
    voiceSettings,
    setListening,
    setThinking,
    setTyping,
    addMessage,
    setVoiceSettings,
  } = useChatStore();

  const handleSubmit = async (message: string) => {
    if (!message.trim() || isThinking) return;

    // Add user message
    addMessage({
      content: message,
      sender: 'user',
    });

    // Clear input
    setInput('');

    // Set thinking state
    setThinking(true);
    setTyping(true);

    try {
      // Send to API
      const response = await apiService.sendMessage(message);

      if (response.success && response.data) {
        // Add agent response
        addMessage({
          content: response.data.reply,
          sender: 'agent',
          type: response.data.action || 'text',
        });

        // Speak the response if voice is enabled
        if (voiceSettings.enabled) {
          await speechService.speak(response.data.reply, voiceSettings);
        }
      } else {
        // Handle error
        addMessage({
          content: response.error || 'Sorry, I encountered an error processing your request.',
          sender: 'agent',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        content: 'Sorry, I\'m having trouble connecting right now. Please try again.',
        sender: 'agent',
        type: 'error',
      });
    } finally {
      setThinking(false);
      setTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const handleVoiceInput = async () => {
    if (!speechService.isSupported()) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      setListening(false);
      speechService.stopListening();
      return;
    }

    try {
      setListening(true);
      const result = await speechService.startListening();
      setInput(result);
      setListening(false);
    } catch (error) {
      console.error('Speech recognition error:', error);
      setListening(false);
      alert('Voice input failed. Please try again.');
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  return (
    <>
      {/* Voice Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Voice Settings</h3>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={voiceSettings.enabled}
                  onChange={(e) => setVoiceSettings({ enabled: e.target.checked })}
                  className="mr-2"
                />
                Enable voice responses
              </label>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Speech Rate: {voiceSettings.rate.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.rate}
                  onChange={(e) => setVoiceSettings({ rate: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Pitch: {voiceSettings.pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={voiceSettings.pitch}
                  onChange={(e) => setVoiceSettings({ pitch: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Volume: {Math.round(voiceSettings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.volume}
                  onChange={(e) => setVoiceSettings({ volume: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          {/* Voice Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Voice Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening..." : "Type your message or use voice input..."}
              disabled={isThinking || isListening}
              className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[48px] max-h-[120px]"
              rows={1}
            />
            
            {/* Character count */}
            {input.length > 0 && (
              <div className="absolute bottom-1 right-1 text-xs text-gray-400">
                {input.length}
              </div>
            )}
          </div>

          {/* Voice Input Button */}
          <button
            onClick={handleVoiceInput}
            disabled={isThinking}
            className={`p-3 rounded-full transition-all duration-200 ${
              isListening
                ? 'bg-red-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Send Button */}
          <button
            onClick={() => handleSubmit(input)}
            disabled={!input.trim() || isThinking}
            className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Status Text */}
        {(isThinking || isListening) && (
          <div className="text-center text-sm text-gray-500 mt-2">
            {isListening && "🎤 Listening... Speak now"}
            {isThinking && "🤔 Thinking..."}
          </div>
        )}
      </div>
    </>
  );
};

export default InputArea;