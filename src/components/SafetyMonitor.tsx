import React from 'react';
import { SafetyTelemetry, RobotTwin } from '../types';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Radio, Activity, StopCircle, CheckCircle2 } from 'lucide-react';

interface SafetyMonitorProps {
  safety: SafetyTelemetry;
  robots: RobotTwin[];
  onEmergencyHalt: () => void;
}

export const SafetyMonitor: React.FC<SafetyMonitorProps> = ({
  safety,
  robots,
  onEmergencyHalt,
}) => {
  const isAllSafe =
    safety.boundaryStatus === 'SAFE' &&
    safety.collisionStatus === 'CLEAR' &&
    safety.lidarSafetyBrake === 'CLEAR' &&
    !safety.systemHalt;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          {isAllSafe ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
          )}
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Hardware Safety &amp; Interlock Monitor (UNO Q Edge Failsafes)
            </h3>
            <p className="text-[11px] text-slate-400">
              Autonomous dynamic monitoring: 8 cm Boundary Buffer, 28 cm Inter-Robot Collision Bubble, &amp; &lt;120 mm ToF Brake
            </p>
          </div>
        </div>

        <button
          onClick={onEmergencyHalt}
          className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
            safety.systemHalt
              ? 'bg-red-600 text-white hover:bg-red-500 animate-pulse'
              : 'bg-slate-950 text-red-400 border border-red-800/80 hover:bg-red-950/60'
          }`}
        >
          <StopCircle className="w-4 h-4" />
          <span>{safety.systemHalt ? 'RESUME SYSTEM' : 'SOFTWARE E-STOP'}</span>
        </button>
      </div>

      {/* Safety Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Boundary Perimeter */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">Perimeter Buffer:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {safety.boundaryStatus}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Margin: <span className="text-amber-400 font-bold">{safety.boundaryBufferMarginCm} cm</span> Inner Safe Ring
          </div>
        </div>

        {/* 2. Inter-Robot Collision Bubble */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">Robot Separation:</span>
            <span className={`flex items-center gap-1 ${safety.collisionStatus === 'CLEAR' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {safety.collisionStatus === 'CLEAR' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {safety.collisionStatus}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Distance: <span className="text-cyan-300 font-bold">{safety.interRobotDistanceCm} cm</span> (Bubble: {safety.collisionBubbleCm} cm)
          </div>
        </div>

        {/* 3. LiDAR / ToF Laser Brake */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">ToF Laser Brake:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {safety.lidarSafetyBrake}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Threshold: &lt;120 mm Active Failsafe Brake
          </div>
        </div>

        {/* 4. RFID Verification Status */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">RFID Rack Interlock:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {safety.rfidMatchStatus}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Match: Hardware Tag Required Before Dock
          </div>
        </div>
      </div>
    </div>
  );
};
