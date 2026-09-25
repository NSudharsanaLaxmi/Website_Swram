import React, { useState } from 'react';
import { LogPacket } from '../types';
import { Terminal, Filter, Trash2, Download } from 'lucide-react';

interface ProtocolTerminalProps {
  logs: LogPacket[];
  onClearLogs: () => void;
}

export const ProtocolTerminal: React.FC<ProtocolTerminalProps> = ({ logs, onClearLogs }) => {
  const [filterSource, setFilterSource] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterSource === 'ALL') return true;
    if (filterSource === 'VISION') return log.source === 'OVERHEAD_VISION' || log.source === 'WAREHOUSE_SERVER';
    if (filterSource === 'SWARM') return log.source === 'SWARM_COORDINATOR' || log.source === 'UNO_Q_BRIDGE';
    if (filterSource === 'ROBOT') return log.source === 'ESP32_AGENT';
    if (filterSource === 'TELEMETRY') return log.source === 'TELEMETRY_BRIDGE';
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-base font-bold text-white">System Protocol & Telemetry Console</h3>
            <span className="text-xs text-slate-400">Live Engineering Stream (UDP Port 5005, UDP 8888, WebSocket 8080, UART 115200)</span>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none"
            >
              <option value="ALL">ALL SOURCES</option>
              <option value="VISION">VISION & PERCEPTION</option>
              <option value="SWARM">SWARM COORDINATOR</option>
              <option value="ROBOT">ESP32 ROBOT AGENTS</option>
              <option value="TELEMETRY">TELEMETRY BRIDGE</option>
            </select>
          </div>

          <button
            onClick={onClearLogs}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
            title="Clear Console Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monospace Output Window */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-96 overflow-y-auto space-y-2 text-xs font-mono">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 text-center py-10">No protocol events recorded.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 border-b border-slate-900/60 pb-1.5">
              <span className="text-slate-500 whitespace-nowrap">[{log.timestamp}]</span>

              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                  log.source === 'OVERHEAD_VISION' || log.source === 'WAREHOUSE_SERVER'
                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    : log.source === 'SWARM_COORDINATOR' || log.source === 'UNO_Q_BRIDGE'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}
              >
                {log.source}
              </span>

              <span className="text-slate-400 font-bold text-[10px] whitespace-nowrap">[{log.direction}]</span>

              <span
                className={`flex-1 break-all ${
                  log.level === 'ALERT'
                    ? 'text-red-400 font-bold'
                    : log.level === 'WARN'
                    ? 'text-amber-300'
                    : log.level === 'SUCCESS'
                    ? 'text-emerald-400'
                    : 'text-slate-200'
                }`}
              >
                {log.content}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
