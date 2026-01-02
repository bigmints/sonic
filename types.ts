
export enum ForegroundStyle {
  PHYLLOTAXIS = 'Phyllotaxis Spiral',
  PSY_MANDALA = 'Psy-Mandala',
  FRACTAL_DNA = 'Fractal DNA',
  CYBER_SPHERE = 'Cyber Sphere',
  ORBITAL_RINGS = 'Orbital Rings',
  SONIC_SPIRAL = 'Sonic Spiral',
  COSMIC_MANDALA = 'Cosmic Mandala',
  SONIC_BLOOM = 'Sonic Bloom',
  NONE = 'None'
}

export enum BackgroundStyle {
  HYPER_TUNNEL = 'Hyper Tunnel',
  PARTICLE_FIELD = 'Particle Field',
  NEBULA_CLOUD = 'Nebula Cloud',
  STAR_FIELD = 'Star Field',
  VORTEX_FLOW = 'Vortex Flow',
  SOLID = 'Solid'
}

export interface VisualizerConfig {
  foregroundStyle: ForegroundStyle;
  backgroundStyle: BackgroundStyle;
  color: string;
  colorSecondary: string;
  sensitivity: number;
  glowAmount: number;
  speed: number;
  backgroundSpeed: number;
  scale: number;
  complexity: number;
  showTimer: boolean;
  timerSize: number;
  rotationSpeed: number;
}

export interface AudioState {
  file: File | null;
  audioUrl: string | null;
  isPlaying: boolean;
}