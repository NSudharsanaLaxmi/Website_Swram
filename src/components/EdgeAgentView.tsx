import React, { useState } from 'react';
import { RobotTwin, WorkspaceCalibration } from '../types';
import { ARUCO_DICT_4X4_50_MARKERS, ArucoMarkerDef } from '../data/arucoMarkers';
import { 
  Eye, 
  Wifi, 
  WifiOff, 
  Terminal,
  Crosshair,
  Compass,
  Radio,
  Share2,
  Camera,
  Layers,
  CheckCircle,
  Sliders,
  Shield,
  ArrowRight,
  Maximize2
} from 'lucide-react';

interface EdgeAgentViewProps {
  selectedRobot: RobotTwin;
  robots: RobotTwin[];
  wifiOnline: boolean;
  setWifiOnline: (online: boolean) => void;
  workspaceCalibration: WorkspaceCalibration;
  onUpdateRobot: (robot: RobotTwin) => void;
  agentLogs: string[];
}

export const EdgeAgentView: React.FC<EdgeAgentViewProps> = ({
  selectedRobot,
  robots,
  wifiOnline,
  setWifiOnline,
  workspaceCalibration,
  agentLogs,
}) => {
  const [selectedBotMarker, setSelectedBotMarker] = useState<number>(0);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'CALIBRATED_METRIC' | 'RAW_CAMERA_WARP'>('CALIBRATED_METRIC');
  const [cameraTiltAngle, setCameraTiltAngle] = useState(12); // Simulated lens pitch in degrees

  const r0 = robots[0];
  const r1 = robots[1] || robots[0];

  // Pipeline stages from user specification
  const pipelineSteps = [
    { title: 'ArUco Detection', desc: 'DICT_4X4_50 OpenCV edge corners (IDs 0–12)', active: true },
    { title: 'Boundary Calibration', desc: '4 Corners (IDs 9–12) 3×3 Homography H', active: true },
    { title: 'Workspace Frame', desc: 'Normalized origin (0,0) & metric scale px/cm', active: true },
    { title: 'Robot/Rack Localize', desc: 'Real-time (x, y, θ) transformation', active: true },
    { title: 'Occupancy & Boundary', desc: '10cm safety buffer & obstacle clearance', active: true },
    { title: 'Task Allocation', desc: 'Central server order assignment', active: true },
    { title: 'Path Planning', desc: 'Constraint-compliant corridor routing', active: true },
    { title: 'Collision Avoidance', desc: '28cm decentralized yield arbitration', active: true },
    { title: 'Local Robot Control', desc: 'ESP32 PWM 4/5 & VL53L0X active braking', active: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Camera className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-zinc-900">
              ArUco Global Perception &amp; Workspace Calibration Layer
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              cv2.aruco.DICT_4X4_50 • 4-Corner Homography Calibration
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-3xl">
            Overhead camera continuously detects boundary markers (IDs 9–12) to dynamically establish workspace origin, scale, and hard perimeter constraints. Eliminates static coordinate assumptions by recalibrating upon camera tilt or table movement.
          </p>
        </div>

        {/* UDP Stream Status */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
            <Radio className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-zinc-600 font-medium">UDP Swarm Stream:</span>
            <span className="font-mono font-bold text-emerald-600">Port 5005 (30 FPS)</span>
          </div>

          <button
            onClick={() => setWifiOnline(!wifiOnline)}
            id="toggle-vision-udp-btn"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              wifiOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
            }`}
          >
            {wifiOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
            <span>{wifiOnline ? 'Vision Stream Online' : 'UDP Stream Disconnected'}</span>
          </button>
        </div>
      </div>

      {/* Perception-to-Control Pipeline Visual Flow */}
      <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-zinc-900">
              End-to-End Perception-to-Control Pipeline Architecture
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Pipeline Active &bull; Closed-Loop (20 Hz)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {pipelineSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/40 flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 font-mono">
                  <span>STEP 0{idx + 1}</span>
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                </div>
                <div className="text-xs font-bold text-zinc-900 mt-1 leading-snug">
                  {step.title}
                </div>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1 leading-tight">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Real-Time Overhead ArUco Camera Feed */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-zinc-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-zinc-700" />
              <h3 className="text-sm font-semibold text-zinc-900">
                Overhead IP Camera Optical Stream
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-zinc-100 p-0.5 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setViewMode('CALIBRATED_METRIC')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    viewMode === 'CALIBRATED_METRIC'
                      ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Rectified Metric Frame (cm)
                </button>
                <button
                  onClick={() => setViewMode('RAW_CAMERA_WARP')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    viewMode === 'RAW_CAMERA_WARP'
                      ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Raw Pixel Plane &amp; Skew
                </button>
              </div>
            </div>
          </div>

          {/* Synthetic Camera Viewport */}
          <div className="mt-4 relative w-full aspect-square bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-inner flex items-center justify-center">
            {/* Arena Grid (120x120cm) */}
            <div 
              className="absolute inset-0 transition-transform duration-300 p-6 flex items-center justify-center"
              style={{
                transform: viewMode === 'RAW_CAMERA_WARP' 
                  ? `perspective(600px) rotateX(${cameraTiltAngle}deg) scale(${cameraZoom * 0.95})` 
                  : `scale(${cameraZoom})`
              }}
            >
              <svg className="w-full h-full" viewBox="0 0 120 120">
                <defs>
                  <pattern id="camGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#27272a" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="120" height="120" fill="url(#camGrid)" stroke="#3f3f46" strokeWidth="1" />

                {/* 4 Boundary Calibration Markers (IDs 9..12) */}
                {ARUCO_DICT_4X4_50_MARKERS.filter(m => m.role === 'BOUNDARY').map((b) => {
                  const pos = 
                    b.id === 9 ? workspaceCalibration.boundaryCorners.tl :
                    b.id === 10 ? workspaceCalibration.boundaryCorners.tr :
                    b.id === 11 ? workspaceCalibration.boundaryCorners.br :
                    workspaceCalibration.boundaryCorners.bl;

                  return (
                    <g key={b.id} transform={`translate(${pos[0]}, ${pos[1]})`}>
                      <circle r="4.5" fill="none" stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
                      <rect x="-2.5" y="-2.5" width="5" height="5" fill="#000" stroke="#f59e0b" strokeWidth="0.5" />
                      <rect x="-1.2" y="-1.2" width="2.4" height="2.4" fill="#fff" />
                      <text x="0" y={b.id === 9 || b.id === 10 ? -4 : 6} fill="#f59e0b" fontSize="2.5" textAnchor="middle" fontWeight="bold">
                        ID {b.id}
                      </text>
                    </g>
                  );
                })}

                {/* Calibrated Boundary Polygon Line */}
                <polygon
                  points={`${workspaceCalibration.boundaryCorners.tl.join(',')} ${workspaceCalibration.boundaryCorners.tr.join(',')} ${workspaceCalibration.boundaryCorners.br.join(',')} ${workspaceCalibration.boundaryCorners.bl.join(',')}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="0.9"
                  strokeDasharray="2,2"
                />

                {/* Fixed Racks (IDs 2..5) */}
                {ARUCO_DICT_4X4_50_MARKERS.filter(m => m.role === 'RACK').map(rack => (
                  <g key={rack.id} transform={`translate(${rack.defaultPositionCm[0]}, ${rack.defaultPositionCm[1]})`}>
                    <rect x="-6" y="-6" width="12" height="12" rx="1.5" fill="#18181b" stroke="#38bdf8" strokeWidth="0.8" />
                    <rect x="-3" y="-5" width="6" height="6" fill="#000" stroke="#fff" strokeWidth="0.3" />
                    <rect x="-1.5" y="-3.5" width="3" height="3" fill="#38bdf8" />
                    <text x="0" y="4" fill="#38bdf8" fontSize="2.4" textAnchor="middle" fontWeight="bold">{rack.name}</text>
                  </g>
                ))}

                {/* Start Zones (IDs 6, 7) */}
                {ARUCO_DICT_4X4_50_MARKERS.filter(m => m.role === 'START_ZONE').map(s => (
                  <g key={s.id} transform={`translate(${s.defaultPositionCm[0]}, ${s.defaultPositionCm[1]})`}>
                    <rect x="-6" y="-6" width="12" height="12" rx="1" fill="#064e3b" fillOpacity="0.3" stroke="#10b981" strokeWidth="0.8" />
                    <text x="0" y="4" fill="#10b981" fontSize="2.2" textAnchor="middle" fontWeight="bold">{s.name}</text>
                  </g>
                ))}

                {/* Delivery Zone (ID 8) */}
                <g transform="translate(95, 60)">
                  <rect x="-8" y="-8" width="16" height="16" rx="2" fill="#881337" fillOpacity="0.4" stroke="#f43f5e" strokeWidth="1" />
                  <text x="0" y="3.5" fill="#f43f5e" fontSize="2.5" textAnchor="middle" fontWeight="bold">DELIVERY (ID 8)</text>
                </g>

                {/* Moving Robot 1 (ID 0) */}
                <g transform={`translate(${r0.pose.x}, ${r0.pose.y}) rotate(${r0.pose.ang})`}>
                  <rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <rect x="-3" y="-3" width="6" height="6" fill="#000" stroke="#fff" strokeWidth="0.4" />
                  <rect x="-1.5" y="-1.5" width="3" height="3" fill="#fff" />
                  <line x1="0" y1="0" x2="9" y2="0" stroke="#22c55e" strokeWidth="1" />
                  <text x="0" y="-7" fill="#38bdf8" fontSize="3" textAnchor="middle" fontWeight="bold">ROBOT 1 (ID 0)</text>
                </g>

                {/* Moving Robot 2 (ID 1) */}
                <g transform={`translate(${r1.pose.x}, ${r1.pose.y}) rotate(${r1.pose.ang})`}>
                  <rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="#0f172a" stroke="#c084fc" strokeWidth="1" />
                  <rect x="-3" y="-3" width="6" height="6" fill="#000" stroke="#fff" strokeWidth="0.4" />
                  <rect x="-1.5" y="-1.5" width="3" height="3" fill="#fff" />
                  <line x1="0" y1="0" x2="9" y2="0" stroke="#22c55e" strokeWidth="1" />
                  <text x="0" y="-7" fill="#c084fc" fontSize="3" textAnchor="middle" fontWeight="bold">ROBOT 2 (ID 1)</text>
                </g>
              </svg>
            </div>

            {/* Live OpenCV Calibration Overlay */}
            <div className="absolute top-3 left-3 bg-zinc-900/90 border border-zinc-700/80 backdrop-blur rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>DYNAMIC ARUCO CALIBRATION ACTIVE (DICT_4X4_50)</span>
              </div>
              <div className="text-zinc-400">
                Boundary Corners: TL(9), TR(10), BR(11), BL(12) [4 Anchors Calibrated]
              </div>
              <div className="text-sky-300">
                Robot 1 (ID 0): ({r0.pose.x.toFixed(1)}, {r0.pose.y.toFixed(1)}) cm &bull; θ={r0.pose.ang.toFixed(1)}°
              </div>
              <div className="text-purple-300">
                Robot 2 (ID 1): ({r1.pose.x.toFixed(1)}, {r1.pose.y.toFixed(1)}) cm &bull; θ={r1.pose.ang.toFixed(1)}°
              </div>
            </div>

            {/* Camera Controls Overlay */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800">
              {viewMode === 'RAW_CAMERA_WARP' && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-300 font-mono mr-2">
                  <span>Tilt:</span>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={cameraTiltAngle}
                    onChange={(e) => setCameraTiltAngle(Number(e.target.value))}
                    className="w-16 accent-amber-500 h-1"
                  />
                  <span>{cameraTiltAngle}°</span>
                </div>
              )}

              <button
                onClick={() => setCameraZoom(Math.max(0.8, cameraZoom - 0.2))}
                className="px-2 py-0.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded"
              >
                -
              </button>
              <span className="text-[10px] font-mono text-zinc-400 px-1">{cameraZoom.toFixed(1)}x</span>
              <button
                onClick={() => setCameraZoom(Math.min(1.8, cameraZoom + 0.2))}
                className="px-2 py-0.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Marker Selection Bar */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {ARUCO_DICT_4X4_50_MARKERS.slice(0, 9).map((m) => (
              <div
                key={m.id}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-[11px]"
              >
                <div className="font-bold text-zinc-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                  <span>ID {m.id}: {m.name}</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500">
                  ({m.defaultPositionCm[0]}, {m.defaultPositionCm[1]}) cm
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: UDP Swarm State Inspector & UNO Q Bridge Logs */}
        <div className="lg:col-span-5 space-y-5">
          {/* UDP Swarm JSON State Packet Inspector */}
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-zinc-900">
                  Calibrated UDP Broadcast Packet (Port 5005)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                JSON Broadcast
              </span>
            </div>

            <pre className="p-3 bg-zinc-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto leading-relaxed border border-zinc-800 max-h-56">
{JSON.stringify({
  timestamp: Date.now() / 1000,
  dictionary: "DICT_4X4_50",
  calibrated: true,
  workspace: {
    boundary_ids: [9, 10, 11, 12],
    origin: [workspaceCalibration.boundaryCorners.tl[0], workspaceCalibration.boundaryCorners.tl[1]],
    extent_cm: [120.0, 120.0],
    scale_px_per_cm: Number(workspaceCalibration.scalePxPerCm.toFixed(2))
  },
  bots: {
    id0: {
      marker: 0,
      x: Number(r0.pose.x.toFixed(2)),
      y: Number(r0.pose.y.toFixed(2)),
      ang: Number(r0.pose.ang.toFixed(2)),
      state: r0.missionState
    },
    id1: {
      marker: 1,
      x: Number(r1.pose.x.toFixed(2)),
      y: Number(r1.pose.y.toFixed(2)),
      ang: Number(r1.pose.ang.toFixed(2)),
      state: r1.missionState
    }
  },
  fixed_landmarks: {
    racks: [2, 3, 4, 5],
    starts: [6, 7],
    delivery: 8
  }
}, null, 2)}
            </pre>
            <p className="text-[11px] text-zinc-500">
              Transformed into the ArUco boundary coordinate frame before multicast. Consumed by <code>standalone_swarm_coordinator.py</code> and <code>uno_q_swarm_agent.py</code>.
            </p>
          </div>

          {/* Arduino UNO Q Linux Bridge (/dev/ttyS0) & Perception Logs */}
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-semibold text-zinc-900">
                  Perception &amp; UNO Q Linux Agent Console
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                UART /dev/ttyS0
              </span>
            </div>

            <div className="h-44 bg-zinc-950 p-3 rounded-lg overflow-y-auto font-mono text-xs text-zinc-300 space-y-1.5 border border-zinc-800">
              <div className="text-amber-400">[CALIBRATION] Detected boundary anchors: 9(TL), 10(TR), 11(BR), 12(BL)</div>
              <div className="text-zinc-400">[CALIBRATION] Homography H computed: 6.67 px/cm orthogonalized</div>
              <div className="text-sky-400">[PERCEPTION] Bot 1 (ID 0) localized: x={r0.pose.x.toFixed(1)}, y={r0.pose.y.toFixed(1)}, θ={r0.pose.ang.toFixed(1)}°</div>
              <div className="text-purple-400">[PERCEPTION] Bot 2 (ID 1) localized: x={r1.pose.x.toFixed(1)}, y={r1.pose.y.toFixed(1)}, θ={r1.pose.ang.toFixed(1)}°</div>
              <div className="text-emerald-400">[UNO_Q RX] Forwarded to ESP32: P:{r0.pose.x.toFixed(1)},{r0.pose.y.toFixed(1)},{r0.pose.ang.toFixed(1)}</div>
              {agentLogs.slice(-4).map((log, i) => (
                <div key={i} className="text-zinc-300">{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
