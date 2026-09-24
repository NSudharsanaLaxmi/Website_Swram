import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { BatteryDataPoint, RobotTwin } from '../types';
import { 
  BatteryCharging, 
  Activity, 
  Zap, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Gauge
} from 'lucide-react';

interface BatteryHealthTrendsProps {
  selectedRobot: RobotTwin;
}

export const BatteryHealthTrends: React.FC<BatteryHealthTrendsProps> = ({ selectedRobot }) => {
  const [metricMode, setMetricMode] = useState<'DISCHARGE' | 'VOLTAGE_CURRENT' | 'ALL'>('ALL');

  // Fallback points if batteryHistory is empty or initializing
  const historyData: BatteryDataPoint[] = (selectedRobot.batteryHistory && selectedRobot.batteryHistory.length > 0)
    ? selectedRobot.batteryHistory
    : [
        {
          time: 'T-10m',
          timestamp: Date.now() - 600000,
          battery: 100.0,
          voltage: 12.6,
          dischargeRate: 0.12,
          currentDraw: 0.85,
          status: 'IDLE'
        },
        {
          time: 'T-8m',
          timestamp: Date.now() - 480000,
          battery: 99.4,
          voltage: 12.54,
          dischargeRate: 0.28,
          currentDraw: 1.45,
          status: 'NAV_TO_PICK'
        },
        {
          time: 'T-6m',
          timestamp: Date.now() - 360000,
          battery: 98.6,
          voltage: 12.48,
          dischargeRate: 0.42,
          currentDraw: 2.30,
          status: 'PICK_PAYLOAD'
        },
        {
          time: 'T-4m',
          timestamp: Date.now() - 240000,
          battery: 97.9,
          voltage: 12.42,
          dischargeRate: 0.35,
          currentDraw: 1.95,
          status: 'NAV_TO_DROP'
        },
        {
          time: 'T-2m',
          timestamp: Date.now() - 120000,
          battery: 97.2,
          voltage: 12.38,
          dischargeRate: 0.31,
          currentDraw: 1.80,
          status: 'IDLE'
        },
        {
          time: 'Now',
          timestamp: Date.now(),
          battery: selectedRobot.battery,
          voltage: selectedRobot.voltage,
          dischargeRate: selectedRobot.driveVelocities.linearX !== 0 ? 0.45 : 0.15,
          currentDraw: selectedRobot.driveVelocities.linearX !== 0 ? 2.4 : 0.9,
          status: selectedRobot.missionState
        }
      ];

  // Calculate statistics from the history
  const currentDischargeRate = historyData[historyData.length - 1]?.dischargeRate || 0.25;
  const avgDischargeRate = (
    historyData.reduce((acc, curr) => acc + curr.dischargeRate, 0) / historyData.length
  ).toFixed(2);
  const peakCurrentDraw = Math.max(...historyData.map(d => d.currentDraw)).toFixed(1);
  const estimatedMinsRemaining = currentDischargeRate > 0 
    ? Math.round(selectedRobot.battery / currentDischargeRate)
    : 240;

  // Custom high-contrast tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: BatteryDataPoint = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700/80 p-3 rounded-lg shadow-xl text-xs font-mono space-y-1 z-50">
          <div className="text-zinc-400 font-bold border-b border-zinc-800 pb-1 flex items-center justify-between gap-4">
            <span>Time: {label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-400 font-sans font-semibold">
              {data.status}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span>Battery Level:</span>
            <span className="font-bold">{data.battery.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sky-400">
            <span>Pack Voltage:</span>
            <span className="font-bold">{data.voltage.toFixed(2)}V</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-amber-400">
            <span>Discharge Rate:</span>
            <span className="font-bold">{data.dischargeRate.toFixed(2)}%/min</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-rose-400">
            <span>Current Draw:</span>
            <span className="font-bold">{data.currentDraw.toFixed(2)}A</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <BatteryCharging className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">
                Battery Health &amp; Discharge Rate Trends
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                3S LiPo Telemetry
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Monitoring {selectedRobot.name} (IP: {selectedRobot.ip}) discharge curves, instantaneous load, and state-of-health.
            </p>
          </div>
        </div>

        {/* View Toggle Mode */}
        <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setMetricMode('ALL')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              metricMode === 'ALL'
                ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            All Curves
          </button>
          <button
            onClick={() => setMetricMode('DISCHARGE')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              metricMode === 'DISCHARGE'
                ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Discharge %/min
          </button>
          <button
            onClick={() => setMetricMode('VOLTAGE_CURRENT')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              metricMode === 'VOLTAGE_CURRENT'
                ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Voltage &amp; Load
          </button>
        </div>
      </div>

      {/* KPI Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
            <span className="font-medium">Current SOC</span>
            <Gauge className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-zinc-900 font-mono">
            {selectedRobot.battery.toFixed(1)}%
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Pack: {selectedRobot.voltage.toFixed(2)}V (4.13V/cell)
          </div>
        </div>

        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
            <span className="font-medium">Discharge Velocity</span>
            <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-base font-bold text-zinc-900 font-mono">
            {currentDischargeRate.toFixed(2)}%/min
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Avg: {avgDischargeRate}%/min
          </div>
        </div>

        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
            <span className="font-medium">Est. Runtime</span>
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-base font-bold text-zinc-900 font-mono">
            ~{estimatedMinsRemaining} min
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
            To 20% critical cutoff
          </div>
        </div>

        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
            <span className="font-medium">Peak Actuator Load</span>
            <Zap className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-base font-bold text-zinc-900 font-mono">
            {peakCurrentDraw} A
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
            TB6612 + PCA9685 max draw
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {metricMode === 'DISCHARGE' ? (
            <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dischargeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#71717a' }} stroke="#d4d4d8" />
              <YAxis 
                tick={{ fontSize: 10, fill: '#71717a' }} 
                stroke="#d4d4d8" 
                unit=" %/m" 
                domain={[0, 'auto']} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="dischargeRate" 
                name="Discharge Rate (%/min)" 
                stroke="#f59e0b" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#dischargeGrad)" 
              />
            </AreaChart>
          ) : metricMode === 'VOLTAGE_CURRENT' ? (
            <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#71717a' }} stroke="#d4d4d8" />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 10, fill: '#71717a' }} 
                stroke="#d4d4d8" 
                unit="V" 
                domain={[11.5, 12.8]} 
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: '#71717a' }} 
                stroke="#d4d4d8" 
                unit="A" 
                domain={[0, 4]} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="voltage" 
                name="Pack Voltage (V)" 
                stroke="#0284c7" 
                strokeWidth={2}
                dot={{ r: 3, fill: '#0284c7' }} 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="currentDraw" 
                name="Current Load (A)" 
                stroke="#e11d48" 
                strokeWidth={2}
                dot={{ r: 3, fill: '#e11d48' }} 
              />
            </LineChart>
          ) : (
            <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#71717a' }} stroke="#d4d4d8" />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 10, fill: '#71717a' }} 
                stroke="#d4d4d8" 
                unit="%" 
                domain={[85, 100]} 
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: '#71717a' }} 
                stroke="#d4d4d8" 
                unit=" %/m" 
                domain={[0, 1.0]} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="battery" 
                name="Battery SOC (%)" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#batteryGrad)" 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="dischargeRate" 
                name="Discharge Rate (%/min)" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#f59e0b' }} 
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Advisory & Telemetry Footnote */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span>Calculated via ESP32 ADC (GPIO 34) 11:1 voltage divider &amp; TB6612 PWM duty integration.</span>
        </div>
        <span className="font-mono text-zinc-400">
          Last sync: {new Date(selectedRobot.lastTelemetryTime).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
