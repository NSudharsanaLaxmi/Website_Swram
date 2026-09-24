import React, { useState } from 'react';
import { RobotTwin } from '../types';
import { 
  Bot, 
  ShieldAlert, 
  ShieldCheck, 
  RotateCw, 
  ArrowUp, 
  ArrowDown, 
  Sliders, 
  Power,
  Gauge,
  Radio,
  Scan,
  Cpu
} from 'lucide-react';

interface HardwareControllerProps {
  selectedRobot: RobotTwin;
  onUpdateRobot: (robot: RobotTwin) => void;
  onSendCommand: (cmd: string) => void;
}

export const HardwareController: React.FC<HardwareControllerProps> = ({
  selectedRobot,
  onUpdateRobot,
  onSendCommand,
}) => {
  // Teleop linear and angular commands matching teleop_keyboard_udp.py / step3_esp32_swarm_agent.ino
  const [linearX, setLinearX] = useState(0);
  const [angularZ, setAngularZ] = useState(0);
  const [speedScale, setSpeedScale] = useState(0.6); // Base speed 0.1 to 1.0

  // 4-DoF Arm Servos (PCA9685 I2C 0x40): Base(CH0), Shoulder(CH1), Elbow(CH2), Wrist(CH3), Gripper(CH4: 85-180)
  const [s0, setS0] = useState(selectedRobot.armServos.base);
  const [s1, setS1] = useState(selectedRobot.armServos.shoulder);
  const [s2, setS2] = useState(selectedRobot.armServos.elbow);
  const [s3, setS3] = useState(selectedRobot.armServos.wrist);
  const [gripperAngle, setGripperAngle] = useState(selectedRobot.armServos.gripper);

  // VL53L0X Laser ToF sensor in mm (0x29) and HC-SR04 in cm
  const [tofDistMm, setTofDistMm] = useState(selectedRobot.tofDistanceMm);
  const [rfidTag, setRfidTag] = useState(selectedRobot.lastRfidTag || 'RACK_TAG_042');
  const [watchdogTimeRemaining, setWatchdogTimeRemaining] = useState(500);

  // Native TB6612 motor speed calculations (left PWM GPIO 4, right PWM GPIO 5)
  // Matching step3_esp32_swarm_agent.ino:
  // left_speed  = linear_x - (angular_z * 0.5)
  // right_speed = linear_x + (angular_z * 0.5)
  const calculateSkidMotors = (lin: number, ang: number) => {
    let left = lin - (ang * 0.5);
    let right = lin + (ang * 0.5);

    // Clamp between -1.0 and 1.0
    left = Math.max(-1.0, Math.min(1.0, left));
    right = Math.max(-1.0, Math.min(1.0, right));

    const leftPwm = Math.round(Math.abs(left) * 255);
    const rightPwm = Math.round(Math.abs(right) * 255);

    return {
      leftPwm,
      rightPwm,
      leftDir: left >= 0 ? 'FWD' : 'REV',
      rightDir: right >= 0 ? 'FWD' : 'REV',
      leftNormalized: left,
      rightNormalized: right
    };
  };

  const isSafetyInterlocked = tofDistMm < 120; // 120mm auto-brake threshold in step3
  const motors = isSafetyInterlocked 
    ? { leftPwm: 0, rightPwm: 0, leftDir: 'STOP', rightDir: 'STOP', leftNormalized: 0, rightNormalized: 0 }
    : calculateSkidMotors(linearX, angularZ);

  const handleDriveChange = (newLin: number, newAng: number) => {
    setLinearX(newLin);
    setAngularZ(newAng);
    setWatchdogTimeRemaining(500);

    // UDP command format matching repo: "linear_x,angular_z"
    const cmd = `${newLin.toFixed(2)},${newAng.toFixed(2)}`;
    onSendCommand(cmd);

    onUpdateRobot({
      ...selectedRobot,
      driveVelocities: { linearX: newLin, angularZ: newAng },
      safetyInterlock: isSafetyInterlocked,
    });
  };

  const handleArmChange = (newBase: number, newShoulder: number, newElbow: number, newWrist: number, newGripper: number) => {
    setS0(newBase);
    setS1(newShoulder);
    setS2(newElbow);
    setS3(newWrist);
    setGripperAngle(newGripper);

    const cmd = `ARM,${newBase},${newShoulder},${newElbow},${newWrist},${newGripper}`;
    onSendCommand(cmd);

    onUpdateRobot({
      ...selectedRobot,
      armServos: { base: newBase, shoulder: newShoulder, elbow: newElbow, wrist: newWrist, gripper: newGripper },
    });
  };

  const handleTofChange = (newDistMm: number) => {
    setTofDistMm(newDistMm);
    const interlock = newDistMm < 120;
    onUpdateRobot({
      ...selectedRobot,
      tofDistanceMm: newDistMm,
      safetyInterlock: interlock,
    });
  };

  // 2D arm visual projection based on PCA9685 angles
  const shoulderAngleDeg = ((s1 - 150) / 450) * 120 - 60;
  const elbowAngleDeg = ((s2 - 150) / 450) * 140 - 70;
  const clawWidth = ((gripperAngle - 85) / 95) * 20 + 6; // 85 deg closed, 180 deg open

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-zinc-900">
              Master ESP32 Hardware &amp; Swarm Actuation Controller
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-sky-50 text-sky-700 border border-sky-200">
              Config.h Hardware Baseline
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Controlling {selectedRobot.name} (IP: {selectedRobot.ip}:8888) • Native TB6612 PWM (D4 Left, D5 Right) • 4-DoF PCA9685 Arm (0x40) • VL53L0X Laser ToF (0x29) • SSD1306 OLED (0x3C).
          </p>
        </div>

        {/* Safety Interlock Status */}
        <div className="flex items-center gap-2">
          {isSafetyInterlocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>TOF INTERLOCK ACTIVE: &lt;120mm (Motors Cut)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safety Clear • Watchdog 500ms Active</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 4WD Skid-Steer TB6612 Drive & Teleop Controls */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-700" />
              <h3 className="text-sm font-semibold text-zinc-900">
                4WD Skid-Steer Locomotion (TB6612 Dual H-Bridges)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              UDP Port 8888 Listener
            </span>
          </div>

          {/* Kinematics Formula Callout */}
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 font-mono text-[11px] text-zinc-700 space-y-1">
            <div className="font-bold text-zinc-900">Differential Skid-Steer Speed Equations:</div>
            <div className="grid grid-cols-2 gap-2 text-zinc-600">
              <div>Left Motors (D4): linear_x - (angular_z * 0.5)</div>
              <div>Right Motors (D5): linear_x + (angular_z * 0.5)</div>
            </div>
            <div className="text-[10px] text-zinc-500 pt-0.5">
              Direction GPIOs: Front (25, 26, 27, 14) • Rear (12, 13, 32, 33) • STBY: 3.3V
            </div>
          </div>

          {/* Visual Robot Chassis Diagram */}
          <div className="relative w-full aspect-16/10 bg-zinc-950 rounded-xl p-4 border border-zinc-800 flex items-center justify-center">
            {/* Center Chassis Body */}
            <div className="relative w-48 h-60 bg-zinc-900 border-2 border-zinc-700 rounded-2xl flex flex-col items-center justify-between p-3 shadow-2xl">
              {/* Front Arrow */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                <ArrowUp className="w-3 h-3 text-sky-400" /> CHASSIS FRONT (ToF 0x29)
              </div>

              {/* Center ESP32 & Controller Badge */}
              <div className="text-center space-y-1">
                <div className="w-12 h-12 mx-auto rounded-lg bg-zinc-800 border border-zinc-600 flex items-center justify-center text-sky-400 shadow-inner">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-mono text-zinc-300 font-bold">{selectedRobot.name}</div>
                <div className="text-[9px] font-mono text-zinc-500">UDP Port 8888 • Watchdog: {watchdogTimeRemaining}ms</div>
              </div>

              {/* Chassis Status */}
              <div className={`text-[10px] font-mono px-2 py-0.5 rounded text-center ${
                isSafetyInterlocked ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-zinc-800 text-zinc-300'
              }`}>
                {isSafetyInterlocked ? 'AUTO-BRAKE ACTIVE' : `lin: ${linearX.toFixed(2)} | ang: ${angularZ.toFixed(2)}`}
              </div>

              {/* 4 Wheels connected to Dual TB6612 */}
              {/* Front Left Wheel */}
              <div className="absolute -top-3 -left-7 w-12 h-20 bg-zinc-800 border-2 border-sky-500/80 rounded-lg flex flex-col justify-between p-1 text-center shadow-lg">
                <span className="text-[9px] font-mono text-sky-400 font-bold">FL (D4)</span>
                <span className="text-[9px] font-mono text-white font-bold">{motors.leftPwm} PWM</span>
                <span className="text-[8px] font-mono text-zinc-400">{motors.leftDir}</span>
              </div>

              {/* Front Right Wheel */}
              <div className="absolute -top-3 -right-7 w-12 h-20 bg-zinc-800 border-2 border-sky-500/80 rounded-lg flex flex-col justify-between p-1 text-center shadow-lg">
                <span className="text-[9px] font-mono text-sky-400 font-bold">FR (D5)</span>
                <span className="text-[9px] font-mono text-white font-bold">{motors.rightPwm} PWM</span>
                <span className="text-[8px] font-mono text-zinc-400">{motors.rightDir}</span>
              </div>

              {/* Rear Left Wheel */}
              <div className="absolute -bottom-3 -left-7 w-12 h-20 bg-zinc-800 border-2 border-sky-500/80 rounded-lg flex flex-col justify-between p-1 text-center shadow-lg">
                <span className="text-[9px] font-mono text-sky-400 font-bold">RL (D4)</span>
                <span className="text-[9px] font-mono text-white font-bold">{motors.leftPwm} PWM</span>
                <span className="text-[8px] font-mono text-zinc-400">{motors.leftDir}</span>
              </div>

              {/* Rear Right Wheel */}
              <div className="absolute -bottom-3 -right-7 w-12 h-20 bg-zinc-800 border-2 border-sky-500/80 rounded-lg flex flex-col justify-between p-1 text-center shadow-lg">
                <span className="text-[9px] font-mono text-sky-400 font-bold">RR (D5)</span>
                <span className="text-[9px] font-mono text-white font-bold">{motors.rightPwm} PWM</span>
                <span className="text-[8px] font-mono text-zinc-400">{motors.rightDir}</span>
              </div>
            </div>
          </div>

          {/* Standalone Keyboard Teleop Controls (W/A/S/D/Space) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700">
                UDP Teleop Controls (Matching <code>teleop_keyboard_udp.py</code>)
              </label>
              <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                <span>Speed:</span>
                <button 
                  onClick={() => setSpeedScale(Math.max(0.2, speedScale - 0.1))}
                  className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200"
                >
                  -
                </button>
                <span className="font-bold text-zinc-800">{(speedScale * 100).toFixed(0)}%</span>
                <button 
                  onClick={() => setSpeedScale(Math.min(1.0, speedScale + 0.1))}
                  className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div></div>
              <button
                onClick={() => handleDriveChange(speedScale, 0)}
                id="btn-teleop-forward"
                className="p-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-mono font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowUp className="w-3.5 h-3.5" /> [W] Fwd
              </button>
              <div></div>

              <button
                onClick={() => handleDriveChange(0, speedScale)}
                id="btn-teleop-pivot-left"
                className="p-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-mono font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 -scale-x-100" /> [A] Left
              </button>
              <button
                onClick={() => handleDriveChange(0, 0)}
                id="btn-teleop-stop"
                className="p-2.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-mono font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <Power className="w-3.5 h-3.5 text-rose-400" /> [Space]
              </button>
              <button
                onClick={() => handleDriveChange(0, -speedScale)}
                id="btn-teleop-pivot-right"
                className="p-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-mono font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" /> [D] Right
              </button>

              <div></div>
              <button
                onClick={() => handleDriveChange(-speedScale, 0)}
                id="btn-teleop-reverse"
                className="p-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-mono font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowDown className="w-3.5 h-3.5" /> [S] Rev
              </button>
              <div></div>
            </div>
          </div>
        </div>

        {/* Right Column: 4-DoF PCA9685 Arm, VL53L0X ToF & RC522 RFID */}
        <div className="lg:col-span-6 space-y-5">
          {/* 4-DoF Robotic Arm Controller Card */}
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-zinc-900">
                  4-DoF Manipulator &amp; Gripper (PCA9685 I2C 0x40)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                CH0 to CH4 (85°-180° Clamping)
              </span>
            </div>

            {/* Arm 2D Visual Rendering */}
            <div className="w-full h-44 bg-zinc-950 rounded-xl p-3 border border-zinc-800 flex items-center justify-center relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 300 160">
                {/* Ground plane */}
                <line x1="20" y1="145" x2="280" y2="145" stroke="#3f3f46" strokeWidth="2" />
                
                {/* Arm Base Turntable CH0 */}
                <rect x="70" y="135" width="40" height="10" rx="2" fill="#52525b" />
                
                {/* Arm Link 1 CH1 Shoulder */}
                <g transform={`translate(90, 135) rotate(${shoulderAngleDeg})`}>
                  <line x1="0" y1="0" x2="0" y2="-55" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="6" fill="#0284c7" />
                  
                  {/* Arm Link 2 CH2 Elbow */}
                  <g transform={`translate(0, -55) rotate(${elbowAngleDeg})`}>
                    <line x1="0" y1="0" x2="45" y2="0" stroke="#818cf8" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="5" fill="#4f46e5" />
                    
                    {/* Gripper Claw CH4 */}
                    <g transform="translate(45, 0)">
                      <circle cx="0" cy="0" r="4" fill="#a855f7" />
                      <path d={`M 0 0 L 15 -${clawWidth/2} L 22 -${clawWidth/4}`} fill="none" stroke="#f43f5e" strokeWidth="2.5" />
                      <path d={`M 0 0 L 15 ${clawWidth/2} L 22 ${clawWidth/4}`} fill="none" stroke="#f43f5e" strokeWidth="2.5" />
                    </g>
                  </g>
                </g>

                {/* Warehouse Payload Crate */}
                <rect x="180" y="125" width="22" height="20" rx="2" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
                <text x="191" y="138" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">BOX</text>
              </svg>

              <div className="absolute top-2 right-3 font-mono text-[10px] text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                CH0:{s0} CH1:{s1} CH2:{s2} Gripper:{gripperAngle}°
              </div>
            </div>

            {/* Arm Poses Matching integrated_robot.ino */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => handleArmChange(300, 200, 200, 300, 180)}
                id="btn-pose-rest"
                className="py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium transition-colors text-center"
              >
                POSE_REST
              </button>
              <button
                onClick={() => handleArmChange(300, 320, 280, 300, 180)}
                id="btn-pose-hover"
                className="py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium transition-colors text-center"
              >
                POSE_HOVER
              </button>
              <button
                onClick={() => handleArmChange(350, 420, 380, 300, 85)}
                id="btn-pose-pick"
                className="py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-medium transition-colors text-center"
              >
                POSE_PICK (Clamp)
              </button>
              <button
                onClick={() => handleArmChange(250, 280, 250, 300, 180)}
                id="btn-pose-drop"
                className="py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium transition-colors text-center"
              >
                POSE_DROP
              </button>
            </div>

            {/* Individual Servo PWM Sliders */}
            <div className="space-y-2 pt-1">
              <div className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600 font-medium">CH0: Base Pan (150-600)</span>
                  <span className="font-mono text-zinc-800 font-bold">{s0}</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="600"
                  value={s0}
                  onChange={(e) => handleArmChange(parseInt(e.target.value), s1, s2, s3, gripperAngle)}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600 font-medium">CH1: Shoulder Joint</span>
                  <span className="font-mono text-zinc-800 font-bold">{s1}</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="600"
                  value={s1}
                  onChange={(e) => handleArmChange(s0, parseInt(e.target.value), s2, s3, gripperAngle)}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600 font-medium">CH4: Gripper Claw Angle</span>
                  <span className="font-mono text-rose-600 font-bold">{gripperAngle}° (85° Clamp - 180° Open)</span>
                </div>
                <input
                  type="range"
                  min="85"
                  max="180"
                  value={gripperAngle}
                  onChange={(e) => handleArmChange(s0, s1, s2, s3, parseInt(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>
            </div>
          </div>

          {/* VL53L0X Laser ToF Sensor & RC522 RFID Card */}
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-zinc-900">
                  VL53L0X Laser ToF (0x29) &amp; RC522 RFID Reader
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Precision Docking: 60mm
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-600 font-medium">Laser Distance to Rack/Payload:</span>
                <span className={`font-mono font-bold ${isSafetyInterlocked ? 'text-rose-600' : 'text-zinc-900'}`}>
                  {tofDistMm} mm (Auto-Brake: &lt;120 mm)
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="800"
                value={tofDistMm}
                onChange={(e) => handleTofChange(parseInt(e.target.value))}
                className={`w-full ${isSafetyInterlocked ? 'accent-rose-600' : 'accent-emerald-600'}`}
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span className="text-rose-500 font-bold">30mm (DOCK/PICK)</span>
                <span className="text-amber-500">120mm Threshold</span>
                <span>800mm (Clear)</span>
              </div>
            </div>

            {/* RFID Scanner Status */}
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="font-semibold text-zinc-900">MFRC522 RFID Tag:</span>
                  <span className="font-mono text-indigo-700 ml-2 font-bold">{rfidTag}</span>
                </div>
              </div>
              <button
                onClick={() => setRfidTag(`PAYLOAD_TAG_${Math.floor(10 + Math.random() * 90)}`)}
                className="px-2 py-1 rounded bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-semibold"
              >
                Scan New Tag
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
