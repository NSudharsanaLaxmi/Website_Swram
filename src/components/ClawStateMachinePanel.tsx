import React from 'react';
import { ClawStateMachineTelemetry } from '../types';
import { Disc, CheckCircle2, ChevronRight, Play, Check, Box, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface ClawStateMachinePanelProps {
  clawTelemetry: ClawStateMachineTelemetry;
}

export const ClawStateMachinePanel: React.FC<ClawStateMachinePanelProps> = ({ clawTelemetry }) => {
  const currentIndex = clawTelemetry.currentPhaseIndex;
  const joints = clawTelemetry.armJoints || { base: 90, shoulder: 90, elbow: 90, joint4: 90, joint5: 180 };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Disc className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              16-Phase Pick-and-Drop 5-DOF Manipulator State Machine
            </h3>
            <p className="text-[11px] text-slate-400">
              5-DOF MG996R Robotic Arm + Gripper (PCA9685 I2C 0x40 CH0–CH4) Real-Time Physical Actuation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-bold rounded-md">
            ACTIVE: {clawTelemetry.currentPhase} (PHASE {currentIndex + 1}/16)
          </span>
        </div>
      </div>

      {/* 16-Step Horizontal / Flow Sequence */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
          <span>Sequential Physical Pick-and-Drop Execution Timeline:</span>
          <span className="text-cyan-300 font-bold">Target: {clawTelemetry.targetRackId.toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {clawTelemetry.phases.map((phase, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={phase}
                className={`p-2 rounded-lg border text-center transition-all flex flex-col justify-between min-h-[64px] ${
                  isCurrent
                    ? 'bg-amber-950 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 scale-105 shadow-lg'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span>#{idx + 1}</span>
                  {isCompleted ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  ) : null}
                </div>

                <span className="text-[10px] font-bold leading-tight mt-1">
                  {phase.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5-DOF Real-Time Joint Telemetry Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* CH0: Base Yaw */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 uppercase">
            <span>CH0 Base Yaw</span>
            <span className="text-cyan-400 font-bold">0-180°</span>
          </div>
          <div className="text-base font-bold text-white">{joints.base}°</div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full" style={{ width: `${(joints.base / 180) * 100}%` }} />
          </div>
        </div>

        {/* CH1: Shoulder Pitch */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 uppercase">
            <span>CH1 Shoulder</span>
            <span className="text-cyan-400 font-bold">15-165°</span>
          </div>
          <div className="text-base font-bold text-white">{joints.shoulder}°</div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full" style={{ width: `${(joints.shoulder / 180) * 100}%` }} />
          </div>
        </div>

        {/* CH2: Elbow Pitch */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 uppercase">
            <span>CH2 Elbow</span>
            <span className="text-cyan-400 font-bold">10-170°</span>
          </div>
          <div className="text-base font-bold text-white">{joints.elbow}°</div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full" style={{ width: `${(joints.elbow / 180) * 100}%` }} />
          </div>
        </div>

        {/* CH3: Joint 4 / Wrist */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 uppercase">
            <span>CH3 Joint 4</span>
            <span className="text-cyan-400 font-bold">10-170°</span>
          </div>
          <div className="text-base font-bold text-white">{joints.joint4}°</div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full" style={{ width: `${(joints.joint4 / 180) * 100}%` }} />
          </div>
        </div>

        {/* CH4: Joint 5 / Gripper */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 uppercase">
            <span>CH4 Gripper</span>
            <span className="text-amber-400 font-bold">{clawTelemetry.gripperState}</span>
          </div>
          <div className="text-base font-bold text-amber-300">{joints.joint5}°</div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full" style={{ width: `${(joints.joint5 / 180) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
