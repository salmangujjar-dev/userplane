// Type declarations for Video.js quality selector plugins

declare module 'videojs-contrib-quality-levels' {
  const plugin: (options?: unknown) => void;
  export default plugin;
}

declare module 'videojs-hls-quality-selector' {
  const plugin: (options?: unknown) => void;
  export default plugin;
}

interface QualityLevel {
  id: string;
  width: number;
  height: number;
  bitrate: number;
  enabled: boolean;
}

interface QualityLevelList {
  length: number;
  selectedIndex: number;
  [index: number]: QualityLevel;
  addQualityLevel(qualityLevel: QualityLevel): QualityLevel;
  removeQualityLevel(qualityLevel: QualityLevel): QualityLevel | null;
  getQualityLevelById(id: string): QualityLevel | null;
  on(event: string, listener: () => void): void;
  off(event: string, listener: () => void): void;
  trigger(event: string): void;
}
