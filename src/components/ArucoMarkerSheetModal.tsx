import React from 'react';
import { ARUCO_DICT_4X4_50_MARKERS, ArucoMarkerDef } from '../data/arucoMarkers';
import { X, Printer, Download, Sparkles, Shield, Compass, Layers, CheckCircle } from 'lucide-react';

interface ArucoMarkerSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArucoMarkerSheetModal: React.FC<ArucoMarkerSheetModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-sm">
              4×4
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900">
                  Warehouse Workcell ArUco Marker Set (DICT_4X4_50)
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  13 Markers (IDs 0–12)
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Primary visual reference and geometric boundary condition system for workspace calibration and robot tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend Banner */}
        <div className="px-5 py-3 bg-indigo-50/70 border-b border-indigo-100 text-xs flex flex-wrap items-center gap-4 text-zinc-700">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
            <span className="font-semibold text-zinc-900">Boundary &amp; Calibration (IDs 9–12):</span> Physical perimeter anchors &amp; origin
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
            <span className="font-semibold text-zinc-900">Robots (IDs 0–1):</span> Moving fiducials on robot chassis
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
            <span className="font-semibold text-zinc-900">Racks (IDs 2–5):</span> Fixed inventory stations
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
            <span className="font-semibold text-zinc-900">Start Zones (IDs 6–7):</span> Robot home &amp; charge pads
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-600 inline-block" />
            <span className="font-semibold text-zinc-900">Delivery Zone (ID 8):</span> Outbound drop station
          </div>
        </div>

        {/* Marker Grid Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {ARUCO_DICT_4X4_50_MARKERS.map((marker) => (
              <div
                key={marker.id}
                className="border border-zinc-200 rounded-xl p-3.5 bg-white flex flex-col items-center text-center shadow-xs hover:border-zinc-400 transition-colors"
              >
                {/* Badge */}
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 font-bold text-zinc-800">
                    ID {marker.id}
                  </span>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase"
                    style={{
                      backgroundColor: `${marker.color}15`,
                      color: marker.color
                    }}
                  >
                    {marker.role}
                  </span>
                </div>

                {/* ArUco SVG Render (6x6 cells: 1 outer black border, 4x4 inner data grid) */}
                <div className="p-2 bg-white rounded-lg border border-zinc-300 shadow-inner">
                  <svg className="w-24 h-24" viewBox="0 0 6 6">
                    {/* Outer Black Border */}
                    <rect x="0" y="0" width="6" height="6" fill="#000000" />
                    {/* Inner 4x4 Cells */}
                    {marker.grid.map((row, rIdx) =>
                      row.map((val, cIdx) => (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx + 1}
                          y={rIdx + 1}
                          width="1"
                          height="1"
                          fill={val === 1 ? '#ffffff' : '#000000'}
                        />
                      ))
                    )}
                  </svg>
                </div>

                {/* Marker Info */}
                <div className="mt-2.5 w-full">
                  <div className="font-mono text-xs font-bold text-zinc-900 truncate">
                    {marker.name}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
                    {marker.label}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-1">
                    Calibrated: ({marker.defaultPositionCm[0]}, {marker.defaultPositionCm[1]}) cm
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mounting & Calibration Notes */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs text-zinc-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <Shield className="w-4 h-4 text-amber-500" />
              <span>Workspace Calibration &amp; Mounting Rules</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600">
              <li>
                <strong>Corner Boundaries (IDs 9–12):</strong> Mount flat at the 4 outer perimeter corners of the 120cm × 120cm workcell. The system automatically computes a 3×3 perspective homography matrix to remove lens distortion and camera tilt.
              </li>
              <li>
                <strong>Robot Moving Markers (IDs 0–1):</strong> Mount horizontally on top of the robot chassis so the overhead IP camera maintains continuous line-of-sight during motion.
              </li>
              <li>
                <strong>Racks (IDs 2–5), Start (IDs 6–7), Delivery (ID 8):</strong> Mount at designated workcell positions. Any physical reconfiguration is automatically detected without altering code.
              </li>
              <li>
                <strong>Print Margin:</strong> Maintain at least a 10mm white border around the outer black frame for optimal binary thresholding in OpenCV.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-mono">
            OpenCV Dictionary: cv2.aruco.DICT_4X4_50 • Size: 50mm × 50mm
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
