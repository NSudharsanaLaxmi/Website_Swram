import React, { useState } from 'react';
import { LogPacket } from '../types';
import { 
  Terminal, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  Radio, 
  Zap,
  Cpu,
  Share2
} from 'lucide-react';

interface ProtocolTerminalProps {
  logs: LogPacket[];
  onClearLogs: () => void;
  onSendCommand: (cmd: string, channel: 'SERIAL' | 'TCP') => void;
}

export const ProtocolTerminal: React.FC<ProtocolTerminalProps> = ({
  logs,
  onClearLogs,
  onSendCommand,
}) => {
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [customCommand, setCustomCommand] = useState('');
  const [commandChannel, setCommandChannel] = useState<'SERIAL' | 'TCP'>('TCP');
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter((l) => {
    if (filterSource === 'ALL') return true;
    return l.source === filterSource;
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommand.trim()) return;
    onSendCommand(customCommand.trim(), commandChannel);
    setCustomCommand('');
  };

  const copyTerminalOutput = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.source}] ${l.direction}: ${l.content}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickCommands = [
    { label: 'UDP :8888 Forward (0.6, 0.0)', cmd: '0.60,0.00', channel: 'TCP' as const },
    { label: 'UDP :8888 Pivot Left (0.0, 0.7)', cmd: '0.00,0.70', channel: 'TCP' as const },
    { label: 'UDP :8888 Pivot Right (0.0, -0.7)', cmd: '0.00,-0.70', channel: 'TCP' as const },
    { label: 'UDP :8888 Emergency Stop (0.0, 0.0)', cmd: '0.00,0.00', channel: 'TCP' as const },
    { label: 'UDP :5005 Pose Frame id0', cmd: '{"timestamp":1710000000,"bots":{"id0":{"x":25.0,"y":30.0,"ang":0.0}}}', channel: 'TCP' as const },
    { label: 'UART 115200 Forward Pose', cmd: 'P:25.0,30.0,0.0', channel: 'SERIAL' as const },
    { label: 'ARM Pick Sequence', cmd: 'ARM,350,420,380,300,85', channel: 'SERIAL' as const }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-zinc-900">
              Swarm UDP Protocol &amp; UART Transit Analyzer
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
              UDP 8888 / UDP 5005 / UART 115200
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time packet monitor tracking velocity commands to ESP32 (Port 8888), overhead ArUco vision broadcasts (Port 5005), and UNO Q Linux UART frames.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg text-xs">
            {['ALL', 'ESP32_AGENT', 'OVERHEAD_VISION', 'SWARM_COORDINATOR', 'UNO_Q_BRIDGE', 'TELEOP_UDP'].map((src) => (
              <button
                key={src}
                onClick={() => setFilterSource(src)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterSource === src
                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {src.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={copyTerminalOutput}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs flex items-center gap-1"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClearLogs}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs flex items-center gap-1"
            title="Clear terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Terminal Window */}
        <div className="lg:col-span-8 bg-zinc-950 rounded-xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
          {/* Terminal Title Bar */}
          <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-zinc-300 font-semibold">Swarm Multi-Port UDP Bus Stream</span>
            </div>
            <span className="text-[11px] text-zinc-500">{filteredLogs.length} frames logged</span>
          </div>

          {/* Terminal Log Stream */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5">
            {filteredLogs.length === 0 ? (
              <div className="text-zinc-600 text-center py-20">
                Awaiting transit packets... Send a command or start the swarm loop to populate UDP bus trace.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isEsp32 = log.source === 'ESP32_AGENT';
                const isVision = log.source === 'OVERHEAD_VISION';
                const isCoord = log.source === 'SWARM_COORDINATOR';
                const isUnoQ = log.source === 'UNO_Q_BRIDGE';
                const isTeleop = log.source === 'TELEOP_UDP';

                return (
                  <div key={log.id} className="flex items-start gap-2 hover:bg-zinc-900/50 px-1 py-0.5 rounded transition-colors">
                    <span className="text-zinc-600 select-none text-[10px]">{log.timestamp}</span>

                    {/* Source Badge */}
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold select-none ${
                        isEsp32
                          ? 'bg-sky-950 text-sky-400 border border-sky-800'
                          : isVision
                          ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                          : isCoord
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isUnoQ
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {log.source}
                    </span>

                    {/* Channel */}
                    <span className="text-[10px] font-mono text-zinc-500">[{log.direction}]</span>

                    {/* Content */}
                    <span
                      className={`font-mono text-xs break-all ${
                        log.level === 'ALERT'
                          ? 'text-rose-400 font-bold'
                          : log.level === 'WARN'
                          ? 'text-amber-300'
                          : log.level === 'SUCCESS'
                          ? 'text-emerald-300'
                          : 'text-zinc-300'
                      }`}
                    >
                      {log.content}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Terminal Command Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2">
            <select
              value={commandChannel}
              onChange={(e) => setCommandChannel(e.target.value as any)}
              className="bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-xs px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="TCP">UDP :8888 (linear,angular)</option>
              <option value="SERIAL">UART (/dev/ttyS0)</option>
            </select>

            <input
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              placeholder="e.g. 0.60,0.00 or ARM,350,420,380,300,85"
              className="flex-1 bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
            />

            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>

        {/* Right Column: UDP Protocol Specifications & Quick Commands */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Swarm Commands
            </h3>
            <p className="text-xs text-zinc-500">
              Inject UDP velocity packets (Port 8888) or ArUco state frames directly to the running swarm.
            </p>

            <div className="space-y-1.5 pt-1">
              {quickCommands.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendCommand(q.cmd, q.channel)}
                  className="w-full text-left p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-semibold text-zinc-800 group-hover:text-indigo-600">
                      {q.label}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 truncate max-w-[200px]">
                      {q.cmd}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600">
                    {q.channel}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-3 text-xs">
            <h4 className="font-semibold text-zinc-900">UDP Protocol Standards:</h4>
            <div className="space-y-2 text-zinc-600">
              <div className="p-2 bg-zinc-50 rounded border border-zinc-200">
                <span className="font-bold text-zinc-900 block font-mono">Port 8888 (Velocity):</span>
                <span>Plain text CSV: <code>linear_x,angular_z</code> (e.g. <code>0.60,-0.40</code>).</span>
              </div>
              <div className="p-2 bg-zinc-50 rounded border border-zinc-200">
                <span className="font-bold text-zinc-900 block font-mono">Port 5005 (Global Pose):</span>
                <span>JSON state broadcast: <code>bots: {'{'}id0: {'{'}x, y, ang{'}'}{'}'}</code>.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
