import React from 'react';
import { TelemetryMode, CalibrationStatus } from '../types';
import { Shield, Radio, Activity, AlertTriangle, Cpu, Terminal, Layers, Code, Eye, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telemetryMode: TelemetryMode;
  setTelemetryMode: (mode: TelemetryMode) => void;
  backendConnected: boolean;
  packetAgeMs: number;
  calibrationStatus: CalibrationStatus;
  emergencyHalt: boolean;
  onEmergencyHalt: () => void;
  onRecalibrate: () => void;
  onOpenMarkerModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  telemetryMode,
  setTelemetryMode,
  backendConnected,
  packetAgeMs,
  calibrationStatus,
  emergencyHalt,
  onEmergencyHalt,
  onRecalibrate,
  onOpenMarkerModal,
}) => {
  const isLive = telemetryMode === 'LIVE';
  const isStale = isLive && (packetAgeMs > 3000 || !backendConnected);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-xl">
      {/* Top Banner / System Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold tracking-wider text-cyan-400">
            <Shield className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>SWARM ROBOTICS OPS CONSOLE</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">DICT_4X4_50 ARUCO CALIBRATION ENGINE</span>
        </div>

        {/* Telemetry Mode & Status Controls */}
        <div className="flex items-center gap-4">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setTelemetryMode('LIVE')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                isLive
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              LIVE TELEMETRY
            </button>
            <button
              onClick={() => setTelemetryMode('DEMO')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                !isLive
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              DEMO / SIMULATION
            </button>
          </div>

          {/* Connection Status Pill */}
          <div
            className={`px-3 py-1 rounded-md border font-mono flex items-center gap-2 ${
              !isLive
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : isStale
                ? 'bg-red-950/40 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !isLive
                  ? 'bg-amber-400'
                  : isStale
                  ? 'bg-red-500 animate-ping'
                  : 'bg-emerald-400'
              }`}
            />
            <span>
              {!isLive
                ? 'DEMO DATA'
                : !backendConnected
                ? 'BACKEND DISCONNECTED'
                : isStale
                ? `STALE (${Math.round(packetAgeMs / 1000)}s)`
                : `LIVE (${packetAgeMs}ms)`}
            </span>
          </div>

          {/* Calibration Status Badge */}
          <div
            className={`px-2.5 py-1 rounded-md border text-[11px] font-mono font-bold flex items-center gap-1.5 ${
              calibrationStatus === 'CALIBRATED'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                : calibrationStatus === 'CALIBRATION_DEGRADED'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                : 'bg-red-950/40 border-red-500/50 text-red-400'
            }`}
          >
            <span>BOUNDARY: {calibrationStatus}</span>
          </div>

          {/* Persistent E-STOP Button */}
          <button
            onClick={onEmergencyHalt}
            className={`px-4 py-1.5 rounded-md font-bold tracking-wide flex items-center gap-2 transition-all text-xs shadow-lg ${
              emergencyHalt
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse border-2 border-white'
                : 'bg-red-600/90 hover:bg-red-600 text-white border border-red-400 hover:shadow-red-900/50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            {emergencyHalt ? 'SYSTEM HALTED - CLICK RESUME' : 'EMERGENCY STOP'}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-slate-800/50">
        <div className="flex items-center space-x-1 overflow-x-auto py-1">
          <TabButton
            id="warehouse"
            label="Digital Twin"
            icon={<Layers className="w-4 h-4" />}
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <TabButton
            id="perception"
            label="Perception & Calibration"
            icon={<Eye className="w-4 h-4" />}
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <TabButton
            id="architecture"
            label="Architecture Hierarchy"
            icon={<Cpu className="w-4 h-4" />}
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <TabButton
            id="edge"
            label="Edge Fleet & Sensors"
            icon={<Activity className="w-4 h-4" />}
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <TabButton
            id="control"
            label="Command & Teleop"
            icon={<Radio className="w-4 h-4" />}
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <TabButton
            id="terminal"
            label="Protocol Terminal"
            icon={<Terminal className="w-4 h-4" />}
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <TabButton
            id="code"
            label="System Code"
            icon={<Code className="w-4 h-4" />}
            activeTab={activeTab}
            onClick={setActiveTab}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRecalibrate}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Recalibrate dynamic perspective homography from boundary markers 9-12"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Recalibrate Workcell
          </button>
          <button
            onClick={onOpenMarkerModal}
            className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            DICT_4X4_50 Marker Sheet
          </button>
        </div>
      </div>
    </header>
  );
};

interface TabButtonProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeTab: string;
  onClick: (id: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, icon, activeTab, onClick }) => {
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
        isActive
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-inner'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
