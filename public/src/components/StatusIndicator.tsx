import React from 'react';
import { useChatStore } from '../store/chatStore';
import { Mic, Brain, MessageSquare } from 'lucide-react';

const StatusIndicator: React.FC = () => {
  const { isListening, isThinking, isTyping } = useChatStore();

  if (isListening) {
    return (
      <div className="flex items-center space-x-2 text-red-500">
        <Mic className="w-4 h-4 animate-pulse" />
        <span className="text-sm font-medium">Listening</span>
      </div>
    );
  }

  if (isThinking) {
    return (
      <div className="flex items-center space-x-2 text-blue-500">
        <Brain className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Thinking</span>
      </div>
    );
  }

  if (isTyping) {
    return (
      <div className="flex items-center space-x-2 text-green-500">
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-medium">Typing</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-gray-500">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      <span className="text-sm">Online</span>
    </div>
  );
};

export default StatusIndicator;