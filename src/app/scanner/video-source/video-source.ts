import { Component, ElementRef, OnDestroy, ViewChild, input, output, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { VideoSourceType } from '../models/scanner.models';

@Component({
  selector: 'app-video-source',
  imports: [NgStyle],
  templateUrl: './video-source.html',
  styleUrl: './video-source.css',
})
export class VideoSource implements OnDestroy {
  readonly slitPosition = input(0.5);
  readonly slitOrientation = input<'vertical' | 'horizontal'>('vertical');
  readonly lineWidth = input(1);
  readonly videoReady = output<HTMLVideoElement>();

  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;

  readonly sourceType = signal<VideoSourceType>('webcam');
  private stream: MediaStream | null = null;
  private objectUrl: string | null = null;

  async toggleSource(type: VideoSourceType): Promise<void> {
    this.cleanup();
    this.sourceType.set(type);
    if (type === 'webcam') {
      await this.startWebcam();
    }
  }

  async startWebcam(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
    if (this.slitOrientation() === 'vertical') {
      return {
        left: (this.slitPosition() * 100) + '%',
        top: '0',
        width: this.lineWidth() + 'px',
        height: '100%',
      };
    } else {
      return {
        top: (this.slitPosition() * 100) + '%',
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
