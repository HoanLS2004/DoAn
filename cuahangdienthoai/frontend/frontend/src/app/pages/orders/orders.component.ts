// orders.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';

import { OrderService } from './orders.service';
import { Order } from './order.model';
import { ProductService } from '../products/products.service';
import { API_BASE_URL } from '../../config/api.config';
interface NewOrderDetail { productID: number | null; quantity: number; unitPrice: number; }
interface Toast          { show: boolean; message: string; type: 'success' | 'error'; }
interface EditInfoForm {
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {

  orders:         Order[] = [];
  filteredOrders: Order[] = [];
  selectedOrder?: Order;

  // ── Search ───────────────────────────────────────────────
  searchText   = '';
  filterStatus = '';

  // ── Pagination ───────────────────────────────────────────
  readonly PAGE_SIZE = 10;
  currentPage = 1;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredOrders.length / this.PAGE_SIZE));
  }

  get pagedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filteredOrders.slice(start, start + this.PAGE_SIZE);
  }
  editInfoPopup: { show: boolean; orderId: number; form: EditInfoForm; saving: boolean } = {
    show: false, orderId: 0,
    form: { receiverName: '', receiverPhone: '', shippingAddress: '' },
    saving: false
  };

  /** Returns page numbers with -1 as ellipsis sentinel */
  pageNumbers(): number[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [];
    pages.push(1);
    if (cur > 3)  pages.push(-1);                                    // left ellipsis
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
    if (cur < total - 2) pages.push(-1);                             // right ellipsis
    pages.push(total);
    return pages;
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
  }

  // ── Create form ──────────────────────────────────────────
  showAddForm     = false;
  isCreating      = false;
  newOrderUserId!: number;
  newDetails: NewOrderDetail[] = [];
  receiverName    = '';
  receiverPhone   = '';
  shippingAddress = '';
  paymentMethod   = 'COD';
  qrCode: string | null = null;

  // ── Popups ───────────────────────────────────────────────
  delPopup: { show: boolean; id: number; userID: number; loading: boolean } =
    { show: false, id: 0, userID: 0, loading: false };

  statusPopup: { show: boolean; orderId: number; newStatus: string; order?: Order } =
    { show: false, orderId: 0, newStatus: '' };

  toast: Toast = { show: false, message: '', type: 'success' };

  constructor(
    private orderService:   OrderService,
    private productService: ProductService,
    private router:         Router,
    private cdr:            ChangeDetectorRef,
  ) {}

  // ── INIT ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadOrders();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => { if (this.router.url.includes('/admin/orders')) this.loadOrders(); });
  }

  // ── LOAD ──────────────────────────────────────────────────
  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (data: Order[]) => {
        this.orders         = [...data];
        this.filteredOrders = [...data];
        this.selectedOrder  = undefined;
        this.currentPage    = 1;
        this.cdr.detectChanges();
      },
      error: () => this.showToast('❌ Không tải được danh sách đơn hàng', 'error'),
    });
  }

  // ── SEARCH + FILTER ───────────────────────────────────────
  onSearch(): void {
  const key    = this.searchText.toLowerCase().trim();
  const status = this.filterStatus;

  this.filteredOrders = this.orders.filter(o => {
    const matchText = !key || (
      o.orderID.toString().includes(key)                   ||
      o.userID.toString().includes(key)                    ||
      (o.receiverName    ?? '').toLowerCase().includes(key) ||
      (o.shippingAddress ?? '').toLowerCase().includes(key) ||
      o.status.toLowerCase().includes(key)
    );
    const matchStatus = !status || o.status === status;  // '' = tất cả → true
    return matchText && matchStatus;
  });

  this.currentPage = 1;
}

clearSearch(): void {
  this.searchText   = '';
  this.onSearch();   
}
  // ── SELECT ────────────────────────────────────────────────
  selectOrder(order: Order): void {
    this.orderService.getOrder(order.orderID).subscribe({
      next: o => {
        this.selectedOrder = o;
        // ✅ Cập nhật lại trong list để status pill hiển thị đúng
        const idx = this.orders.findIndex(x => x.orderID === o.orderID);
        if (idx !== -1) this.orders[idx] = { ...this.orders[idx], ...o };
        this.cdr.detectChanges();
      },
      error: () => this.showToast('❌ Không lấy được chi tiết đơn', 'error'),
    });
}

  // ── DELETE POPUP ──────────────────────────────────────────
  openDelPopup(order: Order): void {
    this.delPopup = { show: true, id: order.orderID, userID: order.userID, loading: false };
  }
  closeDelPopup(): void { this.delPopup = { show: false, id: 0, userID: 0, loading: false }; }

  confirmDelete(): void {
    this.delPopup.loading = true;
    this.orderService.deleteOrder(this.delPopup.id).subscribe({
      next: () => {
        this.showToast(`🗑️ Đã xóa đơn hàng #${this.delPopup.id}`, 'success');
        this.closeDelPopup();
        this.loadOrders();
      },
      error: () => {
        this.delPopup.loading = false;
        this.showToast('❌ Xóa đơn thất bại', 'error');
      },
    });
  }

  // ── STATUS POPUP ──────────────────────────────────────────
  openStatusPopup(order: Order): void {
  // Nếu đang selectedOrder là đơn này thì dùng luôn (đã có payment)
  if (this.selectedOrder?.orderID === order.orderID) {
    this.statusPopup = {
      show:      true,
      orderId:   order.orderID,
      newStatus: order.status,
      order:     this.selectedOrder,  // ← dùng selectedOrder đã có payment
    };
    return;
  }
 
  // Chưa có detail → gọi API lấy full order kèm payment
  this.orderService.getOrder(order.orderID).subscribe({
    next: fullOrder => {
      console.log('🔍 openStatusPopup fullOrder:', JSON.stringify(fullOrder));
      this.statusPopup = {
        show:      true,
        orderId:   fullOrder.orderID,
        newStatus: fullOrder.status,
        order:     fullOrder,
      };
      this.cdr.detectChanges();
    },
    error: () => {
      // Fallback: mở popup với data cũ (Completed sẽ bị lock nếu chưa có payment)
      this.statusPopup = { show: true, orderId: order.orderID, newStatus: order.status, order };
    },
  });
}
  closeStatusPopup(): void { this.statusPopup = { show: false, orderId: 0, newStatus: '', order: undefined }; }

  confirmStatus(): void {
    const { orderId, newStatus, order } = this.statusPopup;
    if (!newStatus || newStatus === order?.status) { this.closeStatusPopup(); return; }

    this.orderService.updateStatus(orderId, newStatus).subscribe({
      next: () => {
        this.showToast(`💾 Đã cập nhật đơn #${orderId} → ${newStatus}`, 'success');
        this.closeStatusPopup();
        this.loadOrders();
      },
      error: () => this.showToast('❌ Cập nhật trạng thái thất bại', 'error'),
    });
  }

  openEditInfoPopup(order: Order): void {
  this.editInfoPopup = {
    show: true,
    orderId: order.orderID,
    form: {
      receiverName:    (order as any).receiverName    ?? '',
      receiverPhone:   (order as any).receiverPhone   ?? '',
      shippingAddress: (order as any).shippingAddress ?? '',
    },
    saving: false,
  };
}

closeEditInfoPopup(): void {
  this.editInfoPopup = {
    show: false, orderId: 0,
    form: { receiverName: '', receiverPhone: '', shippingAddress: '' },
    saving: false
  };
}

confirmEditInfo(): void {
  const { orderId, form } = this.editInfoPopup;
  if (!form.receiverName || !form.receiverPhone || !form.shippingAddress) {
    this.showToast('Vui lòng điền đầy đủ thông tin', 'error'); return;
  }
  this.editInfoPopup.saving = true;
  this.orderService.updateOrderInfo(orderId, form).subscribe({
    next: () => {
      this.showToast(`✅ Đã cập nhật thông tin đơn #${orderId}`, 'success');
      this.closeEditInfoPopup();
      // Cập nhật lại selectedOrder nếu đang xem đơn này
      if (this.selectedOrder?.orderID === orderId) {
        this.selectOrder(this.selectedOrder);
      }
      this.loadOrders();
    },
    error: () => {
      this.editInfoPopup.saving = false;
      this.showToast('❌ Cập nhật thất bại', 'error');
    },
  });
}

  // ── CREATE FORM ───────────────────────────────────────────
  openAddForm(): void {
    this.showAddForm    = true;
    this.newOrderUserId = undefined!;
    this.newDetails     = [];
    this.receiverName   = '';
    this.receiverPhone  = '';
    this.shippingAddress = '';
    this.paymentMethod  = 'COD';
    this.qrCode         = null;
    this.isCreating     = false;
  }
  closeAddForm(): void { this.showAddForm = false; this.qrCode = null; }

  addDetail():           void { this.newDetails.push({ productID: null, quantity: 1, unitPrice: 0 }); }
  removeDetail(i: number): void { this.newDetails.splice(i, 1); }

  onProductChange(d: NewOrderDetail): void {
    if (!d.productID) { d.unitPrice = 0; return; }
    this.productService.getProductById(d.productID).subscribe({
      next:  p  => { d.unitPrice = p.price - p.price * (p.discount ?? 0) / 100; },
      error: () => { this.showToast('❌ Không tìm thấy sản phẩm', 'error'); d.unitPrice = 0; },
    });
  }

  createOrder(): void {
    if (!this.newOrderUserId) { this.showToast('Vui lòng nhập User ID', 'error'); return; }
    if (!this.receiverName || !this.receiverPhone || !this.shippingAddress) {
      this.showToast('Vui lòng nhập đầy đủ thông tin người nhận', 'error'); return;
    }
    if (this.newDetails.length === 0) { this.showToast('Phải có ít nhất một sản phẩm', 'error'); return; }
    if (this.newDetails.some(d => !d.productID || d.quantity <= 0)) {
      this.showToast('Thông tin sản phẩm không hợp lệ', 'error'); return;
    }

    this.isCreating = true;
    const payload = {
      userID: this.newOrderUserId, receiverName: this.receiverName,
      receiverPhone: this.receiverPhone, shippingAddress: this.shippingAddress,
      paymentMethod: this.paymentMethod,
      orderDetails: this.newDetails.map(d => ({ productID: d.productID!, quantity: d.quantity })),
    };

    this.orderService.createOrder(payload).subscribe({
      next: (res: any) => {
        this.isCreating = false;
        this.showToast('✅ Tạo đơn hàng thành công!', 'success');
        if (res.qrCode) { this.qrCode = res.qrCode; this.startPolling(res.orderId); }
        else { this.closeAddForm(); this.loadOrders(); }
      },
      error: (err: any) => { this.isCreating = false; this.showToast('❌ Lỗi: ' + err.error, 'error'); },
    });
  }

  startPolling(orderId: number): void {
    const iv = setInterval(() => {
      this.orderService.getOrder(orderId).subscribe((o: any) => {
        if (o.payment?.paymentStatus === 'Completed') {
          this.showToast('🎉 Thanh toán thành công!', 'success');
          clearInterval(iv); this.closeAddForm(); this.loadOrders();
        }
      });
    }, 3000);
  }

  // ── STATS ─────────────────────────────────────────────────
  countByStatus(s: string): number { return this.orders.filter(o => o.status === s).length; }

  // ── TOAST ─────────────────────────────────────────────────
  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => (this.toast.show = false), 2800);
  }
  canComplete(order?: Order): boolean {
    if (!order) return false;
    return (order as any).payment?.paymentStatus === 'Completed';
  }
  }