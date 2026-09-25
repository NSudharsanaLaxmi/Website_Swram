import React from 'react';
import { RobotTwin } from '../types';
import { Cpu, Zap, Shield, Radio, Activity, CheckCircle2, AlertTriangle, Disc } from 'lucide-react';

interface EdgeAgentViewProps {
  robots: RobotTwin[];
  selectedRobotId: string;
  onSelectRobot: (id: string) => void;
}

export const EdgeAgentView: React.FC<EdgeAgentViewProps> = ({
  robots,
  selectedRobotId,
  onSelectRobot,
}) => {
  const selectedRobot = robots.find((r) => r.id === selectedRobotId) || robots[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Layer 3 & 4 — Robot Fleet & Dual-MCU Edge Intelligence
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Visualizing the onboard architecture: <strong className="text-cyan-300">Arduino UNO Q</strong> (High-Level Edge Brain) 
            interfaced via UART (115200 baud) to <strong className="text-emerald-400">ESP32</strong> (Deterministic Real-Time Actuation & Safety).
          </p>
        </div>

        {/* Robot Selector Buttons */}
        <div className="flex items-center gap-2">
          {robots.map((bot) => (
            <button
              key={bot.id}
              onClick={() => onSelectRobot(bot.id)}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                selectedRobotId === bot.id
                  ? 'bg-cyan-600 text-white shadow-lg border border-cyan-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              {bot.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual-MCU Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Arduino UNO Q High-Level Edge Agent */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold text-cyan-400 block">LAYER 3 — HIGH-LEVEL EDGE AGENT</span>
                <h3 className="text-base font-bold text-white">Arduino UNO Q (Qualcomm MPU)</h3>
              </div>
            </div>

            <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold rounded-md">
              MPU ONLINE
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono text-slate-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Application Processor (MPU)</span>
                <span className="text-white font-bold text-xs block mt-0.5">Qualcomm QRB2210 (4x Cortex-A53 @ 2.0 GHz)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Microcontroller Unit (MCU)</span>
                <span className="text-white font-bold text-xs block mt-0.5">STM32U585 (Arm Cortex-M33 @ 160 MHz)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">UART Link Speed</span>
                <span className="text-cyan-400 font-bold">115200 Baud</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">Wi-Fi Telemetry</span>
                <span className="text-emerald-400 font-bold">UDP Port 5005</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">High-Level Role</span>
                <span className="text-amber-400 font-bold">Swarm Brain</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block font-bold">Primary Responsibilities:</span>
              <ul className="text-slate-300 space-y-1 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Parses global ArUco vision state broadcast from central server.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Evaluates swarm conflict right-of-way yielding logic.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Forwards high-level trajectory frames over UART to ESP32.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Card: ESP32 Deterministic Real-Time Controller */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 block">LAYER 4 — REAL-TIME ACTUATION</span>
                <h3 className="text-base font-bold text-white">ESP32 DevKit V1 (Xtensa Dual-Core)</h3>
              </div>
            </div>

            <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold rounded-md">
              RTOS READY
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono text-slate-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Motor PWM Rails</span>
                <span className="text-emerald-400 font-bold text-xs block mt-0.5">GPIO 4 (Left) | GPIO 5 (Right)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">I2C Bus (GPIO 21/22)</span>
                <span className="text-cyan-400 font-bold text-xs block mt-0.5">PCA9685 (0x40), VL53L0X (0x29)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">ToF Laser Brake</span>
                <span className="text-emerald-400 font-bold">&lt; 120 mm Active</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">Watchdog Timeout</span>
                <span className="text-amber-400 font-bold">500 ms</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">Motor STBY Pins</span>
                <span className="text-cyan-400 font-bold">Hardwired 3.3V</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block font-bold">Direction Pins (8 GPIOs):</span>
              <div className="text-[11px] text-slate-300 font-mono">
                FL: <span className="text-cyan-300">[25, 26]</span> | FR: <span className="text-cyan-300">[27, 14]</span> | 
                RL: <span className="text-cyan-300">[12, 13]</span> | RR: <span className="text-cyan-300">[32, 33]</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry & Actuation Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Motor PWM Drive Gauges */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">4WD Motor Drive PWM</h4>
            <span className="text-[10px] font-mono text-slate-400">SOURCE: ESP32 Hardware PWM</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Left PWM (GPIO 4):</span>
                <span className="font-bold text-cyan-400">
                  {Math.round(Math.abs(selectedRobot.driveVelocities.linearX * 255))} / 255
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${Math.abs(selectedRobot.driveVelocities.linearX * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Right PWM (GPIO 5):</span>
                <span className="font-bold text-cyan-400">
                  {Math.round(Math.abs(selectedRobot.driveVelocities.linearX * 255))} / 255
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${Math.abs(selectedRobot.driveVelocities.linearX * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4-DOF Arm Servos Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">4-DOF Arm Servos (PCA9685)</h4>
            <span className="text-[10px] font-mono text-slate-400">SOURCE: I2C 0x40</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block">CH0 Base:</span>
              <span className="text-cyan-300 font-bold">{selectedRobot.armServos.base} pulse</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block">CH1 Shoulder:</span>
              <span className="text-cyan-300 font-bold">{selectedRobot.armServos.shoulder} pulse</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block">CH2 Elbow:</span>
              <span className="text-cyan-300 font-bold">{selectedRobot.armServos.elbow} pulse</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block">CH3 Wrist:</span>
              <span className="text-cyan-300 font-bold">{selectedRobot.armServos.wrist} pulse</span>
            </div>
          </div>
        </div>

        {/* Onboard Sensors */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Onboard Sensors & Safety</h4>
            <span className="text-[10px] font-mono text-slate-400">SOURCE: ToF / RFID</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">VL53L0X Laser ToF:</span>
              <span className="text-emerald-400 font-bold">{selectedRobot.tofDistanceMm} mm</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">HC-SR04 Ultrasonic:</span>
              <span className="text-cyan-300 font-bold">{selectedRobot.ultrasonicCm} cm</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">RC522 RFID Tag:</span>
              <span className="text-amber-300 font-bold">{selectedRobot.lastRfidTag || 'NONE'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
