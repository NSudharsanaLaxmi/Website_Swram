import React, { useState } from 'react';
import { 
  Network, 
  Server, 
  Cpu, 
  Bot, 
  Camera,
  Radio, 
  Zap, 
  ShieldCheck, 
  Layers,
  ChevronRight,
  Sliders,
  Compass,
  ArrowRight,
  CheckCircle,
  Eye,
  Crosshair
} from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<number>(5);

  const layers = [
    {
      id: 6,
      title: 'LAYER 6: Overhead IP Camera & Video Stream Acquisition',
      file: 'step5_overhead_vision_tracker.py (--source 0 / RTSP)',
      platform: 'Overhead Optical Rig • 1080p @ 30 FPS Stream',
      icon: Camera,
      color: 'border-indigo-500 bg-indigo-50/50 text-indigo-800',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      summary: 'Captures continuous high-resolution overhead video of the 120cm × 120cm warehouse arena under varying lighting and camera tilt angles. Streams raw frames to the vision pipeline.',
      protocols: ['RTSP / HTTP MJPEG / V4L2 USB Camera', 'OpenCV VideoCapture', '1080p Resolution at 30 FPS'],
      specs: [
        'Overhead mount with wide-angle FOV covering entire workspace and perimeter borders',
        'Camera position or tilt shifts are automatically absorbed by dynamic ArUco calibration',
        'Frame buffer stream passed directly to ArUco detection pipeline'
      ]
    },
    {
      id: 5,
      title: 'LAYER 5: ArUco-Based Global Localization & Workspace Calibration Layer',
      file: 'cv2.aruco.DICT_4X4_50 Homography Engine (step5_overhead_vision_tracker.py)',
      platform: 'Overhead Vision Server • UDP Port 5005 Broadcast',
      icon: Compass,
      color: 'border-amber-500 bg-amber-50/50 text-amber-800',
      badgeColor: 'bg-amber-100 text-amber-800',
      summary: 'CRITICAL ARCHITECTURAL COMPONENT: Continuously detects the 4 boundary markers (IDs 9–12) to compute the 3×3 perspective homography matrix H, establishing workspace origin, scale (px/cm), and hard perimeter constraints. Localizes fixed racks (IDs 2–5), start zones (IDs 6–7), delivery zone (ID 8), and moving robots (IDs 0–1) in this unified coordinate frame.',
      protocols: ['OpenCV cv2.aruco.DICT_4X4_50 (13 Markers)', 'cv2.getPerspectiveTransform(src, dst)', 'UDP Multicast Port 5005'],
      specs: [
        'Boundary Conditions: 4 outer corner markers (IDs 9, 10, 11, 12) define physical workspace polygon',
        'Dynamic Recalibration: Recalibrates workspace whenever camera shifts or re-orientates',
        'Unified Frame: Transforms all robot poses, racks, and goals into metric centimeters (120×120cm)',
        'Hard Constraints: Generates occupancy and boundary polygon with 10cm inner safety buffer'
      ]
    },
    {
      id: 4,
      title: 'LAYER 4: Swarm Intelligence, Path Planning & Collision Avoidance',
      file: 'standalone_swarm_coordinator.py',
      platform: 'Central Coordination Station / Python 3',
      icon: Server,
      color: 'border-emerald-500 bg-emerald-50/50 text-emerald-800',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      summary: 'Consumes calibrated ArUco telemetry over UDP 5005, allocates warehouse pick/drop tasks, plans trajectories strictly inside the valid boundary polygon, and executes decentralized right-of-way yielding when peer robot is under 28cm.',
      protocols: ['UDP Socket RX :5005 (ArUco Frame)', 'UDP Socket TX :8888 (ESP32 Velocity)', 'CSV Velocity: "linear_x,angular_z"'],
      specs: [
        'Boundary Enforcement: Trajectories clamped within calibrated polygon; triggers boundary brake if < 10cm',
        'Swarm Yielding: Higher ID robot yields to lower ID robot if distance < 28.0 cm',
        'Control Loop: 20 Hz closed-loop proportional heading guidance and in-place pivot steering',
        'Tolerance Threshold: Waypoint arrival confirmed when Euclidean distance <= 8.0 cm'
      ]
    },
    {
      id: 3,
      title: 'LAYER 3: Arduino UNO Q Linux Swarm Agent & UART Bridge',
      file: 'uno_q_swarm_agent.py & uno_q_linux_setup.sh',
      platform: 'Arduino UNO Q Onboard Linux MPU (/dev/ttyS0 @ 115200)',
      icon: Cpu,
      color: 'border-purple-500 bg-purple-50/50 text-purple-800',
      badgeColor: 'bg-purple-100 text-purple-800',
      summary: 'Runs onboard Linux daemon subscribing to UDP vision broadcast and bridging mission coordinates and waypoint states to the ESP32 via high-speed hardware UART.',
      protocols: ['UDP Client :5005', 'Hardware UART /dev/ttyS0 @ 115200 Baud', 'UART Command: P:x,y,ang'],
      specs: [
        'Zero-drop message passing between Linux networking stack and ESP32 UART',
        'Automatic WiFi reconnection supervisor and systemd daemon management',
        'Onboard edge logging and hardware health diagnostics'
      ]
    },
    {
      id: 2,
      title: 'LAYER 2: ESP32 Autonomous Swarm Agent Firmware',
      file: 'step3_esp32_swarm_agent.ino & Config.h',
      platform: 'ESP32 DevKit V1 (TB6612 Dual H-Bridges)',
      icon: Radio,
      color: 'border-sky-500 bg-sky-50/50 text-sky-800',
      badgeColor: 'bg-sky-100 text-sky-800',
      summary: 'Real-time locomotion firmware running WiFi UDP server on Port 8888. Parses linear and angular velocity commands, applies skid-steer kinematics to 4 DC motors with a 500ms safety watchdog and active obstacle braking.',
      protocols: ['WiFi UDP Server Port 8888', 'TB6612FNG Dual H-Bridges (PWM D4, D5)', '500ms Command Watchdog'],
      specs: [
        'Skid-Steer Kinematics: left = linear_x - (angular_z * 0.5), right = linear_x + (angular_z * 0.5)',
        'PWM Allocation: GPIO 4 (Left PWM), GPIO 5 (Right PWM)',
        'Direction GPIOs: Front (25, 26, 27, 14), Rear (12, 13, 32, 33)',
        'Failsafe: All motors cut to 0 PWM if UDP packet not received within 500ms'
      ]
    },
    {
      id: 1,
      title: 'LAYER 1: Integrated Robot Master (Arm, ToF, OLED & RFID)',
      file: 'integrated_robot.ino & Config.h',
      platform: 'ESP32 Master Sensor/Actuation Core',
      icon: Bot,
      color: 'border-rose-500 bg-rose-50/50 text-rose-800',
      badgeColor: 'bg-rose-100 text-rose-800',
      summary: 'Complete multi-sensor integration firmware driving PCA9685 4-DoF arm, VL53L0X laser ToF distance sensor, SSD1306 OLED display, and RC522 RFID reader over I2C and SPI buses.',
      protocols: ['I2C (SDA 21, SCL 22)', 'PCA9685 0x40 (Arm CH0-4)', 'VL53L0X 0x29 (Laser ToF)', 'SSD1306 0x3C (OLED)', 'MFRC522 SPI (SS 5, RST 17)'],
      specs: [
        '4-DoF Robotic Arm: Base (CH0), Shoulder (CH1), Elbow (CH2), Wrist (CH3), Gripper (CH4 85°-180°)',
        'Laser ToF Auto-Brake: Halts robot motion when obstacle < 120 mm',
        'State Machine: IDLE -> NAV_TO_PICK -> PICK_PAYLOAD -> NAV_TO_DROP -> DROP_PAYLOAD -> RETURN',
        'OLED Display: 128x64 display rendering IP, state, battery, and ToF range'
      ]
    }
  ];

  const currentLayer = layers.find((l) => l.id === selectedLayer) || layers[1];

  const pipeline = [
    'ArUco Detection (0–12)',
    'Boundary Calibration (9–12)',
    'Workspace Coordinate Frame',
    'Robot/Rack Localization',
    'Occupancy & Boundary Map',
    'Task Allocation',
    'Path Planning',
    'Collision Avoidance',
    'Local Robot Control'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Network className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-zinc-900">
            Swarm_Major Hierarchical System Architecture
          </h2>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            ArUco Boundary &amp; Geometric Reference System
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-1 max-w-4xl">
          Structural breakdown illustrating the decoupling between global ArUco vision calibration, swarm coordination, and local real-time robot actuation. The 4 boundary markers (IDs 9–12) define the geometric reference conditions of the entire workspace.
        </p>
      </div>

      {/* Perception to Control Pipeline Flowchart */}
      <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-zinc-900">
              Perception-to-Control Flow Pipeline
            </h3>
          </div>
          <span className="text-[10px] font-mono text-indigo-600 font-bold">
            9-Stage Closed-Loop Process
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-2">
          {pipeline.map((stage, idx) => (
            <React.Fragment key={idx}>
              <div className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-center">
                <div className="text-[9px] font-mono font-bold text-indigo-600">STAGE {idx + 1}</div>
                <div className="text-[11px] font-bold text-zinc-800 whitespace-nowrap mt-0.5">{stage}</div>
              </div>
              {idx < pipeline.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Architecture Visual Stack */}
        <div className="lg:col-span-7 space-y-3">
          {layers.map((layer) => {
            const isSelected = layer.id === selectedLayer;
            const Icon = layer.icon;

            return (
              <div
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer shadow-xs ${
                  isSelected
                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20'
                    : 'border-zinc-200 bg-zinc-50/70 hover:bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      layer.id === 6 ? 'bg-indigo-100 text-indigo-700' :
                      layer.id === 5 ? 'bg-amber-100 text-amber-700' :
                      layer.id === 4 ? 'bg-emerald-100 text-emerald-700' :
                      layer.id === 3 ? 'bg-purple-100 text-purple-700' :
                      layer.id === 2 ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-zinc-900">{layer.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <code className="text-[11px] font-mono font-bold text-indigo-700">{layer.file}</code>
                        <span className="text-zinc-400 text-xs">•</span>
                        <span className="text-[11px] text-zinc-500">{layer.platform}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-indigo-600 rotate-90' : 'text-zinc-400'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Layer Deep Dive */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-4 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${currentLayer.badgeColor}`}>
                {currentLayer.title.split(':')[0]}
              </span>
              <span className="text-xs font-mono text-zinc-400">Layer Inspector</span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-900">{currentLayer.title}</h3>
              <p className="text-xs text-zinc-600 mt-2 leading-relaxed">{currentLayer.summary}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-900">Communication &amp; Standards:</h4>
              <div className="flex flex-wrap gap-1.5">
                {currentLayer.protocols.map((p, i) => (
                  <span key={i} className="px-2 py-1 text-[11px] font-mono bg-zinc-100 text-zinc-700 rounded-md border border-zinc-200">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-900">Operational Specifications:</h4>
              <ul className="text-xs text-zinc-600 space-y-1.5 list-disc pl-4">
                {currentLayer.specs.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
