import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiGeneratePlacementTest, apiSubmitPlacementTest, getToken } from '../utils/api';
import CircularProgress from '../components/CircularProgress';

type Question = {
  id: string;
  question_number: number;
  text: string;
  type: 'mcq' | 'open';
  chapter: string;
  options?: string[];
};

type PlacementTest = {
  test_id: string;
  num_questions: number;
  time_limit_minutes: number;
  instructions: string;
  questions: Question[];
};

type ChapterPerformance = {
  chapter: string;
  correct: number;
  total: number;
  score: number;
};

type StrengthWeakness = {
  chapter: string;
  score: number;
  correct: number;
  total: number;
};

type IncorrectQuestion = {
  id: string;
  chapter: string;
  text: string;
  student_answer: string;
  correct_answer: string;
  explanation: string;
};

type TestResult = {
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  score: number;
  level: string;
  level_name: string;
  recommendation: string;
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  chapter_performance: ChapterPerformance[];
  incorrect_questions: IncorrectQuestion[];
  question_reviews: QuestionReview[];
};

type QuestionReview = {
  question: Question;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  solution_steps?: string[];
  key_concepts?: string[];
};

export default function PlacementTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [test, setTest] = useState<PlacementTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0); // seconds
  const [result, setResult] = useState<TestResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [questionReviews, setQuestionReviews] = useState<QuestionReview[]>([]);
  const [selectedDetailQuestion, setSelectedDetailQuestion] = useState<QuestionReview | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    // Auto-load test on mount
    loadTest();
  }, [router]);

  const loadTest = async () => {
    try {
      setLoading(true);
      setError(null);
      // ✅ Generate 20 questions (4 per chapter x 5 chapters) as per project specification
      const data = await apiGeneratePlacementTest(20);
      setTest(data);
      setTimeLeft(data.time_limit_minutes * 60); // Convert to seconds
      setShowInstructions(true);
    } catch (err: any) {
      setError(err.message || 'Không thể tải bài kiểm tra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setShowInstructions(false);
  };

  // Timer countdown
  useEffect(() => {
    if (!test || showInstructions || result || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit(); // Auto-submit when time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, showInstructions, result, timeLeft]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!test) return;

    // Check if all questions answered
    const unanswered = test.questions.filter(q => !answers[q.id] || answers[q.id].trim() === '');
    if (unanswered.length > 0 && timeLeft > 0) {
      const confirm = window.confirm(
        `Bạn còn ${unanswered.length} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`
      );
      if (!confirm) return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const data = await apiSubmitPlacementTest(test.test_id, answers);
      setResult(data);
      setQuestionReviews(data.question_reviews || []);
    } catch (err: any) {
      setError(err.message || 'Không thể nộp bài. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'advanced': return 'text-green-600 bg-green-50 border-green-300';
      case 'intermediate': return 'text-blue-600 bg-blue-50 border-blue-300';
      case 'beginner': return 'text-yellow-600 bg-yellow-50 border-yellow-300';
      case 'foundation': return 'text-orange-600 bg-orange-50 border-orange-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-300';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'advanced': return '🥇';
      case 'intermediate': return '🥈';
      case 'beginner': return '🥉';
      case 'foundation': return '📚';
      default: return '📊';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📝</div>
          <div className="text-xl font-semibold text-gray-700">Đang tải bài kiểm tra...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadTest}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Bài kiểm tra đánh giá trình độ</h2>
          <p className="text-gray-600 mb-6">
            Bài kiểm tra này giúp chúng tôi đánh giá trình độ của bạn để đề xuất bài tập phù hợp.
          </p>
          <button
            onClick={loadTest}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Bắt đầu kiểm tra
          </button>
        </div>
      </div>
    );
  }

  // Results screen
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Kết quả kiểm tra</h1>
            <p className="text-gray-600">Đánh giá trình độ của bạn</p>
          </div>

          {/* Score Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
              {/* Score */}
              <div className="text-center">
                <CircularProgress percentage={result.score} size={180} />
                <div className="mt-4">
                  <div className="text-3xl font-bold text-gray-800">{result.score.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">
                    {result.correct_count}/{result.total_questions} câu đúng
                  </div>
                </div>
              </div>

              {/* Level */}
              <div className="text-center">
                <div className="text-6xl mb-4">{getLevelIcon(result.level)}</div>
                <div className={`inline-block px-6 py-3 rounded-full border-2 ${getLevelColor(result.level)}`}>
                  <div className="text-2xl font-bold">{result.level_name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-6 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <div className="text-3xl">💡</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Đề xuất cho bạn</h3>
                <p className="text-gray-700">{result.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in-up">
              <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
                <span>💪</span>
                <span>Điểm mạnh của bạn</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {result.strengths.map((s, idx) => (
                  <div key={idx} className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                    <div className="font-semibold text-gray-800 mb-1">{s.chapter}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {s.correct}/{s.total} câu đúng
                      </span>
                      <span className="text-lg font-bold text-green-600">{s.score.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {result.weaknesses.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in-up">
              <h3 className="text-xl font-bold text-orange-600 mb-4 flex items-center gap-2">
                <span>📚</span>
                <span>Cần cải thiện</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {result.weaknesses.map((w, idx) => (
                  <div key={idx} className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <div className="font-semibold text-gray-800 mb-1">{w.chapter}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {w.correct}/{w.total} câu đúng
                      </span>
                      <span className="text-lg font-bold text-orange-600">{w.score.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapter Performance */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span>
              <span>Kết quả theo chương</span>
            </h3>
            <div className="space-y-3">
              {result.chapter_performance.map((perf, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700">{perf.chapter}</span>
                    <span className="text-sm text-gray-600">
                      {perf.correct}/{perf.total} câu
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        perf.score >= 70 ? 'bg-green-500' :
                        perf.score >= 50 ? 'bg-blue-500' :
                        perf.score >= 30 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${perf.score}%` }}
                    />
                  </div>
                  <div className="text-right text-sm text-gray-600 mt-1">
                    {perf.score.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ✅ DETAILED QUESTION REVIEWS */}
          {questionReviews.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in-up">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📝</span>
                <span>Chi tiết từng câu hỏi</span>
              </h3>
              <div className="space-y-4">
                {questionReviews.map((review, idx) => (
                  <div 
                    key={idx} 
                    className={`border-2 rounded-xl p-4 transition ${
                      review.is_correct 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        review.is_correct ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {review.is_correct ? '✓' : '✗'}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">
                          Câu {review.question.question_number} • {review.question.chapter}
                        </div>
                        <div className="font-medium text-gray-800 mb-2">{review.question.text}</div>
                        
                        {/* Options */}
                        {review.question.options && (
                          <div className="space-y-1 ml-4 mb-2">
                            {review.question.options.map((option, optIdx) => {
                              const letter = option.match(/^([A-D])\./)?.[1] || String.fromCharCode(65 + optIdx);
                              const isStudentAnswer = review.student_answer.toUpperCase() === letter;
                              const isCorrectAnswer = review.correct_answer.toUpperCase() === letter;
                              
                              return (
                                <div 
                                  key={optIdx} 
                                  className={`text-sm p-2 rounded ${
                                    isCorrectAnswer 
                                      ? 'bg-green-100 border border-green-400 font-semibold' 
                                      : isStudentAnswer 
                                      ? 'bg-red-100 border border-red-400' 
                                      : 'bg-white'
                                  }`}
                                >
                                  {option}
                                  {isCorrectAnswer && <span className="ml-2 text-green-600">✓ Đúng</span>}
                                  {isStudentAnswer && !isCorrectAnswer && <span className="ml-2 text-red-600">✗ Bạn chọn</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Quick Explanation */}
                        {review.explanation && (
                          <div className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg mb-2">
                            <strong className="text-gray-800">💡 Giải thích:</strong> {review.explanation}
                          </div>
                        )}
                        
                        {/* Detailed Solution Button */}
                        {((review.solution_steps?.length ?? 0) > 0 || (review.key_concepts?.length ?? 0) > 0) && (
                          <button
                            onClick={() => setSelectedDetailQuestion(review)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center gap-1 transition"
                          >
                            <span>📖</span>
                            <span>Xem lời giải chi tiết</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="text-center animate-fade-in-up">
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Tiếp tục học tập →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Instructions screen
  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 animate-fade-in-up">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Bài kiểm tra đánh giá trình độ</h1>
            <p className="text-gray-600">Toán 10 - Tất cả các chương</p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">📋 Hướng dẫn:</h3>
            <div className="space-y-2 text-gray-700">
              <p>• <strong>{test.num_questions} câu hỏi trắc nghiệm</strong> từ 5 chương (Mệnh đề, Hàm số, Lượng giác, Vectơ, Thống kê)</p>
              <p>• Thời gian: <strong>{test.time_limit_minutes} phút</strong></p>
              <p>• Mỗi câu có 4 đáp án A, B, C, D</p>
              <p>• Làm hết sức để có kết quả chính xác nhất</p>
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">💡 Lưu ý:</h3>
            <div className="space-y-2 text-gray-700">
              <p>• Kết quả giúp hệ thống đề xuất bài tập phù hợp với trình độ của bạn</p>
              <p>• Không cần lo lắng, không có điểm số tính vào học tập</p>
              <p>• Bạn có thể làm lại bài kiểm tra này sau</p>
            </div>
          </div>

          <button
            onClick={startTest}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl"
          >
            Bắt đầu làm bài →
          </button>
        </div>
      </div>
    );
  }

  // Test screen
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length;
  const progress = (answeredCount / test.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Timer */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 sticky top-4 z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Bài kiểm tra đánh giá</h1>
              <p className="text-gray-600">Toán 10 - Tất cả các chương</p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Progress */}
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Tiến độ</div>
                <div className="font-bold text-gray-800">
                  {answeredCount}/{test.questions.length}
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Timer */}
              <div className={`text-center ${timeLeft < 300 ? 'animate-pulse' : ''}`}>
                <div className="text-sm text-gray-600 mb-1">Thời gian còn lại</div>
                <div className={`text-2xl font-bold ${
                  timeLeft < 300 ? 'text-red-600' : 'text-gray-800'
                }`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6 mb-6">
          {test.questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in-up">
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {q.question_number}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">{q.chapter}</div>
                  <div className="text-gray-800 whitespace-pre-wrap">{q.text}</div>
                </div>
              </div>

              {/* Answer Input - MCQ only */}
              <div className="space-y-2 ml-13">
                {q.options && q.options.map((option, optIdx) => {
                  const letter = option.match(/^([A-D])\./)?.[1] || String.fromCharCode(65 + optIdx);
                  return (
                    <label
                      key={optIdx}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition ${
                        answers[q.id] === letter
                          ? 'bg-blue-50 border-blue-500'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={letter}
                        checked={answers[q.id] === letter}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-5 h-5 text-blue-600 mr-3"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sticky bottom-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-600">
              {answeredCount < test.questions.length && (
                <span className="text-orange-600 font-semibold">
                  ⚠️ Còn {test.questions.length - answeredCount} câu chưa trả lời
                </span>
              )}
              {answeredCount === test.questions.length && (
                <span className="text-green-600 font-semibold">
                  ✅ Đã hoàn thành tất cả câu hỏi
                </span>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang chấm bài...</span>
                </span>
              ) : (
                <span>Nộp bài →</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ MODAL: Detailed Solution */}
      {selectedDetailQuestion && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedDetailQuestion(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">📖 Lời giải chi tiết</h3>
                  <div className="text-sm opacity-90">
                    Câu {selectedDetailQuestion.question.question_number} • {selectedDetailQuestion.question.chapter}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetailQuestion(null)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Question */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Câu hỏi:</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedDetailQuestion.question.text}</p>
                  {selectedDetailQuestion.question.options && (
                    <div className="mt-3 space-y-1">
                      {selectedDetailQuestion.question.options.map((opt, i) => (
                        <div key={i} className="text-sm text-gray-600">{opt}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Student Answer */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Câu trả lời của bạn:</h4>
                <div className={`p-4 rounded-lg border-2 ${
                  selectedDetailQuestion.is_correct 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-red-50 border-red-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${
                      selectedDetailQuestion.is_correct ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedDetailQuestion.student_answer || '(Chưa trả lời)'}
                    </span>
                    {selectedDetailQuestion.is_correct ? (
                      <span className="text-green-600">✓ Chính xác!</span>
                    ) : (
                      <span className="text-red-600">✗ Sai</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Correct Answer */}
              {!selectedDetailQuestion.is_correct && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Đáp án đúng:</h4>
                  <div className="bg-green-50 border-2 border-green-400 p-4 rounded-lg">
                    <span className="font-bold text-green-600">
                      {selectedDetailQuestion.correct_answer}
                    </span>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {selectedDetailQuestion.explanation && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">💡 Giải thích:</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedDetailQuestion.explanation}</p>
                  </div>
                </div>
              )}

              {/* Solution Steps */}
              {selectedDetailQuestion.solution_steps && selectedDetailQuestion.solution_steps.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">📝 Các bước giải:</h4>
                  <div className="space-y-3">
                    {selectedDetailQuestion.solution_steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-700">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Concepts */}
              {selectedDetailQuestion.key_concepts && selectedDetailQuestion.key_concepts.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">🔑 Kiến thức cần nhớ:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDetailQuestion.key_concepts.map((concept, idx) => (
                      <span 
                        key={idx} 
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t">
              <button
                onClick={() => setSelectedDetailQuestion(null)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

