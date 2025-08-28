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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-semibold">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Analytics Assistant</h1>
              <p className="text-sm text-slate-600">Real-time insights from your dealership data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center">
                  <span className="text-white text-2xl">🚀</span>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                    What would you like to know?
                  </h2>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Ask me anything about your dealership&apos;s performance, traffic patterns, or customer behavior.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button 
                  onClick={() => setInputValue("Show me traffic by city in Florida for the last 30 days")}
                  className="p-4 text-left bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 text-lg">📍</span>
                    <p className="text-slate-700 group-hover:text-slate-900 font-medium text-sm">
                      Show me traffic by city in Florida for the last 30 days
                    </p>
                  </div>
                </button>

                <button 
                  onClick={() => setInputValue("Vehicle inventory page views by condition (new, used, CPO) last month")}
                  className="p-4 text-left bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-emerald-600 text-lg">🚗</span>
                    <p className="text-slate-700 group-hover:text-slate-900 font-medium text-sm">
                      Vehicle inventory page views by condition (new, used, CPO) last month
                    </p>
                  </div>
                </button>

                <button 
                  onClick={() => setInputValue("Mobile vs desktop traffic and conversions last week")}
                  className="p-4 text-left bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 text-lg">📱</span>
                    <p className="text-slate-700 group-hover:text-slate-900 font-medium text-sm">
                      Mobile vs desktop traffic and conversions last week
                    </p>
                  </div>
                </button>

                <button 
                  onClick={() => setInputValue("Top performing marketing campaigns by leads generated")}
                  className="p-4 text-left bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-orange-600 text-lg">📊</span>
                    <p className="text-slate-700 group-hover:text-slate-900 font-medium text-sm">
                      Top performing marketing campaigns by leads generated
                    </p>
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
                  <div className={`flex items-start space-x-3 max-w-3xl ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      message.isUser 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {message.isUser ? '👤' : '🤖'}
                    </div>

                    <div className={`px-4 py-3 rounded-2xl ${
                      message.isUser
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md shadow-sm'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-2 ${
                        message.isUser ? 'text-blue-100' : 'text-slate-500'
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
                  <div className="flex items-start space-x-3 max-w-3xl">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex-shrink-0 flex items-center justify-center">
                      🤖
                    </div>
                    <div className="bg-white border border-slate-200 text-slate-900 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm text-slate-600 font-medium">Analyzing your data...</span>
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
      <div className="bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your dealership's analytics..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500 font-medium"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}