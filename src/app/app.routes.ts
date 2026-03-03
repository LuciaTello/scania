import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'scanner', loadChildren: () => import('./scanner/scanner.routes').then(m => m.scannerRoutes) },
  { path: 'gallery', loadChildren: () => import('./gallery/gallery.routes').then(m => m.galleryRoutes), canActivate: [authGuard] },
  { path: '', redirectTo: 'scanner', pathMatch: 'full' },
];
