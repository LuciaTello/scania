import { Component, signal, computed, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { VideoSource } from '../video-source/video-source';
import { SlitControls } from '../slit-controls/slit-controls';
import { ScanResult } from '../scan-result/scan-result';
import { SlitScanService } from '../services/slit-scan.service';
import { AuthService } from '../../services/auth.service';
import { ScanState, SlitConfig, SlitOrientation } from '../models/scanner.models';

@Component({
  selector: 'app-scanner-page',
  imports: [VideoSource, SlitControls, ScanResult],
  templateUrl: './scanner-page.html',
  styleUrl: './scanner-page.css',
})
export class ScannerPage implements OnInit, OnDestroy {
  readonly orientation = signal<SlitOrientation>('horizontal');
  readonly position = signal(0);
  readonly lineWidth = signal(1);
  readonly speed = signal(1);
  readonly outputSize = signal(2000);
  readonly state = signal<ScanState>('idle');

  readonly slitPosition = computed(() => this.position() / 100);

  readonly isMobile = signal(false);
  readonly settingsOpen = signal(false);

  @ViewChild(ScanResult) scanResultRef!: ScanResult;
  @ViewChild(VideoSource) videoSourceRef!: VideoSource;

  private videoEl: HTMLVideoElement | null = null;
  private isFile = false;
  private mediaQuery!: MediaQueryList;
  private mediaHandler = (e: MediaQueryListEvent) => this.isMobile.set(e.matches);

  constructor(
    readonly slitScan: SlitScanService,
    protected auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.mediaQuery = window.matchMedia('(max-width: 768px)');
    this.isMobile.set(this.mediaQuery.matches);
    this.mediaQuery.addEventListener('change', this.mediaHandler);
  }

  ngOnDestroy(): void {
    this.mediaQuery.removeEventListener('change', this.mediaHandler);
  }

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

  onShutterPress(): void {
    switch (this.state()) {
      case 'previewing':
        this.onStart();
        break;
      case 'scanning':
        this.onStop();
        break;
      case 'complete':
        this.onReset();
        break;
    }
  }

  toggleSettings(): void {
    this.settingsOpen.set(!this.settingsOpen());
  }

  onMobileDownload(): void {
    this.scanResultRef?.download();
  }

  onMobileSave(): void {
    this.scanResultRef?.save();
  }

  onDrawerWebcam(): void {
    this.videoSourceRef?.toggleSource('webcam');
  }

  onDrawerUpload(): void {
    this.videoSourceRef?.triggerFileSelect();
  }

  onDrawerFlip(): void {
    this.videoSourceRef?.flipCamera();
  }
}
