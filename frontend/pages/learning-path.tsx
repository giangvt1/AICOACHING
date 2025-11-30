import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../utils/api';
import TimelineView from '../components/TimelineView';
import AIInsightCard from '../components/AIInsightCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

type LPItem = { 
  id: number; 
  topic_id: number; 
  phase: string; 
  priority_rank: number;
};

type TimelineItem = {
  id: number;
  topic_name: string;
  phase: string;
  priority_rank: number;
  description?: string;
  isCompleted?: boolean;
};

// Chapter names mapping (consistent with diagnostic and backend)
const CHAPTER_NAMES: Record<number, string> = {
  1: "Chương I: Mệnh đề và Tập hợp",
  2: "Chương II: Bất phương trình",
  3: "Chương III: Góc lượng giác và Hệ thức lượng",
  4: "Chương IV: Vectơ",
  5: "Chương V: Phương trình đường thẳng và đường tròn",
};

export default function LearningPathPage() {
  const [items, setItems] = useState<LPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [pathData, insightsData] = await Promise.all([
        apiGet('/learning-path').catch(() => []),
        apiGet('/analysis/insights').catch(() => null),
      ]);
      setItems(pathData);
      setInsights(insightsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await apiPost('/learning-path/generate', {});
      showToast('Lộ trình học tập đã được tạo thành công!', 'success');
      await load();
    } catch (err: any) {
      setError(err.message);
      showToast(err.message || 'Không thể tạo lộ trình', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Map learning path items to timeline items with chapter names
  const timelineItems: TimelineItem[] = items.map(item => {
    const chapterName = CHAPTER_NAMES[item.topic_id] || `Chương ${item.topic_id}`;
    return {
      id: item.id,
      topic_name: chapterName,
      phase: item.phase,
      priority_rank: item.priority_rank,
      isCompleted: false,
    };
  });

  const getAIExplanation = () => {
    if (!insights) return null;

    return {
      strategy: `AI đã phân tích kết quả chẩn đoán của bạn và xác định ${insights.weak_count} chuyên đề cần cải thiện, ${insights.average_count} chuyên đề trung bình, và ${insights.strong_count} chuyên đề bạn đã nắm vững. Dựa trên đó, lộ trình được thiết kế để tối ưu hóa việc học từ nền tảng đến nâng cao.`,
      phases: [
        `📘 **Giai đoạn Nền tảng**: Tập trung vào các chuyên đề yếu nhất để xây dựng nền tảng vững chắc.`,
        `🎯 **Giai đoạn Trọng tâm**: Học các chuyên đề quan trọng và có độ khó trung bình để nâng cao năng lực.`,
        `📝 **Giai đoạn Ôn tập**: Củng cố kiến thức, luyện đề và chuẩn bị cho kỳ thi.`
      ],
      timeline: `Dự kiến hoàn thành trong ${insights.estimated_weeks} tuần nếu bạn học đều đặn.`
    };
  };

  const aiExplanation = getAIExplanation();

  const stats = {
    foundation: items.filter(i => i.phase === 'foundation').length,
    focus: items.filter(i => i.phase === 'focus').length,
    review: items.filter(i => i.phase === 'review').length,
    total: items.length,
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <CardSkeleton />
        <div className="mt-6">
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {ToastComponent}
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🗺️ Lộ trình Học tập Cá nhân hóa</h1>
        <p className="text-gray-600">Được thiết kế bởi AI dựa trên năng lực và mục tiêu của bạn</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* AI Strategy Explanation */}
      {items.length > 0 && aiExplanation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AIInsightCard
            title="Chiến lược AI"
            content={aiExplanation.strategy}
            icon="🤖"
            variant="primary"
          />
          <AIInsightCard
            title="Cấu trúc Lộ trình"
            content={aiExplanation.phases}
            icon="📚"
            variant="info"
          />
        </div>
      )}

      {/* Stats Cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nền tảng</p>
                <p className="text-3xl font-bold text-gray-900">{stats.foundation}</p>
              </div>
              <div className="text-3xl">🏗️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Trọng tâm</p>
                <p className="text-3xl font-bold text-gray-900">{stats.focus}</p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ôn tập</p>
                <p className="text-3xl font-bold text-gray-900">{stats.review}</p>
              </div>
              <div className="text-3xl">📝</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng cộng</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Timeline Học tập</h2>
          <button
            onClick={generate}
            disabled={generating}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Đang tạo...
              </span>
            ) : items.length > 0 ? (
              '🔄 Tạo lại'
            ) : (
              '✨ Tạo lộ trình'
            )}
          </button>
        </div>

        <TimelineView items={timelineItems} />

        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              Chưa có lộ trình học tập
            </h3>
            <p className="text-gray-600 mb-6">
              Hãy hoàn thành bài kiểm tra chẩn đoán trước, sau đó nhấn "Tạo lộ trình" để AI tạo lộ trình cá nhân hóa cho bạn
            </p>
            <div className="inline-block bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Lưu ý:</strong> AI sẽ phân tích kết quả chẩn đoán và mục tiêu của bạn để tạo lộ trình tối ưu nhất
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Explanation */}
      {items.length > 0 && aiExplanation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-green-900 flex items-center gap-2">
              <span>⏱️</span> Thời gian học
            </h3>
            <p className="text-green-800">{aiExplanation.timeline}</p>
            <p className="text-sm text-green-700 mt-2">
              Dựa trên thời gian rảnh bạn đã khai báo
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-yellow-900 flex items-center gap-2">
              <span>💡</span> Bước tiếp theo
            </h3>
            <p className="text-yellow-800 mb-3">
              Sau khi có lộ trình, hãy tạo lịch học để bắt đầu!
            </p>
            <a
              href="/schedule"
              className="inline-block bg-yellow-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
            >
              📅 Tạo lịch học →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
