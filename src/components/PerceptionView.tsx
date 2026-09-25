import React from 'react';
import { WorkspaceCalibration, RobotTwin, LandmarkState, ArucoLiveDetection } from '../types';
import { ARUCO_MARKER_SET_50 } from '../data/arucoMarkers';
import { Eye, Shield, CheckCircle2, AlertTriangle, RefreshCw, Crosshair, Grid } from 'lucide-react';

interface PerceptionViewProps {
  calibration: WorkspaceCalibration;
  robots: RobotTwin[];
  landmarks: LandmarkState[];
  onRecalibrate: () => void;
  onOpenMarkerModal: () => void;
}

export const PerceptionView: React.FC<PerceptionViewProps> = ({
  calibration,
  robots,
  landmarks,
  onRecalibrate,
  onOpenMarkerModal,
}) => {
  // Build Live Marker List based on current system state
  const liveDetections: ArucoLiveDetection[] = ARUCO_MARKER_SET_50.map((meta) => {
    let rawPx: [number, number] = [0, 0];
    let cm: [number, number] = [0, 0];
    let ang = 0;
    let valid = false;

    if (meta.category === 'BOUNDARY') {
      const corner = calibration.boundaryCorners.find((c) => c.id === meta.id);
      if (corner) {
        cm = corner.cm;
        rawPx = corner.px;
        valid = corner.detected;
      }
    } else if (meta.category === 'ROBOT') {
      const r = robots.find((bot) => (meta.id === 0 ? bot.id === 'robot_0' : bot.id === 'robot_1'));
      if (r) {
        cm = [r.pose.x, r.pose.y];
        rawPx = [Math.round(r.pose.x * 6.67), Math.round(r.pose.y * 6.67)];
        ang = r.pose.ang;
        valid = true;
      }
    } else {
      const lm = landmarks.find((l) => l.id === meta.id);
      if (lm) {
        cm = [lm.xCm, lm.yCm];
        rawPx = [Math.round(lm.xCm * 6.67), Math.round(lm.yCm * 6.67)];
        valid = lm.detected;
      }
    }

    return {
      id: meta.id,
      name: meta.name,
      role: meta.category,
      rawPx,
      calibratedCm: cm,
      angleDeg: ang,
      confidence: valid ? 0.98 : 0,
      valid,
      statusText: valid ? 'DETECTED' : 'SEARCHING',
    };
  });

  return (
    <div className="space-y-6">
      {/* Perception Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Layer 1 — Global Perception & Workcell Boundary Engine
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Overhead camera tracking via ArUco dictionary <code className="text-cyan-300 font-mono font-bold">DICT_4X4_50</code>. 
            Corner markers 9–12 establish the workspace origin, scale, orientation, and hard safety polygon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRecalibrate}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Trigger Homography Recalibration
          </button>
          <button
            onClick={onOpenMarkerModal}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Grid className="w-4 h-4 text-cyan-400" />
            Marker Sheet (IDs 0–12)
          </button>
        </div>
      </div>

      {/* Boundary Calibration Status & Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Calibration Status</span>
          <div className="flex items-center gap-2">
            {calibration.isCalibrated ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400 font-mono">CALIBRATED</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-amber-400 font-mono">UNCALIBRATED</span>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Last calibrated: {new Date(calibration.lastCalibratedTimestamp).toLocaleTimeString()}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Boundary Markers Detected</span>
          <div className="text-xl font-bold font-mono text-cyan-400">
            4 / 4 <span className="text-xs font-normal text-slate-400">(IDs 9, 10, 11, 12)</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">TL, TR, BR, BLCorners Valid</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Metric Workspace Dimensions</span>
          <div className="text-xl font-bold font-mono text-white">
            120.0 × 120.0 <span className="text-xs text-slate-400 font-normal">cm</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Perspective Homography Matrix H active</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Safety Buffer Margin</span>
          <div className="text-xl font-bold font-mono text-amber-400">
            8.0 <span className="text-xs text-slate-400 font-normal">cm Perimeter Buffer</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Hard Out-Of-Bounds Braking Trigger</span>
        </div>
      </div>

      {/* Dual Projection Canvas View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane: Raw Camera Feed View */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              Raw Camera Stream & ArUco Detection
            </h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
              SOURCE: Overhead IP Camera (DICT_4X4_50)
            </span>
          </div>

          <div className="relative aspect-square bg-slate-950 rounded-lg border border-slate-800 p-4 flex flex-col items-center justify-center overflow-hidden">
            {/* Grid & Camera Feed Representation */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            {/* Boundary Polygon Outline in Camera Space */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polygon
                points="40,40 760,40 760,760 40,760"
                fill="rgba(6, 182, 212, 0.08)"
                stroke="#06b6d4"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
            </svg>

            {/* Render Rendered Corner Boundary Markers */}
            <CornerMarkerBadge label="ID 9: BOUNDARY_TL" x="5%" y="5%" color="border-cyan-500 text-cyan-400" />
            <CornerMarkerBadge label="ID 10: BOUNDARY_TR" x="95%" y="5%" color="border-cyan-500 text-cyan-400" right />
            <CornerMarkerBadge label="ID 11: BOUNDARY_BR" x="95%" y="95%" color="border-cyan-500 text-cyan-400" right bottom />
            <CornerMarkerBadge label="ID 12: BOUNDARY_BL" x="5%" y="95%" color="border-cyan-500 text-cyan-400" bottom />

            {/* Simulated Live Camera Feed Overlay */}
            <div className="text-center z-10 space-y-2">
              <Eye className="w-12 h-12 text-cyan-400/80 mx-auto animate-pulse" />
              <div className="font-mono text-xs text-cyan-300 font-bold">OVERHEAD ARUCO VISION ACTIVE</div>
              <div className="text-[11px] text-slate-400">1280x720 @ 30fps | Distortion Corrected</div>
              <div className="inline-block px-3 py-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[11px] font-mono rounded-md font-bold mt-2">
                HOMOGRAPHY TRANSFORM H ACTIVE
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Warped Metric Workcell Canvas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Perspective-Corrected Metric Workcell (120 × 120 cm)
            </h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
              SOURCE: Calibrated Homography Matrix H
            </span>
          </div>

          <div className="relative aspect-square bg-slate-950 rounded-lg border border-slate-800 p-6 flex flex-col justify-between overflow-hidden">
            {/* Metric Centimeter Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20%_20%] opacity-60" />

            {/* Inner Safety Buffer Zone Box */}
            <div className="absolute inset-[8%] border-2 border-dashed border-amber-500/50 bg-amber-500/5 rounded-md pointer-events-none flex items-start justify-end p-2">
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-amber-500/30">
                SAFETY BUFFER (8 cm)
              </span>
            </div>

            {/* Robots in Metric View */}
            {robots.map((bot) => (
              <div
                key={bot.id}
                className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-cyan-400 bg-cyan-950/80 flex items-center justify-center text-[10px] font-bold font-mono text-cyan-300 shadow-lg transition-all duration-300"
                style={{
                  left: `${(bot.pose.x / 120) * 100}%`,
                  top: `${(bot.pose.y / 120) * 100}%`,
                  transform: `rotate(${bot.pose.ang}deg)`,
                }}
              >
                R{bot.botNum + 1}
              </div>
            ))}

            {/* Landmarks in Metric View */}
            {landmarks.map((lm) => (
              <div
                key={lm.id}
                className="absolute text-[9px] font-mono font-bold bg-slate-900/90 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(lm.xCm / 120) * 100}%`,
                  top: `${(lm.yCm / 120) * 100}%`,
                }}
              >
                {lm.name} ({lm.id})
              </div>
            ))}

            <div className="z-10 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>(0.0, 0.0) cm</span>
              <span>(120.0, 0.0) cm</span>
            </div>
            <div className="z-10 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>(0.0, 120.0) cm</span>
              <span>(120.0, 120.0) cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active ArUco Detections Tracking Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
          <span>Active Marker Tracking Table (DICT_4X4_50)</span>
          <span className="text-xs font-normal text-slate-400 font-mono">13 Total Registered Markers</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Marker Name</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Camera Px (u, v)</th>
                <th className="py-2.5 px-3">Workspace Cm (x, y)</th>
                <th className="py-2.5 px-3">Orientation</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {liveDetections.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40 transition-all">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">ID {m.id}</td>
                  <td className="py-2.5 px-3 font-bold text-white">{m.name}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.role === 'BOUNDARY'
                          ? 'bg-cyan-950 border border-cyan-800 text-cyan-300'
                          : m.role === 'ROBOT'
                          ? 'bg-amber-950 border border-amber-800 text-amber-300'
                          : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    ({m.rawPx[0]}, {m.rawPx[1]}) px
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white">
                    ({m.calibratedCm[0].toFixed(1)}, {m.calibratedCm[1].toFixed(1)}) cm
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{m.angleDeg.toFixed(1)}°</td>
                  <td className="py-2.5 px-3">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {m.statusText}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface CornerMarkerBadgeProps {
  label: string;
  x: string;
  y: string;
  color: string;
  right?: boolean;
  bottom?: boolean;
}

const CornerMarkerBadge: React.FC<CornerMarkerBadgeProps> = ({ label, x, y, color, right, bottom }) => (
  <div
    className={`absolute z-10 px-2 py-1 bg-slate-900/90 border ${color} rounded text-[10px] font-mono font-bold shadow-lg`}
    style={{
      left: right ? undefined : x,
      right: right ? '5%' : undefined,
      top: bottom ? undefined : y,
      bottom: bottom ? '5%' : undefined,
    }}
  >
    {label}
  </div>
);
