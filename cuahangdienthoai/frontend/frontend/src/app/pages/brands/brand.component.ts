
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Brand } from './brand.model';
import { BrandService } from './brand.service';
interface Toast { show: boolean; message: string; type: 'success' | 'error'; }
@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './brand.component.html',
  styleUrls: ['./brand.component.css'],
})
export class BrandComponent implements OnInit {

  brands:    Brand[] = [];
  brandName  = '';
  editingId: number | null = null;

  toast: Toast = { show: false, message: '', type: 'success' };

  constructor(private brandService: BrandService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.brandService.getAll().subscribe({
      next: res => { this.brands = [...res]; this.cdr.detectChanges(); },
      error: () => this.showToast('❌ Không tải được danh sách nhãn hiệu', 'error'),
    });
  }

  edit(brand: Brand): void {
    this.brandName = brand.name;
    this.editingId = brand.brandID;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  save(): void {
    if (!this.brandName.trim()) { this.showToast('Vui lòng nhập tên nhãn hiệu', 'error'); return; }

    const payload = { name: this.brandName.trim(), status: true };

    if (this.editingId) {
      this.brandService.update(this.editingId, payload).subscribe({
        next: () => { this.showToast('💾 Cập nhật nhãn hiệu thành công!', 'success'); this.resetForm(); this.loadData(); },
        error: () => this.showToast('❌ Cập nhật thất bại!', 'error'),
      });
    } else {
      this.brandService.create(payload).subscribe({
        next: () => { this.showToast('➕ Thêm nhãn hiệu thành công!', 'success'); this.resetForm(); this.loadData(); },
        error: () => this.showToast('❌ Thêm mới thất bại!', 'error'),
      });
    }
  }

  delete(id: number): void {
    const b = this.brands.find(x => x.brandID === id);
    if (!confirm(`Xóa nhãn hiệu "${b?.name}"?`)) return;
    this.brandService.delete(id).subscribe({
      next:  () => { this.showToast(`🗑 Đã xóa "${b?.name}"`, 'success'); this.loadData(); },
      error: () => this.showToast('❌ Xóa thất bại!', 'error'),
    });
  }

  resetForm(): void { this.brandName = ''; this.editingId = null; }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => (this.toast.show = false), 2800);
  }
}