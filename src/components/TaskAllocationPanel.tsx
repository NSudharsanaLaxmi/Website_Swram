import React from 'react';
import { TaskAllocationTelemetry, RobotTwin } from '../types';
import { Cpu, CheckCircle2, AlertTriangle, ArrowRight, Zap, Navigation, Shield, BarChart3 } from 'lucide-react';

interface TaskAllocationPanelProps {
  taskAllocator: TaskAllocationTelemetry;
  robots: RobotTwin[];
  onTriggerAllocation?: (rackName: string) => void;
}

export const TaskAllocationPanel: React.FC<TaskAllocationPanelProps> = ({
  taskAllocator,
  robots,
  onTriggerAllocation,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Autonomous Swarm Task Allocation Engine (UNO Q Edge Brain)
            </h3>
            <p className="text-[11px] text-slate-400">
              Decentralized multi-factor fleet evaluation: Distance, Path Cost, Availability, Collision Risk, &amp; Battery State
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-bold rounded-md flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-cyan-400" />
          ACTIVE TARGET: {taskAllocator.activeTargetRack}
        </span>
      </div>

      {/* Active Mission Pipeline Flow */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="text-slate-400">Mission Description:</span>
          <span className="text-amber-300 font-bold">{taskAllocator.taskDescription}</span>
        </div>

        {/* Candidate Evaluation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {taskAllocator.evaluatedCandidates.map((candidate) => {
            const isSelected = candidate.robotId === taskAllocator.selectedRobotId;
            const rInfo = robots.find((r) => r.id === candidate.robotId);

            return (
              <div
                key={candidate.robotId}
                className={`p-3.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500 text-white ring-2 ring-cyan-500/30 shadow-lg'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="font-bold text-xs text-white">{candidate.name}</span>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 bg-cyan-500 text-slate-950 text-[10px] font-bold rounded">
                      SELECTED
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Euclidean Distance:</span>
                    <span className="font-bold text-slate-200">{candidate.distanceCm.toFixed(1)} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Computed Path Cost:</span>
                    <span className="font-bold text-cyan-300">{candidate.pathCost.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fleet Availability:</span>
                    <span className={`font-bold ${candidate.availability === 'READY' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {candidate.availability}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Collision Risk:</span>
                    <span className={`font-bold ${candidate.collisionRisk === 'LOW' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {candidate.collisionRisk}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">3S LiPo Battery:</span>
                    <span className="font-bold text-amber-300">{candidate.battery}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selection Decision Rationale Banner */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400">UNO Q Arbitration Decision: </span>
              <span className="text-emerald-300 font-bold">{taskAllocator.selectionReason}</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500">Autonomous Edge Allocation</span>
        </div>
      </div>

      {/* Manual Task Evaluation Trigger Buttons */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-400">Simulate Target Assignment Evaluation:</span>
        <div className="flex items-center gap-2">
          {['RACK_1', 'RACK_2', 'RACK_3'].map((rk) => (
            <button
              key={rk}
              onClick={() => onTriggerAllocation && onTriggerAllocation(rk)}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded text-[11px] transition-all font-bold"
            >
              Evaluate {rk}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
