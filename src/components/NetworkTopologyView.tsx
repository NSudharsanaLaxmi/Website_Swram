import React from 'react';
import { NetworkNodeState } from '../types';
import { Radio, Activity, CheckCircle2, AlertTriangle, Cpu, Terminal, ArrowRight } from 'lucide-react';

interface NetworkTopologyViewProps {
  nodes: NetworkNodeState[];
  backendConnected: boolean;
  packetAgeMs: number;
}

export const NetworkTopologyView: React.FC<NetworkTopologyViewProps> = ({
  nodes,
  backendConnected,
  packetAgeMs,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              System Network Topology & Communication Monitoring
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Real-time telemetry interconnection topology covering UDP Multicast (Port 5005), Direct Velocity Sockets (Port 8888), Hardware UART (115200 Baud), and Onboard I2C/SPI buses.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            Backend WebSocket: <span className={backendConnected ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              {backendConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            Telemetry Latency: <span className="text-cyan-400 font-bold">{packetAgeMs} ms</span>
          </div>
        </div>
      </div>

      {/* Network Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map((node) => (
          <div key={node.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase block">{node.layer}</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{node.name}</h4>
              </div>

              <span
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${
                  node.status === 'ONLINE'
                    ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                    : node.status === 'DEGRADED'
                    ? 'bg-amber-950 border-amber-500/40 text-amber-400'
                    : 'bg-red-950 border-red-500/40 text-red-400'
                }`}
              >
                {node.status}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Protocol:</span>
                <span className="text-cyan-300 font-bold">{node.protocol}</span>
              </div>

              {node.ip && (
                <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">IP / Port:</span>
                  <span className="text-white font-bold">{node.ip}:{node.port}</span>
                </div>
              )}

              <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Latency / Data Rate:</span>
                <span className="text-emerald-400 font-bold">{node.latencyMs}ms | {node.dataRateKbps} kbps</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
