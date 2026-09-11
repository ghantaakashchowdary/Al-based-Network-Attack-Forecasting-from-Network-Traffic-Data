import React, { useEffect } from "react";
import { useApi } from "../context/ApiContext";
import { RefreshCw, ShieldAlert, Clock3, Activity, Trash2 } from "lucide-react";

export const IncidentCenterPage: React.FC = () => {
  const { securityEvents, refreshSecurityEvents, removeSecurityEvent } = useApi();
  useEffect(() => { refreshSecurityEvents(); }, [refreshSecurityEvents]);
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><div className="flex items-center gap-2 text-xs text-cyan-300 font-bold uppercase tracking-widest"><Activity className="w-4 h-4" /> SOC Incident Center</div><h2 className="text-2xl font-black mt-2">Security Decision Timeline</h2><p className="text-sm text-slate-400 mt-1">Auditable record of message detections, context fusion and policy actions.</p></div>
        <button onClick={() => refreshSecurityEvents()} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {securityEvents.length === 0 ? <div className="p-12 text-center text-slate-500"><ShieldAlert className="w-10 h-10 mx-auto mb-3 text-slate-700" /><p className="text-sm">No security events yet.</p><p className="text-xs mt-1">Run a scenario from Message Security or Mobile Gateway to create the first event.</p></div> : <div className="divide-y divide-slate-800">{securityEvents.map((event) => <div key={event.event_id} className="p-5 hover:bg-slate-950/40 transition"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="flex items-start gap-3"><div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-900"><ShieldAlert className="w-4 h-4 text-cyan-400" /></div><div><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-sm">{event.category}</span><span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-300">{event.severity}</span><span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-cyan-300">{event.action}</span></div><p className="text-xs text-slate-400 mt-2">{event.reason}</p><div className="flex items-center gap-4 mt-2 text-[10px] text-slate-600 font-mono"><span>ID {event.event_id.slice(0, 12)}</span><span><Clock3 className="inline w-3 h-3 mr-1" />{new Date(event.timestamp).toLocaleString()}</span></div></div></div><div className="flex items-center gap-3"><div className="grid grid-cols-3 gap-2 min-w-[240px]"><Score label="MSG" value={event.scores.message} /><Score label="NET" value={event.scores.network} /><Score label="TOTAL" value={event.scores.composite} /></div><button onClick={() => removeSecurityEvent(event.event_id)} title="Delete Event Record" className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 hover:text-rose-100 transition shrink-0"><Trash2 className="w-4 h-4" /></button></div></div>{event.evidence?.length ? <div className="mt-4 flex flex-wrap gap-2">{event.evidence.map((x, i) => <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400">{x}</span>)}</div> : null}</div>)}</div>}
      </div>
    </div>
  );
};

const Score: React.FC<{ label: string; value?: number | null }> = ({ label, value }) => <div className="rounded-lg bg-slate-950 border border-slate-800 p-2 text-center"><div className="text-[9px] text-slate-600">{label}</div><div className="text-xs font-mono text-slate-300 mt-1">{value == null ? "—" : `${Math.round(value * 100)}%`}</div></div>;
