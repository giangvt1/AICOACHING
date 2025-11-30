import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../utils/api';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

type ExerciseItem = {
  type: 'open' | 'mcq';
  question: string;
  options?: string[];
  correct_index?: number;
  solution: string;
  difficulty: string;
};

type ExerciseSet = {
  id: string;
  user_id: number;
  topic: string;
  difficulty: string;
  format: string;
  items: ExerciseItem[];
  contexts: any[];
  used_model: string;
  saved_path: string;
};

type Chapter = {
  id: number;
  name: string;
};

// Hardcoded chapters aligned with 5-chapter structure
const CHAPTERS: Chapter[] = [
  { id: 1, name: "Chương I: Mệnh đề và Tập hợp" },
  { id: 2, name: "Chương II: Bất phương trình" },
  { id: 3, name: "Chương III: Góc lượng giác và Hệ thức lượng" },
  { id: 4, name: "Chương IV: Vectơ" },
  { id: 5, name: "Chương V: Phương trình đường thẳng và đường tròn" },
];

export default function ExercisesPage() {
  const [selectedTopic, setSelectedTopic] = useState(CHAPTERS[0].name);
  const [difficulty, setDifficulty] = useState('medium');
  const [format, setFormat] = useState<'mcq' | 'open'>('mcq');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentSet, setCurrentSet] = useState<ExerciseSet | null>(null);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string | number}>({});
  const [showSolutions, setShowSolutions] = useState(false);
  const [savedSets, setSavedSets] = useState<any[]>([]);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadSavedSets();
  }, []);

  const loadSavedSets = async () => {
    try {
      const data = await apiGet('/ai/exercises');
      setSavedSets(data);
    } catch (err: any) {
      console.error('Failed to load saved sets:', err);
    }
  };

  const generateExercises = async () => {
    if (!selectedTopic) {
      showToast('Vui lòng chọn chuyên đề', 'error');
      return;
    }

    setGenerating(true);
    setCurrentSet(null);
    setUserAnswers({});
    setShowSolutions(false);

    try {
      // Convert difficulty string to int for backend
      const difficultyMap: { [key: string]: number } = {
        'easy': 1,
        'medium': 3,
        'hard': 5
      };

      const requestBody = {
        topic: selectedTopic,
        n: numQuestions,
        difficulty: difficultyMap[difficulty] || 3,
        format,
        top_k: 4,
      };

      console.log('Sending exercise generation request:', requestBody);

      const response = await apiPost('/ai/generate-exercises', requestBody);

      console.log('Received response:', response);
      setCurrentSet(response.set);
      showToast('Bài tập đã được tạo thành công!', 'success');
      loadSavedSets(); // Refresh saved sets
    } catch (err: any) {
      console.error('Exercise generation failed:', err);
      showToast(err.message || 'Không thể tạo bài tập', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerChange = (index: number, value: string | number) => {
    setUserAnswers(prev => ({ ...prev, [index]: value }));
  };

  const checkAnswers = () => {
    setShowSolutions(true);
    let correct = 0;
    let total = 0;

    currentSet?.items.forEach((item, idx) => {
      if (item.type === 'mcq' && item.correct_index !== undefined) {
        total++;
        if (userAnswers[idx] === item.correct_index) {
          correct++;
        }
      }
    });

    if (total > 0) {
      showToast(`Bạn đúng ${correct}/${total} câu (${Math.round(correct/total*100)}%)`, 'info');
    }
  };

  const resetPractice = () => {
    setCurrentSet(null);
    setUserAnswers({});
    setShowSolutions(false);
  };

  const loadSet = async (setId: string) => {
    try {
      const data = await apiGet(`/ai/exercises/${setId}`);
      setCurrentSet({
        ...data,
        items: data.items.map((item: any) => ({
          type: item.type,
          question: item.question,
          options: item.options,
          correct_index: item.correct_index,
          solution: item.solution,
          difficulty: item.difficulty,
        })),
      });
      setUserAnswers({});
      setShowSolutions(false);
      showToast('Đã tải bài tập', 'success');
    } catch (err: any) {
      showToast('Không thể tải bài tập', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {ToastComponent}
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI Tạo Bài Tập</h1>
        <p className="text-gray-600">Tạo bài tập tự động theo chuyên đề và độ khó</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-lg rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">⚙️ Cài đặt</h2>
            
            <div className="space-y-4">
              {/* Topic Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chuyên đề
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CHAPTERS.map(ch => (
                    <option key={ch.id} value={ch.name}>{ch.name}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Độ khó
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['easy', 'medium', 'hard'].map(level => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        difficulty === level
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level === 'easy' ? 'Dễ' : level === 'medium' ? 'TB' : 'Khó'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại câu hỏi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormat('mcq')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      format === 'mcq'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Trắc nghiệm
                  </button>
                  <button
                    onClick={() => setFormat('open')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      format === 'open'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tự luận
                  </button>
                </div>
              </div>

              {/* Number of questions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số câu hỏi: {numQuestions}
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateExercises}
                disabled={generating || !selectedTopic}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Đang tạo...
                  </span>
                ) : (
                  '✨ Tạo bài tập mới'
                )}
              </button>

              {currentSet && (
                <button
                  onClick={resetPractice}
                  className="w-full bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  🔄 Tạo lại
                </button>
              )}
            </div>

            {/* Saved Sets */}
            {savedSets.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-700 mb-3">📚 Bài tập đã lưu</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {savedSets.slice(0, 5).map((set, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadSet(set.id)}
                      className="w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 transition text-sm"
                    >
                      <div className="font-medium text-gray-800">{set.topic}</div>
                      <div className="text-xs text-gray-500">
                        {set.difficulty} • {set.items?.length || 0} câu
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exercise Display */}
        <div className="lg:col-span-2">
          {generating ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : currentSet ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-2">{currentSet.topic}</h2>
                <div className="flex gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded">
                    {currentSet.difficulty === 'easy' ? 'Dễ' : currentSet.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded">
                    {currentSet.items.length} câu hỏi
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded">
                    {currentSet.used_model === 'artifacts' ? '📚 Dữ liệu thật' : 
                     currentSet.used_model === 'gemini-1.5-flash' ? '🤖 Gemini AI' : 
                     '📐 Fallback'}
                  </span>
                </div>
              </div>

              {/* Questions */}
              {currentSet.items.map((item, idx) => (
                <div key={idx} className="bg-white shadow-lg rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-medium text-gray-800 mb-4">
                        {item.question}
                      </p>

                      {item.type === 'mcq' && item.options ? (
                        <div className="space-y-2">
                          {item.options.map((option, optIdx) => {
                            const isSelected = userAnswers[idx] === optIdx;
                            const isCorrect = item.correct_index === optIdx;
                            const showCorrect = showSolutions && isCorrect;
                            const showWrong = showSolutions && isSelected && !isCorrect;

                            return (
                              <button
                                key={optIdx}
                                onClick={() => !showSolutions && handleAnswerChange(idx, optIdx)}
                                disabled={showSolutions}
                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                                  showCorrect
                                    ? 'border-green-500 bg-green-50'
                                    : showWrong
                                    ? 'border-red-500 bg-red-50'
                                    : isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                    showCorrect ? 'border-green-500 bg-green-500' :
                                    showWrong ? 'border-red-500 bg-red-500' :
                                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                  }`}>
                                    {(showCorrect || (isSelected && !showSolutions)) && (
                                      <span className="text-white text-sm">✓</span>
                                    )}
                                    {showWrong && <span className="text-white text-sm">✗</span>}
                                  </div>
                                  <span className="flex-1">{option}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <textarea
                          value={userAnswers[idx] as string || ''}
                          onChange={(e) => handleAnswerChange(idx, e.target.value)}
                          disabled={showSolutions}
                          placeholder="Nhập câu trả lời của bạn..."
                          className="w-full border-2 border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                          rows={4}
                        />
                      )}

                      {/* Solution */}
                      {showSolutions && (
                        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                          <p className="font-semibold text-blue-900 mb-2">💡 Lời giải:</p>
                          <p className="text-gray-700 whitespace-pre-line">{item.solution}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {!showSolutions ? (
                  <button
                    onClick={checkAnswers}
                    className="flex-1 bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition shadow-md"
                  >
                    ✓ Kiểm tra đáp án
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setUserAnswers({});
                      setShowSolutions(false);
                    }}
                    className="flex-1 bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition shadow-md"
                  >
                    🔄 Làm lại
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                Sẵn sàng luyện tập?
              </h3>
              <p className="text-gray-600 mb-6">
                Chọn chuyên đề và cài đặt bên trái, sau đó nhấn "Tạo bài tập mới" để bắt đầu
              </p>
              <div className="inline-block bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>💡 Mẹo:</strong> AI sẽ tự động tạo bài tập phù hợp với độ khó bạn chọn
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

