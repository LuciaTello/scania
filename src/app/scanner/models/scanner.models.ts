export type VideoSourceType = 'webcam' | 'file';
export type SlitOrientation = 'vertical' | 'horizontal';
export type ScanState = 'idle' | 'previewing' | 'scanning' | 'complete';
export type ScanMode = 'fixed' | 'sweep';

export interface SlitConfig {
  orientation: SlitOrientation;
  position: number; // 0-1
  lineWidth: number; // 1-10
  mode: ScanMode;
}
