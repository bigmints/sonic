
import React, { useState, useRef, useEffect } from 'react';
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
    <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
      <header className="fixed top-0 w-full p-6 flex justify-between items-center z-50">
        <h1 className="text-xl font-black tracking-tighter uppercase italic">
          SonicVision <span className="text-red-600">PRO</span>
        </h1>
        {isReady && !isRecording && (
          <button 
            onClick={handleReset}
            className="px-6 py-2 bg-neutral-900/80 backdrop-blur border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:border-red-500 transition-all active:scale-95"
          >
            New Session
          </button>
        )}
      </header>

      <main className="w-full max-w-[1700px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-20">
        <div className="lg:col-span-8 aspect-video relative rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/5 group">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-10 text-center p-10">
              <h2 className="text-6xl font-black mb-8 italic uppercase tracking-tighter leading-none">High-End<br/>Audio Engine</h2>
              <div className="flex gap-4">
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

        <div className="lg:col-span-4 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-neutral-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[2rem] space-y-8">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] italic">Foreground Object</h3>
                <span className="text-[8px] font-mono text-neutral-600">FX_BANK_A</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(ForegroundStyle).map(s => (
                  <button 
                    key={s} 
                    onClick={() => setConfig(p => ({ ...p, foregroundStyle: s }))} 
                    className={`aspect-square flex flex-col items-center justify-center text-center p-1 rounded-xl text-[7px] font-black uppercase tracking-tighter border-2 transition-all active:scale-90 ${
                      config.foregroundStyle === s 
                        ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' 
                        : 'bg-neutral-800/40 border-white/5 text-neutral-500 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span className="leading-[1.1] flex flex-col items-center justify-center">
                      {s.split(/[\s-]+/).map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic">Background Scene</h3>
                <span className="text-[8px] font-mono text-neutral-600">ENV_BANK_B</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(BackgroundStyle).map(s => (
                  <button 
                    key={s} 
                    onClick={() => setConfig(p => ({ ...p, backgroundStyle: s }))} 
                    className={`aspect-square flex flex-col items-center justify-center text-center p-1 rounded-xl text-[7px] font-black uppercase tracking-tighter border-2 transition-all active:scale-90 ${
                      config.backgroundStyle === s 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]' 
                        : 'bg-neutral-800/40 border-white/5 text-neutral-500 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span className="leading-[1.1] flex flex-col items-center justify-center">
                      {s.split(' ').map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] italic">3D Modulators</h3>
              <ControlSlider label="Visual Scale" value={config.scale} min={0.1} max={5} step={0.1} onChange={v => setConfig(p => ({ ...p, scale: v }))} />
              <ControlSlider label="Transient Gain" value={config.sensitivity} min={0.5} max={8} step={0.1} onChange={v => setConfig(p => ({ ...p, sensitivity: v }))} />
              <ControlSlider label="Spin Ratio" value={config.rotationSpeed} min={0} max={5} step={0.1} onChange={v => setConfig(p => ({ ...p, rotationSpeed: v }))} />
              <ControlSlider label="Evolution Speed" value={config.speed} min={0.1} max={5} step={0.1} onChange={v => setConfig(p => ({ ...p, speed: v }))} />
              <ControlSlider label="Point Density" value={config.complexity} min={500} max={15000} step={500} onChange={v => setConfig(p => ({ ...p, complexity: v }))} />
              
              <div className="flex items-center justify-between pt-2">
                <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Master HUD Timer</label>
                <button 
                  onClick={() => setConfig(p => ({ ...p, showTimer: !p.showTimer }))}
                  className={`w-12 h-6 rounded-full relative transition-colors ${config.showTimer ? 'bg-red-600' : 'bg-neutral-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.showTimer ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              {config.showTimer && (
                <ControlSlider label="HUD Typography" value={config.timerSize} min={20} max={500} step={10} onChange={v => setConfig(p => ({ ...p, timerSize: v }))} />
              )}
            </section>

            <section>
              <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] mb-4 italic">Color Grade</h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { p: '#ff0000', s: '#0066ff' },
                  { p: '#00ffcc', s: '#3300ff' },
                  { p: '#ff9900', s: '#ff00ff' },
                  { p: '#ffffff', s: '#ff0000' },
                  { p: '#00ff00', s: '#ffff00' },
                ].map((pair, idx) => (
                  <button key={idx} onClick={() => setConfig(p => ({ ...p, color: pair.p, colorSecondary: pair.s }))} className={`w-8 h-8 rounded-full border-2 transition-all flex overflow-hidden p-0.5 ${config.color === pair.p ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                    <div className="flex-1 h-full rounded-l-full" style={{ background: pair.p }} /><div className="flex-1 h-full rounded-r-full" style={{ background: pair.s }} />
                  </button>
                ))}
              </div>
            </section>

            <div className="pt-4">
              <button disabled={!isReady || isRecording} onClick={() => setIsRecording(true)} className="w-full py-5 bg-red-600 text-white rounded-xl font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_20px_50px_rgba(255,0,0,0.2)] hover:bg-red-500 transition-all active:scale-95 disabled:opacity-20">Master 4K Video</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ControlSlider = ({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center"><label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{label}</label><span className="text-[9px] font-mono text-white">{value}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full h-[2px] bg-neutral-800 rounded-full appearance-none accent-red-600 cursor-pointer" />
  </div>
);

export default App;
