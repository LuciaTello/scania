import { Injectable, signal } from '@angular/core';
import { SlitConfig, SlitOrientation } from '../models/scanner.models';

@Injectable({ providedIn: 'root' })
export class SlitScanService {
  readonly scanProgress = signal(0);

  private sourceCanvas!: HTMLCanvasElement;
  private sourceCtx!: CanvasRenderingContext2D;
  private resultCanvas!: HTMLCanvasElement;
  private resultCtx!: CanvasRenderingContext2D;
  private videoEl!: HTMLVideoElement;
  private animFrameId = 0;
  private currentCol = 0;
  private scanning = false;

  initSource(video: HTMLVideoElement): void {
    this.videoEl = video;
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCtx = this.sourceCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  setResultCanvas(canvas: HTMLCanvasElement): void {
    this.resultCanvas = canvas;
    this.resultCtx = canvas.getContext('2d')!;
  }

  startWebcamScan(config: () => SlitConfig): void {
    const vw = this.videoEl.videoWidth;
    const vh = this.videoEl.videoHeight;
    if (!vw || !vh) return;

    this.sourceCanvas.width = vw;
    this.sourceCanvas.height = vh;

    const maxCols = 2000;
    if (config().orientation === 'vertical') {
      this.resultCanvas.width = maxCols;
      this.resultCanvas.height = vh;
    } else {
      this.resultCanvas.width = vw;
      this.resultCanvas.height = maxCols;
    }
    this.resultCtx.clearRect(0, 0, this.resultCanvas.width, this.resultCanvas.height);

    this.currentCol = 0;
    this.scanning = true;
    this.scanProgress.set(0);

    const loop = () => {
      if (!this.scanning) return;
      const cfg = config();
      this.sourceCtx.drawImage(this.videoEl, 0, 0, vw, vh);

      if (cfg.orientation === 'vertical') {
        const slitX = Math.round(cfg.position * (vw - cfg.lineWidth));
        const strip = this.sourceCtx.getImageData(slitX, 0, cfg.lineWidth, vh);
        this.resultCtx.putImageData(strip, this.currentCol, 0);
        this.currentCol += cfg.lineWidth;

        if (this.currentCol >= this.resultCanvas.width) {
          this.expandResultCanvas(cfg.orientation, cfg.lineWidth);
        }
      } else {
        const slitY = Math.round(cfg.position * (vh - cfg.lineWidth));
        const strip = this.sourceCtx.getImageData(0, slitY, vw, cfg.lineWidth);
        this.resultCtx.putImageData(strip, 0, this.currentCol);
        this.currentCol += cfg.lineWidth;

        if (this.currentCol >= this.resultCanvas.height) {
          this.expandResultCanvas(cfg.orientation, cfg.lineWidth);
        }
      }

      this.scanProgress.set(this.currentCol);
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  async startFileScan(config: SlitConfig): Promise<void> {
    const vw = this.videoEl.videoWidth;
    const vh = this.videoEl.videoHeight;
    if (!vw || !vh) return;

    this.sourceCanvas.width = vw;
    this.sourceCanvas.height = vh;
    this.currentCol = 0;
    this.scanning = true;
    this.scanProgress.set(0);

    const duration = this.videoEl.duration;
    const fps = 30;
    const totalFrames = Math.floor(duration * fps);

    if (config.orientation === 'vertical') {
      this.resultCanvas.width = totalFrames * config.lineWidth;
      this.resultCanvas.height = vh;
    } else {
      this.resultCanvas.width = vw;
      this.resultCanvas.height = totalFrames * config.lineWidth;
    }
    this.resultCtx.clearRect(0, 0, this.resultCanvas.width, this.resultCanvas.height);

    for (let i = 0; i < totalFrames; i++) {
      if (!this.scanning) break;

      this.videoEl.currentTime = i / fps;
      await new Promise<void>(resolve => {
        const handler = () => {
          this.videoEl.removeEventListener('seeked', handler);
          resolve();
        };
        this.videoEl.addEventListener('seeked', handler);
      });

      this.sourceCtx.drawImage(this.videoEl, 0, 0, vw, vh);

      if (config.orientation === 'vertical') {
        const slitX = Math.round(config.position * (vw - config.lineWidth));
        const strip = this.sourceCtx.getImageData(slitX, 0, config.lineWidth, vh);
        this.resultCtx.putImageData(strip, this.currentCol, 0);
      } else {
        const slitY = Math.round(config.position * (vh - config.lineWidth));
        const strip = this.sourceCtx.getImageData(0, slitY, vw, config.lineWidth);
        this.resultCtx.putImageData(strip, 0, this.currentCol);
      }

      this.currentCol += config.lineWidth;
      this.scanProgress.set(Math.round((i / totalFrames) * 100));
    }

    this.trimResult(config.orientation);
    this.scanning = false;
    this.scanProgress.set(100);
  }

  stop(orientation: SlitOrientation): void {
    this.scanning = false;
    cancelAnimationFrame(this.animFrameId);
    this.trimResult(orientation);
  }

  reset(): void {
    this.scanning = false;
    cancelAnimationFrame(this.animFrameId);
    this.currentCol = 0;
    this.scanProgress.set(0);
    if (this.resultCtx) {
      this.resultCtx.clearRect(0, 0, this.resultCanvas.width, this.resultCanvas.height);
    }
  }

  getResultDataURL(): string {
    return this.resultCanvas.toDataURL('image/png');
  }

  private trimResult(orientation: SlitOrientation): void {
    if (!this.resultCanvas || this.currentCol <= 0) return;

    if (orientation === 'vertical') {
      const trimmed = this.resultCtx.getImageData(0, 0, this.currentCol, this.resultCanvas.height);
      this.resultCanvas.width = this.currentCol;
      this.resultCtx.putImageData(trimmed, 0, 0);
    } else {
      const trimmed = this.resultCtx.getImageData(0, 0, this.resultCanvas.width, this.currentCol);
      this.resultCanvas.height = this.currentCol;
      this.resultCtx.putImageData(trimmed, 0, 0);
    }
  }

  private expandResultCanvas(orientation: SlitOrientation, lineWidth: number): void {
    const extra = 1000;
    if (orientation === 'vertical') {
      const imgData = this.resultCtx.getImageData(0, 0, this.resultCanvas.width, this.resultCanvas.height);
      this.resultCanvas.width += extra;
      this.resultCtx.putImageData(imgData, 0, 0);
    } else {
      const imgData = this.resultCtx.getImageData(0, 0, this.resultCanvas.width, this.resultCanvas.height);
      this.resultCanvas.height += extra;
      this.resultCtx.putImageData(imgData, 0, 0);
    }
  }
}
