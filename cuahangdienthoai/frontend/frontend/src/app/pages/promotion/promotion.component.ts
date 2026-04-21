// promotion.component.ts
import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromotionService, Promotion } from './promotion.service';

interface Toast { show: boolean; message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-promotion-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promotion.component.html',
  styleUrls: ['./promotion.component.css'],
})
export class PromotionManagementComponent implements OnInit {

  promotions: Promotion[] = [];
  isEdit = false;

  form: Promotion = this.emptyForm();

  toast: Toast = { show: false, message: '', type: 'success' };
  searchText      = '';
  filterType      = '';   // 'Percent' | 'Amount' | ''
  filterStatus    = '';   // 'true' | 'false' | ''
  filteredPromos: Promotion[] = []

  // ── Popup: thêm / sửa ────────────────────────────────────
  formPopup: { show: boolean; loading: boolean } = { show: false, loading: false };

  // ── Popup: xóa ───────────────────────────────────────────
  delPopup: { show: boolean; id: number; code: string; discountValue: number; discountType: string; loading: boolean } =
    { show: false, id: 0, code: '', discountValue: 0, discountType: 'Percent', loading: false };

  // ── Pagination ───────────────────────────────────────────
  readonly PAGE_SIZE = 20;
  currentPage = 1;
  pageNumbers(): number[] {
    const total = this.totalPages, cur = this.currentPage;
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

  constructor(
    private promoService: PromotionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.load(); }
  load(): void {
    this.promoService.getAll().subscribe({
      next: (data: Promotion[]) => {
        this.promotions     = [...data];
        this.filteredPromos = [...data];
        this.currentPage    = 1;
        this.cdr.detectChanges();
      },
      error: () => this.showToast('Không tải được danh sách khuyến mãi', 'error'),
    });
  }
  onSearch(): void {
    const key    = this.searchText.toLowerCase().trim();
    const type   = this.filterType;
    const status = this.filterStatus;

    if (!key && !type && !status) {
      this.filteredPromos = [...this.promotions];
      this.currentPage = 1;
      return;
    }

    this.filteredPromos = this.promotions.filter(p => {
      const matchText   = !key    || p.code.toLowerCase().includes(key) ||
                                    (p.description ?? '').toLowerCase().includes(key);
      const matchType   = !type   || p.discountType === type;
      const matchStatus = !status || p.isActive === (status === 'true');
      return matchText && matchType && matchStatus;
    });

    this.currentPage = 1;
  }

  clearSearch(): void {
    this.searchText  = '';
    this.onSearch();
  }
  // ── POPUP: THÊM ───────────────────────────────────────────
  openAddPopup(): void {
    this.isEdit    = false;
    this.form      = this.emptyForm();
    this.formPopup = { show: true, loading: false };
  }

  // ── POPUP: SỬA ────────────────────────────────────────────
  openEditPopup(p: Promotion): void {
    this.isEdit = true;
    this.form   = {
      ...p,
      startDate: p.startDate.slice(0, 10),
      endDate:   p.endDate.slice(0, 10),
    };
    this.formPopup = { show: true, loading: false };
  }

  closeFormPopup(): void {
    if (this.formPopup.loading) return;
    this.formPopup = { show: false, loading: false };
  }

  // ── SAVE ──────────────────────────────────────────────────
  savePromotion(): void {
    if (!this.form.code.trim()) { this.showToast('Vui lòng nhập mã khuyến mãi', 'error'); return; }
    this.formPopup.loading = true;

    if (this.isEdit && this.form.promotionID) {
      this.promoService.update(this.form.promotionID, this.form).subscribe({
        next: () => {
          this.formPopup.loading = false;
          this.showToast('💾 Cập nhật mã khuyến mãi thành công!', 'success');
          this.closeFormPopup();
          this.load();
        },
        error: () => { this.formPopup.loading = false; this.showToast('Cập nhật thất bại', 'error'); },
      });
    } else {
      this.promoService.create(this.form).subscribe({
        next: () => {
          this.formPopup.loading = false;
          this.showToast('➕ Thêm mã khuyến mãi thành công!', 'success');
          this.closeFormPopup();
          this.load();
        },
        error: () => { this.formPopup.loading = false; this.showToast('Thêm mới thất bại', 'error'); },
      });
    }
  }

  // ── POPUP: XÓA ────────────────────────────────────────────
  openDelPopup(p: Promotion): void {
    this.delPopup = {
      show: true,
      id:            p.promotionID ?? 0,
      code:          p.code,
      discountValue: p.discountValue,
      discountType:  p.discountType,
      loading:       false,
    };
  }

  closeDelPopup(): void {
    if (this.delPopup.loading) return;
    this.delPopup = { show: false, id: 0, code: '', discountValue: 0, discountType: 'Percent', loading: false };
  }

  confirmDelete(): void {
    this.delPopup.loading = true;
    this.promoService.delete(this.delPopup.id).subscribe({
      next: () => {
        this.showToast(`🗑️ Đã xóa mã "${this.delPopup.code}"`, 'success');
        this.delPopup = { show: false, id: 0, code: '', discountValue: 0, discountType: 'Percent', loading: false };
        this.load();
      },
      error: () => { this.delPopup.loading = false; this.showToast('Xóa thất bại', 'error'); },
    });
  }

  // ── STATS ─────────────────────────────────────────────────
  countByStatus(active: boolean): number { return this.promotions.filter(p => p.isActive === active).length; }
  countByType(type: string): number      { return this.promotions.filter(p => p.discountType === type).length; }

  // ── ESCAPE KEY ────────────────────────────────────────────
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.delPopup.show)       this.closeDelPopup();
    else if (this.formPopup.show) this.closeFormPopup();
  }

  // ── HELPERS ───────────────────────────────────────────────
  private emptyForm(): Promotion {
    const today = new Date().toISOString().slice(0, 10);
    return {
      promotionID:   undefined,
      code:          '',
      description:   '',
      discountType:  'Percent',
      discountValue: 0,
      minOrderValue: 0,
      startDate:     today,
      endDate:       today,
      quantity:      0,
      isActive:      true,
    };
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message: msg, type };
    setTimeout(() => (this.toast.show = false), 2800);
  }
  get pagedPromotions(): Promotion[] {
    const s = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filteredPromos.slice(s, s + this.PAGE_SIZE);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredPromos.length / this.PAGE_SIZE));
  }
}