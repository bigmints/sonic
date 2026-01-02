
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'https://esm.sh/three';
import { VisualizerConfig, ForegroundStyle, BackgroundStyle, TimerLocation } from '../types';

interface Props {
  audioUrl: string | null;
  config: VisualizerConfig;
  isRecording: boolean;
  onRecordingComplete: () => void;
  onRecordingProgress: (progress: number) => void;
  isPlaying: boolean;
}

const VisualizerCanvas = forwardRef<HTMLAudioElement, Props>(({ 
  audioUrl, 
  config, 
  isRecording, 
  onRecordingComplete, 
  onRecordingProgress,
  isPlaying: isPlayingProp 
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    fgGroup: THREE.Group;
    bgGroup: THREE.Group;
    analyser: AnalyserNode | null;
    dataArray: Uint8Array;
    clock: THREE.Clock;
    fgPoints: THREE.Points | null;
    bgPoints: THREE.Points | null;
  } | null>(null);

  useImperativeHandle(ref, () => audioRef.current!);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onPlay = () => {
      setIsPlaying(true);
      setHasInteracted(true);
    };
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!audioUrl || !canvasRef.current || !hudCanvasRef.current) return;

    const width = 3840;
    const height = 2160;
    
    hudCanvasRef.current.width = width;
    hudCanvasRef.current.height = height;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 40000);
    camera.position.z = 2000;

    const clock = new THREE.Clock();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.5;

    const source = audioContext.createMediaElementSource(audioRef.current!);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const fgGroup = new THREE.Group();
    const bgGroup = new THREE.Group();
    scene.add(bgGroup);
    scene.add(fgGroup);

    threeRef.current = { 
      scene, camera, renderer, 
      fgGroup, bgGroup,
      analyser, dataArray, clock,
      fgPoints: null,
      bgPoints: null
    };

    return () => {
      renderer.dispose();
      audioContext.close();
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!threeRef.current) return;
    const { fgGroup, bgGroup, scene } = threeRef.current;
    
    while(fgGroup.children.length > 0) fgGroup.remove(fgGroup.children[0]);
    while(bgGroup.children.length > 0) bgGroup.remove(bgGroup.children[0]);

    if (config.backgroundStyle !== BackgroundStyle.SOLID) {
      const bgCount = 12000;
      const bgGeo = new THREE.BufferGeometry();
      const bgPos = new Float32Array(bgCount * 3);
      const bgCol = new Float32Array(bgCount * 3);
      const bgC = new THREE.Color(config.colorSecondary);

      for(let i=0; i<bgCount; i++) {
        if (config.backgroundStyle === BackgroundStyle.HYPER_TUNNEL || config.backgroundStyle === BackgroundStyle.STAR_FIELD) {
          bgPos[i*3] = (Math.random() - 0.5) * 8000;
          bgPos[i*3+1] = (Math.random() - 0.5) * 8000;
          bgPos[i*3+2] = Math.random() * -25000;
        } else if (config.backgroundStyle === BackgroundStyle.VORTEX_FLOW) {
          const angle = Math.random() * Math.PI * 2;
          const r = 2000 + Math.random() * 5000;
          bgPos[i*3] = Math.cos(angle) * r;
          bgPos[i*3+1] = Math.sin(angle) * r;
          bgPos[i*3+2] = (Math.random() - 0.5) * 10000;
        } else {
          bgPos[i*3] = (Math.random() - 0.5) * 20000;
          bgPos[i*3+1] = (Math.random() - 0.5) * 20000;
          bgPos[i*3+2] = (Math.random() - 0.5) * 15000;
        }
        const brightness = 0.4 + Math.random() * 0.6;
        bgCol[i*3] = bgC.r * brightness; 
        bgCol[i*3+1] = bgC.g * brightness; 
        bgCol[i*3+2] = bgC.b * brightness;
      }
      bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
      bgGeo.setAttribute('color', new THREE.BufferAttribute(bgCol, 3));
      const bgMat = new THREE.PointsMaterial({ 
        size: config.backgroundStyle === BackgroundStyle.STAR_FIELD ? 10 : 25, 
        vertexColors: true, 
        transparent: true, 
        opacity: 0.8, 
        blending: THREE.AdditiveBlending 
      });
      const bgPts = new THREE.Points(bgGeo, bgMat);
      bgGroup.add(bgPts);
      threeRef.current.bgPoints = bgPts;
    }

    if (config.foregroundStyle !== ForegroundStyle.NONE) {
      const fgCount = Math.floor(config.complexity);
      const fgGeo = new THREE.BufferGeometry();
      const fgPos = new Float32Array(fgCount * 3);
      const fgCol = new Float32Array(fgCount * 3);
      const c1 = new THREE.Color(config.color);
      const c2 = new THREE.Color(config.colorSecondary);

      for(let i=0; i<fgCount; i++) {
        const t = i / fgCount;
        
        const col = new THREE.Color();
        if (config.foregroundStyle === ForegroundStyle.SONIC_SPIRAL || 
            config.foregroundStyle === ForegroundStyle.COSMIC_MANDALA || 
            config.foregroundStyle === ForegroundStyle.SONIC_BLOOM) {
          if (t < 0.15) {
            col.setRGB(1, 0, 0); // Core Red
          } else if (t < 0.6) {
            const innerT = (t - 0.15) / 0.45;
            col.setRGB(1 - innerT * 0.5, 0, innerT * 0.8); // Purple-ish
          } else {
            const outerT = (t - 0.6) / 0.4;
            col.setRGB(0.5 - outerT * 0.5, outerT * 0.6, 1); // Blue/Cyan
          }
        } else {
          col.copy(c1).lerp(c2, t);
        }
        fgCol[i*3] = col.r; fgCol[i*3+1] = col.g; fgCol[i*3+2] = col.b;
        
        if (config.foregroundStyle === ForegroundStyle.CYBER_SPHERE) {
           const phi = Math.acos(-1 + (2 * i) / fgCount);
           const theta = Math.sqrt(fgCount * Math.PI) * phi;
           const r = 500;
           fgPos[i*3] = Math.sin(phi) * Math.cos(theta) * r;
           fgPos[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;
           fgPos[i*3+2] = Math.cos(phi) * r;
        } else if (config.foregroundStyle === ForegroundStyle.ORBITAL_RINGS) {
           const ringCount = 8;
           const dotsPerRing = fgCount / ringCount;
           const ringIndex = Math.floor(i / dotsPerRing);
           const angle = (i % dotsPerRing) / dotsPerRing * Math.PI * 2;
           const radius = 300 + ringIndex * 100;
           const tilt = ringIndex * (Math.PI / ringCount);
           fgPos[i*3] = Math.cos(angle) * radius;
           fgPos[i*3+1] = Math.sin(angle) * radius * Math.cos(tilt);
           fgPos[i*3+2] = Math.sin(angle) * radius * Math.sin(tilt);
        }
      }
      fgGeo.setAttribute('position', new THREE.BufferAttribute(fgPos, 3));
      fgGeo.setAttribute('color', new THREE.BufferAttribute(fgCol, 3));
      const fgMat = new THREE.PointsMaterial({ 
        size: 15, 
        vertexColors: true, 
        transparent: true, 
        opacity: 1, 
        blending: THREE.AdditiveBlending 
      });
      const fgPts = new THREE.Points(fgGeo, fgMat);
      fgGroup.add(fgPts);
      threeRef.current.fgPoints = fgPts;
    }

    scene.background = new THREE.Color(0x000000);
  }, [config.foregroundStyle, config.backgroundStyle, config.complexity, config.color, config.colorSecondary]);

  useEffect(() => {
    if (!threeRef.current) return;
    const { renderer, scene, camera, fgGroup, bgGroup, analyser, dataArray, clock, fgPoints, bgPoints } = threeRef.current;
    let frameId: number;

    const render = () => {
      const time = clock.getElapsedTime();
      
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        
        let bass = 0;
        for (let i = 0; i < 12; i++) bass += dataArray[i];
        bass /= (12 * 255);
        const thump = Math.pow(bass, 1.4) * config.sensitivity;

        if (fgPoints) {
          const posArr = fgPoints.geometry.attributes.position.array as Float32Array;
          const count = posArr.length / 3;

          if (config.foregroundStyle === ForegroundStyle.SONIC_SPIRAL || config.foregroundStyle === ForegroundStyle.PHYLLOTAXIS) {
            const goldenAngle = 137.508 * (Math.PI / 180);
            const dotSpread = (config.foregroundStyle === ForegroundStyle.SONIC_SPIRAL ? 8 : 12 + thump * 25) * config.scale;
            for (let i = 0; i < count; i++) {
              const angle = i * goldenAngle + time * config.speed * 0.1;
              const r = dotSpread * Math.sqrt(i);
              const bin = Math.floor((i % 256));
              const amp = dataArray[bin] / 255;
              posArr[i*3] = Math.cos(angle) * (r + amp * 60);
              posArr[i*3+1] = Math.sin(angle) * (r + amp * 60);
              posArr[i*3+2] = Math.sin(time * 3 + i * 0.04) * (thump * 150);
            }
            fgPoints.material.size = (config.foregroundStyle === ForegroundStyle.SONIC_SPIRAL ? 10 : 15 + thump * 20) * config.scale;
          } else if (config.foregroundStyle === ForegroundStyle.COSMIC_MANDALA || config.foregroundStyle === ForegroundStyle.SONIC_BLOOM) {
            const petals = 12;
            const ringCount = 8;
            for (let i = 0; i < count; i++) {
              const ringIdx = Math.floor(i / (count / ringCount));
              const angle = (i % (count / ringCount)) / (count / ringCount) * Math.PI * 2 + time * 0.2;
              const bin = Math.floor(ringIdx / ringCount * 128);
              const amp = dataArray[bin] / 255 * 100 * config.sensitivity;
              const baseR = (100 + ringIdx * 150) * config.scale;
              const wave = Math.sin(petals * angle + time * config.speed) * (50 + amp);
              const r = baseR + wave + amp;
              posArr[i*3] = Math.cos(angle) * r;
              posArr[i*3+1] = Math.sin(angle) * r;
              posArr[i*3+2] = Math.sin(time * 2 + angle * petals) * (thump * 100);
            }
          } else if (config.foregroundStyle === ForegroundStyle.PSY_MANDALA) {
            for (let i = 0; i < count; i++) {
              const angle = (i / count) * Math.PI * 2;
              const amp = dataArray[Math.floor((i % 128))] / 255 * 400 * config.sensitivity;
              const r = (500 * config.scale + amp) + Math.sin(time * 2 + angle * 12) * 100;
              posArr[i*3] = Math.cos(angle) * r;
              posArr[i*3+1] = Math.sin(angle) * r;
              posArr[i*3+2] = Math.cos(time * 4 + i * 0.1) * (thump * 100);
            }
          } else if (config.foregroundStyle === ForegroundStyle.FRACTAL_DNA) {
            for (let i = 0; i < count; i++) {
              const helixIdx = i % 2;
              const angle = (i * 0.08) + time * config.speed + (helixIdx * Math.PI);
              const radius = 300 * config.scale + thump * 200;
              posArr[i*3] = Math.cos(angle) * radius;
              posArr[i*3+1] = Math.sin(angle) * radius;
              posArr[i*3+2] = (i - count / 2) * (8 * config.scale);
            }
          } else if (config.foregroundStyle === ForegroundStyle.CYBER_SPHERE) {
            const rBase = 500 * config.scale + thump * 300;
            for (let i = 0; i < count; i++) {
              const phi = Math.acos(-1 + (2 * i) / count);
              const theta = Math.sqrt(count * Math.PI) * phi + time * config.speed * 0.2;
              const amp = dataArray[i % 256] / 255 * 100 * config.sensitivity;
              const r = rBase + amp;
              posArr[i*3] = Math.sin(phi) * Math.cos(theta) * r;
              posArr[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;
              posArr[i*3+2] = Math.cos(phi) * r;
            }
          } else if (config.foregroundStyle === ForegroundStyle.ORBITAL_RINGS) {
            const ringCount = 8;
            const dpr = count / ringCount;
            for (let i = 0; i < count; i++) {
              const ri = Math.floor(i / dpr);
              const angle = (i % dpr) / dpr * Math.PI * 2 + time * config.speed * (0.5 + ri * 0.1);
              const radius = (300 + ri * 120 + (dataArray[ri * 10] / 255 * 100)) * config.scale;
              const tilt = ri * (Math.PI / ringCount) + time * 0.1 * config.rotationSpeed;
              posArr[i*3] = Math.cos(angle) * radius;
              posArr[i*3+1] = Math.sin(angle) * radius * Math.cos(tilt);
              posArr[i*3+2] = Math.sin(angle) * radius * Math.sin(tilt);
            }
          }
          fgPoints.geometry.attributes.position.needsUpdate = true;
        }

        if (bgPoints) {
          const posArr = bgPoints.geometry.attributes.position.array as Float32Array;
          if (config.backgroundStyle === BackgroundStyle.HYPER_TUNNEL || config.backgroundStyle === BackgroundStyle.STAR_FIELD) {
            for (let i = 0; i < posArr.length / 3; i++) {
              posArr[i*3+2] += (25 + (thump * 180)) * config.backgroundSpeed;
              if (posArr[i*3+2] > 3000) {
                posArr[i*3+2] = -25000;
              }
            }
          } else {
             bgGroup.rotation.y += 0.0007 * config.backgroundSpeed;
             bgGroup.rotation.x += 0.0004 * config.backgroundSpeed;
          }
          bgPoints.geometry.attributes.position.needsUpdate = true;
          bgPoints.material.opacity = 0.5 + thump * 0.5;
        }

        fgGroup.rotation.z += 0.003 * config.rotationSpeed;
        camera.position.z = 2000 - (thump * 400);
        camera.fov = 45 + (thump * 15);
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);

      // --- ADVANCED HUD RENDERING ---
      if (hudCanvasRef.current) {
        const hCtx = hudCanvasRef.current.getContext('2d');
        if (hCtx) {
          hCtx.clearRect(0, 0, hudCanvasRef.current.width, hudCanvasRef.current.height);
          
          if (config.showTimer || config.title || config.subtitle) {
            const timeStr = formatTime(audioRef.current?.currentTime || 0);
            const w = hudCanvasRef.current.width;
            const h = hudCanvasRef.current.height;
            const bassIntensity = dataArray ? dataArray[0] / 255 : 0;
            
            // Layout Setup
            const padding = 200;
            let anchorX = w / 2;
            let anchorY = h / 2;
            let align: CanvasTextAlign = 'center';
            let baseline: CanvasTextBaseline = 'middle';

            switch(config.timerLocation) {
              case TimerLocation.TOP_LEFT: anchorX = padding; anchorY = padding; align = 'left'; baseline = 'top'; break;
              case TimerLocation.TOP_CENTER: anchorX = w / 2; anchorY = padding; align = 'center'; baseline = 'top'; break;
              case TimerLocation.TOP_RIGHT: anchorX = w - padding; anchorY = padding; align = 'right'; baseline = 'top'; break;
              case TimerLocation.CENTER_LEFT: anchorX = padding; anchorY = h / 2; align = 'left'; baseline = 'middle'; break;
              case TimerLocation.CENTER: anchorX = w / 2; anchorY = h / 2; align = 'center'; baseline = 'middle'; break;
              case TimerLocation.CENTER_RIGHT: anchorX = w - padding; anchorY = h / 2; align = 'right'; baseline = 'middle'; break;
              case TimerLocation.BOTTOM_LEFT: anchorX = padding; anchorY = h - padding; align = 'left'; baseline = 'bottom'; break;
              case TimerLocation.BOTTOM_CENTER: anchorX = w / 2; anchorY = h - padding; align = 'center'; baseline = 'bottom'; break;
              case TimerLocation.BOTTOM_RIGHT: anchorX = w - padding; anchorY = h - padding; align = 'right'; baseline = 'bottom'; break;
            }

            hCtx.save();
            
            // Collect text items
            const items = [
              { val: config.title, size: config.titleSize, font: '900 italic sans-serif' },
              { val: config.subtitle, size: config.subtitleSize, font: '400 monospace' },
              { val: config.showTimer ? timeStr : null, size: config.timerSize, font: '900 monospace' }
            ].filter(i => i.val);

            if (items.length > 0) {
              const lineSpacing = 40;
              let totalHeight = 0;
              
              items.forEach(item => {
                totalHeight += item.size + lineSpacing;
              });
              totalHeight -= lineSpacing;

              // Starting Y coordinate based on baseline
              let curY = anchorY;
              if (baseline === 'middle') curY = anchorY - totalHeight / 2;
              else if (baseline === 'bottom') curY = anchorY - totalHeight;

              hCtx.textAlign = align;
              hCtx.textBaseline = 'top';
              hCtx.shadowColor = config.color;

              items.forEach((item) => {
                // FIXED SIZE - Pulse removed as requested for the title and text
                const dynamicSize = item.size; 
                const isTitle = item.size === config.titleSize;
                
                hCtx.font = `${isTitle ? '900 italic' : '900'} ${dynamicSize}px ${item.font.includes('monospace') ? 'monospace' : 'sans-serif'}`;
                hCtx.fillStyle = 'white';
                // Subtle static shadow or no reactive animation for the title
                hCtx.shadowBlur = isTitle ? (dynamicSize / 8) : (dynamicSize / 4) * (bassIntensity * 0.5);
                
                const tx = anchorX;

                // Letter Spacing Emulation for Subtitle
                if (item.size === config.subtitleSize) {
                  hCtx.font = `${dynamicSize}px monospace`;
                  const chars = item.val!.split('');
                  const charSpacing = 15;
                  let fullTextWidth = 0;
                  chars.forEach(c => fullTextWidth += hCtx.measureText(c).width + charSpacing);
                  fullTextWidth -= charSpacing;

                  let startX = tx;
                  if (align === 'center') startX = tx - fullTextWidth/2;
                  if (align === 'right') startX = tx - fullTextWidth;

                  chars.forEach(c => {
                    hCtx.fillText(c, startX, curY);
                    startX += hCtx.measureText(c).width + charSpacing;
                  });
                } else {
                  hCtx.fillText(item.val!, tx, curY);
                }
                
                curY += item.size + lineSpacing;
              });
            }

            hCtx.restore();
          }
        }
      }

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [config, isPlaying]);

  const formatTime = (s: number) => {
    const m = Math.floor(s/60);
    const sec = Math.floor(s%60);
    return `${m.toString()}:${sec.toString().padStart(2,'0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = parseFloat(e.target.value);
    }
  };

  const togglePlay = () => {
    if (audioRef.current?.paused) {
      audioRef.current.play();
    } else {
      audioRef.current?.pause();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (isRecording && canvasRef.current && hudCanvasRef.current && audioRef.current && audioUrl) {
      const audio = audioRef.current;
      const canvas = canvasRef.current;
      const hud = hudCanvasRef.current;
      const compCanvas = document.createElement('canvas');
      compCanvas.width = canvas.width;
      compCanvas.height = canvas.height;
      const compCtx = compCanvas.getContext('2d')!;
      audio.currentTime = 0;
      audio.play();
      const stream = compCanvas.captureStream(60);
      const audioStream = (audio as any).captureStream ? (audio as any).captureStream() : null;
      const combined = new MediaStream([...stream.getTracks(), ...(audioStream ? audioStream.getAudioTracks() : [])]);
      const recorder = new MediaRecorder(combined, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 100000000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SonicVision-Master.mp4`;
        a.click();
        onRecordingComplete();
      };
      recorder.start();
      const progressLoop = () => {
        compCtx.clearRect(0,0,compCanvas.width, compCanvas.height);
        compCtx.drawImage(canvas, 0, 0);
        compCtx.drawImage(hud, 0, 0);
        onRecordingProgress(audio.currentTime / audio.duration);
        if (audio.ended) recorder.stop(); else if (isRecording) requestAnimationFrame(progressLoop);
      };
      progressLoop();
    }
  }, [isRecording, audioUrl]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain z-0" />
      <canvas ref={hudCanvasRef} className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none" />
      <audio ref={audioRef} src={audioUrl || undefined} crossOrigin="anonymous" />
      
      {audioUrl && !hasInteracted && !isRecording && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-[60]">
           <button onClick={togglePlay} className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-95 transition-all">
             <svg className="w-10 h-10 text-black ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
           </button>
        </div>
      )}

      {audioUrl && !isRecording && (
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
          <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
            <input type="range" min={0} max={duration || 0} value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className="h-full bg-red-600" style={{ width: `${(currentTime / duration) * 100}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
                {isPlaying ? <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
              </button>
              <div className="text-[13px] font-black tracking-widest tabular-nums uppercase">{formatTime(currentTime)} / {formatTime(duration)}</div>
            </div>
            <button onClick={toggleFullscreen} className="text-white hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default VisualizerCanvas;
