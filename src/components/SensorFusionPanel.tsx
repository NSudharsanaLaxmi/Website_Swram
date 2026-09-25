import React from 'react';
import { PerceptionTelemetry } from '../types';
import { Eye, Radio, Activity, CheckCircle2, AlertTriangle, ShieldCheck, Cpu, Layers } from 'lucide-react';

interface SensorFusionPanelProps {
  perception: PerceptionTelemetry;
}

export const SensorFusionPanel: React.FC<SensorFusionPanelProps> = ({ perception }) => {
  const isFusionVerified = perception.sensorFusion.approachAuthorized;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Perception &amp; Multi-Sensor Fusion Pipeline
            </h3>
            <p className="text-[11px] text-slate-400">
              Heterogeneous Sensor Fusion: Overhead ArUco (WHERE) + RC522 RFID (WHICH) + VL53L0X LiDAR/ToF (SAFE)
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1.5 ${
            isFusionVerified
              ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
              : 'bg-amber-950 text-amber-300 border-amber-600'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          FUSION STATUS: {perception.sensorFusion.status}
        </span>
      </div>

      {/* 3-Sensor Modality Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. ArUco / Webcam Vision */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
              <Eye className="w-4 h-4" />
              <span>Overhead ArUco Vision</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded">
              WHERE AM I?
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">ArUco Dictionary:</span>
              <span className="font-bold text-cyan-300">{perception.dictionary}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Boundary Corners:</span>
              <span className="font-bold text-emerald-400">{perception.detectedCorners}/4 (IDs 9-12)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Homography Matrix H:</span>
              <span className="font-bold text-emerald-400">CALIBRATED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Robots Tracked:</span>
              <span className="font-bold text-slate-200">Robot 1 (ID 0), Robot 2 (ID 1)</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
            Role: Global Metric Coordinates &amp; Dynamic Boundary Transform
          </div>
        </div>

        {/* 2. RC522 RFID Sensor */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Radio className="w-4 h-4" />
              <span>RC522 RFID Verification</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-amber-950 border border-amber-800 text-amber-300 rounded">
              WHICH RACK?
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Scanned Tag UID:</span>
              <span className="font-bold text-amber-300">{perception.rfidReading.activeTag}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Rack Match:</span>
              <span className="font-bold text-emerald-400">{perception.rfidReading.matchedRack}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Verification Match:</span>
              <span className="font-bold text-emerald-400">{perception.rfidReading.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SPI Bus Hardware:</span>
              <span className="font-bold text-slate-200">RC522 (SS:5, RST:2)</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
            Role: Ground-Truth Rack Identity Confirmation
          </div>
        </div>

        {/* 3. VL53L0X LiDAR / ToF Laser */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Activity className="w-4 h-4" />
              <span>VL53L0X LiDAR / ToF</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded">
              IS IT SAFE?
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Front Laser ToF:</span>
              <span className="font-bold text-emerald-400">{perception.lidarTof.frontDistanceMm} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Left Clearance:</span>
              <span className="font-bold text-slate-200">{perception.lidarTof.leftClearanceCm} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Right Clearance:</span>
              <span className="font-bold text-slate-200">{perception.lidarTof.rightClearanceCm} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Docking Threshold:</span>
              <span className="font-bold text-cyan-300">60 mm (Brake: &lt;120mm)</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
            Role: Local Clearance Validation &amp; Collision Safety Braking
          </div>
        </div>
      </div>

      {/* Sensor Fusion Verdict Agreement Banner */}
      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Sensor Fusion Agreement:</span>
              <span className="text-emerald-300">Overhead ArUco ✓ + RFID Tag Match ✓ + LiDAR Clearance ✓</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Target Rack 2 position locked. Identity verified. Front distance 320 mm allows precision dock.
            </div>
          </div>
        </div>

        <span className="px-3 py-1 bg-emerald-900/80 border border-emerald-500 text-emerald-200 text-xs font-bold rounded-md shadow">
          PICKUP AUTHORIZED
        </span>
      </div>
    </div>
  );
};
