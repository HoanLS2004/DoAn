// product-config.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOnlyDirective } from '../../guards/adminonly.directive';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { API_BASE_URL } from '../../config/api.config';
interface Toast { show: boolean; message: string; type: 'success' | 'error'; }
interface Config {
  configurationID?: number;
  configCode:       string;
  productID:        number;
  color:            string;
  screen:           string;
  operatingSystem:  string;
  rearCamera:       string;
  frontCamera:      string;
  cpu:              string;
  gpu:              string;
  ram:              string;
  internalStorage:  string;
  sim:              string;
  network:          string;
  battery:          string;
  charging:         string;
  refreshRate:      string;
  fingerprint:      string;
  waterResistance:  string;
  weight:           string;
  design:           string;
  createdAt?:       string;
}

const EMPTY_FORM = (): Config => ({
  configCode: '', productID: 0, color: '', screen: '', operatingSystem: '',
  rearCamera: '', frontCamera: '', cpu: '', gpu: '', ram: '', internalStorage: '',
  sim: '', network: '', battery: '', charging: '', refreshRate: '',
  fingerprint: '', waterResistance: '', weight: '', design: '',
});

@Component({
  selector: 'app-product-config',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminOnlyDirective],
  templateUrl: './productconfig.component.html',
  styleUrls: ['./productconfig.component.css'],
})
export class ProductConfigComponent implements OnInit {

  private readonly API = `${API_BASE_URL}/ProductConfigurations`;

  configs:         Config[] = [];
  filteredConfigs: Config[] = [];
  searchText = '';
  isEdit     = false;
  form: Config = EMPTY_FORM();
  searchPage = 1;

  toast: Toast = { show: false, message: '', type: 'success' };

  // Popup: view detail
  viewPopup: { show: boolean; config: Config | null } = { show: false, config: null };

  // Popup: add / edit form
  formPopup: { show: boolean; loading: boolean } = { show: false, loading: false };

  // Popup: delete confirm
  delPopup: { show: boolean; id: number; configCode: string; productID: number; loading: boolean } =
    { show: false, id: 0, configCode: '', productID: 0, loading: false };

  // Pagination
  readonly PAGE_SIZE = 10;
  currentPage = 1;

  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredConfigs.length / this.PAGE_SIZE)); }
  get pagedConfigs(): Config[] {
    const s = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filteredConfigs.slice(s, s + this.PAGE_SIZE);
  }
  get uniqueProducts(): number {
    return new Set(this.configs.map(c => c.productID)).size;
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

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  // ── LOAD ─────────────────────────────────────────────
  load(): void {
    this.http.get<Config[]>(`${this.API}/api/ProductConfigurations`).subscribe({
      next: res => {
        this.configs         = res ?? [];
        this.filteredConfigs = [...this.configs];
        this.currentPage     = 1;
        this.cdr.detectChanges();
      },
      error: () => this.showToast('❌ Không tải được dữ liệu', 'error'),
    });
  }

  // ── SEARCH ───────────────────────────────────────────
  onSearch(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filteredConfigs = q
      ? this.configs.filter(c =>
          (c.configCode       ?? '').toLowerCase().includes(q) ||
          (c.cpu              ?? '').toLowerCase().includes(q) ||
          (c.ram              ?? '').toLowerCase().includes(q) ||
          (c.color            ?? '').toLowerCase().includes(q) ||
          (c.operatingSystem  ?? '').toLowerCase().includes(q) ||
          (c.screen           ?? '').toLowerCase().includes(q) ||
          String(c.productID).includes(q)
        )
      : [...this.configs];
    this.currentPage = 1;
  }
  clearSearch(): void { this.searchText = ''; this.onSearch(); }
  searchConfigs(): void {
    this.currentPage = 1;
    this.onSearch(); 
  }
  // ── POPUP: ADD ───────────────────────────────────────
  openAddPopup(): void {
    this.isEdit = false;
    this.form   = EMPTY_FORM();
    this.formPopup = { show: true, loading: false };
  }

  // ── POPUP: EDIT ──────────────────────────────────────
  openEditPopup(c: Config): void {
    this.isEdit = true;
    this.form   = { ...c };
    this.formPopup = { show: true, loading: false };
  }
  editFromView(c: Config | null): void {
    if (!c) return;
    this.closeViewPopup();
    setTimeout(() => this.openEditPopup(c), 180);
  }

  closeFormPopup(): void { this.formPopup = { show: false, loading: false }; }

  // ── POPUP: VIEW ──────────────────────────────────────
  openViewPopup(c: Config): void { this.viewPopup = { show: true, config: c }; }
  closeViewPopup(): void { this.viewPopup = { show: false, config: null }; }

  // ── POPUP: DELETE ────────────────────────────────────
  openDelPopup(c: Config): void {
    const cid = (c as any).configID ?? (c as any).configurationID ?? 0;
    this.delPopup = { show: true, id: cid, configCode: c.configCode, productID: c.productID, loading: false };
  }
  closeDelPopup(): void { if (!this.delPopup.loading) this.delPopup.show = false; }

  // ── CRUD ─────────────────────────────────────────────
  create(): void {
    if (!this.form.configCode.trim() || !this.form.productID) {
      this.showToast('Vui lòng nhập mã cấu hình và Product ID', 'error'); return;
    }
    this.formPopup.loading = true;
    this.http.post<Config>(`${this.API}/api/ProductConfigurations`, this.buildDto()).subscribe({
      next: () => {
        this.formPopup.loading = false;   // reset trước
        this.showToast('✅ Thêm cấu hình thành công!', 'success');
        this.formPopup.show = false;      // đóng ngay
        this.load();
      },
      error: () => {
        this.formPopup.loading = false;
        this.showToast('❌ Thêm thất bại — kiểm tra lại kết nối server', 'error');
      },
    });
  }

  update(): void {
    // Tìm ID từ tất cả field name phổ biến mà C# có thể serialize ra
    const id = (this.form as any).configID          // ← field thực từ API
            ?? (this.form as any).configurationID
            ?? (this.form as any).ConfigurationID
            ?? (this.form as any).id
            ?? (this.form as any).ID;

    if (!id) {
      this.showToast('❌ Không tìm được ID cấu hình để cập nhật', 'error');
      console.error('Form thiếu ID:', this.form);
      return;
    }

    this.formPopup.loading = true;
    this.http.put(`${this.API}/api/ProductConfigurations/${id}`, this.buildDto()).subscribe({
      next: () => {
        this.formPopup.loading = false;   // reset trước
        this.showToast('💾 Cập nhật thành công!', 'success');
        this.formPopup.show = false;      // đóng ngay
        this.load();
      },
      error: () => {
        this.formPopup.loading = false;
        this.showToast('❌ Cập nhật thất bại — kiểm tra lại kết nối server', 'error');
      },
    });
  }

  confirmDelete(): void {
    this.delPopup.loading = true;
    this.http.delete(`${this.API}/api/ProductConfigurations/${this.delPopup.id}`).subscribe({
      next: () => {
        this.showToast(`🗑️ Đã xóa cấu hình ${this.delPopup.configCode}`, 'success');
        this.closeDelPopup();
        this.load();
      },
      error: () => { this.delPopup.loading = false; this.showToast('❌ Xóa thất bại', 'error'); },
    });
  }

  // ── HELPERS ──────────────────────────────────────────
  private buildDto() {
    return {
      configCode:      this.form.configCode,
      productID:       Number(this.form.productID),
      color:           this.form.color,
      screen:          this.form.screen,
      operatingSystem: this.form.operatingSystem,
      rearCamera:      this.form.rearCamera,
      frontCamera:     this.form.frontCamera,
      cpu:             this.form.cpu,
      gpu:             this.form.gpu,
      ram:             this.form.ram,
      internalStorage: this.form.internalStorage,
      sim:             this.form.sim,
      network:         this.form.network,
      battery:         this.form.battery,
      charging:        this.form.charging,
      refreshRate:     this.form.refreshRate,
      fingerprint:     this.form.fingerprint,
      waterResistance: this.form.waterResistance,
      weight:          this.form.weight,
      design:          this.form.design,
    };
  }

  /** Spec fields cho popup xem chi tiết */
  getSpecFields(c: Config): { icon: string; label: string; value: string }[] {
    return [
      { icon: '🔢', label: 'Mã cấu hình',    value: c.configCode },
      { icon: '📱', label: 'Product ID',      value: String(c.productID) },
      { icon: '🎨', label: 'Màu sắc',         value: c.color },
      { icon: '🖥️', label: 'Màn hình',        value: c.screen },
      { icon: '🔄', label: 'Tần số quét',     value: c.refreshRate },
      { icon: '📷', label: 'Camera sau',       value: c.rearCamera },
      { icon: '🤳', label: 'Camera trước',     value: c.frontCamera },
      { icon: '⚡', label: 'CPU',              value: c.cpu },
      { icon: '🎮', label: 'GPU',              value: c.gpu },
      { icon: '🧠', label: 'RAM',              value: c.ram },
      { icon: '💾', label: 'Bộ nhớ trong',     value: c.internalStorage },
      { icon: '📲', label: 'Hệ điều hành',    value: c.operatingSystem },
      { icon: '📶', label: 'SIM',              value: c.sim },
      { icon: '🌐', label: 'Mạng',             value: c.network },
      { icon: '🔋', label: 'Pin',              value: c.battery },
      { icon: '⚡', label: 'Sạc',              value: c.charging },
      { icon: '👆', label: 'Vân tay / FaceID', value: c.fingerprint },
      { icon: '💧', label: 'Kháng nước',       value: c.waterResistance },
      { icon: '⚖️', label: 'Trọng lượng',     value: c.weight },
      { icon: '🏗️', label: 'Thiết kế',        value: c.design },
    ];
  }

  /** Màu hex gần đúng từ tên màu tiếng Việt */
  getColorHex(color: string): string {
    if (!color) return '#e5e7eb';
    const c = color.toLowerCase();
    if (c.includes('đen') || c.includes('black'))   return '#1f2937';
    if (c.includes('trắng') || c.includes('white')) return '#f9fafb';
    if (c.includes('xanh lá') || c.includes('green')) return '#22c55e';
    if (c.includes('xanh') || c.includes('blue'))   return '#3b82f6';
    if (c.includes('titan') || c.includes('titan')) return '#94a3b8';
    if (c.includes('vàng') || c.includes('gold'))   return '#eab308';
    if (c.includes('đỏ') || c.includes('red'))      return '#ef4444';
    if (c.includes('hồng') || c.includes('pink'))   return '#ec4899';
    if (c.includes('tím') || c.includes('purple'))  return '#a855f7';
    if (c.includes('bạc') || c.includes('silver'))  return '#cbd5e1';
    if (c.includes('xám') || c.includes('gray') || c.includes('grey')) return '#6b7280';
    return '#d70018';
  }

  // Phím Escape đóng popup
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.delPopup.show)  this.closeDelPopup();
    else if (this.formPopup.show) this.closeFormPopup();
    else if (this.viewPopup.show) this.closeViewPopup();
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message: msg, type };
    setTimeout(() => (this.toast.show = false), 2800);
  }
}