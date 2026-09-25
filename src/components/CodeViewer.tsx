import React, { useState } from 'react';
import { SOURCE_FILES, HARDWARE_PINS, IMPLEMENTATION_STEPS, SourceFile } from '../data/sourceCode';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  ListOrdered,
  ExternalLink,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export const CodeViewer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>('config-h');
  const [activeSubTab, setActiveSubTab] = useState<'CODE' | 'PINOUT' | 'MANUAL'>('CODE');
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);

  const currentFile = SOURCE_FILES.find((f) => f.id === selectedFileId) || SOURCE_FILES[0];

  const handleCopy = (file: SourceFile) => {
    navigator.clipboard.writeText(file.code);
    setCopiedFileId(file.id);
    setTimeout(() => setCopiedFileId(null), 2000);
  };

  const handleDownload = (file: SourceFile) => {
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    SOURCE_FILES.forEach((f, idx) => {
      setTimeout(() => handleDownload(f), idx * 250);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Swarm_Major Verified Firmware &amp; Production Source Code
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Verified Production Source
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end, compile-ready firmware and server coordination files directly synchronized with the <code className="text-cyan-300">Swarm_Major</code> repository (ESP32 4WD + PCA9685 Arm, UDP :8888, ArUco :5005).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sub-tab switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('CODE')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubTab === 'CODE'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Source Files
            </button>
            <button
              onClick={() => setActiveSubTab('PINOUT')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubTab === 'PINOUT'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hardware Pinout
            </button>
            <button
              onClick={() => setActiveSubTab('MANUAL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubTab === 'MANUAL'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Deployment Manual
            </button>
          </div>

          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-md"
            title="Download all verified source files"
          >
            <Download className="w-3.5 h-3.5" /> Download All
          </button>
        </div>
      </div>

      {activeSubTab === 'CODE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Selector Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Architecture Layers &amp; Source Files
            </h3>

            <div className="space-y-2">
              {SOURCE_FILES.map((file) => {
                const isSelected = file.id === selectedFileId;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 shadow-md ring-2 ring-cyan-500/20'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              file.language === 'cpp' ? 'bg-sky-400' : 'bg-emerald-400'
                            }`}
                          />
                          <span className="font-mono text-xs font-bold text-white">
                            {file.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {file.moduleTitle}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 uppercase">
                        {file.language}
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
                      <span>{file.platform}</span>
                      <span>{file.code.split('\n').length} lines</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 shadow-xl flex flex-col overflow-hidden">
            {/* Header / Info bar */}
            <div className="bg-slate-900 p-3.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{currentFile.name}</span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-400">{currentFile.platform}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(currentFile)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
                >
                  {copiedFileId === currentFile.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy File</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownload(currentFile)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Description & Key Specs */}
            <div className="bg-slate-900/60 p-3 border-b border-slate-800/80 text-xs text-slate-300 font-sans space-y-1.5">
              <p className="text-slate-400">{currentFile.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentFile.keyFeatures.map((feat, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-cyan-300 border border-slate-800"
                  >
                    • {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Preformatted Code Content with Line Numbers */}
            <div className="p-4 overflow-x-auto overflow-y-auto max-h-[600px] font-mono text-xs text-slate-200 bg-slate-950">
              <pre className="table">
                {currentFile.code.split('\n').map((line, i) => (
                  <div key={i} className="table-row hover:bg-slate-900/80">
                    <span className="table-cell pr-4 text-right select-none text-slate-600 text-[11px] w-10">
                      {i + 1}
                    </span>
                    <span className="table-cell whitespace-pre">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Pinout Tab */}
      {activeSubTab === 'PINOUT' && (
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              ESP32 &amp; Arduino UNO Q Hardware Pin Interconnect Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Wiring connections mapping the ESP32 DevKit V1 motor drivers, PCA9685 I2C arm driver, HC-SR04 ultrasonic sensor, voltage divider, and the STM32 UART bridge.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-y border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Pin / Port</th>
                  <th className="py-3 px-4">Firmware Macro Definition</th>
                  <th className="py-3 px-4">Hardware Layer</th>
                  <th className="py-3 px-4">Target Peripheral</th>
                  <th className="py-3 px-4">Operational Specification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {HARDWARE_PINS.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-cyan-400">{p.pin}</td>
                    <td className="py-2.5 px-4 text-white font-semibold">{p.function}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        p.layer === 'ESP32' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {p.layer}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-300">{p.targetDevice}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deployment Implementation Manual Tab */}
      {activeSubTab === 'MANUAL' && (
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-400" />
              Hierarchical Architecture Deployment Manual
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end operational sequence to stand up the physical network topology, server, microcontrollers, and edge agent.
            </p>
          </div>

          <div className="space-y-6">
            {IMPLEMENTATION_STEPS.map((step) => (
              <div
                key={step.step}
                className="p-5 rounded-xl border border-slate-800 bg-slate-950 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-cyan-900 text-cyan-200 border border-cyan-700 flex items-center justify-center font-bold text-xs">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{step.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{step.summary}</p>
                  </div>
                </div>

                {/* Shell Commands Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-400 space-y-1 shadow-inner">
                  {step.commands.map((cmd, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-slate-600 select-none">$</span>
                      <span>{cmd}</span>
                    </div>
                  ))}
                </div>

                {/* Verification Checklist */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-slate-300">Verification Criteria:</span>
                  {step.checks.map((chk, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{chk}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
