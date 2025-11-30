import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiGet } from '../../../utils/api';
import withAdminAuth from '../../../utils/withAdminAuth';
import AdminLayout from '../../../components/AdminLayout';
import Link from 'next/link';
import RadarChart from '../../../components/RadarChart';

type Student = {
  id: number;
  email: string;
  full_name: string | null;
  school: string | null;
  grade: string | null;
  created_at: string;
};

type Progress = {
  student_id: number;
  student_email: string;
  student_name: string | null;
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  discipline_score: number;
  topics_mastered: number;
  weak_topics: number;
  mastery_radar: { topic_id: number; topic_name: string; percent: number }[];
};

type DiagnosticData = {
  student_id: number;
  student_email: string;
  chapters: {
    chapter_id: number;
    chapter_name: string;
    results: { id: number; percent: number; mastery_level: number; timestamp: string }[];
  }[];
};

type ExerciseData = {
  student_id: number;
  student_email: string;
  total_exercises: number;
  correct_exercises: number;
  accuracy: number;
  exercises: { id: number; question_id: number; is_correct: boolean; timestamp: string; time_spent_sec: number }[];
};

function StudentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [exercises, setExercises] = useState<ExerciseData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostic' | 'exercises'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadStudentData();
    }
  }, [id]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const [studentData, progressData, diagnosticData, exerciseData] = await Promise.all([
        apiGet(`/admin/students/${id}`),
        apiGet(`/admin/students/${id}/progress`),
        apiGet(`/admin/students/${id}/diagnostic`),
        apiGet(`/admin/students/${id}/exercises?limit=50`)
      ]);
      
      setStudent(studentData);
      setProgress(progressData);
      setDiagnostic(diagnosticData);
      setExercises(exerciseData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-600">Loading student data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !student || !progress) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error || 'Student not found'}</p>
          <Link href="/admin/students" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Back to students list
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const radarData = progress.mastery_radar.map(t => ({
    label: t.topic_name.length > 20 ? t.topic_name.substring(0, 20) + '...' : t.topic_name,
    value: t.percent,
  }));

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Back Button */}
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-4 hover:underline"
        >
          <span>←</span>
          <span>Back to Students</span>
        </Link>

        {/* Student Header */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-xl shadow-xl p-8 mb-6 text-white">
          <div className="flex items-center gap-6">
            <div className="text-7xl">👨‍🎓</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{student.full_name || 'Anonymous Student'}</h1>
              <p className="text-lg opacity-90 mb-3">{student.email}</p>
              <div className="flex flex-wrap gap-3">
                {student.school && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    🏫 {student.school}
                  </span>
                )}
                {student.grade && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    📚 {student.grade}
                  </span>
                )}
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  📅 Joined {new Date(student.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Sessions</p>
            <p className="text-3xl font-bold text-gray-900">{progress.completed_sessions}/{progress.total_sessions}</p>
            <p className="text-xs text-blue-600 mt-1">{progress.completion_rate.toFixed(1)}% complete</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Discipline</p>
            <p className="text-3xl font-bold text-gray-900">{progress.discipline_score.toFixed(0)}%</p>
            <p className="text-xs text-green-600 mt-1">Attendance score</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-purple-500">
            <p className="text-sm text-gray-600 mb-1">Mastered</p>
            <p className="text-3xl font-bold text-gray-900">{progress.topics_mastered}</p>
            <p className="text-xs text-purple-600 mt-1">Topics strong</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-orange-500">
            <p className="text-sm text-gray-600 mb-1">Weak Topics</p>
            <p className="text-3xl font-bold text-gray-900">{progress.weak_topics}</p>
            <p className="text-xs text-orange-600 mt-1">Need improvement</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveTab('diagnostic')}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'diagnostic'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📝 Diagnostic
              </button>
              <button
                onClick={() => setActiveTab('exercises')}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'exercises'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ✨ Exercises
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {radarData.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Mastery Radar</h3>
                    <RadarChart data={radarData} />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No mastery data available</p>
                )}
              </div>
            )}

            {activeTab === 'diagnostic' && diagnostic && (
              <div className="space-y-4">
                {diagnostic.chapters.length > 0 ? (
                  diagnostic.chapters.map((chapter) => (
                    <div key={chapter.chapter_id} className="bg-gray-50 rounded-lg p-5">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">{chapter.chapter_name}</h3>
                      <div className="space-y-2">
                        {chapter.results.map((result) => (
                          <div key={result.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-700">Test #{result.id}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(result.timestamp).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`font-bold ${result.percent >= 75 ? 'text-green-600' : result.percent >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {result.percent}%
                              </span>
                              <span className="text-gray-500">Level {result.mastery_level}/5</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No diagnostic data available</p>
                )}
              </div>
            )}

            {activeTab === 'exercises' && exercises && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-3xl font-bold text-blue-600">{exercises.total_exercises}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Correct</p>
                    <p className="text-3xl font-bold text-green-600">{exercises.correct_exercises}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                    <p className="text-3xl font-bold text-purple-600">{exercises.accuracy.toFixed(1)}%</p>
                  </div>
                </div>

                {exercises.exercises.length > 0 ? (
                  <div className="space-y-2">
                    {exercises.exercises.map((exercise) => (
                      <div key={exercise.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl ${exercise.is_correct ? '✅' : '❌'}`}></span>
                          <div>
                            <p className="font-semibold text-gray-800">Question #{exercise.question_id}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(exercise.timestamp).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Time: {exercise.time_spent_sec}s</p>
                          <p className={`text-sm font-semibold ${exercise.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                            {exercise.is_correct ? 'Correct' : 'Incorrect'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No exercise data available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(StudentDetailPage);

