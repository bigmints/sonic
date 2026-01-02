
import React, { useState, useRef } from 'react';
import { ForegroundStyle, BackgroundStyle, VisualizerConfig, AudioState } from './types';
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
    timerSize: 150,
    rotationSpeed: 0.8,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAudioSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setState({ file, audioUrl: url, isPlaying: false });
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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
      <header className="fixed top-0 w-full p-8 flex justify-between items-center z-50">
        <h1 className="text-xl font-black tracking-tighter uppercase italic">
          SONICVISION <span className="text-red-600">PRO</span>
        </h1>
        {isReady && !isRecording && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsRecording(true)}
              className="px-6 py-2 bg-red-600 border border-red-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:bg-red-500 transition-all active:scale-95"
            >
              Export 4K Video
            </button>
            <button 
              onClick={handleReset}
              className="px-6 py-2 bg-neutral-900/80 backdrop-blur border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all active:scale-95"
            >
              New Session
            </button>
          </div>
        )}
      </header>

      <main className={`w-full max-w-[1750px] pt-24 transition-all duration-700 ${isReady ? 'grid grid-cols-1 lg:grid-cols-12 gap-10 items-start' : 'flex items-center justify-center min-h-[70vh]'}`}>
        {/* Visualizer Container */}
        <div className={`${isReady ? 'lg:col-span-8' : 'w-full max-w-5xl'} aspect-video relative rounded-3xl overflow-hidden bg-[#050505] shadow-2xl border border-white/5 group`}>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 p-10">
              <div className="p-16 flex flex-col items-center justify-center max-w-3xl w-full">
                <h2 className="text-[64px] font-black mb-12 italic uppercase tracking-tighter leading-[0.9] text-center text-white">
                  HIGH-END<br/>AUDIO ENGINE
                </h2>
                <AudioUpload onFileSelect={handleAudioSelect} />
              </div>
            </div>
          )}

          {isRecording && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-50 flex items-center justify-center p-12">
              <div className="w-full max-w-sm text-center">
                <h3 className="text-xs font-black tracking-[0.4em] mb-12 text-red-500 uppercase">Mastering 4K Export Sequence</h3>
                <div className="text-8xl font-black text-white mb-6 tracking-tighter">{Math.round(recordingProgress * 100)}<span className="text-xl text-neutral-500">%</span></div>
                <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${recordingProgress * 100}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Precision Controls */}
        {isReady && (
          <div className="lg:col-span-4 space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-2 custom-scrollbar pb-10">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[2rem] space-y-12">
              
              {/* STYLE SELECTION */}
              <div className="space-y-10">
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] italic">FOREGROUND OBJECT</h3>
                    <span className="text-[9px] font-mono text-neutral-600">OBJ_MOD_A</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.values(ForegroundStyle).map(s => (
                      <button 
                        key={s} 
                        onClick={() => setConfig(p => ({ ...p, foregroundStyle: s }))} 
                        className={`aspect-square flex flex-col items-center justify-center text-center p-2 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all active:scale-90 ${
                          config.foregroundStyle === s 
                            ? 'bg-red-600 text-white shadow-[0_0_25px_rgba(220,38,38,0.7)] scale-105 z-10' 
                            : 'bg-[#151515] text-neutral-500 border border-white/5 hover:text-white hover:border-white/20'
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
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] italic">BACKGROUND SCENE</h3>
                    <span className="text-[9px] font-mono text-neutral-600">ENV_MOD_B</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.values(BackgroundStyle).map(s => (
                      <button 
                        key={s} 
                        onClick={() => setConfig(p => ({ ...p, backgroundStyle: s }))} 
                        className={`aspect-square flex flex-col items-center justify-center text-center p-2 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all active:scale-90 ${
                          config.backgroundStyle === s 
                            ? 'bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.7)] scale-105 z-10' 
                            : 'bg-[#151515] text-neutral-500 border border-white/5 hover:text-white hover:border-white/20'
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

              {/* PHYSICS & RENDERING */}
              <section className="space-y-8 pt-6 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic">PHYSICS MATRIX</h3>
                  <span className="text-[9px] font-mono text-neutral-600">RENDER_V3</span>
                </div>
                
                <div className="space-y-6">
                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Primary Tone</label>
                      <div className="flex items-center gap-3 bg-[#151515] p-2 rounded-lg border border-white/5">
                        <input 
                          type="color" 
                          value={config.color} 
                          onChange={(e) => setConfig(p => ({ ...p, color: e.target.value }))}
                          className="w-full h-4 bg-transparent border-none cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Secondary Tone</label>
                      <div className="flex items-center gap-3 bg-[#151515] p-2 rounded-lg border border-white/5">
                        <input 
                          type="color" 
                          value={config.colorSecondary} 
                          onChange={(e) => setConfig(p => ({ ...p, colorSecondary: e.target.value }))}
                          className="w-full h-4 bg-transparent border-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Range Sliders */}
                  <div className="space-y-5">
                    {[
                      { label: 'Sensitivity', key: 'sensitivity', min: 0.5, max: 5, step: 0.1, color: 'accent-red-600', unit: '' },
                      { label: 'Complexity', key: 'complexity', min: 500, max: 8000, step: 100, color: 'accent-red-600', unit: 'pts' },
                      { label: 'Glow Depth', key: 'glowAmount', min: 0, max: 100, step: 1, color: 'accent-white', unit: '%' },
                      { label: 'Foreground Speed', key: 'speed', min: 0.1, max: 3, step: 0.1, color: 'accent-red-600', unit: 'x' },
                      { label: 'Environment Speed', key: 'backgroundSpeed', min: 0.05, max: 2, step: 0.05, color: 'accent-blue-600', unit: 'x' },
                      { label: 'Magnification', key: 'scale', min: 0.2, max: 2.5, step: 0.1, color: 'accent-blue-600', unit: 'x' },
                      { label: 'Rotation Speed', key: 'rotationSpeed', min: 0, max: 5, step: 0.1, color: 'accent-blue-400', unit: 'rad/s' },
                    ].map((ctrl) => (
                      <div key={ctrl.key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{ctrl.label}</label>
                          <span className="text-[9px] font-mono text-white">{(config as any)[ctrl.key]}{ctrl.unit}</span>
                        </div>
                        <input 
                          type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step}
                          value={(config as any)[ctrl.key]} 
                          onChange={(e) => setConfig(p => ({ ...p, [ctrl.key]: parseFloat(e.target.value) }))}
                          className={`w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer ${ctrl.color}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* HUD / OVERLAY */}
              <section className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic">HUD OVERLAY</h3>
                  <button 
                    onClick={() => setConfig(p => ({ ...p, showTimer: !p.showTimer }))}
                    className={`text-[9px] px-3 py-1 rounded border transition-all ${config.showTimer ? 'border-red-500 text-red-500' : 'border-neutral-700 text-neutral-700'}`}
                  >
                    {config.showTimer ? 'ONLINE' : 'OFFLINE'}
                  </button>
                </div>

                {config.showTimer && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Timer Scale</label>
                      <span className="text-[9px] font-mono text-white">{config.timerSize}px</span>
                    </div>
                    <input 
                      type="range" min="50" max="400" step="10" 
                      value={config.timerSize} 
                      onChange={(e) => setConfig(p => ({ ...p, timerSize: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                )}
              </section>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;