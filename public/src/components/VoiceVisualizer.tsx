import React from 'react';

const VoiceVisualizer: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full mx-4">
        <div className="mb-6">
          <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-full"></div>
            </div>
          </div>
          
          {/* Sound waves animation */}
          <div className="flex items-center justify-center space-x-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-red-500 to-pink-600 rounded-full animate-pulse"
                style={{
                  height: Math.random() * 40 + 20,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">Listening...</h3>
        <p className="text-gray-600 text-sm">
          Speak clearly into your microphone. I'm listening for your appointment request.
        </p>
      </div>
    </div>
  );
};

export default VoiceVisualizer;