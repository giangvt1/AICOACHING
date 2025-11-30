import { useState } from 'react';
import { apiPost } from '../utils/api';

export default function AssistantPage() {
  const [problem, setProblem] = useState('');
  const [topic, setTopic] = useState('Hàm số bậc nhất');
  const [difficulty, setDifficulty] = useState(3);
  const [n, setN] = useState(5);

  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    setError(null); setOutput(''); setLoading(true);
    try {
      const res = await apiPost('/assistant/explain', { problem });
      setOutput(res.text || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    setError(null); setOutput(''); setLoading(true);
    try {
      const res = await apiPost('/assistant/generate', { topic, difficulty, n });
      setOutput(res.text || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">AI Assistant</h1>
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 shadow rounded">
          <h2 className="font-semibold mb-2">Explain a problem</h2>
          <textarea className="border rounded w-full p-2 h-40" value={problem} onChange={e => setProblem(e.target.value)} placeholder="Nhập đề bài Toán 10..." />
          <div className="mt-2">
            <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded" onClick={explain}>
              {loading ? 'Working...' : 'Explain'}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 shadow rounded">
          <h2 className="font-semibold mb-2">Generate exercises</h2>
          <div className="mb-2">
            <label className="block text-sm">Topic</label>
            <input className="border rounded p-2 w-full" value={topic} onChange={e => setTopic(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="block text-sm">Difficulty (1-5)</label>
            <input type="number" min={1} max={5} className="border rounded p-2 w-24" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} />
          </div>
          <div className="mb-2">
            <label className="block text-sm">How many</label>
            <input type="number" min={1} max={10} className="border rounded p-2 w-24" value={n} onChange={e => setN(Number(e.target.value))} />
          </div>
          <div>
            <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded" onClick={generate}>
              {loading ? 'Working...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 shadow rounded mt-6">
        <h2 className="font-semibold mb-2">Output</h2>
        <pre className="whitespace-pre-wrap text-sm">{output}</pre>
      </div>
    </div>
  );
}
