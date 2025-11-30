import { useEffect, useState } from 'react';
import { apiGet } from '../utils/api';
import RadarChart from '../components/RadarChart';
import AIInsightCard from '../components/AIInsightCard';
import { CardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';

type TopicSummary = {
  topic_id: number;
  topic_name: string;
  percent: number;
  mastery_level: number;
  classification: string;
  priority_score: number;
};

type AIInsights = {
  overall_assessment: string;
  priority_reasoning: string;
  recommendations: string[];
  encouragement: string;
  weak_count: number;
  average_count: number;
  strong_count: number;
  top_priority_topics: string[];
  estimated_weeks: number;
  model_used: string;
};

export default function AnalysisPage() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Load both analysis and insights in parallel
        const [analysisData, insightsData] = await Promise.all([
          apiGet('/analysis/strength-weakness'),
          apiGet('/analysis/insights')
        ]);
        setTopics(analysisData.topics);
        setInsights(insightsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Get classification badge color
  const getClassBadge = (classification: string) => {
    const styles = {
      weak: 'bg-red-100 text-red-800',
      average: 'bg-yellow-100 text-yellow-800',
      strong: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[classification as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {classification}
      </span>
    );
  };

  // Prepare radar chart data
  const radarData = topics.map(t => ({
    label: t.topic_name.length > 20 ? t.topic_name.substring(0, 20) + '...' : t.topic_name,
    value: t.percent,
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Phân tích Năng lực</h1>
        <p className="text-gray-600">Đánh giá điểm mạnh, điểm yếu và lộ trình học tập cá nhân hóa</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <TableSkeleton />
        </div>
      ) : (
        <>
          {/* AI Insights Section */}
          {insights && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Stats cards */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Điểm mạnh</p>
                    <p className="text-3xl font-bold text-green-900">{insights.strong_count}</p>
                  </div>
                  <div className="text-4xl">💪</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700 font-medium">Trung bình</p>
                    <p className="text-3xl font-bold text-yellow-900">{insights.average_count}</p>
                  </div>
                  <div className="text-4xl">📚</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 font-medium">Cần cải thiện</p>
                    <p className="text-3xl font-bold text-red-900">{insights.weak_count}</p>
                  </div>
                  <div className="text-4xl">🎯</div>
                </div>
              </div>
            </div>
          )}

          {/* Radar Chart and AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Radar Chart */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Biểu đồ Năng lực</h2>
              {topics.length > 0 ? (
                <RadarChart data={radarData} />
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">Chưa có dữ liệu</p>
                    <p className="text-sm text-gray-400">Hãy hoàn thành bài kiểm tra chẩn đoán</p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Insights */}
            {insights && (
              <div className="space-y-4">
                <AIInsightCard
                  title="Đánh giá tổng quan"
                  content={insights.overall_assessment}
                  icon="🤖"
                  variant="primary"
                />
                <div className="bg-white shadow-lg rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <p className="text-sm text-gray-600">Thời gian dự kiến</p>
                      <p className="text-2xl font-bold text-indigo-600">{insights.estimated_weeks} tuần</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Dựa trên lộ trình học tập cá nhân hóa</p>
                </div>
              </div>
            )}
          </div>

          {/* Priority Reasoning and Recommendations */}
          {insights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <AIInsightCard
                title="Tại sao ưu tiên như vậy?"
                content={insights.priority_reasoning}
                icon="🎯"
                variant="warning"
              />
              <AIInsightCard
                title="Khuyến nghị từ AI"
                content={insights.recommendations}
                icon="💡"
                variant="info"
              />
            </div>
          )}

          {/* Encouragement */}
          {insights && (
            <div className="mb-6">
              <AIInsightCard
                title="Động viên"
                content={insights.encouragement}
                icon="🌟"
                variant="success"
              />
            </div>
          )}

          {/* Detailed Table */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
              <h2 className="text-xl font-semibold text-white">Chi tiết theo Chuyên đề</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Chuyên đề</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Điểm</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Trình độ</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Phân loại</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Độ ưu tiên</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((t, idx) => (
                    <tr key={t.topic_id} className={`border-b hover:bg-gray-50 transition ${idx < 3 ? 'bg-amber-50' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {idx < 3 && <span className="text-lg">🔥</span>}
                          <span className="font-medium">{t.topic_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${t.percent >= 75 ? 'bg-green-500' : t.percent >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${t.percent}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-sm">{t.percent}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">{t.mastery_level}/5</span>
                      </td>
                      <td className="p-4">{getClassBadge(t.classification)}</td>
                      <td className="p-4">
                        <span className={`font-semibold ${idx < 3 ? 'text-red-600' : 'text-gray-600'}`}>
                          {t.priority_score.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {topics.length === 0 && (
                    <tr>
                      <td className="p-8 text-center" colSpan={5}>
                        <div className="text-gray-400">
                          <p className="text-lg mb-2">Chưa có dữ liệu phân tích</p>
                          <p className="text-sm">Hãy hoàn thành bài kiểm tra chẩn đoán để AI có thể phân tích năng lực của bạn</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model info */}
          {insights && (
            <div className="mt-4 text-center text-xs text-gray-500">
              Phân tích được tạo bởi: {insights.model_used === 'gemini-1.5-flash' ? '🤖 Gemini AI' : '📐 Thuật toán thông minh'}
            </div>
          )}
        </>
      )}
    </div>
  );
}
