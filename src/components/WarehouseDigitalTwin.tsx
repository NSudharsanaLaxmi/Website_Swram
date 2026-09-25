import React, { useState } from 'react';
import { RobotTwin, TaskOrder, WorkspaceCalibration, LandmarkState, RackState, Pose } from '../types';
import { INITIAL_RACKS_STATE, INITIAL_DELIVERY_ZONE } from '../data/arucoMarkers';
import { 
  Layers, 
  Shield, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Navigation, 
  ArrowDown, 
  ArrowUp, 
  Box, 
  Truck, 
  Info,
  CornerDownRight,
  Maximize2,
  X
} from 'lucide-react';

interface WarehouseDigitalTwinProps {
  robots: RobotTwin[];
  selectedRobotId: string;
  onSelectRobot: (id: string) => void;
  tasks: TaskOrder[];
  workspace: WorkspaceCalibration;
  landmarks: LandmarkState[];
  racks?: RackState[];
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
  racks = INITIAL_RACKS_STATE,
  onAddTask,
  onEmergencyHalt,
}) => {
  const [selectedRackId, setSelectedRackId] = useState<string | null>('rack_1');
  const [showTrajectories, setShowTrajectories] = useState<boolean>(true);
  const [showSafetyRadii, setShowSafetyRadii] = useState<boolean>(true);

  const selectedRobot = robots.find((r) => r.id === selectedRobotId) || robots[0];
  const selectedRack = racks.find((rk) => rk.id === selectedRackId) || racks[0];

  // Inter-robot distance & conflict check
  const robot0 = robots.find((r) => r.botNum === 0);
  const robot1 = robots.find((r) => r.botNum === 1);
  let interRobotDistCm = 999;
  let isConflict = false;

  if (robot0 && robot1) {
    interRobotDistCm = Math.sqrt(
      Math.pow(robot0.pose.x - robot1.pose.x, 2) + Math.pow(robot0.pose.y - robot1.pose.y, 2)
    );
    isConflict = interRobotDistCm < 28.0;
  }

  // Delivery zone reference
  const deliveryZone = INITIAL_DELIVERY_ZONE;

  return (
    <div className="space-y-6">
      {/* Top Banner: Real-time status & quick toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              3-Rack Warehouse Digital Twin & Swarm Workcell Map
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            U/Triangular arrangement with open central maneuvering corridor. 
            Calibrated via <code className="text-cyan-300 font-mono font-bold">DICT_4X4_50</code> ArUco H-Matrix.
            Safety buffer margin: <span className="text-amber-400 font-mono font-bold">8.0 cm</span>.
          </p>
        </div>

        {/* View Controls & Fleet Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setShowTrajectories(!showTrajectories)}
              className={`px-2.5 py-1 rounded transition-colors ${showTrajectories ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400'}`}
            >
              Corridors: {showTrajectories ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowSafetyRadii(!showSafetyRadii)}
              className={`px-2.5 py-1 rounded transition-colors ${showSafetyRadii ? 'bg-amber-950 text-amber-300 border border-amber-700/60' : 'text-slate-400'}`}
            >
              28cm Bubbles: {showSafetyRadii ? 'ON' : 'OFF'}
            </button>
          </div>

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
                <span className={`w-2 h-2 rounded-full ${r.outOfBounds ? 'bg-red-500 animate-ping' : r.isYielding ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className="font-bold">{r.name}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                ({r.pose.x.toFixed(1)}, {r.pose.y.toFixed(1)}) cm | {r.missionState}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict / Warning Banner if detected */}
      {isConflict && (
        <div className="bg-amber-950/80 border border-amber-500/70 p-4 rounded-xl flex items-center justify-between text-amber-200 text-xs font-mono">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
            <div>
              <span className="font-bold text-amber-300">INTER-ROBOT CONFLICT DETECTED:</span> Separation distance is {interRobotDistCm.toFixed(1)} cm (&lt; 28.0 cm threshold).
              <div className="text-slate-400 text-[11px] mt-0.5">Robot 1 (ID 0) holds Right-of-Way. Robot 2 (ID 1) yielding in Central Maneuvering Zone.</div>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-900 border border-amber-600 rounded text-[10px] font-bold text-amber-300">
            AUTO-YIELD ACTIVE
          </span>
        </div>
      )}

      {/* Main Grid: Interactive Map (8 cols) + Dual Inspectors (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 2D Digital Twin Canvas */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              120 × 120 cm Calibrated Workcell Workspace (DICT_4X4_50)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-500/40 px-2.5 py-1 rounded-md">
                HOMOGRAPHY H ACTIVE
              </span>
            </div>
          </div>

          {/* Canvas Container */}
          <div className="relative aspect-square bg-slate-950 rounded-xl border border-slate-800 p-8 flex flex-col justify-between overflow-hidden shadow-inner select-none">
            {/* Grid background (20 cm major grid lines) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16.66%_16.66%] opacity-40 pointer-events-none" />

            {/* Safety Perimeter Buffer Margin (8 cm on all edges = 6.67% of 120 cm) */}
            <div className="absolute inset-[6.67%] border-2 border-dashed border-amber-500/40 bg-amber-500/5 rounded-lg pointer-events-none flex items-start justify-end p-2">
              <span className="text-[9px] font-mono text-amber-400 font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-amber-500/30">
                8 cm SAFETY BUFFER
              </span>
            </div>

            {/* Central Open Maneuvering / Traffic Zone (X: 25-95 cm, Y: 38-65 cm) */}
            <div 
              className="absolute border border-cyan-500/20 bg-cyan-950/20 rounded-lg pointer-events-none flex flex-col items-center justify-center p-2 text-center"
              style={{
                left: `${(25 / 120) * 100}%`,
                top: `${(38 / 120) * 100}%`,
                width: `${((95 - 25) / 120) * 100}%`,
                height: `${((65 - 38) / 120) * 100}%`,
              }}
            >
              <span className="text-[10px] font-mono text-cyan-400/80 font-bold uppercase tracking-wider">
                Central Maneuvering Zone
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                Unobstructed passing &amp; lateral approach corridor (70 × 27 cm)
              </span>
            </div>

            {/* Boundary Markers (IDs 9-12) */}
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

            {/* Approach Corridors & Exit Trajectories (SVG overlay) */}
            {showTrajectories && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <marker id="arrow-south" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                  </marker>
                  <marker id="arrow-north" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
                  </marker>
                  <marker id="arrow-delivery" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                  </marker>
                </defs>

                {/* Rack 1: Central -> Approach (35,45) -> Pickup (35,32) */}
                <line 
                  x1={`${(35 / 120) * 100}%`} y1={`${(55 / 120) * 100}%`} 
                  x2={`${(35 / 120) * 100}%`} y2={`${(36 / 120) * 100}%`} 
                  stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-south)"
                />

                {/* Rack 2: Central -> Approach (85,45) -> Pickup (85,32) */}
                <line 
                  x1={`${(85 / 120) * 100}%`} y1={`${(55 / 120) * 100}%`} 
                  x2={`${(85 / 120) * 100}%`} y2={`${(36 / 120) * 100}%`} 
                  stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-south)"
                />

                {/* Rack 3: Central -> Approach (60,55) -> Pickup (60,68) */}
                <line 
                  x1={`${(60 / 120) * 100}%`} y1={`${(48 / 120) * 100}%`} 
                  x2={`${(60 / 120) * 100}%`} y2={`${(67 / 120) * 100}%`} 
                  stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-north)"
                />

                {/* Delivery Zone: Approach (60,88) -> Drop (60,98) */}
                <line 
                  x1={`${(60 / 120) * 100}%`} y1={`${(82 / 120) * 100}%`} 
                  x2={`${(60 / 120) * 100}%`} y2={`${(96 / 120) * 100}%`} 
                  stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-delivery)"
                />
              </svg>
            )}

            {/* 3 Storage Racks (Selectable) */}
            {racks.map((rk) => {
              const isSelected = selectedRackId === rk.id;
              return (
                <div
                  key={rk.id}
                  onClick={() => setSelectedRackId(rk.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-lg border cursor-pointer shadow-lg transition-all duration-200 z-20 ${
                    isSelected
                      ? 'bg-amber-950 border-amber-400 ring-4 ring-amber-500/30 text-white scale-105'
                      : 'bg-slate-900/90 border-amber-600/60 text-amber-200 hover:border-amber-400'
                  }`}
                  style={{
                    left: `${(rk.position.x / 120) * 100}%`,
                    top: `${(rk.position.y / 120) * 100}%`,
                  }}
                  title={`Click to inspect ${rk.name} (Marker ID ${rk.markerId})`}
                >
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                    <Box className="w-3.5 h-3.5 text-amber-400" />
                    <span>{rk.name}</span>
                    <span className="text-[10px] text-amber-400/80 font-normal">({rk.markerId})</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between gap-2 mt-0.5">
                    <span>Face: {rk.pickupFace}</span>
                    {rk.pickupFace === 'SOUTH' ? (
                      <ArrowDown className="w-3 h-3 text-amber-400" />
                    ) : (
                      <ArrowUp className="w-3 h-3 text-cyan-400" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Delivery Drop Station (ID 8) */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-lg border bg-emerald-950/90 border-emerald-500/60 text-emerald-200 shadow-md z-20 text-center"
              style={{
                left: `${(deliveryZone.position.x / 120) * 100}%`,
                top: `${(deliveryZone.position.y / 120) * 100}%`,
              }}
            >
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-300">
                <Truck className="w-3.5 h-3.5" />
                <span>DELIVERY (ID 8)</span>
              </div>
              <div className="text-[9px] font-mono text-emerald-400/80 mt-0.5">
                Drop Zone ({deliveryZone.position.x}, {deliveryZone.position.y})
              </div>
            </div>

            {/* Robot 1 Start Staging Bay (ID 6) */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded border bg-slate-900/90 border-slate-700 text-slate-300 font-mono text-[10px] z-10"
              style={{
                left: `${(20.0 / 120) * 100}%`,
                top: `${(102.0 / 120) * 100}%`,
              }}
            >
              START 1 (6)
            </div>

            {/* Robot 2 Start Staging Bay (ID 7) */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded border bg-slate-900/90 border-slate-700 text-slate-300 font-mono text-[10px] z-10"
              style={{
                left: `${(100.0 / 120) * 100}%`,
                top: `${(102.0 / 120) * 100}%`,
              }}
            >
              START 2 (7)
            </div>

            {/* Robots with Heading Vector & Safety Bubble */}
            {robots.map((bot) => {
              const isSel = bot.id === selectedRobotId;
              const radiusPercent = (28 / 120) * 100; // 28 cm collision bubble

              return (
                <React.Fragment key={bot.id}>
                  {/* 28 cm Inter-Robot Collision Bubble */}
                  {showSafetyRadii && (
                    <div
                      className={`absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 border transition-all ${
                        bot.isYielding 
                          ? 'border-amber-400 bg-amber-500/10' 
                          : 'border-cyan-500/20 bg-cyan-500/5'
                      }`}
                      style={{
                        left: `${(bot.pose.x / 120) * 100}%`,
                        top: `${(bot.pose.y / 120) * 100}%`,
                        width: `${radiusPercent * 2}%`,
                        height: `${radiusPercent * 2}%`,
                      }}
                    />
                  )}

                  {/* Robot Body */}
                  <div
                    onClick={() => onSelectRobot(bot.id)}
                    className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-2 cursor-pointer flex items-center justify-center text-xs font-mono font-bold shadow-2xl transition-all duration-300 z-30 ${
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
                    {/* Heading Vector Arrow */}
                    <div className="absolute w-6 h-0.5 bg-cyan-400 left-full top-1/2 -translate-y-1/2">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400 rotate-45" />
                    </div>
                  </div>
                </React.Fragment>
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

          {/* Visual Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span className="text-slate-400">Racks (1-3) &amp; Face</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
              <span className="text-slate-400">Maneuvering Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-slate-400">Delivery Drop Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-amber-400" />
              <span className="text-slate-400">28cm Safety Bubble</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dual Inspectors (Selected Rack + Fleet Inspector) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Interactive Selected Rack Inspector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block tracking-wider">
                  INTERACTIVE RACK INSPECTOR
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Box className="w-4 h-4 text-amber-400" />
                  {selectedRack.name}
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-mono font-bold rounded-md">
                MARKER ID {selectedRack.markerId}
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs text-slate-300">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Rack Status:</span>
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40 text-[10px]">
                  {selectedRack.status}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Physical Center (X, Y):</span>
                  <span className="text-amber-300 font-bold">
                    ({selectedRack.position.x.toFixed(1)}, {selectedRack.position.y.toFixed(1)}) cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pickup Face:</span>
                  <span className="text-cyan-300 font-bold">
                    {selectedRack.pickupFace} ({selectedRack.orientation > 0 ? '+90° South' : '-90° North'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RFID Verification:</span>
                  <span className="text-amber-400 font-bold">{selectedRack.rfidTag}</span>
                </div>
              </div>

              {/* Navigation Corridors */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Predictable Navigation Corridors
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">Approach</span>
                    <span className="text-cyan-300 font-bold">
                      ({selectedRack.approachPose.x}, {selectedRack.approachPose.y})
                    </span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">Pickup</span>
                    <span className="text-amber-300 font-bold">
                      ({selectedRack.pickupPose.x}, {selectedRack.pickupPose.y})
                    </span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">Exit</span>
                    <span className="text-emerald-300 font-bold">
                      ({selectedRack.exitPose.x}, {selectedRack.exitPose.y})
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Task Dispatch for Selected Robot */}
              <button
                onClick={() => {
                  onAddTask({
                    id: `TASK_${Date.now()}`,
                    name: `${selectedRack.name} -> DELIVERY_ZONE`,
                    pickTarget: [selectedRack.pickupPose.x, selectedRack.pickupPose.y],
                    dropTarget: [deliveryZone.dropPose.x, deliveryZone.dropPose.y],
                    rackMarkerId: selectedRack.markerId,
                    dropMarkerId: 8,
                    status: 'OPEN',
                    assignedTo: selectedRobot.id,
                    itemType: 'Electronic Pallet Kit',
                    rfidPayloadId: selectedRack.rfidTag || 'TAG_RACK_01',
                    createdAt: Date.now(),
                  });
                }}
                className="w-full py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <CornerDownRight className="w-4 h-4" />
                Dispatch {selectedRobot.name} to {selectedRack.name}
              </button>
            </div>
          </div>

          {/* 2. Selected Robot Inspector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block tracking-wider">
                  ROBOT FLEET INSPECTOR
                </span>
                <h3 className="text-base font-bold text-white">{selectedRobot.name}</h3>
              </div>
              <span className="px-2.5 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-mono font-bold rounded-md">
                ID {selectedRobot.botNum}
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs text-slate-300">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Mission State:</span>
                <span className="text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40 text-[10px]">
                  {selectedRobot.missionState}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Metric Centroid:</span>
                  <span className="text-cyan-300 font-bold">
                    X: {selectedRobot.pose.x.toFixed(1)} cm | Y: {selectedRobot.pose.y.toFixed(1)} cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Heading Theta:</span>
                  <span className="text-cyan-300 font-bold">{selectedRobot.pose.ang.toFixed(1)}°</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1">SOURCE: Overhead Vision ArUco DICT_4X4_50</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">ToF Distance (Docking):</span>
                  <span className="text-emerald-400 font-bold">{selectedRobot.tofDistanceMm} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RFID Tag Verified:</span>
                  <span className="text-amber-300 font-bold">{selectedRobot.lastRfidTag || 'NONE'}</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1">SOURCE: ESP32 I2C 0x29 / SPI RC522</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">3S LiPo Battery:</span>
                <span className="text-amber-400 font-bold">{selectedRobot.battery}% ({selectedRobot.voltage}V)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
