import { Component, ElementRef, ViewChild, AfterViewInit, output, input, effect } from '@angular/core';
import { SlitScanService } from '../services/slit-scan.service';
import { ScanState } from '../models/scanner.models';

@Component({
  selector: 'app-scan-result',
  templateUrl: './scan-result.html',
  styleUrl: './scan-result.css',
})
export class ScanResult implements AfterViewInit {
  @ViewChild('resultCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly state = input<ScanState>('idle');
  readonly canvasReady = output<HTMLCanvasElement>();

  constructor(readonly slitScan: SlitScanService) {}

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
}
