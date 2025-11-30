import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '../utils/api';

const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

type Slot = {
  id?: number;
  weekday: number;
  start_time: string;
  end_time: string;
};

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<Slot>({ weekday: 0, start_time: '19:00:00', end_time: '20:30:00' });

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/students/me/availability');
        setSlots(data);
      } catch (err: any) {
        setError(err.message);
      }
    })();
  }, []);

  const addSlot = () => {
    setSlots([...slots, { ...newSlot }]);
  };
  const removeSlot = (idx: number) => {
    setSlots(slots.filter((_, i) => i !== idx));
  };
  const save = async () => {
    setMsg(null); setError(null);
    try {
      const payload = slots.map(s => ({ weekday: s.weekday, start_time: s.start_time, end_time: s.end_time }));
      const res = await apiPut('/students/me/availability', payload);
      setSlots(res);
      setMsg('Availability saved');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Weekly Availability</h1>
      <div className="bg-white p-4 shadow rounded mb-4">
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-sm">Weekday</label>
            <select className="border rounded p-2" value={newSlot.weekday} onChange={e => setNewSlot({ ...newSlot, weekday: Number(e.target.value) })}>
              {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm">Start</label>
            <input
              className="border rounded p-2"
              type="time"
              value={(newSlot.start_time || '').slice(0,5)}
              onChange={e => setNewSlot({ ...newSlot, start_time: (e.target.value || '') + ':00' })}
            />
          </div>
          <div>
            <label className="block text-sm">End</label>
            <input
              className="border rounded p-2"
              type="time"
              value={(newSlot.end_time || '').slice(0,5)}
              onChange={e => setNewSlot({ ...newSlot, end_time: (e.target.value || '') + ':00' })}
            />
          </div>
          <button className="bg-gray-800 text-white px-3 py-2 rounded" onClick={addSlot}>Add slot</button>
        </div>
      </div>

      <div className="bg-white shadow rounded">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Weekday</th>
              <th className="text-left p-2">Start</th>
              <th className="text-left p-2">End</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {slots.map((s, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2">{WEEKDAYS[s.weekday]}</td>
                <td className="p-2">{s.start_time}</td>
                <td className="p-2">{s.end_time}</td>
                <td className="p-2"><button className="text-red-600" onClick={() => removeSlot(idx)}>Remove</button></td>
              </tr>
            ))}
            {slots.length === 0 && <tr><td className="p-2" colSpan={4}>No slots yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-4 items-center">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={save}>Save Availability</button>
        {msg && <span className="text-green-700">{msg}</span>}
        {error && <span className="text-red-600">{error}</span>}
      </div>
    </div>
  );
}
