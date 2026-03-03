import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface GalleryImage {
  url: string;
  public_id: string;
  created_at: string;
}

@Component({
  selector: 'app-gallery-page',
  templateUrl: './gallery-page.html',
  styleUrl: './gallery-page.css',
})
export class GalleryPage implements OnInit {
  readonly state = signal<'loading' | 'empty' | 'loaded'>('loading');
  readonly images = signal<GalleryImage[]>([]);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ images: GalleryImage[] }>(`${environment.apiUrl}/gallery`).subscribe({
      next: (res) => {
        this.images.set(res.images);
        this.state.set(res.images.length ? 'loaded' : 'empty');
      },
      error: () => {
        this.state.set('empty');
      },
    });
  }
}
