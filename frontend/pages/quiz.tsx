import { useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, apiPost } from '../utils/api';

type Topic = { id: number; name: string };

type Question = {
  id: number;
  topic_id: number;
  text: string;
  options: string[];
  difficulty: number;
};

type QuizResult = {
  topic_id: number;
  total: number;
  correct_count: number;
  score_percent: number;
  details: { question_id: number; correct_index: number; chosen_index: number; is_correct: boolean }[];
};

export default function QuizPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);
  const [durationMin, setDurationMin] = useState(5);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/catalog/topics');
        setTopics(data);
        if (data.length > 0) setTopicId(data[0].id);
      } catch (err: any) {
        setError(err.message);
      }
    })();
  }, []);

  useEffect(() => {
    if (!started) return;
    setTimeLeft(durationMin * 60);
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          submit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      timerRef.current && clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const loadQuestions = async () => {
    if (!topicId) return;
    setError(null);
    setResult(null);
    setQuestions([]);
    setAnswers({});
    try {
      const data = await apiGet(`/questions?topic_id=${topicId}&limit=${limit}`);
      setQuestions(data.questions || []);
      setStarted(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const submit = async () => {
    if (!topicId) return;
    setError(null);
    try {
      const payload = {
        topic_id: topicId,
        answers: Object.entries(answers).map(([qid, idx]) => ({ question_id: Number(qid), answer_index: idx as number })),
      };
      const res = await apiPost('/questions/quiz/submit', payload);
      setResult(res);
      setStarted(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const mmss = useMemo(() => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [timeLeft]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Quiz</h1>
      {error && <p className="text-red-600">{error}</p>}

      {!started && !result && (
        <div className="bg-white p-4 shadow rounded mb-4 flex gap-4 items-end">
          <div>
            <label className="block text-sm">Topic</label>
            <select className="border rounded p-2" value={topicId ?? undefined} onChange={e => setTopicId(Number(e.target.value))}>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm">Questions</label>
            <input type="number" min={1} max={50} value={limit} onChange={e => setLimit(Number(e.target.value))} className="border rounded p-2 w-24" />
          </div>
          <div>
            <label className="block text-sm">Duration (min)</label>
            <input type="number" min={1} max={60} value={durationMin} onChange={e => setDurationMin(Number(e.target.value))} className="border rounded p-2 w-24" />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={loadQuestions}>Start</button>
        </div>
      )}

      {started && (
        <div className="mb-4 flex items-center gap-4">
          <div className="text-lg font-semibold">Time Left: {mmss}</div>
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={submit}>Submit</button>
        </div>
      )}

      {questions.length > 0 && (
        <div className="bg-white shadow rounded p-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="mb-4">
              <div className="font-medium">{idx + 1}. {q.text}</div>
              <div className="mt-2 grid gap-2">
                {q.options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === i}
                      onChange={() => setAnswers({ ...answers, [q.id]: i })}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="bg-white p-4 shadow rounded">
          <div className="text-lg font-semibold mb-2">Score: {result.correct_count}/{result.total} ({result.score_percent}%)</div>
          <div className="text-sm text-gray-700">Details:</div>
          <ul className="list-disc pl-6">
            {result.details.map(d => (
              <li key={d.question_id} className={d.is_correct ? 'text-green-700' : 'text-red-700'}>
                Q{d.question_id}: chosen {d.chosen_index}, correct {d.correct_index}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
