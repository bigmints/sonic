
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'https://esm.sh/three';
import { VisualizerConfig, ForegroundStyle, BackgroundStyle } from '../types';

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
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    const onPlay = () => setIsPlaying(true);
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
          } else if (config.foregroundStyle === ForegroundStyle.COSMIC_MANDALA) {
            const petals = 12;
            const layers = 6;
            const pointsPerLayer = count / layers;
            for (let i = 0; i < count; i++) {
              const layerIdx = Math.floor(i / pointsPerLayer);
              const angle = (i % pointsPerLayer) / pointsPerLayer * Math.PI * 2 + time * config.speed * 0.2;
              const bin = Math.floor((layerIdx / layers) * 256);
              const amp = dataArray[bin] / 255 * 100 * config.sensitivity;
              const baseR = (100 + layerIdx * 150) * config.scale;
              const petalMod = Math.sin(petals * angle + time) * (50 + amp);
              const r = baseR + petalMod + amp;
              posArr[i*3] = Math.cos(angle) * r;
              posArr[i*3+1] = Math.sin(angle) * r;
              posArr[i*3+2] = Math.sin(time * 2 + angle * petals) * (thump * 80);
            }
            fgPoints.material.size = (10 + thump * 15) * config.scale;
          } else if (config.foregroundStyle === ForegroundStyle.SONIC_BLOOM) {
            const petalCount = 5;
            const ringCount = 10;
            const pointsPerRing = count / ringCount;
            for (let i = 0; i < count; i++) {
              const ringIdx = Math.floor(i / pointsPerRing);
              const angle = (i % pointsPerRing) / pointsPerRing * Math.PI * 2;
              const bin = Math.floor((ringIdx / ringCount) * 128);
              const amp = dataArray[bin] / 255 * 150 * config.sensitivity;
              const baseR = (50 + ringIdx * 80) * config.scale;
              const wave = Math.sin(petalCount * angle + time * config.speed + ringIdx) * (20 + amp);
              const r = baseR + wave + amp;
              posArr[i*3] = Math.cos(angle) * r;
              posArr[i*3+1] = Math.sin(angle) * r;
              posArr[i*3+2] = Math.cos(time + ringIdx * 0.5) * (thump * 50);
            }
            fgPoints.material.size = (8 + thump * 12) * config.scale;
          } else if (config.foregroundStyle === ForegroundStyle.PSY_MANDALA) {
            const sym = 12;
            for (let i = 0; i < count; i++) {
              const angle = (i / count) * Math.PI * 2;
              const bin = Math.floor((i % 128) / 128 * 256);
              const amp = dataArray[bin] / 255 * 500 * config.sensitivity;
              const r = (500 * config.scale + amp) + Math.sin(time * 2 + angle * sym) * 100;
              posArr[i*3] = Math.cos(angle) * r;
              posArr[i*3+1] = Math.sin(angle) * r;
              posArr[i*3+2] = Math.cos(time * 4 + i * 0.1) * (thump * 100);
            }
          } else if (config.foregroundStyle === ForegroundStyle.FRACTAL_DNA) {
            for (let i = 0; i < count; i++) {
              const helixIdx = i % 2;
              const angle = (i * 0.08) + time * config.speed + (helixIdx * Math.PI);
              const radius = 300 * config.scale + thump * 200;
              posArr[i*3] = Math.cos(angle) * radius + Math.sin(i * 0.5) * 40;
              posArr[i*3+1] = Math.sin(angle) * radius + Math.cos(i * 0.5) * 40;
              posArr[i*3+2] = (i - count / 2) * (8 * config.scale);
            }
          } else if (config.foregroundStyle === ForegroundStyle.CYBER_SPHERE) {
            const rBase = 500 * config.scale + thump * 300;
            for (let i = 0; i < count; i++) {
              const phi = Math.acos(-1 + (2 * i) / count);
              const theta = Math.sqrt(count * Math.PI) * phi + time * config.speed * 0.2;
              const bin = Math.floor((i % 256));
              const amp = dataArray[bin] / 255 * 100 * config.sensitivity;
              const r = rBase + amp;
              posArr[i*3] = Math.sin(phi) * Math.cos(theta) * r;
              posArr[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;
              posArr[i*3+2] = Math.cos(phi) * r;
            }
          } else if (config.foregroundStyle === ForegroundStyle.ORBITAL_RINGS) {
            const ringCount = 8;
            const dotsPerRing = count / ringCount;
            for (let i = 0; i < count; i++) {
              const ringIndex = Math.floor(i / dotsPerRing);
              const angle = (i % dotsPerRing) / dotsPerRing * Math.PI * 2 + time * config.speed * (0.5 + ringIndex * 0.1);
              const bin = Math.floor(ringIndex / ringCount * 256);
              const amp = dataArray[bin] / 255 * 150 * config.sensitivity;
              const radius = (300 + ringIndex * 120 + amp) * config.scale;
              const tilt = ringIndex * (Math.PI / ringCount) + time * 0.1 * config.rotationSpeed;
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
            const speedMult = config.backgroundStyle === BackgroundStyle.STAR_FIELD ? 50 : 25;
            for (let i = 0; i < posArr.length / 3; i++) {
              posArr[i*3+2] += speedMult + (thump * 180) + (config.speed * 40);
              if (posArr[i*3+2] > 3000) {
                posArr[i*3+2] = -25000;
                posArr[i*3] = (Math.random() - 0.5) * 10000;
                posArr[i*3+1] = (Math.random() - 0.5) * 10000;
              }
            }
          } else if (config.backgroundStyle === BackgroundStyle.VORTEX_FLOW) {
            for (let i = 0; i < posArr.length / 3; i++) {
              const x = posArr[i*3];
              const y = posArr[i*3+1];
              const angle = Math.atan2(y, x);
              const dist = Math.sqrt(x*x + y*y);
              const newAngle = angle + (0.01 + thump * 0.05) * (1000 / dist);
              posArr[i*3] = Math.cos(newAngle) * dist;
              posArr[i*3+1] = Math.sin(newAngle) * dist;
              posArr[i*3+2] += (5 + thump * 100) * config.speed;
              if (posArr[i*3+2] > 10000) posArr[i*3+2] = -10000;
            }
          } else {
             bgGroup.rotation.y += 0.0007 * config.speed;
             bgGroup.rotation.x += 0.0004 * config.speed;
          }
          bgPoints.geometry.attributes.position.needsUpdate = true;
          bgPoints.material.opacity = 0.5 + thump * 0.5;
        }

        fgGroup.rotation.z += 0.003 * config.rotationSpeed;
        camera.position.z = 2000 - (thump * 500);
        camera.fov = 45 + (thump * 20);
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);

      if (hudCanvasRef.current) {
        const hCtx = hudCanvasRef.current.getContext('2d');
        if (hCtx) {
          hCtx.clearRect(0, 0, hudCanvasRef.current.width, hudCanvasRef.current.height);
          if (config.showTimer) {
            const timeStr = formatTime(audioRef.current?.currentTime || 0);
            hCtx.save();
            hCtx.font = `900 ${config.timerSize}px monospace`;
            hCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            hCtx.textAlign = 'center';
            hCtx.textBaseline = 'middle';
            if (dataArray) {
               hCtx.shadowBlur = (config.timerSize / 4) * (dataArray[0]/255);
               hCtx.shadowColor = config.color;
            }
            hCtx.fillText(timeStr, hudCanvasRef.current.width / 2, hudCanvasRef.current.height / 2);
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const toggleMute = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    if (audioRef.current) audioRef.current.muted = newVal;
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
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
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

      const recorder = new MediaRecorder(combined, { 
        mimeType: 'video/webm;codecs=vp9', 
        videoBitsPerSecond: 100000000 
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SonicVision-Export-4K.mp4`;
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
      
      {audioUrl && !isRecording && (
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
          {/* Progress Bar */}
          <div className="relative w-full h-1 group/progress mb-4">
            <input 
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-red-600 relative" 
                 style={{ width: `${(currentTime / duration) * 100}%` }}
               >
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full scale-0 group-hover/progress:scale-100 transition-transform" />
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Play/Pause */}
              <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-3 group/volume">
                <button onClick={toggleMute} className="text-white">
                  {isMuted || volume === 0 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 9v6h4l5 5V4l-5 5H7z"/></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                  )}
                </button>
                <input 
                  type="range" 
                  min={0} 
                  max={1} 
                  step={0.01} 
                  value={volume} 
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-20 transition-all h-1 bg-white/20 appearance-none accent-white cursor-pointer"
                />
              </div>

              {/* Time */}
              <div className="text-[11px] font-medium text-white/90 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-4">
                 <div className="px-2 py-0.5 rounded border border-white/20 text-[9px] font-black tracking-widest text-white/40 uppercase">4K MASTER</div>
                 <div className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase italic">SonicVision Engine</div>
              </div>
              
              {/* Fullscreen Button */}
              <button onClick={toggleFullscreen} className="text-white hover:scale-110 transition-transform">
                {isFullscreen ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default VisualizerCanvas;
