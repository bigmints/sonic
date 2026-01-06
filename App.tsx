
import React, { useState, useRef } from 'react';
import { ForegroundStyle, BackgroundStyle, VisualizerConfig, AudioState, TimerLocation } from './types';
import VisualizerCanvas from './components/VisualizerCanvas';
import AudioUpload from './components/AudioUpload';

const App: React.FC = () => {
  const [state, setState] = useState<AudioState>({
    file: null,
    audioUrl: null,
    isPlaying: false,
  });

  const [config, setConfig] = useState<VisualizerConfig>({
    foregroundStyle: ForegroundStyle.PHYLLOTAXIS,
    backgroundStyle: BackgroundStyle.HYPER_TUNNEL,
    color: '#ff0000',
    colorSecondary: '#0066ff',
    sensitivity: 2.2,
    glowAmount: 60,
    speed: 1.2,
    backgroundSpeed: 0.5,
    scale: 1.0,
    complexity: 4000,
    showTimer: true,
    timerSize: 110,
    timerLocation: TimerLocation.CENTER,
    rotationSpeed: 0.8,
    title: 'SONIC SESSION',
    subtitle: 'MASTER RENDER V1',
    titleSize: 160,
    subtitleSize: 45,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAudioSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setState({ file, audioUrl: url, isPlaying: false });
  };

  const handleLoadSample = async () => {
    try {
      const response = await fetch('/sample.mp3');
      const blob = await response.blob();
      const file = new File([blob], 'Retro Alley Drift.mp3', { type: 'audio/mpeg' });
      handleAudioSelect(file);
    } catch (error) {
      console.error('Error loading sample audio:', error);
    }
  };

  const handleReset = () => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    setState({
      file: null,
      audioUrl: null,
      isPlaying: false,
    });
    setIsRecording(false);
    setRecordingProgress(0);
  };

  const isReady = !!state.audioUrl;


  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
      <header className="fixed top-0 w-full p-10 flex justify-between items-center z-50">
        <h1 className="text-2xl font-black tracking-[-0.05em] uppercase cursor-default">
          SONIC<span className="text-red-600">VISION</span> <span className="text-[10px] tracking-[0.3em] font-medium opacity-50 ml-2">PRO MASTER</span>
        </h1>

        {isReady && (
          <div className="flex items-center gap-6">
            {!isRecording ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsRecording(true)}
                  className="px-8 py-3 bg-red-600 border border-red-500 rounded-full text-[11px] font-black uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:bg-red-500 hover:scale-105 transition-all active:scale-95 pointer-events-auto"
                >
                  Master Export
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[11px] font-black uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-all active:scale-95 pointer-events-auto"
                >
                  New Project
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-8 px-8 py-4 bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] min-w-[340px] animate-in slide-in-from-top-4 duration-500 pointer-events-auto">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-[0.1em] text-white/90">LIVE RECORDING</span>
                    <span className="text-[9px] font-mono text-white/40 uppercase">System Active</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[14px] font-black tracking-tighter tabular-nums">{Math.round(recordingProgress * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-red-600 h-full shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                      style={{ width: `${recordingProgress * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setIsRecording(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-red-600/20 hover:border-red-600/50 hover:text-red-500 transition-all active:scale-90 group"
                  title="Cancel Export"
                >
                  <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className={`w-full max-w-[1800px] pt-24 transition-all duration-1000 ease-in-out ${isReady ? 'grid grid-cols-1 lg:grid-cols-12 gap-12 items-start' : 'flex items-center justify-center min-h-[80vh]'}`}>
        {/* Visualizer Container */}
        <div className={`${isReady ? 'lg:col-span-8' : 'w-full max-w-5xl'} aspect-video relative rounded-[2.5rem] overflow-hidden bg-black shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 group ring-1 ring-white/10`}>
          <VisualizerCanvas
            audioUrl={state.audioUrl}
            config={config}
            isRecording={isRecording}
            onRecordingComplete={() => setIsRecording(false)}
            onRecordingProgress={setRecordingProgress}
            isPlaying={state.isPlaying}
            ref={audioRef}
          />

          {!isReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 p-10 backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center max-w-3xl w-full text-center">
                <div className="text-[10px] font-black tracking-[0.8em] text-red-500 mb-6 uppercase">Initialize Engine</div>
                <h2 className="text-[80px] font-black mb-16 uppercase tracking-[-0.04em] leading-[0.85] text-white">
                  PROFESSIONAL<br /><span className="text-white/20">AUDIO RENDERER</span>
                </h2>
                <div className="flex flex-col items-center gap-8">
                  <AudioUpload onFileSelect={handleAudioSelect} />

                  <div className="flex items-center gap-4 w-full max-w-[200px]">
                    <div className="h-[1px] flex-1 bg-white/5" />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">OR</span>
                    <div className="h-[1px] flex-1 bg-white/5" />
                  </div>

                  <button
                    onClick={handleLoadSample}
                    className="bg-[#15151b] border border-[#2a2a3a] rounded-xl px-12 py-5 flex items-center gap-4 hover:bg-[#1c1c25] hover:border-red-500/50 transition-all cursor-pointer group shadow-2xl"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-500 group-hover:scale-125 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <span className="font-bold text-base uppercase tracking-widest text-white/90">Load Sample Music</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Precision Controls */}
        {isReady && (
          <div className="lg:col-span-4 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto pr-4 custom-scrollbar pb-20 animate-in slide-in-from-right duration-700">
            <div className="bg-[#080808]/90 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] space-y-16 shadow-2xl ring-1 ring-white/5">

              {/* STYLE SELECTION */}
              <div className="space-y-12">
                <section>
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h3 className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic mb-1">CORE OBJECT</h3>
                      <p className="text-[9px] text-neutral-500 font-medium uppercase tracking-widest">Foreground Geometry</p>
                    </div>
                    <span className="text-[9px] font-mono text-red-600/50">MOD_A</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.values(ForegroundStyle).map(s => (
                      <button
                        key={s}
                        onClick={() => setConfig(p => ({ ...p, foregroundStyle: s }))}
                        className={`aspect-square flex flex-col items-center justify-center text-center p-2 rounded-2xl text-[8px] font-black uppercase tracking-tighter transition-all active:scale-90 ${config.foregroundStyle === s
                          ? 'bg-red-600 text-white shadow-[0_15px_40px_rgba(220,38,38,0.4)] scale-105 z-10'
                          : 'bg-[#121212] text-neutral-500 border border-white/5 hover:text-white hover:border-white/20'
                          }`}
                      >
                        <span className="leading-[1.1]">
                          {s.split(/[\s-]+/).map((word, i) => (
                            <span key={i} className="block">{word}</span>
                          ))}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h3 className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic mb-1">ENVIRONMENT</h3>
                      <p className="text-[9px] text-neutral-500 font-medium uppercase tracking-widest">Background Flux</p>
                    </div>
                    <span className="text-[9px] font-mono text-blue-600/50">MOD_B</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.values(BackgroundStyle).map(s => (
                      <button
                        key={s}
                        onClick={() => setConfig(p => ({ ...p, backgroundStyle: s }))}
                        className={`aspect-square flex flex-col items-center justify-center text-center p-2 rounded-2xl text-[8px] font-black uppercase tracking-tighter transition-all active:scale-90 ${config.backgroundStyle === s
                          ? 'bg-blue-600 text-white shadow-[0_15px_40px_rgba(37,99,235,0.4)] scale-105 z-10'
                          : 'bg-[#121212] text-neutral-500 border border-white/5 hover:text-white hover:border-white/20'
                          }`}
                      >
                        <span className="leading-[1.1]">
                          {s.split(' ').map((word, i) => (
                            <span key={i} className="block">{word}</span>
                          ))}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* HUD / TEXT OVERLAY */}
              <section className="space-y-10 pt-10 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic mb-1">HUD SYSTEM</h3>
                    <p className="text-[9px] text-neutral-500 font-medium uppercase tracking-widest">Text Overlay & Data</p>
                  </div>
                  <button
                    onClick={() => setConfig(p => ({ ...p, showTimer: !p.showTimer }))}
                    className={`text-[10px] font-bold px-4 py-1.5 rounded-full border-2 transition-all ${config.showTimer ? 'border-red-600 text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'border-neutral-800 text-neutral-700'}`}
                  >
                    {config.showTimer ? 'ACTIVE' : 'BYPASS'}
                  </button>
                </div>

                {config.showTimer && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Master Identifier</label>
                        <input
                          type="text"
                          value={config.title}
                          onChange={(e) => setConfig(p => ({ ...p, title: e.target.value }))}
                          placeholder="TITLE"
                          className="w-full bg-[#121212] border border-white/5 rounded-xl px-5 py-4 text-[12px] font-black tracking-[0.1em] outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all uppercase"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Sub-Metadata</label>
                        <input
                          type="text"
                          value={config.subtitle}
                          onChange={(e) => setConfig(p => ({ ...p, subtitle: e.target.value }))}
                          placeholder="SUBTITLE"
                          className="w-full bg-[#121212] border border-white/5 rounded-xl px-5 py-4 text-[10px] font-bold tracking-[0.3em] outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Title Pt</label>
                          <span className="text-[9px] font-mono text-white/40">{config.titleSize}</span>
                        </div>
                        <input
                          type="range" min="50" max="600" step="10"
                          value={config.titleSize}
                          onChange={(e) => setConfig(p => ({ ...p, titleSize: parseInt(e.target.value) }))}
                          className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Timer Pt</label>
                          <span className="text-[9px] font-mono text-white/40">{config.timerSize}</span>
                        </div>
                        <input
                          type="range" min="50" max="400" step="10"
                          value={config.timerSize}
                          onChange={(e) => setConfig(p => ({ ...p, timerSize: parseInt(e.target.value) }))}
                          className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-500 text-center block">Spatial Alignment Grid</label>
                      <div className="flex justify-center">
                        <div className="grid grid-cols-3 gap-3 p-3 bg-black/40 rounded-3xl border border-white/5">
                          {Object.values(TimerLocation).map(loc => (
                            <button
                              key={loc}
                              onClick={() => setConfig(p => ({ ...p, timerLocation: loc }))}
                              className={`w-10 h-10 rounded-lg border-2 transition-all ${config.timerLocation === loc
                                ? 'bg-red-600 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                                : 'bg-neutral-900 border-transparent hover:border-white/20'
                                }`}
                              title={loc}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* RENDER ENGINE CONTROLS */}
              <section className="space-y-10 pt-10 border-t border-white/5">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic mb-1">PHYSICS ENGINE</h3>
                    <p className="text-[9px] text-neutral-500 font-medium uppercase tracking-widest">Real-time Modulation</p>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-600 uppercase">GPU_MASTER</span>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Primary Color</label>
                      <div className="flex items-center gap-3 bg-[#121212] p-3 rounded-xl border border-white/5 focus-within:border-white/20 transition-all">
                        <input
                          type="color"
                          value={config.color}
                          onChange={(e) => setConfig(p => ({ ...p, color: e.target.value }))}
                          className="w-full h-6 bg-transparent border-none cursor-pointer rounded-md overflow-hidden"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Accent Color</label>
                      <div className="flex items-center gap-3 bg-[#121212] p-3 rounded-xl border border-white/5 focus-within:border-white/20 transition-all">
                        <input
                          type="color"
                          value={config.colorSecondary}
                          onChange={(e) => setConfig(p => ({ ...p, colorSecondary: e.target.value }))}
                          className="w-full h-6 bg-transparent border-none cursor-pointer rounded-md overflow-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {[
                      { label: 'Gain Sensitivity', key: 'sensitivity', min: 0.5, max: 5, step: 0.1, color: 'accent-red-600', unit: '' },
                      { label: 'Resolution Density', key: 'complexity', min: 500, max: 8000, step: 100, color: 'accent-white', unit: 'pts' },
                      { label: 'Foreground Delta', key: 'speed', min: 0.1, max: 3, step: 0.1, color: 'accent-red-600', unit: 'x' },
                      { label: 'Environment Delta', key: 'backgroundSpeed', min: 0.05, max: 2, step: 0.05, color: 'accent-blue-600', unit: 'x' },
                      { label: 'Geometric Scale', key: 'scale', min: 0.2, max: 2.5, step: 0.1, color: 'accent-red-600', unit: 'x' },
                      { label: 'Orbital Velocity', key: 'rotationSpeed', min: 0, max: 5, step: 0.1, color: 'accent-white', unit: 'rad/s' },
                    ].map((ctrl) => (
                      <div key={ctrl.key} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{ctrl.label}</label>
                          <span className="text-[10px] font-mono text-white/50">{(config as any)[ctrl.key]}{ctrl.unit}</span>
                        </div>
                        <input
                          type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step}
                          value={(config as any)[ctrl.key]}
                          onChange={(e) => setConfig(p => ({ ...p, [ctrl.key]: parseFloat(e.target.value) }))}
                          className={`w-full h-1 bg-neutral-900 rounded-full appearance-none cursor-pointer ${ctrl.color} transition-all`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
