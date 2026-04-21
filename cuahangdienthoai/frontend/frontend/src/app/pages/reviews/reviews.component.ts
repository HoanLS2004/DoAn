import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewsService, Review } from './reviews.service';
import { ChangeDetectorRef } from '@angular/core';

interface Toast { show: boolean; message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-review-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './reviews-admin.component.html',
  styleUrls: ['./reviews-admin.component.css'],
})
export class ReviewAdminComponent implements OnInit {

  reviews:         Review[] = [];
  filteredReviews: Review[] = [];
  searchText   = '';
  filterRating: number | '' = '';
  editingId: number | null = null;

  toast: Toast = { show: false, message: '', type: 'success' };

  // ── Pagination ────────────────────────────────────────────
  readonly PAGE_SIZE = 20;
  currentPage = 1;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredReviews.length / this.PAGE_SIZE));
  }

  get pagedReviews(): Review[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filteredReviews.slice(start, start + this.PAGE_SIZE);
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
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
  }

  // ── Add popup ─────────────────────────────────────────────
  addPopup: {
      show: boolean; loading: boolean;
      form: { userID: number | ''; productID: number | ''; rating: number; comment: string };
    } = { show: false, loading: false, form: { userID: '', productID: '', rating: 5, comment: '' } };
  openAddPopup(): void {
      this.addPopup = { show: true, loading: false, form: { userID: '', productID: '', rating: 5, comment: '' } };
    }

  closeAddPopup(): void { this.addPopup = { ...this.addPopup, show: false, loading: false }; }

  confirmAdd(): void {
    if (!this.addPopup.form.userID) {
      this.showToast('Vui lòng nhập User ID', 'error'); return;
    }
    if (!this.addPopup.form.productID) {
      this.showToast('Vui lòng nhập Product ID', 'error'); return;
    }
    if (!this.addPopup.form.comment?.trim()) {
      this.showToast('Vui lòng nhập nội dung đánh giá', 'error'); return;
    }
    this.addPopup.loading = true;
    this.reviewService.create(this.addPopup.form).subscribe({
      next: () => {
        this.showToast('➕ Thêm đánh giá thành công!', 'success');
        this.closeAddPopup();
        this.load();
      },
      error: (err) => {
          this.addPopup.loading = false;
          this.cdr.detectChanges();
          const status = err?.status;
          const msg = (err?.error?.message || '').toString().toLowerCase();

          if (status === 404 || status === 500) {
            if (msg.includes('user')) {
              this.showToast('❌ User ID không tồn tại!', 'error');
            } else if (msg.includes('product')) {
              this.showToast('❌ Sản phẩm không tồn tại!', 'error');
            } else if (status === 400) {
              this.showToast('❌ Dữ liệu không hợp lệ!', 'error');
            } else {
              this.showToast('❌ User hoặc sản phẩm không tồn tại!', 'error');
            }
          } else {
            this.showToast('❌ Thêm thất bại! (lỗi ' + status + ')', 'error');
          }
        },
    });
  }

  // ── Delete popup ──────────────────────────────────────────
  delPopup: {
    show: boolean; id: number; userID: number; productID: number;
    rating: number; comment: string; loading: boolean;
  } = { show: false, id: 0, userID: 0, productID: 0, rating: 0, comment: '', loading: false };

  openDelPopup(r: Review): void {
    this.delPopup = { show: true, id: r.reviewID, userID: r.userID, productID: r.productID, rating: r.rating, comment: r.comment, loading: false };
  }
  closeDelPopup(): void { this.delPopup = { ...this.delPopup, show: false, loading: false }; }

  confirmDelete(): void {
    this.delPopup.loading = true;
    this.reviewService.delete(this.delPopup.id).subscribe({
      next: () => {
        this.showToast('🗑️ Đã xóa đánh giá', 'success');
        this.closeDelPopup();
        this.load();
      },
      error: () => {
        this.delPopup.loading = false;
        this.showToast('❌ Xóa thất bại!', 'error');
      },
    });
  }

  // ── Edit popup ────────────────────────────────────────────
  editPopup: {
    show: boolean; id: number; loading: boolean;
    form: { userID: number; productID: number; rating: number; comment: string };
  } = { show: false, id: 0, loading: false, form: { userID: 0, productID: 0, rating: 5, comment: '' } };

  openEditPopup(r: Review): void {
    this.editPopup = {
      show: true, id: r.reviewID, loading: false,
      form: { userID: r.userID, productID: r.productID, rating: r.rating, comment: r.comment },
    };
  }
  closeEditPopup(): void { this.editPopup = { ...this.editPopup, show: false, loading: false }; }

  confirmEdit(): void {
    if (!this.editPopup.form.comment?.trim()) {
      this.showToast('Vui lòng nhập nội dung đánh giá', 'error'); return;
    }
    this.editPopup.loading = true;
    this.reviewService.update(this.editPopup.id, this.editPopup.form).subscribe({
      next: () => {
        this.showToast('💾 Cập nhật thành công!', 'success');
        this.closeEditPopup();
        this.load();
      },
      error: () => {
        this.editPopup.loading = false;
        this.showToast('❌ Cập nhật thất bại!', 'error');
      },
    });
  }

  // ── Preview popup ─────────────────────────────────────────
  previewPopup: { show: boolean; review: Review | null } = { show: false, review: null };

  openPreviewPopup(r: Review): void {
    this.previewPopup = { show: true, review: r };
  }
  closePreviewPopup(): void { this.previewPopup = { show: false, review: null }; }

  openEditFromPreview(): void {
    const r = this.previewPopup.review;
    if (!r) return;
    this.closePreviewPopup();
    setTimeout(() => this.openEditPopup(r), 180);
  }

  constructor(private reviewService: ReviewsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  // ── LOAD ──────────────────────────────────────────────────
  load(): void {
    this.reviewService.getAll().subscribe({
      next: res => {
        this.reviews = res;
        this.applySearch();
        this.cdr.detectChanges();
      },
      error: () => this.showToast('❌ Không tải được danh sách đánh giá', 'error'),
    });
  }

  // ── SEARCH + FILTER ───────────────────────────────────────
  onSearch(): void { this.applySearch(); }

  applySearch(): void {
    const kw = this.searchText.toLowerCase().trim();

    this.filteredReviews = this.reviews.filter(r => {
      const matchText = !kw || (
        r.comment?.toLowerCase().includes(kw) ||
        String(r.userID).includes(kw)         ||
        String(r.productID).includes(kw)      ||
        String(r.reviewID).includes(kw)
      );
      const matchRating = this.filterRating === '' || r.rating === Number(this.filterRating);
      return matchText && matchRating;
    });

    this.currentPage = 1;
  }

  clearSearch(): void {
    this.searchText      = '';
    this.filterRating    = '';
    this.filteredReviews = [...this.reviews];
    this.currentPage     = 1;
  }

  // ── STAT HELPERS ──────────────────────────────────────────
  avgRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
  }

  countByRating(star: number): number { return this.reviews.filter(r => r.rating === star).length; }

  getAvatarColor(id: number): string {
    const c = ['#d70018','#0a5c9e','#059669','#7c3aed','#db7706','#0891b2'];
    return c[id % c.length];
  }

  getInitials(id: number): string { return 'U' + id; }

  // ── TOAST ─────────────────────────────────────────────────
  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message: msg, type };
    setTimeout(() => (this.toast.show = false), 2800);
  }
  getDisplayName(r: Review): string {
    return (r.userName && r.userName.trim()) ? r.userName : 'User #' + r.userID;
  }
}