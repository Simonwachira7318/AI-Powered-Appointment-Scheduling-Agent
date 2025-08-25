import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import StatusIndicator from './StatusIndicator';
import VoiceVisualizer from './VoiceVisualizer';

const ChatInterface: React.FC = () => {
  const { messages, isListening, isThinking, isTyping } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Scheduler Bot</h1>
              <p className="text-sm text-gray-500">Your AI appointment assistant</p>
            </div>
          </div>
          <StatusIndicator />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Scheduler Bot!
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              I can help you schedule appointments, check your availability, and manage your calendar. 
              Try asking me something like:
            </p>
            <div className="space-y-2 text-sm text-gray-500 max-w-sm mx-auto">
              <div className="bg-white rounded-lg p-3 text-left shadow-sm">
                "Schedule a meeting with John at 2 PM tomorrow"
              </div>
              <div className="bg-white rounded-lg p-3 text-left shadow-sm">
                "Am I free on Friday at 3 PM?"
              </div>
              <div className="bg-white rounded-lg p-3 text-left shadow-sm">
                "What's on my schedule for next week?"
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">AI</span>
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 max-w-md shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Visualizer */}
      {isListening && <VoiceVisualizer />}

      {/* Input Area */}
      <InputArea />
    </div>
  );
};

export default ChatInterface;