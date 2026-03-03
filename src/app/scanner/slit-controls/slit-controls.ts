import { Component, input, output, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlitOrientation, ScanState } from '../models/scanner.models';

@Component({
  selector: 'app-slit-controls',
  imports: [FormsModule],
  templateUrl: './slit-controls.html',
  styleUrl: './slit-controls.css',
})
export class SlitControls {
  readonly orientation = model<SlitOrientation>('vertical');
  readonly position = model(50);
  readonly lineWidth = model(1);
  readonly state = input<ScanState>('idle');

  readonly start = output<void>();
  readonly stop = output<void>();
  readonly resetScan = output<void>();

  onStart() { this.start.emit(); }
  onStop() { this.stop.emit(); }
  onReset() { this.resetScan.emit(); }
}
