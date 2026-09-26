import React, { useState, useEffect } from 'react';
import { RobotTwin, TaskOrder, CommandAck } from '../types';
import { Radio, AlertTriangle, Play, Pause, RefreshCw, Send, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface HardwareControllerProps {
  robots: RobotTwin[];
  selectedRobotId: string;
  onSelectRobot: (id: string) => void;
  onSendCommand: (commandName: string, targetRobotId: string, payload?: any) => Promise<CommandAck>;
  onEmergencyHalt: () => void;
  activeCommands: CommandAck[];
  onAddTask: (task: TaskOrder) => void;
}

export const HardwareController: React.FC<HardwareControllerProps> = ({
  robots,
  selectedRobotId,
  onSelectRobot,
  onSendCommand,
  onEmergencyHalt,
  activeCommands,
  onAddTask,
}) => {
  const selectedRobot = robots.find((r) => r.id === selectedRobotId) || robots[0];

  const [linearVelocity, setLinearVelocity] = useState<number>(0);
  const [angularVelocity, setAngularVelocity] = useState<number>(0);
  const [lastCommandAck, setLastCommandAck] = useState<CommandAck | null>(null);

  // Send manual drive packet
  const handleDrive = async (lin: number, ang: number) => {
    setLinearVelocity(lin);
    setAngularVelocity(ang);
    const ack = await onSendCommand('MANUAL_DRIVE', selectedRobotId, {
      linearX: lin,
      angularZ: ang,
      ip: selectedRobot.ip,
      udpPort: selectedRobot.udpPort,
    });
    setLastCommandAck(ack);
  };

  // Keyboard Teleop listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          handleDrive(0.5, 0.0);
          break;
        case 's':
        case 'arrowdown':
          handleDrive(-0.5, 0.0);
          break;
        case 'a':
        case 'arrowleft':
          handleDrive(0.0, 0.8);
          break;
        case 'd':
        case 'arrowright':
          handleDrive(0.0, -0.8);
          break;
        case ' ':
        case 'x':
          handleDrive(0.0, 0.0);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRobotId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Layer 4 & 5 — Real-Time Command & Teleoperation Pipeline
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Dispatch direct movement, arm poses, and mission tasks to physical ESP32 robots over UDP Port 8888 with command acknowledgment pipeline.
          </p>
        </div>

        {/* Robot Selection */}
        <div className="flex items-center gap-2">
          {robots.map((bot) => (
            <button
              key={bot.id}
              onClick={() => onSelectRobot(bot.id)}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                selectedRobotId === bot.id
                  ? 'bg-cyan-600 text-white shadow-lg border border-cyan-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {bot.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive D-Pad Teleop */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">Manual Teleoperation Controls</h3>
            <span className="text-xs font-mono text-slate-400">Use On-Screen D-Pad or [W/A/S/D] Keys</span>
          </div>

          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            {/* Forward */}
            <button
              onClick={() => handleDrive(0.55, 0.0)}
              className="w-20 h-16 bg-cyan-950 hover:bg-cyan-900 border-2 border-cyan-500/50 rounded-xl text-cyan-300 font-bold font-mono shadow-lg transition-all flex flex-col items-center justify-center active:scale-95"
            >
              ▲
              <span className="text-[10px] text-slate-400">FWD (W)</span>
            </button>

            {/* Middle Row: Left, Stop, Right */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDrive(0.0, 0.85)}
                className="w-20 h-16 bg-cyan-950 hover:bg-cyan-900 border-2 border-cyan-500/50 rounded-xl text-cyan-300 font-bold font-mono shadow-lg transition-all flex flex-col items-center justify-center active:scale-95"
              >
                ◀
                <span className="text-[10px] text-slate-400">LEFT (A)</span>
              </button>

              <button
                onClick={() => handleDrive(0.0, 0.0)}
                className="w-20 h-16 bg-red-950 hover:bg-red-900 border-2 border-red-500/60 rounded-xl text-red-300 font-bold font-mono shadow-lg transition-all flex flex-col items-center justify-center active:scale-95"
              >
                ■
                <span className="text-[10px] text-red-400">STOP (Space)</span>
              </button>

              <button
                onClick={() => handleDrive(0.0, -0.85)}
                className="w-20 h-16 bg-cyan-950 hover:bg-cyan-900 border-2 border-cyan-500/50 rounded-xl text-cyan-300 font-bold font-mono shadow-lg transition-all flex flex-col items-center justify-center active:scale-95"
              >
                ▶
                <span className="text-[10px] text-slate-400">RIGHT (D)</span>
              </button>
            </div>

            {/* Reverse */}
            <button
              onClick={() => handleDrive(-0.55, 0.0)}
              className="w-20 h-16 bg-cyan-950 hover:bg-cyan-900 border-2 border-cyan-500/50 rounded-xl text-cyan-300 font-bold font-mono shadow-lg transition-all flex flex-col items-center justify-center active:scale-95"
            >
              ▼
              <span className="text-[10px] text-slate-400">REV (S)</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
            <div>
              <span className="text-slate-400 block">Active Velocity Command:</span>
              <span className="text-white font-bold">
                Linear X: {linearVelocity.toFixed(2)} | Angular Z: {angularVelocity.toFixed(2)}
              </span>
            </div>
            <button
              onClick={onEmergencyHalt}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              EMERGENCY HALT
            </button>
          </div>
        </div>

        {/* Right Column: Command Pipeline Status & Mission Enqueue */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Command Pipeline & Feedback Status
          </h3>

          {lastCommandAck ? (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Command ID:</span>
                <span className="text-cyan-400 font-bold">{lastCommandAck.commandId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Target Robot:</span>
                <span className="text-white font-bold">{lastCommandAck.targetRobotId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pipeline State:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    lastCommandAck.state === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : lastCommandAck.state === 'EXECUTING'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                      : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {lastCommandAck.state}
                </span>
              </div>
              <div className="text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px]">
                {lastCommandAck.message}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-500 font-mono">
              No active command pending. Click D-Pad or press W/A/S/D to dispatch packets.
            </div>
          )}

          {/* Quick Enqueue Mission Task */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 font-mono uppercase">Enqueue Warehouse Task (3 Racks)</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() =>
                  onAddTask({
                    id: `MISSION-${Date.now().toString().slice(-4)}`,
                    name: 'RACK_1 (ID 2) -> DELIVERY_ZONE (ID 8)',
                    pickTarget: [35.0, 32.0],
                    dropTarget: [60.0, 98.0],
                    rackMarkerId: 2,
                    dropMarkerId: 8,
                    status: 'OPEN',
                    itemType: 'Electronic Sensor Kit',
                    rfidPayloadId: `TAG_ES_${Math.floor(Math.random() * 900 + 100)}`,
                    createdAt: Date.now(),
                  })
                }
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-mono font-bold text-left transition-all"
              >
                + Rack 1 Pick
              </button>

              <button
                onClick={() =>
                  onAddTask({
                    id: `MISSION-${Date.now().toString().slice(-4)}`,
                    name: 'RACK_2 (ID 3) -> DELIVERY_ZONE (ID 8)',
                    pickTarget: [85.0, 32.0],
                    dropTarget: [60.0, 98.0],
                    rackMarkerId: 3,
                    dropMarkerId: 8,
                    status: 'OPEN',
                    itemType: 'Actuator Servo Pack',
                    rfidPayloadId: `TAG_ACT_${Math.floor(Math.random() * 900 + 100)}`,
                    createdAt: Date.now(),
                  })
                }
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-mono font-bold text-left transition-all"
              >
                + Rack 2 Pick
              </button>

              <button
                onClick={() =>
                  onAddTask({
                    id: `MISSION-${Date.now().toString().slice(-4)}`,
                    name: 'RACK_3 (ID 4) -> DELIVERY_ZONE (ID 8)',
                    pickTarget: [60.0, 68.0],
                    dropTarget: [60.0, 98.0],
                    rackMarkerId: 4,
                    dropMarkerId: 8,
                    status: 'OPEN',
                    itemType: 'Lithium Battery Module',
                    rfidPayloadId: `TAG_BAT_${Math.floor(Math.random() * 900 + 100)}`,
                    createdAt: Date.now(),
                  })
                }
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-mono font-bold text-left transition-all"
              >
                + Rack 3 Pick
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5-DOF MG996R Arm Direct Pose Control & Calibration Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">5-DOF MG996R Robotic Arm Direct Joint Control</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Command individual PCA9685 servo angles (CH0–CH4) or execute pre-calibrated mission poses.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-3 py-1 rounded-md">
            TARGET: {selectedRobot.name}
          </span>
        </div>

        {/* Named Pose Presets */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Mission Pose Presets:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'HOME (90,90,90,90,180)', pose: 0, desc: 'Rest Position' },
              { label: 'APPROACH (90,65,115,90,180)', pose: 1, desc: 'Hover Over Rack' },
              { label: 'PICK (90,45,135,90,45)', pose: 2, desc: 'Grip Payload' },
              { label: 'LIFT (90,80,100,90,45)', pose: 3, desc: 'Elevate' },
              { label: 'TRANSPORT (90,110,70,90,45)', pose: 4, desc: 'Compact Transit' },
              { label: 'DROP (90,45,135,90,180)', pose: 5, desc: 'Release Payload' },
              { label: 'RETRACT (90,100,80,90,180)', pose: 6, desc: 'Safe Fold' },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() =>
                  onSendCommand('ARM_NAMED_POSE', selectedRobotId, { pose: p.pose })
                }
                className="px-3 py-1.5 bg-slate-950 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 rounded-lg text-xs font-mono transition-all"
                title={p.desc}
              >
                {p.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Individual Joint Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {/* CH0 Base Yaw */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">CH0 Base Yaw</span>
              <span className="text-cyan-400 font-bold">{selectedRobot.armServos.base}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={selectedRobot.armServos.base}
              onChange={(e) =>
                onSendCommand('ARM_POSE', selectedRobotId, {
                  base: parseInt(e.target.value),
                  shoulder: selectedRobot.armServos.shoulder,
                  elbow: selectedRobot.armServos.elbow,
                  joint4: selectedRobot.armServos.joint4,
                  joint5: selectedRobot.armServos.joint5,
                })
              }
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0°</span>
              <span>180°</span>
            </div>
          </div>

          {/* CH1 Shoulder */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">CH1 Shoulder</span>
              <span className="text-cyan-400 font-bold">{selectedRobot.armServos.shoulder}°</span>
            </div>
            <input
              type="range"
              min="15"
              max="165"
              value={selectedRobot.armServos.shoulder}
              onChange={(e) =>
                onSendCommand('ARM_POSE', selectedRobotId, {
                  base: selectedRobot.armServos.base,
                  shoulder: parseInt(e.target.value),
                  elbow: selectedRobot.armServos.elbow,
                  joint4: selectedRobot.armServos.joint4,
                  joint5: selectedRobot.armServos.joint5,
                })
              }
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>15°</span>
              <span>165°</span>
            </div>
          </div>

          {/* CH2 Elbow */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">CH2 Elbow</span>
              <span className="text-cyan-400 font-bold">{selectedRobot.armServos.elbow}°</span>
            </div>
            <input
              type="range"
              min="10"
              max="170"
              value={selectedRobot.armServos.elbow}
              onChange={(e) =>
                onSendCommand('ARM_POSE', selectedRobotId, {
                  base: selectedRobot.armServos.base,
                  shoulder: selectedRobot.armServos.shoulder,
                  elbow: parseInt(e.target.value),
                  joint4: selectedRobot.armServos.joint4,
                  joint5: selectedRobot.armServos.joint5,
                })
              }
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>10°</span>
              <span>170°</span>
            </div>
          </div>

          {/* CH3 Joint 4 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">CH3 Joint 4</span>
              <span className="text-cyan-400 font-bold">{selectedRobot.armServos.joint4}°</span>
            </div>
            <input
              type="range"
              min="10"
              max="170"
              value={selectedRobot.armServos.joint4}
              onChange={(e) =>
                onSendCommand('ARM_POSE', selectedRobotId, {
                  base: selectedRobot.armServos.base,
                  shoulder: selectedRobot.armServos.shoulder,
                  elbow: selectedRobot.armServos.elbow,
                  joint4: parseInt(e.target.value),
                  joint5: selectedRobot.armServos.joint5,
                })
              }
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>10°</span>
              <span>170°</span>
            </div>
          </div>

          {/* CH4 Joint 5 Gripper */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">CH4 Gripper</span>
              <span className="text-amber-300 font-bold">{selectedRobot.armServos.joint5}°</span>
            </div>
            <input
              type="range"
              min="45"
              max="180"
              value={selectedRobot.armServos.joint5}
              onChange={(e) =>
                onSendCommand('ARM_POSE', selectedRobotId, {
                  base: selectedRobot.armServos.base,
                  shoulder: selectedRobot.armServos.shoulder,
                  elbow: selectedRobot.armServos.elbow,
                  joint4: selectedRobot.armServos.joint4,
                  joint5: parseInt(e.target.value),
                })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>45° (Grip)</span>
              <span>180° (Open)</span>
            </div>
          </div>
        </div>
      </div>
