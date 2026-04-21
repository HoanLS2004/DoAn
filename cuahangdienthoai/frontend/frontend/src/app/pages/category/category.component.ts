// category.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOnlyDirective } from '../../guards/adminonly.directive';
import { CategoryService, Category } from './category.service';
import { ChangeDetectorRef } from '@angular/core';

interface Toast { show: boolean; message: string; type: 'success' | 'error'; }

const EMPTY_FORM = (): Category => ({ categoryID: '', name: '', description: '' });

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminOnlyDirective],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
})
export class CategoryComponent implements OnInit {

  categories:         Category[] = [];
  filteredCategories: Category[] = [];
  searchText = '';
  isEdit     = false;
  form: Category = EMPTY_FORM();

  toast: Toast = { show: false, message: '', type: 'success' };

  // Popup: view
  viewPopup: { show: boolean; cat: Category | null } = { show: false, cat: null };

  // Popup: add / edit
  formPopup: { show: boolean; loading: boolean } = { show: false, loading: false };

  // Popup: delete
  delPopup: { show: boolean; id: string; name: string; loading: boolean } =
    { show: false, id: '', name: '', loading: false };

  // Pagination — 20 item/trang
  readonly PAGE_SIZE = 20;
  currentPage = 1;

  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredCategories.length / this.PAGE_SIZE)); }
  get pagedCategories(): Category[] {
    const s = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filteredCategories.slice(s, s + this.PAGE_SIZE);
  }

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
  goPage(p: number): void { if (p >= 1 && p <= this.totalPages) this.currentPage = p; }

  constructor(private categoryService: CategoryService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  // ── LOAD ─────────────────────────────────────────────
  load(): void {
    this.categoryService.getAll().subscribe({
      next: (res: any) => {
        const arr = Array.isArray(res) ? res
                  : Array.isArray(res?.data) ? res.data
                  : Array.isArray(res?.value) ? res.value
                  : [];
        this.categories         = arr;
        this.filteredCategories = [...arr];
        this.currentPage        = 1;
        this.cdr.detectChanges();
      },
      error: () => this.showToast('❌ Không tải được danh sách danh mục', 'error'),
    });
  }

  // ── SEARCH ───────────────────────────────────────────
  onSearch(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filteredCategories = q
      ? this.categories.filter(c =>
          (c.name         ?? '').toLowerCase().includes(q) ||
          (c.categoryID   ?? '').toLowerCase().includes(q) ||
          (c.description  ?? '').toLowerCase().includes(q))
      : [...this.categories];
    this.currentPage = 1;
  }
  clearSearch(): void { this.searchText = ''; this.onSearch(); }

  // ── POPUP: VIEW ───────────────────────────────────────
  openViewPopup(c: Category): void { this.viewPopup = { show: true, cat: c }; }
  closeViewPopup(): void { this.viewPopup = { show: false, cat: null }; }

  editFromView(c: Category | null): void {
    if (!c) return;
    this.closeViewPopup();
    setTimeout(() => this.openEditPopup(c), 180);
  }

  // ── POPUP: ADD ────────────────────────────────────────
  openAddPopup(): void {
    this.isEdit    = false;
    this.form      = EMPTY_FORM();
    this.formPopup = { show: true, loading: false };
  }

  // ── POPUP: EDIT ───────────────────────────────────────
  openEditPopup(c: Category): void {
    this.isEdit    = true;
    this.form      = { ...c };
    this.formPopup = { show: true, loading: false };
  }

  closeFormPopup(): void {
    if (this.formPopup.loading) return;
    this.formPopup = { show: false, loading: false };
  }

  // ── POPUP: DELETE ─────────────────────────────────────
  openDelPopup(c: Category): void {
    this.delPopup = { show: true, id: c.categoryID, name: c.name, loading: false };
  }
  closeDelPopup(): void { if (!this.delPopup.loading) this.delPopup.show = false; }

  // ── CRUD ─────────────────────────────────────────────
  create(): void {
    if (!this.form.categoryID.trim() || !this.form.name.trim()) {
      this.showToast('Vui lòng nhập đầy đủ ID và tên danh mục', 'error'); return;
    }
    this.formPopup.loading = true;
    this.categoryService.create(this.form).subscribe({
      next: () => {
        this.formPopup.loading = false;
        this.formPopup.show    = false;
        this.showToast('✅ Thêm danh mục thành công!', 'success');
        this.load();
      },
      error: () => {
        this.formPopup.loading = false;
        this.showToast('❌ Thêm thất bại — kiểm tra lại kết nối', 'error');
      },
    });
  }

  update(): void {
    this.formPopup.loading = true;
    this.categoryService.update(this.form.categoryID, this.form).subscribe({
      next: () => {
        this.formPopup.loading = false;
        this.formPopup.show    = false;
        this.showToast('💾 Cập nhật thành công!', 'success');
        this.load();
      },
      error: () => {
        this.formPopup.loading = false;
        this.showToast('❌ Cập nhật thất bại — kiểm tra lại kết nối', 'error');
      },
    });
  }

  confirmDelete(): void {
    this.delPopup.loading = true;
    this.categoryService.delete(this.delPopup.id).subscribe({
      next: () => {
        this.showToast(`🗑️ Đã xóa danh mục "${this.delPopup.name}"`, 'success');
        this.delPopup.show = false;
        this.load();
      },
      error: () => {
        this.delPopup.loading = false;
        this.showToast('❌ Xóa thất bại', 'error');
      },
    });
  }

  // ── STAT ─────────────────────────────────────────────
  countWithDesc(): number {
    return this.categories.filter(c => c.description?.trim()).length;
  }

  // Escape đóng popup
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.delPopup.show)       this.closeDelPopup();
    else if (this.formPopup.show) this.closeFormPopup();
    else if (this.viewPopup.show) this.closeViewPopup();
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message: msg, type };
    setTimeout(() => (this.toast.show = false), 2800);
  }
}