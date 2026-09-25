import React, { useState } from 'react';
import { RobotTwin, TaskOrder, WorkspaceCalibration, LandmarkState } from '../types';
import { Layers, Shield, Eye, AlertTriangle, CheckCircle2, Disc, Play, Pause, Activity } from 'lucide-react';

interface WarehouseDigitalTwinProps {
  robots: RobotTwin[];
  selectedRobotId: string;
  onSelectRobot: (id: string) => void;
  tasks: TaskOrder[];
  workspace: WorkspaceCalibration;
  landmarks: LandmarkState[];
  onAddTask: (task: TaskOrder) => void;
  onEmergencyHalt: () => void;
}

export const WarehouseDigitalTwin: React.FC<WarehouseDigitalTwinProps> = ({
  robots,
  selectedRobotId,
  onSelectRobot,
  tasks,
  workspace,
  landmarks,
  onAddTask,
  onEmergencyHalt,
}) => {
  const selectedRobot = robots.find((r) => r.id === selectedRobotId) || robots[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Real-Time Warehouse Digital Twin & Swarm Workcell Map
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Real-time digital twin transformed via <code className="text-cyan-300 font-mono font-bold">DICT_4X4_50</code> ArUco homography matrix $H$. 
            Hard safety perimeter buffer: <span className="text-amber-400 font-mono font-bold">8.0 cm</span>.
          </p>
        </div>

        {/* Quick Fleet Quick Status Pills */}
        <div className="flex items-center gap-3">
          {robots.map((r) => (
            <div
              key={r.id}
              onClick={() => onSelectRobot(r.id)}
              className={`px-3 py-2 rounded-lg border font-mono text-xs cursor-pointer transition-all ${
                selectedRobotId === r.id
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${r.outOfBounds ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                <span className="font-bold">{r.name}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                ({r.pose.x.toFixed(1)}, {r.pose.y.toFixed(1)}) cm | {r.missionState}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Map + Fleet Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 2D Digital Twin Canvas */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              120 × 120 cm Calibrated Workcell Workspace
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-500/40 px-2.5 py-1 rounded-md">
              HOMOGRAPHY H ACTIVE
            </span>
          </div>

          <div className="relative aspect-square bg-slate-950 rounded-xl border border-slate-800 p-8 flex flex-col justify-between overflow-hidden shadow-inner">
            {/* Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20%_20%] opacity-50" />

            {/* Safety Perimeter Buffer Polygon */}
            <div className="absolute inset-[6.6%] border-2 border-dashed border-amber-500/40 bg-amber-500/5 rounded-lg pointer-events-none flex items-start justify-end p-2">
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-slate-900/90 px-2 py-0.5 rounded border border-amber-500/30">
                SAFETY BUFFER (8 cm)
              </span>
            </div>

            {/* Corner Markers (IDs 9-12) */}
            <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-400 font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-cyan-800">
              BOUNDARY_TL (9)
            </div>
            <div className="absolute top-2 right-2 text-[10px] font-mono text-cyan-400 font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-cyan-800">
              BOUNDARY_TR (10)
            </div>
            <div className="absolute bottom-2 right-2 text-[10px] font-mono text-cyan-400 font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-cyan-800">
              BOUNDARY_BR (11)
            </div>
            <div className="absolute bottom-2 left-2 text-[10px] font-mono text-cyan-400 font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-cyan-800">
              BOUNDARY_BL (12)
            </div>

            {/* Fixed Warehouse Landmarks (Racks, Starts, Delivery) */}
            {landmarks.map((lm) => (
              <div
                key={lm.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded text-[10px] font-mono font-bold shadow-md ${
                  lm.type === 'RACK'
                    ? 'bg-amber-950/90 border border-amber-500/60 text-amber-300'
                    : lm.type === 'DELIVERY'
                    ? 'bg-emerald-950/90 border border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-800/90 border border-slate-700 text-slate-300'
                }`}
                style={{
                  left: `${(lm.xCm / 120) * 100}%`,
                  top: `${(lm.yCm / 120) * 100}%`,
                }}
              >
                {lm.name} ({lm.id})
              </div>
            ))}

            {/* Robots */}
            {robots.map((bot) => {
              const isSel = bot.id === selectedRobotId;

              return (
                <div
                  key={bot.id}
                  onClick={() => onSelectRobot(bot.id)}
                  className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-2 cursor-pointer flex items-center justify-center text-xs font-mono font-bold shadow-2xl transition-all duration-300 ${
                    bot.outOfBounds
                      ? 'bg-red-950 border-red-500 text-white animate-bounce'
                      : isSel
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 ring-4 ring-cyan-500/30'
                      : 'bg-slate-900 border-slate-600 text-slate-300'
                  }`}
                  style={{
                    left: `${(bot.pose.x / 120) * 100}%`,
                    top: `${(bot.pose.y / 120) * 100}%`,
                    transform: `rotate(${bot.pose.ang}deg)`,
                  }}
                  title={`${bot.name} - Pose: (${bot.pose.x.toFixed(1)}, ${bot.pose.y.toFixed(1)}) cm`}
                >
                  R{bot.botNum + 1}
                  {/* Direction Heading Line */}
                  <div className="absolute w-6 h-0.5 bg-cyan-400 left-full top-1/2 -translate-y-1/2" />
                </div>
              );
            })}

            {/* Corner Coordinates */}
            <div className="z-10 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>(0,0) cm</span>
              <span>(120,0) cm</span>
            </div>
            <div className="z-10 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>(0,120) cm</span>
              <span>(120,120) cm</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Selected Robot Inspector */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase block">
                ROBOT FLEET INSPECTOR
              </span>
              <h3 className="text-base font-bold text-white">{selectedRobot.name}</h3>
            </div>

            <span className="px-2.5 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-mono font-bold rounded-md">
              ID {selectedRobot.botNum}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs text-slate-300">
            {/* Mission State */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Mission State:</span>
              <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40 text-[11px]">
                {selectedRobot.missionState}
              </span>
            </div>

            {/* Metric Position */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">ArUco Centroid:</span>
                <span className="text-cyan-300 font-bold">
                  X: {selectedRobot.pose.x.toFixed(1)} cm | Y: {selectedRobot.pose.y.toFixed(1)} cm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Orientation Theta:</span>
                <span className="text-cyan-300 font-bold">{selectedRobot.pose.ang.toFixed(1)}°</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">SOURCE: Overhead Vision DICT_4X4_50</div>
            </div>

            {/* ESP32 Onboard Safety */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">VL53L0X Laser ToF:</span>
                <span className="text-emerald-400 font-bold">{selectedRobot.tofDistanceMm} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HC-SR04 Ultrasonic:</span>
                <span className="text-cyan-300 font-bold">{selectedRobot.ultrasonicCm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RC522 RFID Tag:</span>
                <span className="text-amber-300 font-bold">{selectedRobot.lastRfidTag || 'NONE'}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">SOURCE: ESP32 I2C Bus (0x29)</div>
            </div>

            {/* Power & Voltage */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">3S LiPo Battery:</span>
              <span className="text-amber-400 font-bold">{selectedRobot.battery}% ({selectedRobot.voltage}V)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
