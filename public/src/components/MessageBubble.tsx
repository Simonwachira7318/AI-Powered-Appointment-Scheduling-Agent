import React from 'react';
import { Message } from '../types';
import { Clock, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  const getTypeIcon = () => {
    switch (message.type) {
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'availability':
        return <Clock className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeColor = () => {
    switch (message.type) {
      case 'appointment':
        return 'text-green-600';
      case 'availability':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
          : 'bg-gradient-to-r from-blue-500 to-indigo-600'
      }`}>
        <span className="text-white font-bold text-xs">
          {isUser ? 'U' : 'AI'}
        </span>
      </div>

      {/* Message Content */}
      <div className={`max-w-md ${isUser ? 'ml-auto' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
          isUser 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
            : 'bg-white text-gray-900'
        }`}>
          {/* Type indicator */}
          {!isUser && message.type && message.type !== 'text' && (
            <div className={`flex items-center space-x-1 mb-2 text-sm ${getTypeColor()}`}>
              {getTypeIcon()}
              <span className="capitalize">{message.type}</span>
            </div>
          )}

          {/* Message text */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;