import { Component, ElementRef, ViewChild, AfterViewInit, output, input, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SlitScanService } from '../services/slit-scan.service';
import { AuthService } from '../../services/auth.service';
import { ScanState } from '../models/scanner.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-scan-result',
  templateUrl: './scan-result.html',
  styleUrl: './scan-result.css',
})
export class ScanResult implements AfterViewInit {
  @ViewChild('resultCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly state = input<ScanState>('idle');
  readonly hideActions = input(false);
  readonly canvasReady = output<HTMLCanvasElement>();
  readonly saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  constructor(
    readonly slitScan: SlitScanService,
    private http: HttpClient,
    protected auth: AuthService,
  ) {
    effect(() => {
      this.state();
      this.saveState.set('idle');
    });
  }

  ngAfterViewInit(): void {
    this.canvasReady.emit(this.canvasRef.nativeElement);
  }

  download(): void {
    const url = this.slitScan.getResultDataURL();
    const a = document.createElement('a');
    a.href = url;
    a.download = this.generateFilename();
    a.click();
  }

  save(): void {
    this.saveState.set('saving');

    const dataURL = this.slitScan.getResultDataURL();
    const blob = this.dataURLtoBlob(dataURL);

    const formData = new FormData();
    formData.append('image', blob, this.generateFilename());
    formData.append('folder', 'scania/scans');

    this.http.post(`${environment.apiUrl}/upload`, formData).subscribe({
      next: () => this.saveState.set('saved'),
      error: (err) => {
        console.error('Save failed:', err);
        this.saveState.set('error');
      },
    });
  }

  private generateFilename(): string {
    const now = new Date();
    const d = now.toISOString().slice(0, 10);
    const t = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    return `scan-${d}_${t}.png`;
  }

  private dataURLtoBlob(dataURL: string): Blob {
    const [header, data] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)![1];
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }
}
