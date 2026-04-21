// product-detailuser.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { API_BASE_URL } from '../../config/api.config';
interface Toast { show: boolean; message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-detailuser.component.html',
  styleUrls: ['./product-detailuser.component.css'],
})
export class ProductDetailuserComponent implements OnInit {

  product:   any;
  images:    any[] = [];
  reviews:   any[] = [];
  avgRating  = 0;
  productId!: number;
  cartCount  = 0;
  stockQuantity = 0;

  allImages:   string[] = [];
  activeIdx    = 0;
  thumbOffset  = 0;

  lightboxOpen  = false;
  lightboxIndex = 0;

  quantity    = 1;
  wished      = false;
  hoverRating = 0;
  newReview   = { rating: 5, comment: '', userName: '' };
  toast: Toast = { show: false, message: '', type: 'success' };

  productConfig: any = null;
  configPopup    = false;

  private readonly API = `${API_BASE_URL}`;
  private readonly THUMB_VISIBLE = 6;

  constructor(
    private route: ActivatedRoute,
    private http:  HttpClient,
    private cdr:   ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProduct();
    this.loadReviews();
    this.loadAvgRating();
    this.loadConfig();
  }

  loadConfig(): void {
    this.http.get(`${this.API}/api/ProductConfigurations/product/${this.productId}`)
      .subscribe({
        next: (res: any) => { this.productConfig = res; this.cdr.detectChanges(); },
        error: () => { this.productConfig = null; },
      });
  }

  getConfigGroups(): { icon: string; title: string; rows: { label: string; value: string; icon: string }[] }[] {
    const cfg = this.productConfig;
    if (!cfg) return [];
    const v = (val: any) => val ?? '—';
    return [
      {
        icon: '📱', title: 'Màn hình & Thiết kế',
        rows: [
          { icon: '🖥️', label: 'Màn hình',        value: v(cfg.screen) },
          { icon: '🔄', label: 'Tần số quét',      value: v(cfg.refreshRate) },
          { icon: '🎨', label: 'Màu sắc',           value: v(cfg.color) },
          { icon: '🏗️', label: 'Thiết kế',          value: v(cfg.design) },
          { icon: '⚖️', label: 'Trọng lượng',      value: v(cfg.weight) },
          { icon: '💧', label: 'Kháng nước',        value: v(cfg.waterResistance) },
        ]
      },
      {
        icon: '🚀', title: 'Hiệu năng',
        rows: [
          { icon: '⚡', label: 'CPU / Chip',        value: v(cfg.cpu) },
          { icon: '🎮', label: 'GPU',                value: v(cfg.gpu) },
          { icon: '🧠', label: 'RAM',                value: v(cfg.ram) },
          { icon: '💾', label: 'Bộ nhớ trong',      value: v(cfg.internalStorage) },
          { icon: '📲', label: 'Hệ điều hành',      value: v(cfg.operatingSystem) },
        ]
      },
      {
        icon: '📷', title: 'Camera',
        rows: [
          { icon: '📷', label: 'Camera sau',        value: v(cfg.rearCamera) },
          { icon: '🤳', label: 'Camera trước',      value: v(cfg.frontCamera) },
        ]
      },
      {
        icon: '📡', title: 'Kết nối & Pin',
        rows: [
          { icon: '📶', label: 'Mạng',               value: v(cfg.network) },
          { icon: '📲', label: 'SIM',                 value: v(cfg.sim) },
          { icon: '🔋', label: 'Dung lượng pin',     value: v(cfg.battery) },
          { icon: '⚡', label: 'Sạc',                value: v(cfg.charging) },
          { icon: '👆', label: 'Bảo mật sinh trắc',  value: v(cfg.fingerprint) },
        ]
      },
    ];
  }

  loadProduct(): void {
    this.http.get(`${this.API}/api/products/${this.productId}`).subscribe({
      next: (res: any) => {
        this.product = res;
        this.stockQuantity = Number(res.stockQuantity ?? res.StockQuantity ?? 0);
        const embedded = res.images ?? res.productImages ?? res.imageList ?? [];
        if (embedded.length > 0) {
          this.images = embedded;
          this.buildAllImages();
          this.cdr.detectChanges();
        } else {
          this.buildAllImages();
          this.cdr.detectChanges();
          this.loadImages();
        }
      },
    });
  }

  loadImages(): void {
    this.http.get<any[]>(`${this.API}/api/ProductImages?productId=${this.productId}`)
      .subscribe({
        next: (res) => {
          this.images = Array.isArray(res) ? res : [];
          this.buildAllImages();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Không load được ảnh phụ:', err);
          this.images = [];
          this.buildAllImages();
          this.cdr.detectChanges();
        },
      });
  }

  buildAllImages(): void {
    const seen = new Set<string>();
    const arr: string[] = [];

    const add = (raw: string) => {
      if (!raw) return;
      const url = this.getUrl(raw);
      if (!seen.has(url)) { seen.add(url); arr.push(url); }
    };

    const isThumbnail = (img: any): boolean => {
      const v = img.isThumbnail ?? img.IsThumbnail ?? img.is_thumbnail ?? img.isMain ?? 0;
      return v === 1 || v === true || v === '1';
    };

    const thumbImgs = this.images.filter(i => isThumbnail(i));
    const extraImgs = this.images.filter(i => !isThumbnail(i));

    for (const img of thumbImgs) {
      add(img.imageUrl ?? img.ImageUrl ?? img.url ?? '');
    }

    if (this.product?.thumbnailUrl) add(this.product.thumbnailUrl);

    for (const img of extraImgs) {
      add(img.imageUrl ?? img.ImageUrl ?? img.url ?? '');
    }

    this.allImages   = arr;
    this.activeIdx   = 0;
    this.thumbOffset = 0;
  }

  loadReviews(): void {
    this.http.get<any>(`${this.API}/api/reviews/product/${this.productId}`).subscribe({
      next: (reviewsRes) => {
        const reviews = Array.isArray(reviewsRes) ? reviewsRes : reviewsRes?.data ?? [];
        if (!reviews.length) { this.reviews = []; return; }

        this.http.get<any>(`${this.API}/api/users`).subscribe({
          next: (usersRes) => {
            const users = Array.isArray(usersRes) ? usersRes : usersRes?.data ?? [];
            this.reviews = reviews.map((r: any) => {
              const user = users.find((u: any) =>
                u.userId === r.userID || u.userID === r.userID || u.id === r.userID
              );
              return {
                ...r,
                displayName: user?.fullName ?? user?.userName ?? user?.name ?? `Khách #${r.userID}`,
              };
            });
            this.cdr.detectChanges();
          },
        });
      },
    });
  }

  loadAvgRating(): void {
    this.http.get(`${this.API}/api/reviews/avg/${this.productId}`).subscribe({
      next: (res: any) => { this.avgRating = res.averageRating ?? 0; this.cdr.detectChanges(); },
    });
  }

  selectImg(idx: number): void {
    this.activeIdx = idx;
    if (idx < this.thumbOffset) this.thumbOffset = idx;
    if (idx >= this.thumbOffset + this.THUMB_VISIBLE)
      this.thumbOffset = idx - this.THUMB_VISIBLE + 1;
  }

  prevImg(): void {
    const n = this.allImages.length;
    this.selectImg((this.activeIdx - 1 + n) % n);
  }

  nextImg(): void {
    this.selectImg((this.activeIdx + 1) % this.allImages.length);
  }

  scrollStrip(dir: number): void {
    const max = Math.max(0, this.allImages.length - this.THUMB_VISIBLE);
    this.thumbOffset = Math.max(0, Math.min(max, this.thumbOffset + dir));
  }

  openLightbox(idx: number): void {
    this.lightboxIndex = idx;
    this.lightboxOpen  = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    document.body.style.overflow = '';
  }

  lightboxPrev(): void {
    const n = this.allImages.length;
    this.lightboxIndex = (this.lightboxIndex - 1 + n) % n;
  }

  lightboxNext(): void {
    this.lightboxIndex = (this.lightboxIndex + 1) % this.allImages.length;
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.lightboxOpen) return;
    if (e.key === 'ArrowLeft')  this.lightboxPrev();
    if (e.key === 'ArrowRight') this.lightboxNext();
    if (e.key === 'Escape')     { this.closeLightbox(); this.configPopup = false; }
  }

  changeQty(delta: number): void {
    const newQty = this.quantity + delta;
    if (newQty > this.stockQuantity) {
      this.showToast(`⚠️ Chỉ còn ${this.stockQuantity} sản phẩm trong kho!`, 'error');
      return;
    }
    if (newQty < 1) return;
    this.quantity = newQty;
  }

  onQuantityInput(): void {
    if (this.quantity > this.stockQuantity) {
      this.quantity = this.stockQuantity;
      this.showToast(`⚠️ Chỉ còn ${this.stockQuantity} sản phẩm trong kho!`, 'error');
    }
    if (this.quantity < 1) this.quantity = 1;
  }

  addToCart(): void {
    if (this.quantity > this.stockQuantity) {
      this.showToast(`⚠️ Chỉ còn ${this.stockQuantity} sản phẩm trong kho!`, 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.showToast('❌ Vui lòng đăng nhập!', 'error');
      return;
    }

    this.http.post(
      `${this.API}/api/cart/add?productId=${this.productId}&quantity=${this.quantity}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next:  () => {
        this.cartCount += this.quantity;
        this.showToast(`✅ Đã thêm ${this.quantity} sản phẩm vào giỏ hàng!`, 'success');
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Thêm giỏ hàng thất bại';
        this.showToast(`❌ ${msg}`, 'error');
      },
    });
  }

  buyNow(): void {
    if (this.quantity > this.stockQuantity) {
      this.showToast(`⚠️ Chỉ còn ${this.stockQuantity} sản phẩm trong kho!`, 'error');
      return;
    }
    this.addToCart();
    setTimeout(() => window.location.href = '/cart', 800);
  }

  toggleWish(): void {
    this.wished = !this.wished;
    this.showToast(this.wished ? '❤️ Đã thêm vào yêu thích!' : '🤍 Đã bỏ yêu thích', 'success');
  }

  submitReview(): void {
    if (!this.newReview.comment.trim()) {
      this.showToast('Vui lòng nhập nội dung đánh giá', 'error'); return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.showToast('❌ Vui lòng đăng nhập để gửi đánh giá', 'error'); return;
    }

    const payload = {
      productID: this.productId,
      rating:    this.newReview.rating,
      comment:   this.newReview.comment.trim(),
    };

    this.http.post(`${this.API}/api/reviews`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => {
        this.showToast('⭐ Gửi đánh giá thành công!', 'success');
        this.newReview = { rating: 5, comment: '', userName: '' };
        this.loadReviews();
        this.loadAvgRating();
      },
      error: (err) => {
        if (err.status === 401) {
          this.showToast('❌ Vui lòng đăng nhập để gửi đánh giá', 'error');
        } else {
          this.showToast('❌ Gửi đánh giá thất bại', 'error');
        }
      },
    });
  }

  getUrl(path: string): string {
    if (!path) return 'assets/no-image.jpg';
    return path.startsWith('http') ? path : `${this.API}${path}`;
  }

  onImgErr(e: Event): void {
    (e.target as HTMLImageElement).src = 'assets/no-image.jpg';
  }

  countByStar(star: number): number {
    return this.reviews.filter(r => r.rating === star).length;
  }

  getAvatarColor(id: number): string {
    const cols = ['#d70018','#0a5c9e','#059669','#7c3aed','#db7706','#0891b2'];
    return cols[(id ?? 0) % cols.length];
  }

  getInitials(val: string | number): string {
    if (typeof val === 'number') return 'K';
    const parts = String(val).trim().split(' ');
    return parts.length >= 2
      ? (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
      : String(val).slice(0, 2).toUpperCase();
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message: msg, type };
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 2800);
  }
}