import React, { useEffect, useState } from 'react';

const fetchJson = async (path: string, opts: any = {}) => {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const SolverAdmin: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [m, t] = await Promise.all([fetchJson('/api/scraper/metrics'), fetchJson('/api/scraper/manual-tasks')]);
      setMetrics(m);
      setTasks(t || []);
    } catch (err) {
      console.warn('Admin load failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, []);

  const submitToken = async (id: string) => {
    try {
      await fetchJson('/api/scraper/manual-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token: tokenInput })
      });
      setTokenInput('');
      setSelected(null);
      await load();
    } catch (err) {
      alert('Submit failed: ' + String(err));
    }
  };

  if (loading && !metrics) {
    return <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-300">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-bold text-white">Scraper / Solver Metrics</h2>
        <pre className="mt-3 text-sm text-slate-300">{JSON.stringify(metrics, null, 2)}</pre>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white">Manual Solve Tasks</h3>
        <div className="mt-4 space-y-3">
          {tasks.length === 0 && <div className="text-slate-400">No manual tasks queued.</div>}
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-white">{task.asin} <span className="text-xs text-slate-500">#{task.id}</span></div>
                <div className="mt-1 text-xs text-slate-400">{task.pageUrl}</div>
                <div className="mt-2 text-xs text-slate-400">Status: {task.status}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => { setSelected(task.id); setTokenInput(''); }} className="rounded bg-amz-accent px-3 py-1 text-sm font-medium text-slate-900">Provide token</button>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="mt-4 flex gap-2">
            <input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="captcha token" className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200" />
            <button onClick={() => submitToken(selected)} className="rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-white">Submit</button>
            <button onClick={() => { setSelected(null); setTokenInput(''); }} className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-200">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolverAdmin;
