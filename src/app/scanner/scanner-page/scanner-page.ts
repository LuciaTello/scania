import { Component, signal, computed } from '@angular/core';
import { VideoSource } from '../video-source/video-source';
import { SlitControls } from '../slit-controls/slit-controls';
import { ScanResult } from '../scan-result/scan-result';
import { SlitScanService } from '../services/slit-scan.service';
import { ScanState, SlitConfig, SlitOrientation, ScanMode } from '../models/scanner.models';

@Component({
  selector: 'app-scanner-page',
  imports: [VideoSource, SlitControls, ScanResult],
  templateUrl: './scanner-page.html',
  styleUrl: './scanner-page.css',
})
export class ScannerPage {
  readonly orientation = signal<SlitOrientation>('horizontal');
  readonly mode = signal<ScanMode>('sweep');
  readonly position = signal(0);
  readonly lineWidth = signal(1);
  readonly speed = signal(1);
  readonly outputSize = signal(2000);
  readonly state = signal<ScanState>('idle');

  readonly slitPosition = computed(() => this.position() / 100);

  private videoEl: HTMLVideoElement | null = null;
  private isFile = false;

  constructor(readonly slitScan: SlitScanService) {}

  onVideoReady(video: HTMLVideoElement): void {
    this.videoEl = video;
    this.isFile = !video.srcObject;
    this.slitScan.initSource(video);
    this.state.set('previewing');
  }

  onCanvasReady(canvas: HTMLCanvasElement): void {
    this.slitScan.setResultCanvas(canvas);
  }

  onStart(): void {
    if (!this.videoEl) return;
    this.state.set('scanning');

    if (this.isFile) {
      const config: SlitConfig = {
        orientation: this.orientation(),
        position: this.slitPosition(),
        lineWidth: this.lineWidth(),
        mode: this.mode(),
        speed: this.speed(),
        outputSize: this.outputSize(),
      };
      this.slitScan.startFileScan(config).then(() => {
        this.state.set('complete');
      });
    } else {
      this.slitScan.startWebcamScan(() => ({
        orientation: this.orientation(),
        position: this.slitPosition(),
        lineWidth: this.lineWidth(),
        mode: this.mode(),
        speed: this.speed(),
        outputSize: this.outputSize(),
      }), () => this.state.set('complete'));
    }
  }

  onStop(): void {
    this.slitScan.stop(this.orientation());
    this.state.set('complete');
  }

  onReset(): void {
    this.slitScan.reset();
    this.state.set(this.videoEl ? 'previewing' : 'idle');
  }
}
