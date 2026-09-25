import React from 'react';
import { ARUCO_MARKER_SET_50 } from '../data/arucoMarkers';
import { X, Grid, Shield, Cpu, Tag } from 'lucide-react';

interface ArucoMarkerSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArucoMarkerSheetModal: React.FC<ArucoMarkerSheetModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
          <div>
            <div className="flex items-center gap-3">
              <Grid className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white tracking-wide">
                Warehouse Workcell ArUco Marker Set (`DICT_4X4_50`)
              </h2>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Print markers approximately 50 × 50 mm or larger. Keep a crisp white border around the black code.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Marker Grid List */}
        <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ARUCO_MARKER_SET_50.map((marker) => (
              <div
                key={marker.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-bold">
                      ID {marker.id}
                    </span>
                    <span className="font-bold text-white">{marker.name}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      marker.category === 'BOUNDARY'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                        : marker.category === 'ROBOT'
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {marker.category}
                  </span>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{marker.description}</p>

                <div className="text-[10px] text-slate-400 pt-1 space-y-0.5">
                  <div>• Placement: <span className="text-slate-200">{marker.hardwarePlacement}</span></div>
                  {marker.gridCoordinates && (
                    <div>• Default Location: <span className="text-cyan-300 font-bold">{marker.gridCoordinates}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
