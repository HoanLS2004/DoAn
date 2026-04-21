  // payment.component.ts
  import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { PaymentService } from './payment.service';

  interface Toast { show: boolean; message: string; type: 'success' | 'error'; }

  @Component({
    selector: 'app-payment',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './payment.component.html',
    styleUrls: ['./payment.component.css'],
  })
  export class PaymentComponent implements OnInit {

    payments:         any[] = [];
    filteredPayments: any[] = [];

    form: any = {
      paymentID:     0,
      orderID:       '',
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      amount:        0,
      paidAt:        null,
    };

    isEdit = false;

    searchOrder  = '';
    searchMethod = '';
    searchStatus = '';
    sortField: 'paymentID' | 'orderID' | 'amount' | 'paymentStatus' | 'paidAt' = 'paidAt';
    sortDir:   'asc' | 'desc' = 'desc';
    toast: Toast = { show: false, message: '', type: 'success' };

    // ── Popup: thêm / sửa ────────────────────────────────────
    formPopup: { show: boolean; loading: boolean } = { show: false, loading: false };

    // ── Popup: xóa ───────────────────────────────────────────
    delPopup: { show: boolean; id: number; amount: number; loading: boolean } =
      { show: false, id: 0, amount: 0, loading: false };

    // ── Pagination ───────────────────────────────────────────
    readonly PAGE_SIZE = 20;
    currentPage = 1;

    get totalPages(): number {
      return Math.max(1, Math.ceil(this.filteredPayments.length / this.PAGE_SIZE));
    }

    get pagedPayments(): any[] {
      const s = (this.currentPage - 1) * this.PAGE_SIZE;
      return this.filteredPayments.slice(s, s + this.PAGE_SIZE);
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
    sort(field: 'paymentID' | 'orderID' | 'amount' | 'paymentStatus' | 'paidAt'): void {
        if (this.sortField === field) {
          this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortField = field;
          this.sortDir   = field === 'paymentStatus' ? 'asc' : 'desc';
        }
        this.applySort();
    }
    
    private applySort(): void {
      const dir = this.sortDir === 'asc' ? 1 : -1;
    
      // Thứ tự ưu tiên trạng thái: Completed → Pending → Failed
      const statusOrder: Record<string, number> = {
        Completed: 0, Pending: 1, Failed: 2,
      };
    
      this.filteredPayments = [...this.filteredPayments].sort((a, b) => {
        switch (this.sortField) {
          case 'paymentStatus': {
            const oa = statusOrder[a.paymentStatus] ?? 99;
            const ob = statusOrder[b.paymentStatus] ?? 99;
            return (oa - ob) * dir;
          }
          case 'paymentID':
              return (Number(a.paymentID) - Number(b.paymentID)) * dir;
          case 'amount':
            return (Number(a.amount) - Number(b.amount)) * dir;
          case 'orderID':
            return (Number(a.orderID) - Number(b.orderID)) * dir;
          case 'paidAt': {
            const ta = a.paidAt ? new Date(a.paidAt).getTime() : 0;
            const tb = b.paidAt ? new Date(b.paidAt).getTime() : 0;
            return (ta - tb) * dir;
          }
          default: return 0;
        }
      });
      this.currentPage = 1;
    }
    goPage(p: number): void {
      if (p >= 1 && p <= this.totalPages) this.currentPage = p;
    }

    constructor(private service: PaymentService, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void { this.load(); }

    // ── LOAD + NORMALIZE ─────────────────────────────────────
    load(): void {
      this.service.getAll().subscribe({
        next: (res: any[]) => {
          this.payments         = res.map(p => this.normalize(p));
          this.filteredPayments = [...this.payments];
          this.currentPage      = 1;
          this.applySort();
          this.cdr.detectChanges();
        },
        error: () => this.showToast('Không tải được dữ liệu', 'error'),
      });
    }

    private normalize(p: any): any {
      return {
        ...p,
        paymentStatus: this.normalizeStatus(p.paymentStatus),
        paymentMethod: this.normalizeMethod(p.paymentMethod),
      };
    }

    private normalizeStatus(raw: string): string {
      if (!raw) return 'Pending';
      const s = raw.trim().toLowerCase();
      if (s === 'completed' || s === 'success') return 'Completed';
      if (s === 'pending'   || s === 'processing') return 'Pending';
      if (s === 'failed'    || s === 'cancelled' || s === 'canceled') return 'Failed';
      return raw.trim();
    }

    private normalizeMethod(raw: string): string {
      if (!raw) return 'COD';
      const s = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
      if (s === 'cod')        return 'COD';
      if (s === 'momo')       return 'Momo';
      if (s === 'creditcard') return 'CreditCard';
      if (s === 'transfer')   return 'Transfer';
      return raw.trim();
    }

    // ── SEARCH ───────────────────────────────────────────────
    search(): void {
      const order  = this.searchOrder.trim();
      const method = this.searchMethod;
      const status = this.searchStatus;
      this.filteredPayments = this.payments.filter(p =>
        (!order  || p.orderID.toString().includes(order)) &&
        (!method || p.paymentMethod === method) &&
        (!status || p.paymentStatus === status)
      );
      this.applySort();
      this.currentPage = 1;
    }

    resetSearch(): void {
      this.searchOrder  = '';
      this.searchMethod = '';
      this.searchStatus = '';
      this.filteredPayments = [...this.payments];
      this.currentPage = 1;
    }

    // ── POPUP: THÊM ──────────────────────────────────────────
    openAddPopup(): void {
      this.isEdit = false;
      this.form   = { paymentID: 0, orderID: '', paymentMethod: 'COD', paymentStatus: 'Pending', amount: 0, paidAt: null };
      this.formPopup = { show: true, loading: false };
    }

    // ── POPUP: SỬA ───────────────────────────────────────────
    openEditPopup(p: any): void {
      this.isEdit = true;
      this.form   = {
        paymentID:     p.paymentID,
        orderID:       p.orderID,
        paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentStatus,
        amount:        p.amount,
        paidAt:        p.paidAt ? this.toDatetimeLocal(p.paidAt) : null,
      };
      this.formPopup = { show: true, loading: false };
    }

    closeFormPopup(): void {
      if (this.formPopup.loading) return;
      this.formPopup = { show: false, loading: false };
    }

    // ── CREATE ───────────────────────────────────────────────
    create(): void {
      if (!this.form.orderID) { this.showToast('Vui lòng nhập Order ID', 'error'); return; }
      this.formPopup.loading = true;
      this.service.create(this.form).subscribe({
        next: () => {
          this.formPopup.loading = false;
          this.showToast('✅ Thêm giao dịch thành công!', 'success');
          this.closeFormPopup();
          this.load();
        },
        error: () => { this.formPopup.loading = false; this.showToast('Thêm giao dịch thất bại', 'error'); },
      });
    }

    // ── UPDATE ───────────────────────────────────────────────
    update(): void {
      this.formPopup.loading = true;
      this.service.update(this.form.paymentID, this.form).subscribe({
        next: () => {
          this.formPopup.loading = false;
          this.showToast('💾 Cập nhật thành công!', 'success');
          this.closeFormPopup();
          this.load();
        },
        error: () => { this.formPopup.loading = false; this.showToast('Cập nhật thất bại', 'error'); },
      });
    }

    // ── POPUP: XÓA ───────────────────────────────────────────
    openDelPopup(p: any): void {
      this.delPopup = { show: true, id: p.paymentID, amount: p.amount, loading: false };
    }

    closeDelPopup(): void {
      if (this.delPopup.loading) return;
      this.delPopup = { show: false, id: 0, amount: 0, loading: false };
    }

    confirmDelete(): void {
      this.delPopup.loading = true;
      this.service.delete(this.delPopup.id).subscribe({
        next: () => {
          this.showToast(`🗑️ Đã xóa giao dịch #${this.delPopup.id}`, 'success');
          this.delPopup = { show: false, id: 0, amount: 0, loading: false };
          this.load();
        },
        error: () => { this.delPopup.loading = false; this.showToast('Xóa thất bại', 'error'); },
      });
    }

    // ── STATS ────────────────────────────────────────────────
    getCountByStatus(status: string): number {
      return this.payments.filter(p => p.paymentStatus === status).length;
    }

    getTotalAmount(): number {
      return this.payments
        .filter(p => p.paymentStatus === 'Completed')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }

    // ── ESCAPE KEY ───────────────────────────────────────────
    @HostListener('document:keydown.escape')
    onEscape(): void {
      if (this.delPopup.show)   this.closeDelPopup();
      else if (this.formPopup.show) this.closeFormPopup();
    }

    // ── UTILITY ──────────────────────────────────────────────
    private toDatetimeLocal(iso: string): string {
      try { return new Date(iso).toISOString().slice(0, 16); } catch { return ''; }
    }

    private showToast(msg: string, type: 'success' | 'error'): void {
      this.toast = { show: true, message: msg, type };
      setTimeout(() => (this.toast.show = false), 2800);
    }
  }