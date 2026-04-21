// product-images.component.ts
import { Component, HostListener } from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { API_BASE_URL } from '../../config/api.config';

interface Toast {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-product-images',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './product-images.component.html',
  styleUrls: ['./product-images.component.css'],
})
export class ProductImagesComponent {

  uploadForm: FormGroup;
  selectedFile: File | null = null;
  previews: string[]        = [];
  uploadProgress            = 0;
  images: any[]             = [];
  filteredImages_: any[]    = [];
  searchTerm                = '';
  isEditing                 = false;
  editImageId: number | null = null;
  isDragOver                = false;
  readonly baseUrl = API_BASE_URL;
  toast: Toast = { show: false, message: '', type: 'success' };

  readonly PAGE_SIZE = 20;
  currentPage = 1;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredImages_.length / this.PAGE_SIZE));
  }

  get pagedImages(): any[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filteredImages_.slice(start, start + this.PAGE_SIZE);
  }

  pageNumbers(): number[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  goPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  private readonly API = `${API_BASE_URL}/api/productimages`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {
    this.uploadForm = this.fb.group({
      productId:   [''],
      file:        [null],
      isThumbnail: [false],
    });

    this.loadImages();
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] ?? null;
    this._generatePreview(this.selectedFile);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver   = false;
    this.selectedFile = event.dataTransfer?.files[0] ?? null;
    this._generatePreview(this.selectedFile);
  }

  private _generatePreview(file: File | null): void {
    if (!file) return;
    const reader    = new FileReader();
    reader.onload   = (e: any) => { this.previews = [e.target.result]; };
    reader.readAsDataURL(file);
  }

  saveImage(): void {
    if (!this.uploadForm.value.productId) {
      this.showToast('Vui lòng nhập Product ID!', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) { this.showToast('Bạn chưa đăng nhập!', 'error'); return; }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const formData = new FormData();
    formData.append('ProductID',   this.uploadForm.value.productId);
    formData.append('IsThumbnail', this.uploadForm.value.isThumbnail);
    if (this.selectedFile) formData.append('File', this.selectedFile);

    if (this.isEditing && this.editImageId) {
      this.http.put(`${this.API}/${this.editImageId}`, formData, { headers })
        .subscribe({
          next: () => {
            this.showToast('💾 Cập nhật hình ảnh thành công!', 'success');
            this.resetForm();
            this.loadImages();
          },
          error: err => {
            console.error('Lỗi cập nhật:', err);
            this.showToast('❌ Cập nhật thất bại!', 'error');
          },
        });
    } else {
      this.http.post(this.API, formData, {
        headers,
        reportProgress: true,
        observe: 'events',
      }).subscribe({
        next: event => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
          } else if (event.type === HttpEventType.Response) {
            this.showToast('✅ Upload hình ảnh thành công!', 'success');
            this.resetForm();
            this.loadImages();
          }
        },
        error: err => {
          console.error('Lỗi upload:', err);
          this.showToast('❌ Upload thất bại!', 'error');
        },
      });
    }
  }

  loadImages(): void {
    this.http.get<any[]>(this.API).subscribe({
      next: res => {
        this.images = [...res];
        this._applyFilter();
        this.cdr.detectChanges();
      },
      error: () => this.showToast('❌ Không tải được danh sách ảnh', 'error'),
    });
  }

  deleteImage(id: number): void {
    const img = this.images.find(i => i.imageID === id);
    if (!confirm(`Xóa hình ảnh #${id} (Sản phẩm ${img?.productID})?`)) return;

    const token   = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.delete(`${this.API}/${id}`, { headers }).subscribe({
      next: () => {
        this.images = this.images.filter(i => i.imageID !== id);
        this._applyFilter();
        this.showToast(`🗑 Đã xóa hình ảnh #${id}`, 'success');
      },
      error: () => this.showToast('❌ Xóa thất bại!', 'error'),
    });
  }

  setThumbnail(id: number): void {
    const token   = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.put(`${this.API}/set-thumbnail/${id}`, {}, { headers }).subscribe({
      next: () => {
        this.images = this.images.map(img => ({
          ...img,
          isThumbnail: img.imageID === id,
        }));
        this._applyFilter();
        this.showToast('⭐ Đặt thumbnail thành công!', 'success');
      },
      error: () => this.showToast('❌ Lỗi đặt thumbnail!', 'error'),
    });
  }

      private _resolveImageUrl(imageUrl: string): string {
      if (!imageUrl) return '';
      // Nếu đã là URL đầy đủ (http/https) thì dùng luôn
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      // Tránh double slash
      const base = this.baseUrl.replace(/\/$/, '');
      const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
      return `${base}${path}`;
    }


      editImage(img: any): void {
        this.isEditing    = true;
        this.editImageId  = img.imageID;
        this.selectedFile = null;
        this.previews     = [this._resolveImageUrl(img.imageUrl)]; // ← đổi dòng này

        this.uploadForm.patchValue({
          productId:   img.productID,
          isThumbnail: img.isThumbnail,
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

  resetForm(): void {
    this.isEditing     = false;
    this.editImageId   = null;
    this.selectedFile  = null;
    this.previews      = [];
    this.uploadProgress = 0;
    this.isDragOver    = false;
    this.uploadForm.reset({ productId: '', file: null, isThumbnail: false });
  }

  onSearch(): void { this._applyFilter(); }

  clearSearch(): void {
    this.searchTerm = '';
    this._applyFilter();
  }

  private _applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredImages_ = [...this.images];
    } else {
      this.filteredImages_ = this.images.filter(img =>
        img.productID.toString().includes(this.searchTerm.trim()),
      );
    }
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  countThumbnails(): number {
    return this.images.filter(img => img.isThumbnail).length;
  }

  countUniqueProducts(): number {
    return new Set(this.images.map(img => img.productID)).size;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isEditing) this.resetForm();
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => (this.toast.show = false), 2800);
  }
}