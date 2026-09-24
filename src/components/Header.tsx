import React from 'react';
import { 
  Bot, 
  Cpu, 
  Layers, 
  Radio, 
  FileCode2, 
  Network, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  ShieldCheck,
  Zap,
  Eye
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  wifiOnline: boolean;
  setWifiOnline: (online: boolean) => void;
  emergencyHalt: boolean;
  setEmergencyHalt: (halt: boolean) => void;
  onResetSimulation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  wifiOnline,
  setWifiOnline,
  emergencyHalt,
  setEmergencyHalt,
  onResetSimulation
}) => {
  const navTabs = [
    { id: 'warehouse', label: '120cm Swarm Arena Twin', icon: Layers, badge: 'ArUco DICT_4X4_50 (IDs 0–12)' },
    { id: 'edge-agent', label: 'Boundary Calibration & Vision', icon: Eye, badge: 'Corner Anchors (IDs 9–12)' },
    { id: 'actuation', label: 'ESP32 & Hardware Control', icon: Bot, badge: 'TB6612 + ToF + PCA9685' },
    { id: 'packet-bus', label: 'UDP Protocol & Teleop Bus', icon: Radio, badge: 'Port 8888 / 5005' },
    { id: 'firmware', label: 'Swarm Repository Code', icon: FileCode2, badge: 'ArUco Calibrated Code' },
    { id: 'architecture', label: 'Swarm Topology & Guide', icon: Network, badge: 'Calibration & Safety Layer' }
  ];

  return (
    <header className="border-b border-zinc-200 bg-white/95 backdrop-blur sticky top-0 z-40 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-zinc-900">
                AI-Driven Cooperative Autonomous Mobile Manipulator Swarm
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Swarm_Major Live Twin
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              ESP32 4WD + PCA9685 Arm • Overhead ArUco Localization (UDP :5005) • Closed-Loop Swarm Coordinator (UDP :8888) • 120×120cm Arena
            </p>
          </div>
        </div>

        {/* System Status Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* WiFi / UDP Broadcast Toggle */}
          <button
            onClick={() => setWifiOnline(!wifiOnline)}
            id="wifi-toggle-btn"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              wifiOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
            }`}
            title="Toggle WiFi link to test UDP Port 5005 & 8888 loss"
          >
            {wifiOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
            <span>UDP Swarm Link: {wifiOnline ? 'ONLINE (:5005 / :8888)' : 'OFFLINE (Loss)'}</span>
          </button>

          {/* Emergency Safety Interlock */}
          <button
            onClick={() => setEmergencyHalt(!emergencyHalt)}
            id="emergency-halt-btn"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              emergencyHalt
                ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700 shadow-sm animate-bounce'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
            }`}
          >
            {emergencyHalt ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />}
            <span>{emergencyHalt ? 'EMERGENCY BRAKE ACTIVE' : 'Safety Interlock: OK'}</span>
          </button>

          {/* Reset Simulation */}
          <button
            onClick={onResetSimulation}
            id="reset-simulation-btn"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 transition-colors"
            title="Reset positions, orders, and telemetry to initial state"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-100 overflow-x-auto">
        <nav className="flex space-x-1 py-1.5 min-w-max" aria-label="Tabs">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                id={`nav-tab-${tab.id}`}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-300' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

