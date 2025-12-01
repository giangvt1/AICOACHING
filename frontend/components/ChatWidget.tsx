import { useState } from 'react';
import { apiPost } from '../utils/api';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn giải đáp thắc mắc về Toán 10. Hãy hỏi tôi bất cứ điều gì! 😊'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    '📐 Bất phương trình bậc nhất là gì?',
    '📊 Cách tính sin, cos, tan?',
    '➕ Phép toán vectơ cơ bản',
    '🔢 Giải phương trình đường tròn'
  ];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiPost('/assistant/explain', {
        problem: input
      });
      
      // Backend returns { text: "..." }
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.text || response.explanation || 'Xin lỗi, tôi không thể trả lời câu hỏi này. 🤔'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: '⚠️ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau hoặc diễn đạt câu hỏi khác.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center z-50 animate-float hover:animate-none"
          style={{ boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)' }}
        >
          <span className="text-3xl sm:text-4xl">💬</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-96 h-[80vh] sm:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-blue-200 animate-scale-in"
          style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-float">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Trợ lý</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs opacity-90">Đang hoạt động</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:rotate-90"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-blue-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md transition-all hover:shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-none'
                      : 'bg-white border-2 border-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">🤖</span>
                      <span className="text-xs font-semibold text-blue-600">AI Trợ lý</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border-2 border-gray-200 rounded-2xl rounded-bl-none px-5 py-3 shadow-md">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">🤖</span>
                    <span className="text-xs font-semibold text-blue-600">Đang suy nghĩ...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 py-3 border-t-2 border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 animate-fade-in">
              <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>Gợi ý câu hỏi:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.slice(0, 2).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-xs bg-white text-blue-700 px-4 py-2 rounded-full border-2 border-blue-200 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all hover:shadow-md font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t-2 border-gray-100 bg-white rounded-b-2xl">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                rows={2}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end shadow-md hover:shadow-lg"
              >
                <span className="text-2xl">📤</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <span>💬</span>
              <span>Nhấn Enter để gửi</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

