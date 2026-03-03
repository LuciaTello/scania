import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'scanner', loadChildren: () => import('./scanner/scanner.routes').then(m => m.scannerRoutes) },
  { path: '', redirectTo: 'scanner', pathMatch: 'full' },
];
