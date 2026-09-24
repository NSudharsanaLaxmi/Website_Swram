import React, { useState, useMemo } from 'react';
import { RobotTwin, TaskOrder, WorkspaceCalibration } from '../types';
import { BatteryHealthTrends } from './BatteryHealthTrends';
import { ArucoMarkerSheetModal } from './ArucoMarkerSheetModal';
import { 
  ARUCO_DICT_4X4_50_MARKERS, 
  ArucoMarkerDef, 
  getDistanceToBoundary, 
  calculateBoundaryRepulsion 
} from '../data/arucoMarkers';
import { 
  Play, 
  MapPin, 
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Scan,
  Send,
  Radio,
  Printer,
  Sliders,
  RefreshCw,
  Compass,
  AlertTriangle,
  Layers,
  Crosshair
} from 'lucide-react';

interface WarehouseDigitalTwinProps {
  robots: RobotTwin[];
  tasks: TaskOrder[];
  selectedRobotId: string;
  setSelectedRobotId: (id: string) => void;
  onUpdateRobot: (robot: RobotTwin) => void;
  onAddTask: (task: TaskOrder) => void;
  onTriggerScheduler: () => void;
  schedulerActive: boolean;
  setSchedulerActive: (active: boolean) => void;
  workspaceCalibration: WorkspaceCalibration;
  onRecalibrateWorkspace: (corners: { tl: [number, number]; tr: [number, number]; br: [number, number]; bl: [number, number] }) => void;
  onResetCalibration: () => void;
}

export const WarehouseDigitalTwin: React.FC<WarehouseDigitalTwinProps> = ({
  robots,
  tasks,
  selectedRobotId,
  setSelectedRobotId,
  onAddTask,
  onTriggerScheduler,
  schedulerActive,
  setSchedulerActive,
  workspaceCalibration,
  onRecalibrateWorkspace,
  onResetCalibration,
}) => {
  const [selectedRackId, setSelectedRackId] = useState<number>(2); // RACK_1 default
  const [selectedItem, setSelectedItem] = useState('Precision Sensor Pod');
  const [showMarkerSheet, setShowMarkerSheet] = useState(false);
  const [showCalibrationControls, setShowCalibrationControls] = useState(false);
  const [skewOffset, setSkewOffset] = useState({ x: 0, y: 0 });

  const selectedRobot = robots.find((r) => r.id === selectedRobotId) || robots[0];

  // Inter-robot distance in physical cm
  const r0 = robots[0];
  const r1 = robots[1] || robots[0];
  const interRobotDist = Math.sqrt(
    Math.pow(r0.pose.x - r1.pose.x, 2) + Math.pow(r0.pose.y - r1.pose.y, 2)
  );
  const isYieldingDistance = interRobotDist < 28.0;

  // Calibrated boundary polygon vertices (ID 9..12)
  const boundaryPolygon: [number, number][] = useMemo(() => [
    workspaceCalibration.boundaryCorners.tl,
    workspaceCalibration.boundaryCorners.tr,
    workspaceCalibration.boundaryCorners.br,
    workspaceCalibration.boundaryCorners.bl,
  ], [workspaceCalibration.boundaryCorners]);

  // Safety buffer polygon (offset inward by boundarySafetyMarginCm = 10cm)
  const safetyBufferPolygon: [number, number][] = useMemo(() => {
    const m = workspaceCalibration.boundarySafetyMarginCm;
    const { tl, tr, br, bl } = workspaceCalibration.boundaryCorners;
    return [
      [tl[0] + m, tl[1] + m],
      [tr[0] - m, tr[1] + m],
      [br[0] - m, br[1] - m],
      [bl[0] + m, bl[1] - m],
    ];
  }, [workspaceCalibration]);

  // Compute boundary status for selected robot
  const selectedBoundaryStatus = useMemo(() => {
    return calculateBoundaryRepulsion(
      [selectedRobot.pose.x, selectedRobot.pose.y],
      boundaryPolygon,
      workspaceCalibration.boundarySafetyMarginCm
    );
  }, [selectedRobot.pose.x, selectedRobot.pose.y, boundaryPolygon, workspaceCalibration.boundarySafetyMarginCm]);

  const selectedBoundaryDist = useMemo(() => {
    return getDistanceToBoundary([selectedRobot.pose.x, selectedRobot.pose.y], boundaryPolygon).distance;
  }, [selectedRobot.pose.x, selectedRobot.pose.y, boundaryPolygon]);

  // Rack landmark markers (IDs 2..5)
  const rackMarkers = ARUCO_DICT_4X4_50_MARKERS.filter(m => m.role === 'RACK');
  const deliveryMarker = ARUCO_DICT_4X4_50_MARKERS.find(m => m.id === 8)!;
  const startMarkers = ARUCO_DICT_4X4_50_MARKERS.filter(m => m.role === 'START_ZONE');
  const boundaryMarkers = ARUCO_DICT_4X4_50_MARKERS.filter(m => m.role === 'BOUNDARY');

  const handleDispatchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const rack = ARUCO_DICT_4X4_50_MARKERS.find(m => m.id === selectedRackId) || rackMarkers[0];
    const delivery = deliveryMarker;

    const newTask: TaskOrder = {
      id: `TASK_${Math.floor(100 + Math.random() * 900)}`,
      name: `${rack.name} -> DELIVERY_ZONE`,
      pickTarget: rack.defaultPositionCm,
      dropTarget: delivery.defaultPositionCm,
      rackMarkerId: rack.id,
      dropMarkerId: delivery.id,
      status: 'OPEN',
      itemType: selectedItem,
      rfidPayloadId: `RFID_${rack.name}_${Math.floor(10 + Math.random() * 89)}`,
      createdAt: Date.now()
    };
    onAddTask(newTask);
  };

  // Simulate camera distortion/corner nudge
  const handleNudgeCamera = (dx: number, dy: number) => {
    setSkewOffset(prev => {
      const next = { x: prev.x + dx, y: prev.y + dy };
      const base = workspaceCalibration.boundaryCorners;
      onRecalibrateWorkspace({
        tl: [Math.max(2, base.tl[0] + dx), Math.max(2, base.tl[1] + dy)],
        tr: [Math.min(118, base.tr[0] + dx * 0.5), Math.max(2, base.tr[1] - dy)],
        br: [Math.min(118, base.br[0] - dx), Math.min(118, base.br[1] + dy * 0.5)],
        bl: [Math.max(2, base.bl[0] - dx * 0.5), Math.min(118, base.bl[1] - dy)]
      });
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-zinc-900">
              ArUco-Calibrated Warehouse Workcell Digital Twin
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              DICT_4X4_50 (13 Markers)
            </span>
            <span className="px-2 py-0.5 text-xs font-mono rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              Boundary: IDs 9–12
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-3xl">
            ArUco markers form the primary geometric reference conditions. Overhead cameras continuously calibrate origin, scale, and hard perimeter constraints from boundary markers (IDs 9–12), localizing fixed racks (IDs 2–5), start zones (IDs 6–7), delivery zone (ID 8), and moving robots (IDs 0–1).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowMarkerSheet(true)}
            id="btn-open-marker-sheet"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Markers (IDs 0–12)</span>
          </button>

          <button
            onClick={() => setShowCalibrationControls(!showCalibrationControls)}
            id="btn-toggle-calibration-panel"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              showCalibrationControls
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Camera Recalibration</span>
          </button>

          <button
            onClick={() => setSchedulerActive(!schedulerActive)}
            id="scheduler-toggle-btn"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs ${
              schedulerActive
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${schedulerActive ? 'animate-spin' : ''}`} />
            <span>{schedulerActive ? 'Swarm Loop: RUNNING (20 Hz)' : 'Swarm Loop: PAUSED'}</span>
          </button>

          <button
            onClick={onTriggerScheduler}
            id="trigger-scheduler-step-btn"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step Coordinate</span>
          </button>
        </div>
      </div>

      {/* Dynamic Recalibration Control Tray */}
      {showCalibrationControls && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-amber-900">
                ArUco Dynamic Calibration Matrix &amp; Camera Distortion Simulator
              </span>
            </div>
            <button
              onClick={() => {
                setSkewOffset({ x: 0, y: 0 });
                onResetCalibration();
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-zinc-50 border border-amber-300 text-amber-900 font-semibold rounded text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset to Orthogonal (120×120cm)</span>
            </button>
          </div>

          <p className="text-zinc-600 text-[11px]">
            Simulate overhead camera perspective tilt, skew, or physical workcell re-orientation. The global perception layer detects the 4 boundary markers (IDs 9–12) and dynamically recalculates the homography perspective matrix without requiring manual coordinate updates.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
            <div className="bg-white p-2.5 rounded-lg border border-amber-200">
              <span className="text-zinc-500 block text-[10px]">BOUNDARY_TL (ID 9)</span>
              <span className="font-bold text-zinc-900">({workspaceCalibration.boundaryCorners.tl[0].toFixed(1)}, {workspaceCalibration.boundaryCorners.tl[1].toFixed(1)}) cm</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-amber-200">
              <span className="text-zinc-500 block text-[10px]">BOUNDARY_TR (ID 10)</span>
              <span className="font-bold text-zinc-900">({workspaceCalibration.boundaryCorners.tr[0].toFixed(1)}, {workspaceCalibration.boundaryCorners.tr[1].toFixed(1)}) cm</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-amber-200">
              <span className="text-zinc-500 block text-[10px]">BOUNDARY_BR (ID 11)</span>
              <span className="font-bold text-zinc-900">({workspaceCalibration.boundaryCorners.br[0].toFixed(1)}, {workspaceCalibration.boundaryCorners.br[1].toFixed(1)}) cm</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-amber-200">
              <span className="text-zinc-500 block text-[10px]">BOUNDARY_BL (ID 12)</span>
              <span className="font-bold text-zinc-900">({workspaceCalibration.boundaryCorners.bl[0].toFixed(1)}, {workspaceCalibration.boundaryCorners.bl[1].toFixed(1)}) cm</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="font-semibold text-zinc-700">Simulate Camera Tilt:</span>
            <button
              onClick={() => handleNudgeCamera(-2, 1.5)}
              className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 rounded font-semibold text-zinc-700 text-xs"
            >
              Tilt Skew Left (-2cm)
            </button>
            <button
              onClick={() => handleNudgeCamera(2, -1.5)}
              className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 rounded font-semibold text-zinc-700 text-xs"
            >
              Tilt Skew Right (+2cm)
            </button>
            <span className="text-zinc-500 ml-auto font-mono text-[10px]">
              Safety Margin: {workspaceCalibration.boundarySafetyMarginCm}cm &bull; Scale: {workspaceCalibration.scalePxPerCm.toFixed(2)} px/cm
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: 2D 120x120 Arena Map & Coordination Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive 2D Digital Twin Map */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-zinc-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-zinc-600" />
              <h3 className="text-sm font-semibold text-zinc-800">
                Calibrated Workspace Map (Boundary IDs 9–12)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono flex-wrap">
              <span className={isYieldingDistance ? 'text-amber-600 font-bold animate-pulse' : 'text-zinc-500'}>
                Inter-Bot: {interRobotDist.toFixed(1)}cm {isYieldingDistance ? '(YIELD <28cm)' : '(Safe)'}
              </span>
              <span className="text-zinc-300">|</span>
              <span className={selectedBoundaryDist < 10 ? 'text-rose-600 font-bold animate-pulse' : 'text-emerald-700 font-medium'}>
                Boundary Dist: {selectedBoundaryDist.toFixed(1)}cm {selectedBoundaryDist < 10 ? '(BRAKE/CORRECT)' : ''}
              </span>
            </div>
          </div>

          {/* SVG Map representing 120cm x 120cm arena with ArUco boundary constraints */}
          <div className="mt-4 relative w-full aspect-square bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 p-2 shadow-inner">
            <svg
              className="w-full h-full"
              viewBox="0 0 120 120"
              id="warehouse-map-svg"
            >
              <defs>
                <pattern id="arenaGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#27272a" strokeWidth="0.4" strokeDasharray="1,1" />
                </pattern>
                {/* Diagonal warning hatch for safety margin */}
                <pattern id="safetyHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#f59e0b" strokeWidth="0.7" opacity="0.3" />
                </pattern>
              </defs>

              {/* Background */}
              <rect width="120" height="120" fill="#09090b" />
              <rect width="120" height="120" fill="url(#arenaGrid)" stroke="#27272a" strokeWidth="0.8" />

              {/* Outer boundary polygon defined by IDs 9, 10, 11, 12 */}
              <polygon
                points={boundaryPolygon.map(p => `${p[0]},${p[1]}`).join(' ')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="2,1"
              />

              {/* 10cm Inward Safety Buffer Band */}
              <polygon
                points={safetyBufferPolygon.map(p => `${p[0]},${p[1]}`).join(' ')}
                fill="#f59e0b"
                fillOpacity="0.04"
                stroke="#d97706"
                strokeWidth="0.6"
                strokeDasharray="1,1"
              />

              {/* Boundary Markers (IDs 9..12) at the 4 Calibration Corners */}
              {boundaryMarkers.map((bMarker) => {
                const cornerPos = 
                  bMarker.id === 9 ? workspaceCalibration.boundaryCorners.tl :
                  bMarker.id === 10 ? workspaceCalibration.boundaryCorners.tr :
                  bMarker.id === 11 ? workspaceCalibration.boundaryCorners.br :
                  workspaceCalibration.boundaryCorners.bl;

                return (
                  <g key={bMarker.id} transform={`translate(${cornerPos[0]}, ${cornerPos[1]})`}>
                    {/* Reticle anchor */}
                    <circle r="4" fill="none" stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="1,1" />
                    <line x1="-5" y1="0" x2="5" y2="0" stroke="#f59e0b" strokeWidth="0.5" />
                    <line x1="0" y1="-5" x2="0" y2="5" stroke="#f59e0b" strokeWidth="0.5" />
                    
                    {/* 4x4 ArUco Representation */}
                    <rect x="-2.5" y="-2.5" width="5" height="5" fill="#000" stroke="#f59e0b" strokeWidth="0.4" />
                    <rect x="-1.25" y="-1.25" width="2.5" height="2.5" fill="#fff" />
                    <rect x="-0.6" y="-0.6" width="1.2" height="1.2" fill="#000" />
                    
                    {/* Tag Label */}
                    <text
                      x="0"
                      y={bMarker.id === 9 || bMarker.id === 10 ? -4 : 6.5}
                      fill="#f59e0b"
                      fontSize="2.6"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      ID {bMarker.id} ({cornerPos[0].toFixed(0)},{cornerPos[1].toFixed(0)})
                    </text>
                  </g>
                );
              })}

              {/* Fixed Landmark: Storage Racks 1..4 (IDs 2..5) */}
              {rackMarkers.map((rack) => {
                const isSelected = selectedRackId === rack.id;
                return (
                  <g
                    key={rack.id}
                    transform={`translate(${rack.defaultPositionCm[0]}, ${rack.defaultPositionCm[1]})`}
                    className="cursor-pointer"
                    onClick={() => setSelectedRackId(rack.id)}
                  >
                    {/* Rack footprint */}
                    <rect
                      x="-8"
                      y="-8"
                      width="16"
                      height="16"
                      rx="1.5"
                      fill="#18181b"
                      stroke={isSelected ? '#38bdf8' : '#27272a'}
                      strokeWidth={isSelected ? 1.5 : 0.8}
                    />

                    {/* ArUco Marker Glyph */}
                    <rect x="-4" y="-7" width="8" height="8" fill="#000" stroke="#fff" strokeWidth="0.3" />
                    <rect x="-2" y="-5" width="4" height="4" fill="#38bdf8" />
                    
                    {/* Rack Label */}
                    <text x="0" y="4" fill="#38bdf8" fontSize="2.8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      {rack.name}
                    </text>
                    <text x="0" y="7" fill="#71717a" fontSize="2.2" textAnchor="middle" fontFamily="monospace">
                      ID {rack.id}
                    </text>
                  </g>
                );
              })}

              {/* Start Zones: Robot 1 & Robot 2 (IDs 6, 7) */}
              {startMarkers.map((start) => (
                <g key={start.id} transform={`translate(${start.defaultPositionCm[0]}, ${start.defaultPositionCm[1]})`}>
                  <rect x="-7" y="-7" width="14" height="14" rx="2" fill="#064e3b" fillOpacity="0.3" stroke="#10b981" strokeWidth="0.8" strokeDasharray="1,1" />
                  <rect x="-3" y="-6" width="6" height="6" fill="#000" stroke="#fff" strokeWidth="0.3" />
                  <rect x="-1.5" y="-4.5" width="3" height="3" fill="#10b981" />
                  <text x="0" y="3" fill="#10b981" fontSize="2.5" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    {start.name === 'ROBOT_1_START' ? 'START 1' : 'START 2'}
                  </text>
                  <text x="0" y="6" fill="#6ee7b7" fontSize="2" textAnchor="middle" fontFamily="monospace">
                    ID {start.id}
                  </text>
                </g>
              ))}

              {/* Delivery Zone (ID 8) */}
              <g transform={`translate(${deliveryMarker.defaultPositionCm[0]}, ${deliveryMarker.defaultPositionCm[1]})`}>
                <rect x="-9" y="-9" width="18" height="18" rx="2" fill="#881337" fillOpacity="0.35" stroke="#f43f5e" strokeWidth="1.2" />
                <rect x="-4" y="-7.5" width="8" height="8" fill="#000" stroke="#fff" strokeWidth="0.3" />
                <rect x="-2" y="-5.5" width="4" height="4" fill="#f43f5e" />
                <text x="0" y="3.5" fill="#f43f5e" fontSize="2.8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                  DELIVERY
                </text>
                <text x="0" y="7" fill="#fda4af" fontSize="2.2" textAnchor="middle" fontFamily="monospace">
                  ID 8 ({deliveryMarker.defaultPositionCm[0]}, {deliveryMarker.defaultPositionCm[1]})
                </text>
              </g>

              {/* 28cm Inter-Robot Yield Danger Ring */}
              <circle
                cx={r0.pose.x}
                cy={r0.pose.y}
                r="14"
                fill="none"
                stroke={isYieldingDistance ? '#f43f5e' : '#3f3f46'}
                strokeWidth="0.8"
                strokeDasharray="2,2"
              />

              {/* Robots in the Calibrated Arena */}
              {robots.map((robot) => {
                const rx = robot.pose.x;
                const ry = robot.pose.y;
                const isSelected = robot.id === selectedRobotId;
                const color = robot.botNum === 0 ? '#38bdf8' : '#c084fc';
                const distToPerimeter = getDistanceToBoundary([rx, ry], boundaryPolygon).distance;
                const isNearBoundary = distToPerimeter < workspaceCalibration.boundarySafetyMarginCm;

                return (
                  <g
                    key={robot.id}
                    className="cursor-pointer transition-transform duration-300"
                    onClick={() => setSelectedRobotId(robot.id)}
                  >
                    {/* Selection Halo */}
                    {isSelected && (
                      <circle
                        cx={rx}
                        cy={ry}
                        r="12"
                        fill="none"
                        stroke={color}
                        strokeWidth="0.75"
                        strokeDasharray="2,2"
                        className="animate-spin"
                      />
                    )}

                    {/* Boundary Proximity Warning Ring */}
                    {isNearBoundary && (
                      <circle
                        cx={rx}
                        cy={ry}
                        r="10"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="0.9"
                        strokeDasharray="1.5,1.5"
                        className="animate-pulse"
                      />
                    )}

                    {/* Robot Body Oriented to heading */}
                    <g transform={`translate(${rx}, ${ry}) rotate(${robot.pose.ang})`}>
                      {/* Chassis */}
                      <rect x="-6" y="-4.5" width="12" height="9" rx="1.5" fill="#0f172a" stroke={color} strokeWidth="0.8" />
                      
                      {/* ArUco Marker Square (ID 0 or ID 1) */}
                      <rect x="-3" y="-3" width="6" height="6" fill="#000" stroke="#fff" strokeWidth="0.3" />
                      <rect x="-1.5" y="-1.5" width="3" height="3" fill="#fff" />
                      <rect x="-0.8" y="-0.8" width="1.6" height="1.6" fill="#000" />
                      
                      {/* Heading Arrow */}
                      <line x1="0" y1="0" x2="8" y2="0" stroke="#22c55e" strokeWidth="0.8" />
                      
                      {/* 4 Wheels */}
                      <rect x="-5" y="-5.5" width="3" height="1.5" rx="0.5" fill="#52525b" />
                      <rect x="2" y="-5.5" width="3" height="1.5" rx="0.5" fill="#52525b" />
                      <rect x="-5" y="4" width="3" height="1.5" rx="0.5" fill="#52525b" />
                      <rect x="2" y="4" width="3" height="1.5" rx="0.5" fill="#52525b" />
                    </g>

                    {/* Label Badge */}
                    <text
                      x={rx}
                      y={ry - 8}
                      fill={color}
                      fontSize="3"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {robot.name} [{robot.missionState}]
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Arena Coordinates Summary */}
          <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sky-600 font-bold">Robot 1 (Marker ID 0): ({r0.pose.x.toFixed(1)}, {r0.pose.y.toFixed(1)} cm)</span>
              <span className="text-zinc-300">|</span>
              <span className="font-mono text-purple-600 font-bold">Robot 2 (Marker ID 1): ({r1.pose.x.toFixed(1)}, {r1.pose.y.toFixed(1)} cm)</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              Calibrated Boundary: 120cm Polygon (IDs 9–12)
            </span>
          </div>
        </div>

        {/* Right Column: Swarm Mission Dispatcher & Closed-Loop Coordinator */}
        <div className="lg:col-span-5 space-y-5">
          {/* Mission Dispatcher Card (Warehouse Central Server) */}
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-zinc-900">
                  ArUco-Referenced Mission Dispatcher
                </h3>
              </div>
              <span className="text-[11px] font-mono text-indigo-600 font-bold">
                Racks (IDs 2–5) &bull; Delivery (ID 8)
              </span>
            </div>

            <form onSubmit={handleDispatchOrder} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Pick Station (ArUco Rack)
                  </label>
                  <select
                    value={selectedRackId}
                    onChange={(e) => setSelectedRackId(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white font-medium"
                  >
                    {rackMarkers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (ID {m.id}) &bull; ({m.defaultPositionCm[0]}, {m.defaultPositionCm[1]})cm
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Drop Bay (ArUco Delivery)
                  </label>
                  <input
                    type="text"
                    disabled
                    value="DELIVERY_ZONE (ID 8) [95, 60]cm"
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-zinc-50 font-medium text-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Payload Item Type
                </label>
                <input
                  type="text"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-200 font-medium"
                  placeholder="e.g. Microcontroller PCB Crate"
                />
              </div>

              <button
                type="submit"
                id="btn-dispatch-mission"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" /> Dispatch Autonomous Swarm Mission
              </button>
            </form>
          </div>

          {/* Active Robots Mission State & Boundary Safety Monitor */}
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-900">
                Autonomous Swarm Node &amp; Safety State
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Boundary Safety: Active
              </span>
            </div>

            <div className="space-y-3">
              {robots.map((bot) => {
                const bDist = getDistanceToBoundary([bot.pose.x, bot.pose.y], boundaryPolygon).distance;
                const bStatus = calculateBoundaryRepulsion([bot.pose.x, bot.pose.y], boundaryPolygon, workspaceCalibration.boundarySafetyMarginCm);

                return (
                  <div
                    key={bot.id}
                    onClick={() => setSelectedRobotId(bot.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      bot.id === selectedRobotId
                        ? 'bg-indigo-50/60 border-indigo-300'
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5">
                        <span>{bot.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-200 text-zinc-700 rounded">
                          {bot.ip}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          bot.missionState === 'YIELDING' 
                            ? 'bg-amber-100 text-amber-800'
                            : bot.missionState === 'PICK_PAYLOAD'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {bot.missionState}
                        </span>
                        {bStatus.alertLevel !== 'SAFE' && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 animate-pulse">
                            {bStatus.alertLevel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-200/60 text-[11px] font-mono text-zinc-600">
                      <div>Pose: ({bot.pose.x.toFixed(1)}, {bot.pose.y.toFixed(1)})</div>
                      <div>Angle: {bot.pose.ang.toFixed(1)}°</div>
                      <div>Perimeter: {bDist.toFixed(1)} cm</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Battery Health Trends Card for Selected Robot */}
      <BatteryHealthTrends selectedRobot={selectedRobot} />

      {/* ArUco Print Sheet Modal */}
      <ArucoMarkerSheetModal
        isOpen={showMarkerSheet}
        onClose={() => setShowMarkerSheet(false)}
      />
    </div>
  );
};
