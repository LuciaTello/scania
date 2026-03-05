import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild, input, output, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { VideoSourceType } from '../models/scanner.models';

@Component({
  selector: 'app-video-source',
  imports: [NgStyle],
  templateUrl: './video-source.html',
  styleUrl: './video-source.css',
  host: { '[class.fullscreen]': 'fullscreen()' },
})
export class VideoSource implements AfterViewInit, OnDestroy {
  readonly slitPosition = input(0.5);
  readonly slitOrientation = input<'vertical' | 'horizontal'>('vertical');
  readonly lineWidth = input(1);
  readonly sweepPosition = input(-1);
  readonly hideSourceControls = input(false);
  readonly fullscreen = input(false);
  readonly videoReady = output<HTMLVideoElement>();

  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('videoContainer') containerRef!: ElementRef<HTMLDivElement>;

  readonly sourceType = signal<VideoSourceType>('webcam');
  readonly facingMode = signal<'user' | 'environment'>('user');
  private stream: MediaStream | null = null;
  private objectUrl: string | null = null;

  private readonly videoNaturalWidth = signal(0);
  private readonly videoNaturalHeight = signal(0);
  private readonly containerSize = signal({ width: 0, height: 0 });
  private resizeObserver?: ResizeObserver;

  readonly overlayStyle = computed<Record<string, string>>(() => {
    const pos = this.sweepPosition() >= 0 ? this.sweepPosition() : this.slitPosition();
    const vw = this.videoNaturalWidth();
    const vh = this.videoNaturalHeight();
    const { width: cw, height: ch } = this.containerSize();

    let rX = 0, rY = 0, rW = cw, rH = ch;
    if (vw > 0 && vh > 0 && cw > 0 && ch > 0) {
      const va = vw / vh;
      const ca = cw / ch;
      if (va > ca) {
        rW = cw; rH = cw / va; rX = 0; rY = (ch - rH) / 2;
      } else {
        rH = ch; rW = ch * va; rY = 0; rX = (cw - rW) / 2;
      }
    }

    if (this.slitOrientation() === 'vertical') {
      return {
        left: (rX + pos * rW) + 'px',
        top: rY + 'px',
        width: this.lineWidth() + 'px',
        height: rH + 'px',
      };
    } else {
      return {
        top: (rY + pos * rH) + 'px',
        left: rX + 'px',
        width: rW + 'px',
        height: this.lineWidth() + 'px',
      };
    }
  });

  ngAfterViewInit(): void {
    const el = this.containerRef.nativeElement;
    this.resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      this.containerSize.set({ width, height });
    });
    this.resizeObserver.observe(el);
  }

  async toggleSource(type: VideoSourceType): Promise<void> {
    this.cleanup();
    this.sourceType.set(type);
    if (type === 'webcam') {
      await this.startWebcam();
    }
  }

  triggerFileSelect(): void {
    this.fileInputRef?.nativeElement.click();
  }

  async flipCamera(): Promise<void> {
    this.facingMode.set(this.facingMode() === 'user' ? 'environment' : 'user');
    if (this.sourceType() === 'webcam') {
      this.stopStream();
      await this.startWebcam();
    }
  }

  async startWebcam(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.facingMode() },
      });
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      video.onloadedmetadata = () => {
        video.play();
        this.videoNaturalWidth.set(video.videoWidth);
        this.videoNaturalHeight.set(video.videoHeight);
        this.videoReady.emit(video);
      };
    } catch (e) {
      console.error('Webcam access denied', e);
    }
  }

  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.cleanup();
    this.objectUrl = URL.createObjectURL(file);
    const video = this.videoRef.nativeElement;
    video.src = this.objectUrl;
    video.onloadedmetadata = () => {
      this.videoNaturalWidth.set(video.videoWidth);
      this.videoNaturalHeight.set(video.videoHeight);
      this.videoReady.emit(video);
    };
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.resizeObserver?.disconnect();
  }
}
