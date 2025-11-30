import { useEffect, useState } from 'react';
import { apiGet } from '../utils/api';
import CircularProgress from '../components/CircularProgress';
import BarChart from '../components/BarChart';
import RadarChart from '../components/RadarChart';
import { CardSkeleton } from '../components/LoadingSkeleton';

type Overview = {
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  completion_percent: number;
  discipline_score: number;
  topics_mastered: number;
  weak_topics: number;
  mastery_radar: { topic_id: number; topic_name: string; percent: number }[];
}

export default function ProgressPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const v = await apiGet('/progress/overview');
        setData(v);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chưa có dữ liệu</h2>
          <p className="text-gray-600">Hãy bắt đầu học tập để xem tiến độ của bạn</p>
        </div>
      </div>
    );
  }

  const barData = data.mastery_radar.slice(0, 8).map(topic => ({
    label: topic.topic_name.length > 15 ? topic.topic_name.substring(0, 12) + '...' : topic.topic_name,
    value: topic.percent,
    color: topic.percent >= 75 ? '#10b981' : topic.percent >= 50 ? '#f59e0b' : '#ef4444'
  }));

  const radarData = data.mastery_radar.map(topic => ({
    label: topic.topic_name.length > 20 ? topic.topic_name.substring(0, 20) + '...' : topic.topic_name,
    value: topic.percent
  }));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📈 Tiến độ Học tập</h1>
        <p className="text-gray-600">Theo dõi quá trình và kết quả học tập của bạn</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Circular Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Hoàn thành buổi học</h3>
            <CircularProgress 
              percentage={Math.round(data.completion_rate || data.completion_percent || 0)} 
              color="#3b82f6"
            />
            <p className="mt-4 text-sm text-gray-600">
              {data.completed_sessions} / {data.total_sessions} buổi
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Kỷ luật học tập</h3>
            <CircularProgress 
              percentage={Math.round(data.discipline_score || 0)} 
              color="#10b981"
            />
            <p className="mt-4 text-sm text-gray-600">
              {data.discipline_score >= 80 ? '🌟 Xuất sắc!' : data.discipline_score >= 60 ? '👍 Tốt!' : '💪 Cố gắng hơn!'}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Chủ đề đã vững</h3>
            <div className="text-center">
              <div className="text-6xl font-bold text-purple-600 mb-2">{data.topics_mastered}</div>
              <p className="text-sm text-gray-600">
                {data.weak_topics > 0 && `${data.weak_topics} chủ đề cần cải thiện`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>📊</span> Điểm số theo Chủ đề
          </h2>
          {barData.length > 0 ? (
            <BarChart data={barData} height={250} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p>Chưa có dữ liệu</p>
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span>🎯</span> Năng lực Tổng quan
          </h2>
          {radarData.length > 0 ? (
            <RadarChart data={radarData} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p>Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Topics Breakdown */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">📚 Chi tiết Chủ đề</h2>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            {data.mastery_radar.length > 0 ? (
              <div className="space-y-3">
                {data.mastery_radar.map((topic, idx) => (
                  <div key={topic.topic_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {idx < 3 && <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>}
                        <span className="font-medium text-gray-800">{topic.topic_name}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            topic.percent >= 75 ? 'bg-green-500' : 
                            topic.percent >= 50 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}
                          style={{ width: `${topic.percent}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="ml-4 font-bold text-gray-700">{topic.percent}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">Chưa có dữ liệu chủ đề</p>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">⭐ Tổng kết</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {data.total_sessions}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Tổng buổi học</p>
                    <p className="text-sm text-gray-600">Đã lên lịch</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {data.completed_sessions}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Đã hoàn thành</p>
                    <p className="text-sm text-gray-600">Buổi học</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {data.topics_mastered}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Chủ đề vững</p>
                    <p className="text-sm text-gray-600">Đạt ≥75%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {data.weak_topics}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Cần cải thiện</p>
                    <p className="text-sm text-gray-600">Dưới 60%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-lg">
              <p className="text-center font-medium text-gray-800">
                {data.completion_rate >= 80 ? 
                  '🌟 Xuất sắc! Bạn đang học tập rất tốt!' : 
                  data.completion_rate >= 50 ? 
                  '👍 Bạn đang trên đúng hướng! Tiếp tục phát huy!' :
                  '💪 Hãy cố gắng hoàn thành nhiều buổi học hơn nhé!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
