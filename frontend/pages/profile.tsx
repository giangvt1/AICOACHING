import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '../utils/api';
import { useRouter } from 'next/router';

type Student = {
  id: number;
  email: string;
  full_name?: string;
  school?: string;
  grade?: string;
  goal_score?: number | null;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Student | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/students/me');
        setMe(data);
      } catch (err: any) {
        setError(err.message);
      }
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);
    try {
      const payload = {
        full_name: me?.full_name || null,
        school: me?.school || null,
        grade: me?.grade || null,
        goal_score: me?.goal_score || null,
      };
      const newMe = await apiPut('/students/me', payload);
      setMe(newMe);
      setMsg('Profile updated');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!me) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto bg-white p-6 shadow rounded">
      <h1 className="text-xl font-semibold mb-4">Profile</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Full name</label>
          <input className="border rounded w-full p-2" value={me.full_name || ''} onChange={e => setMe({ ...me, full_name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm">School</label>
          <input className="border rounded w-full p-2" value={me.school || ''} onChange={e => setMe({ ...me, school: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm">Grade</label>
          <input className="border rounded w-full p-2" value={me.grade || ''} onChange={e => setMe({ ...me, grade: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm">Goal score (0-10)</label>
          <input type="number" min={0} max={10} className="border rounded w-full p-2" value={me.goal_score ?? ''} onChange={e => setMe({ ...me, goal_score: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        {msg && <p className="text-green-700">{msg}</p>}
        {error && <p className="text-red-600">{error}</p>}
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
      </form>
    </div>
  );
}
