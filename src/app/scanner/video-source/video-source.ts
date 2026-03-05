import { Component, ElementRef, OnDestroy, ViewChild, input, output, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { VideoSourceType } from '../models/scanner.models';

@Component({
  selector: 'app-video-source',
  imports: [NgStyle],
  templateUrl: './video-source.html',
  styleUrl: './video-source.css',
  host: { '[class.fullscreen]': 'fullscreen()' },
})
export class VideoSource implements OnDestroy {
  readonly slitPosition = input(0.5);
  readonly slitOrientation = input<'vertical' | 'horizontal'>('vertical');
  readonly lineWidth = input(1);
  readonly sweepPosition = input(-1);
  readonly hideSourceControls = input(false);
  readonly fullscreen = input(false);
  readonly videoReady = output<HTMLVideoElement>();

  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly sourceType = signal<VideoSourceType>('webcam');
  readonly facingMode = signal<'user' | 'environment'>('user');
  private stream: MediaStream | null = null;
  private objectUrl: string | null = null;

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
      this.videoReady.emit(video);
    };
  }

  get overlayStyle(): Record<string, string> {
    const pos = this.sweepPosition() >= 0 ? this.sweepPosition() : this.slitPosition();
    if (this.slitOrientation() === 'vertical') {
      return {
        left: (pos * 100) + '%',
        top: '0',
        width: this.lineWidth() + 'px',
        height: '100%',
      };
    } else {
      return {
        top: (pos * 100) + '%',
        left: '0',
        width: '100%',
        height: this.lineWidth() + 'px',
      };
    }
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
  }
}
