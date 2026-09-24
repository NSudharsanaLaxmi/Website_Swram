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
  const [selectedFileId, setSelectedFileId] = useState<string>('module1');
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
      <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-zinc-900">
              Swarm_Major Verified Firmware &amp; Production Source Code
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              8 Verified Source Modules
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            End-to-end, compile-ready firmware and server coordination files directly synchronized with the Swarm_Major repository (ESP32 4WD + PCA9685 Arm, UDP :8888, ArUco :5005).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sub-tab switcher */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setActiveSubTab('CODE')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubTab === 'CODE'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Source Files
            </button>
            <button
              onClick={() => setActiveSubTab('PINOUT')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubTab === 'PINOUT'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Hardware Pinout
            </button>
            <button
              onClick={() => setActiveSubTab('MANUAL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeSubTab === 'MANUAL'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Deployment Manual
            </button>
          </div>

          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-xs"
            title="Download all 4 source files"
          >
            <Download className="w-3.5 h-3.5" /> Download All
          </button>
        </div>
      </div>

      {activeSubTab === 'CODE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Selector Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider px-1">
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
                        ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              file.language === 'cpp' ? 'bg-sky-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-mono text-xs font-bold text-zinc-900">
                            {file.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 line-clamp-2">
                          {file.moduleTitle}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase">
                        {file.language}
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] font-mono text-zinc-500 flex items-center justify-between border-t border-zinc-100 pt-2">
                      <span>{file.platform}</span>
                      <span>{file.code.split('\n').length} lines</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-8 bg-zinc-950 rounded-xl border border-zinc-800 shadow-xl flex flex-col overflow-hidden">
            {/* Header / Info bar */}
            <div className="bg-zinc-900 p-3.5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{currentFile.name}</span>
                <span className="text-zinc-500">|</span>
                <span className="text-zinc-400">{currentFile.platform}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(currentFile)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition-colors"
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
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Description & Key Specs */}
            <div className="bg-zinc-900/60 p-3 border-b border-zinc-800/80 text-xs text-zinc-300 font-sans space-y-1.5">
              <p className="text-zinc-400">{currentFile.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentFile.keyFeatures.map((feat, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                  >
                    • {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Preformatted Code Content with Line Numbers */}
            <div className="p-4 overflow-x-auto overflow-y-auto max-h-[600px] font-mono text-xs text-zinc-200">
              <pre className="table">
                {currentFile.code.split('\n').map((line, i) => (
                  <div key={i} className="table-row hover:bg-zinc-900/80">
                    <span className="table-cell pr-4 text-right select-none text-zinc-600 text-[11px] w-10">
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
        <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-xs space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              ESP32 &amp; Arduino UNO Q Hardware Pin Interconnect Matrix
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Wiring connections mapping the ESP32 DevKit V1 motor drivers, PCA9685 I2C arm driver, HC-SR04 ultrasonic sensor, voltage divider, and the STM32 UART bridge.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-y border-zinc-200 text-zinc-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Pin / Port</th>
                  <th className="py-3 px-4">Firmware Macro Definition</th>
                  <th className="py-3 px-4">Hardware Layer</th>
                  <th className="py-3 px-4">Target Peripheral</th>
                  <th className="py-3 px-4">Operational Specification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-mono">
                {HARDWARE_PINS.map((p, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-indigo-700">{p.pin}</td>
                    <td className="py-2.5 px-4 text-zinc-900 font-semibold">{p.function}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        p.layer === 'ESP32' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.layer}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-zinc-700">{p.targetDevice}</td>
                    <td className="py-2.5 px-4 font-sans text-zinc-500">{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deployment Implementation Manual Tab */}
      {activeSubTab === 'MANUAL' && (
        <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-xs space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-600" />
              Hierarchical Architecture Deployment Manual
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              End-to-end operational sequence to stand up the physical network topology, server, microcontrollers, and edge agent.
            </p>
          </div>

          <div className="space-y-6">
            {IMPLEMENTATION_STEPS.map((step) => (
              <div
                key={step.step}
                className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{step.title}</h4>
                    <p className="text-xs text-zinc-600 mt-0.5">{step.summary}</p>
                  </div>
                </div>

                {/* Shell Commands Box */}
                <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs text-emerald-400 space-y-1 shadow-inner">
                  {step.commands.map((cmd, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-zinc-600 select-none">$</span>
                      <span>{cmd}</span>
                    </div>
                  ))}
                </div>

                {/* Verification Checklist */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-zinc-700">Verification Criteria:</span>
                  {step.checks.map((chk, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
