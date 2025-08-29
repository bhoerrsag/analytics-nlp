'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Sorry, I encountered an error.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">A</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-black">Analytics Assistant</h1>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-black mb-2">
                  What would you like to know?
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Ask me about your dealership analytics, performance metrics, or any insights you need.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <button 
                    onClick={() => setInputValue("Show me traffic by city for the last 30 days")}
                    className="p-3 text-left bg-white hover:bg-gray-50 rounded-lg border border-gray-300 hover:border-black transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-black">📍</span>
                      <span className="text-sm text-black font-medium">Traffic by city analysis</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setInputValue("Vehicle inventory page views by condition")}
                    className="p-3 text-left bg-white hover:bg-gray-50 rounded-lg border border-gray-300 hover:border-black transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-black">🚗</span>
                      <span className="text-sm text-black font-medium">Vehicle inventory insights</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setInputValue("Mobile vs desktop traffic analysis")}
                    className="p-3 text-left bg-white hover:bg-gray-50 rounded-lg border border-gray-300 hover:border-black transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-black">📱</span>
                      <span className="text-sm text-black font-medium">Device performance data</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setInputValue("Top performing marketing campaigns")}
                    className="p-3 text-left bg-white hover:bg-gray-50 rounded-lg border border-gray-300 hover:border-black transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-black">📊</span>
                      <span className="text-sm text-black font-medium">Marketing campaign results</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-2xl ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
                        message.isUser 
                          ? 'bg-black text-white' 
                          : 'bg-gray-200 text-black'
                      }`}>
                        {message.isUser ? '👤' : 'A'}
                      </div>

                      <div className={`px-4 py-2 rounded-2xl ${
                        message.isUser
                          ? 'bg-black text-white rounded-br-sm'
                          : 'bg-gray-100 border border-gray-300 text-black rounded-bl-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>
                        <p className={`text-xs mt-1 ${
                          message.isUser ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3 max-w-2xl">
                      <div className="w-7 h-7 rounded-full bg-gray-200 text-black flex-shrink-0 flex items-center justify-center text-xs">
                        A
                      </div>
                      <div className="bg-gray-100 border border-gray-300 px-4 py-2 rounded-2xl rounded-bl-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-xs text-gray-700">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-300">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your analytics..."
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-black placeholder-gray-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}