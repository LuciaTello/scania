import { Injectable, signal } from '@angular/core';
import { SlitConfig, SlitOrientation } from '../models/scanner.models';

@Injectable({ providedIn: 'root' })
export class SlitScanService {
  readonly scanProgress = signal(0);
  readonly sweepPosition = signal(-1);

  private sourceCanvas!: HTMLCanvasElement;
  private sourceCtx!: CanvasRenderingContext2D;
  private resultCanvas!: HTMLCanvasElement;
  private resultCtx!: CanvasRenderingContext2D;
  private videoEl!: HTMLVideoElement;
  private animFrameId = 0;
  private currentCol = 0;
  private scanning = false;
  private frameCount = 0;

  initSource(video: HTMLVideoElement): void {
    this.videoEl = video;
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCtx = this.sourceCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  setResultCanvas(canvas: HTMLCanvasElement): void {
    this.resultCanvas = canvas;
    this.resultCtx = canvas.getContext('2d')!;
  }

  startWebcamScan(config: () => SlitConfig, onComplete?: () => void): void {
    const vw = this.videoEl.videoWidth;
    const vh = this.videoEl.videoHeight;
    if (!vw || !vh) return;

    this.sourceCanvas.width = vw;
    this.sourceCanvas.height = vh;

    const outputSize = config().outputSize;
    if (config().orientation === 'vertical') {
      this.resultCanvas.width = outputSize;
      this.resultCanvas.height = vh;
    } else {
      this.resultCanvas.width = vw;
      this.resultCanvas.height = outputSize;
    }
    this.resultCtx.clearRect(0, 0, this.resultCanvas.width, this.resultCanvas.height);

    this.currentCol = 0;
    this.frameCount = 0;
    this.scanning = true;
    this.scanProgress.set(0);
    this.sweepPosition.set(-1);

    const loop = () => {
      if (!this.scanning) return;
      const cfg = config();

      this.frameCount++;
      const frameSkip = 11 - cfg.speed;
      if (this.frameCount % frameSkip !== 0) {
        this.animFrameId = requestAnimationFrame(loop);
        return;
      }

      this.sourceCtx.drawImage(this.videoEl, 0, 0, vw, vh);

      const isSweep = cfg.mode === 'sweep';
      const totalDim = cfg.orientation === 'vertical' ? vw : vh;
      const sweepPos = isSweep
        ? (this.currentCol % totalDim) / totalDim
        : cfg.position;

      if (isSweep) {
        this.sweepPosition.set(sweepPos);
      }

      if (cfg.orientation === 'vertical') {
        const slitX = Math.round(sweepPos * (vw - cfg.lineWidth));
        const strip = this.sourceCtx.getImageData(slitX, 0, cfg.lineWidth, vh);
        this.resultCtx.putImageData(strip, this.currentCol, 0);
        this.currentCol += cfg.lineWidth;
      } else {
        const slitY = Math.round(sweepPos * (vh - cfg.lineWidth));
        const strip = this.sourceCtx.getImageData(0, slitY, vw, cfg.lineWidth);
        this.resultCtx.putImageData(strip, 0, this.currentCol);
        this.currentCol += cfg.lineWidth;
      }

      const limit = isSweep ? Math.min(totalDim, cfg.outputSize) : cfg.outputSize;
      if (this.currentCol >= limit) {
        this.scanning = false;
        this.sweepPosition.set(-1);
        this.trimResult(cfg.orientation);
        this.scanProgress.set(100);
        onComplete?.();
        return;
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
    this.sweepPosition.set(-1);

    const duration = this.videoEl.duration;
    const fps = 30;
    const allFrames = Math.floor(duration * fps);
    const maxFrames = Math.min(allFrames, Math.floor(config.outputSize / config.lineWidth));
    const isSweep = config.mode === 'sweep';

    if (config.orientation === 'vertical') {
      this.resultCanvas.width = maxFrames * config.lineWidth;
      this.resultCanvas.height = vh;
    } else {
      this.resultCanvas.width = vw;
      this.resultCanvas.height = maxFrames * config.lineWidth;
    }
    this.resultCtx.clearRect(0, 0, this.resultCanvas.width, this.resultCanvas.height);

    let captured = 0;
    for (let i = 0; i < allFrames; i += config.speed) {
      if (!this.scanning || captured >= maxFrames) break;

      this.videoEl.currentTime = i / fps;
      await new Promise<void>(resolve => {
        const handler = () => {
          this.videoEl.removeEventListener('seeked', handler);
          resolve();
        };
        this.videoEl.addEventListener('seeked', handler);
      });

      this.sourceCtx.drawImage(this.videoEl, 0, 0, vw, vh);

      const sweepPos = isSweep ? i / allFrames : config.position;
      if (isSweep) {
        this.sweepPosition.set(sweepPos);
      }

      if (config.orientation === 'vertical') {
        const slitX = Math.round(sweepPos * (vw - config.lineWidth));
        const strip = this.sourceCtx.getImageData(slitX, 0, config.lineWidth, vh);
        this.resultCtx.putImageData(strip, this.currentCol, 0);
      } else {
        const slitY = Math.round(sweepPos * (vh - config.lineWidth));
        const strip = this.sourceCtx.getImageData(0, slitY, vw, config.lineWidth);
        this.resultCtx.putImageData(strip, 0, this.currentCol);
      }

      this.currentCol += config.lineWidth;
      captured++;
      this.scanProgress.set(Math.round((captured / maxFrames) * 100));
    }

    this.trimResult(config.orientation);
    this.scanning = false;
    this.sweepPosition.set(-1);
    this.scanProgress.set(100);
  }

  stop(orientation: SlitOrientation): void {
    this.scanning = false;
    cancelAnimationFrame(this.animFrameId);
    this.sweepPosition.set(-1);
    this.trimResult(orientation);
  }

  reset(): void {
    this.scanning = false;
    cancelAnimationFrame(this.animFrameId);
    this.currentCol = 0;
    this.frameCount = 0;
    this.scanProgress.set(0);
    this.sweepPosition.set(-1);
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
