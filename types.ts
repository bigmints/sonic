
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

export enum TimerLocation {
  TOP_LEFT = 'Top Left',
  TOP_CENTER = 'Top Center',
  TOP_RIGHT = 'Top Right',
  CENTER_LEFT = 'Center Left',
  CENTER = 'Center',
  CENTER_RIGHT = 'Center Right',
  BOTTOM_LEFT = 'Bottom Left',
  BOTTOM_CENTER = 'Bottom Center',
  BOTTOM_RIGHT = 'Bottom Right'
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
  timerLocation: TimerLocation;
  rotationSpeed: number;
  title: string;
  subtitle: string;
  titleSize: number;
  subtitleSize: number;
}

export interface AudioState {
  file: File | null;
  audioUrl: string | null;
  isPlaying: boolean;
}