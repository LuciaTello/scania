import { Component, ElementRef, ViewChild, AfterViewInit, output, input, signal } from '@angular/core';
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
  readonly canvasReady = output<HTMLCanvasElement>();
  readonly saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  constructor(
    readonly slitScan: SlitScanService,
    private http: HttpClient,
    protected auth: AuthService,
  ) {}

  ngAfterViewInit(): void {
    this.canvasReady.emit(this.canvasRef.nativeElement);
  }

  download(): void {
    const url = this.slitScan.getResultDataURL();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slit-scan.png';
    a.click();
  }

  save(): void {
    this.saveState.set('saving');
    this.canvasRef.nativeElement.toBlob((blob) => {
      if (!blob) {
        this.saveState.set('error');
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'slit-scan.png');
      formData.append('folder', 'scania/scans');

      this.http.post(`${environment.apiUrl}/upload`, formData).subscribe({
        next: () => this.saveState.set('saved'),
        error: () => this.saveState.set('error'),
      });
    }, 'image/png');
  }
}
