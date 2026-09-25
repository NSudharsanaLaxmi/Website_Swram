import React from 'react';
import { ClawStateMachineTelemetry } from '../types';
import { Disc, CheckCircle2, ChevronRight, Play, Check, Box, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface ClawStateMachinePanelProps {
  clawTelemetry: ClawStateMachineTelemetry;
}

export const ClawStateMachinePanel: React.FC<ClawStateMachinePanelProps> = ({ clawTelemetry }) => {
  const currentIndex = clawTelemetry.currentPhaseIndex;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Disc className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              16-Phase Pick-and-Drop Manipulator State Machine
            </h3>
            <p className="text-[11px] text-slate-400">
              4-DOF Robotic Arm + MG90S Gripper (PCA9685 I2C 0x40 CH0–CH4) Real-Time Physical Actuation
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
            const isUpcoming = idx > currentIndex;

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

      {/* Real-Time Actuator & Gripper Telemetry Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Arm Position Angle */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase block">Arm Articulation</span>
          <div className="text-base font-bold text-white">
            {clawTelemetry.armAngleDeg.toFixed(1)}° <span className="text-xs text-slate-400 font-normal">Interpolated</span>
          </div>
          <span className="text-[10px] text-cyan-400">PCA9685 CH1-CH3</span>
        </div>

        {/* Gripper State */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase block">Claw Gripper Angle</span>
          <div className="text-base font-bold text-amber-300">
            {clawTelemetry.gripperDeg}° ({clawTelemetry.gripperState})
          </div>
          <span className="text-[10px] text-slate-500">85° Closed — 180° Open</span>
        </div>

        {/* Object Optical Verification */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase block">Object Detection</span>
          <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>DETECTED</span>
          </div>
          <span className="text-[10px] text-slate-500">ToF Docking Range &lt; 60mm</span>
        </div>

        {/* Grip Confirmation */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase block">Grip Confirmation</span>
          <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>CONFIRMED</span>
          </div>
          <span className="text-[10px] text-slate-500">Servo Pulse Locked</span>
        </div>
      </div>
    </div>
  );
};
