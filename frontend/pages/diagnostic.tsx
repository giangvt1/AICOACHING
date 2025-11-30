import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../utils/api';
import { useRouter } from 'next/router';
import { useToast } from '../components/Toast';

type Chapter = { id: number; name: string; description: string; };

type Item = { topic_id: number; total_questions: number; correct: number };

// 5 chương chính - hardcoded theo cấu trúc file MD
const CHAPTERS: Chapter[] = [
  { id: 1, name: 'Chương I', description: 'Mệnh đề và Tập hợp' },
  { id: 2, name: 'Chương II', description: 'Bất phương trình' },
  { id: 3, name: 'Chương III', description: 'Góc lượng giác và Hệ thức lượng' },
  { id: 4, name: 'Chương IV', description: 'Vectơ' },
  { id: 5, name: 'Chương V', description: 'Phương trình đường thẳng và đường tròn' },
];

export default function DiagnosticPage() {
  const router = useRouter();
  const [items, setItems] = useState<Record<number, Item>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    // Initialize with 10 total questions per chapter
    const init: Record<number, Item> = {};
    CHAPTERS.forEach((ch) => { 
      init[ch.id] = { topic_id: ch.id, total_questions: 10, correct: 0 }; 
    });
    setItems(init);
    setLoading(false);
  }, []);

  const updateItem = (topicId: number, field: 'total_questions' | 'correct', value: number) => {
    setItems(prev => {
      const item = prev[topicId] || { topic_id: topicId, total_questions: 10, correct: 0 };
      const updated = { ...item, [field]: value };
      // Ensure correct doesn't exceed total
      if (field === 'total_questions') {
        updated.correct = Math.min(updated.correct, value);
      } else if (value > updated.total_questions) {
        updated.correct = updated.total_questions;
      }
      return { ...prev, [topicId]: updated };
    });
  };

  const submit = async () => {
    setError(null);
    const payload = { items: Object.values(items).filter(i => i.total_questions > 0) };
    
    if (payload.items.length === 0) { 
      showToast('Vui lòng nhập kết quả ít nhất một chủ đề', 'error'); 
      return; 
    }

    try {
      setSubmitting(true);
      await apiPost('/diagnostic/submit', payload);
      showToast('Kết quả đã được lưu thành công!', 'success');
      
      // Redirect to analysis after 1.5 seconds
      setTimeout(() => {
        router.push('/analysis');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      showToast(err.message || 'Không thể lưu kết quả', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getPercentage = (topicId: number) => {
    const item = items[topicId];
    if (!item || item.total_questions === 0) return 0;
    return Math.round((item.correct / item.total_questions) * 100);
  };

  const getPercentColor = (percent: number) => {
    if (percent >= 75) return 'text-green-600';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-5xl mx-auto">
      {ToastComponent}
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 Kiểm tra Chẩn đoán</h1>
        <p className="text-gray-600">Nhập kết quả bài kiểm tra của bạn để AI phân tích năng lực</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-3xl">💡</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Hướng dẫn</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Nhập số câu hỏi tổng cộng và số câu trả lời đúng cho mỗi chủ đề</li>
              <li>• AI sẽ phân tích điểm mạnh, điểm yếu và tạo lộ trình học tập cá nhân hóa</li>
              <li>• Bạn có thể bỏ qua các chủ đề chưa học (để 0 câu hỏi)</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Topics Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {CHAPTERS.map((chapter, idx) => {
            const percent = getPercentage(chapter.id);
            const item = items[chapter.id] || { total_questions: 10, correct: 0 };
            
            return (
              <div key={chapter.id} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                      <h3 className="font-semibold text-gray-800">{chapter.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                  </div>
                  {item.total_questions > 0 && (
                    <span className={`text-2xl font-bold ${getPercentColor(percent)}`}>
                      {percent}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tổng câu hỏi
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-center font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={item.total_questions}
                      onChange={e => updateItem(chapter.id, 'total_questions', Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số câu đúng
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={item.total_questions}
                      className="w-full border-2 border-green-300 rounded-lg px-3 py-2 text-center font-semibold focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={item.correct}
                      onChange={e => updateItem(chapter.id, 'correct', Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Progress Bar */}
                {item.total_questions > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          percent >= 75 ? 'bg-green-500' : 
                          percent >= 50 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center gap-4">
        <button
          onClick={submit}
          disabled={submitting || loading}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold px-8 py-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg text-lg"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Đang xử lý...
            </span>
          ) : (
            '✨ Phân tích với AI'
          )}
        </button>
      </div>

      {/* Bottom Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Sau khi gửi, bạn sẽ được chuyển đến trang phân tích kết quả</p>
      </div>
    </div>
  );
}
