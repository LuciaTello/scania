export type VideoSourceType = 'webcam' | 'file';
export type SlitOrientation = 'vertical' | 'horizontal';
export type ScanState = 'idle' | 'previewing' | 'scanning' | 'complete';

export interface SlitConfig {
  orientation: SlitOrientation;
  position: number; // 0-1
  lineWidth: number; // 1-10
}
