import React, { useState } from 'react';
import { Eye, Shield, Cpu, Activity, Zap, CheckCircle2, FileCode, Radio, ArrowDown } from 'lucide-react';

interface ArchNode {
  id: string;
  name: string;
  layerTitle: string;
  role: string;
  hardware: string;
  software: string;
  inputs: string[];
  outputs: string[];
  protocol: string;
  status: 'ONLINE' | 'ACTIVE' | 'DETERMINISTIC_OK';
  files: string[];
}

const ARCHITECTURE_NODES: ArchNode[] = [
  {
    id: 'vision',
    name: '1. Overhead Vision Perception Layer',
    layerTitle: 'Layer 1 — Global Perception & Boundary Reference',
    role: 'Captures continuous top-down video stream and detects ArUco markers using DICT_4X4_50.',
    hardware: 'Overhead IP Camera / Smartphone / POCO (Full HD 1080p @ 30fps)',
    software: 'OpenCV 4.13 + Python cv2.aruco Detector (DICT_4X4_50)',
    inputs: ['Raw Video Frames', 'ArUco Marker IDs 0 to 12'],
    outputs: ['Raw Pixel Centroids (u, v)', 'Corner Point Boundaries'],
    protocol: 'RTSP / HTTP Video Stream',
    status: 'ONLINE',
    files: ['server/warehouse_central_server.py', 'server/step5_overhead_vision_tracker.py'],
  },
  {
    id: 'homography',
    name: '2. Dynamic Boundary Homography Engine',
    layerTitle: 'Layer 1.5 — Metric Workspace Transformation',
    role: 'Extracts boundary markers IDs 9 (TL), 10 (TR), 11 (BR), 12 (BL) and computes the 3x3 Homography Matrix H.',
    hardware: 'Host Workstation CPU / GPU',
    software: 'cv2.getPerspectiveTransform() + cv2.perspectiveTransform()',
    inputs: ['Boundary Marker Centroids (IDs 9-12)', 'Known Arena Dimensions (120x120 cm)'],
    outputs: ['Perspective Matrix H', 'Metric Workcell Coordinates (X_cm, Y_cm)', 'Out-of-Bounds Flag'],
    protocol: 'In-Memory Matrix Transformation',
    status: 'ONLINE',
    files: ['server/warehouse_central_server.py'],
  },
  {
    id: 'swarm',
    name: '3. Swarm Coordination & Task Planning Layer',
    layerTitle: 'Layer 2 — Decentralized Swarm Coordination',
    role: 'Maintains global swarm state, evaluates peer proximity clearance (28 cm), enforces right-of-way yielding based on Robot ID, and dispatches warehouse missions.',
    hardware: 'Linux Central Coordinator Server (or Containerized ROS 2 Humble)',
    software: 'Python Swarm Coordinator / ROS 2 geometry_msgs/Twist Planner',
    inputs: ['Global Robot Metric Poses (X, Y, theta)', 'Shared 3-Rack Environment (IDs 2-4)', 'Delivery Zone (ID 8)'],
    outputs: ['JSON Telemetry Broadcast (Port 5005)', 'Target Waypoint Vectors'],
    protocol: 'UDP Multicast Broadcast (Port 5005)',
    status: 'ACTIVE',
    files: ['server/standalone_swarm_coordinator.py', 'server/step6_closed_loop_coordinator.py'],
  },
  {
    id: 'uno_q',
    name: '4. Arduino UNO Q High-Level Edge Agent',
    layerTitle: 'Layer 3 — Edge Intelligence & Robot Brain',
    role: 'High-level onboard edge computer handling robot-level decision making, swarm mission participation, task queuing, and high-speed UART link to ESP32.',
    hardware: 'Arduino UNO Q (Qualcomm QRB2210 Quad-Core Arm Cortex-A53 @ 2.0 GHz MPU + STM32U585 MCU)',
    software: 'Debian Linux + Arduino App Lab + Python Edge Agent',
    inputs: ['UDP Vision Stream (Port 5005)', 'Assigned Mission Orders'],
    outputs: ['High-Level Motion Intent', 'UART Serial Frames (115200 Baud)'],
    protocol: 'Wi-Fi 5 UDP + Hardware UART (115200 Baud)',
    status: 'ONLINE',
    files: ['server/uno_q_swarm_agent.py'],
  },
  {
    id: 'esp32',
    name: '5. ESP32 Real-Time Deterministic Controller',
    layerTitle: 'Layer 4 — Deterministic Safety & Motor Controller',
    role: 'Real-time microcontroller executing skid-steer PWM motor control, ToF laser proximity safety braking (<120 mm), Watchdog failsafe timer (500 ms), and PCA9685 servo arm poses.',
    hardware: 'ESP32 DevKit V1 (Xtensa Dual-Core 240 MHz)',
    software: 'C++ Arduino Firmware / FreeRTOS (integrated_robot.ino)',
    inputs: ['UDP Command Stream (Port 8888)', 'VL53L0X ToF Distance', 'RC522 RFID Scans'],
    outputs: ['Native Hardware PWM (GPIO 4/5)', '8-Pin Motor Direction Signals', 'PCA9685 I2C Signals'],
    protocol: 'Wi-Fi UDP Port 8888 + Hardware I2C / SPI',
    status: 'DETERMINISTIC_OK',
    files: [
      'firmware/integrated_robot/Config.h',
      'firmware/integrated_robot/MotorDriver.cpp',
      'firmware/integrated_robot/ArmController.cpp',
      'firmware/integrated_robot/SensorSuite.cpp',
      'firmware/integrated_robot/integrated_robot.ino',
    ],
  },
  {
    id: 'actuators',
    name: '6. Actuators, Motors & Sensor Hardware',
    layerTitle: 'Layer 5 — Physical Actuation & Sensing Hardware',
    role: 'Physical 4WD Mecanum/Wheeled drive chassis, 2x TB6612FNG drivers, 4-DOF articulated manipulator (MG90S servos), VL53L0X ToF laser, HC-SR04 ultrasonic, and SSD1306 OLED dashboard.',
    hardware: '4x TT BO Motors + 2x TB6612FNG + PCA9685 + 5x MG90S Servos + VL53L0X + SSD1306 OLED + 3S 11.1V LiPo',
    software: 'Direct Voltage / PWM Pulse Signals',
    inputs: ['PWM Speeds', 'Direction Logic Levels', 'Servo Duty Cycles'],
    outputs: ['Robot Kinetic Drive', 'Arm Articulation', 'Ground Distance Telemetry'],
    protocol: 'Direct Analog/Digital Lines + I2C Bus (0x40, 0x29, 0x3C)',
    status: 'ONLINE',
    files: ['firmware/integrated_robot/Config.h'],
  },
];

export const ArchitectureDiagram: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('uno_q');

  const activeNode = ARCHITECTURE_NODES.find((n) => n.id === selectedNodeId) || ARCHITECTURE_NODES[3];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Swarm Hardware & Software Architecture Hierarchy
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            System hierarchy strictly aligned with <code className="text-cyan-300 font-mono font-bold">NSudharsanaLaxmi/Swarm_Major</code>. 
            Click any node below to inspect hardware specs, communication protocols, data inputs/outputs, and source files.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>DECENTRALIZED EDGE ARCHITECTURE VALIDATED</span>
        </div>
      </div>

      {/* Main Interactive Diagram Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Stacked Architecture Nodes */}
        <div className="lg:col-span-7 space-y-3">
          {ARCHITECTURE_NODES.map((node, index) => {
            const isSelected = selectedNodeId === node.id;

            return (
              <React.Fragment key={node.id}>
                <div
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase block">
                          {node.layerTitle}
                        </span>
                        <h4 className="text-sm font-bold text-white">{node.name}</h4>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-300">
                      {node.protocol}
                    </span>
                  </div>
                </div>

                {index < ARCHITECTURE_NODES.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="w-4 h-4 text-cyan-400/60 animate-bounce" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Column: Node Details Inspector */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl sticky top-24 self-start space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-mono font-bold text-cyan-400 block uppercase">
              {activeNode.layerTitle}
            </span>
            <h3 className="text-lg font-bold text-white mt-1">{activeNode.name}</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{activeNode.role}</p>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 font-semibold block mb-1">Hardware Specification:</span>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200">
                {activeNode.hardware}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1">Software & Firmware Stack:</span>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-cyan-300">
                {activeNode.software}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1">Communication Protocol:</span>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-emerald-400 font-bold">
                {activeNode.protocol}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Data Inputs:</span>
                <ul className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 space-y-1 text-[11px]">
                  {activeNode.inputs.map((inp, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {inp}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Data Outputs:</span>
                <ul className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 space-y-1 text-[11px]">
                  {activeNode.outputs.map((out, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {out}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                Source Files in Swarm_Major Repository:
              </span>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                {activeNode.files.map((file, idx) => (
                  <div key={idx} className="text-[11px] text-cyan-300 font-mono font-semibold">
                    • {file}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
