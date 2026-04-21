
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule, ActivatedRoute } from '@angular/router';  // ← thêm ActivatedRoute
import { API_BASE_URL } from '../../config/api.config';
interface OrderDetail {
  productID:   number;
  productName: string;
  quantity:    number;
  unitPrice:   number;
}
interface Payment {
  paymentMethod: string;
  paymentStatus: string;
}
interface Order {
  orderID:         number;
  userID:          number;
  orderDate:       string;
  totalAmount:     number;
  status:          'Pending' | 'Shipping' | 'Completed' | 'Cancelled';
  receiverName:    string;
  receiverPhone:   string;
  shippingAddress: string;
  payment?:        Payment;
  orderDetails:    OrderDetail[];
}
interface Toast { show: boolean; message: string; type: 'success' | 'error' | 'info'; }

const STATUS_STEPS = ['Pending', 'Shipping', 'Completed'] as const;
const STATUS_META: Record<string, { label: string; icon: string }> = {
  Pending:   { label: 'Chờ xác nhận', icon: '⏳' },
  Shipping:  { label: 'Đang giao',    icon: '🚚' },
  Completed: { label: 'Đã nhận',      icon: '✅' },
  Cancelled: { label: 'Đã hủy',       icon: '❌' },
};

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './odersusers.component.html',
  styleUrls: ['./odersusers.component.css'],
})
export class OrdersUsersComponent implements OnInit {
  private readonly API = `${API_BASE_URL}/api/orders`;
  private readonly PAYMENT_API = `${API_BASE_URL}/api/payments`;

  orders:         Order[] = [];
  filteredOrders: Order[] = [];
  selectedOrder?: Order;
  isLoading    = true;
  isCancelling = false;
  filterStatus = '';
  searchText   = '';

  // ── Kết quả thanh toán MoMo (đọc từ query params) ─────────
  momoResult:  'success' | 'failed' | null = null;
  momoOrderId: number | null = null;

  cancelPopup: { show: boolean; order?: Order } = { show: false };
  toast: Toast = { show: false, message: '', type: 'success' };

  STATUS_META  = STATUS_META;
  STATUS_STEPS = STATUS_STEPS;

  tabs = [
    { value: '',          label: 'Tất cả',       icon: '🏠' },
    { value: 'Pending',   label: 'Chờ xác nhận', icon: '⏳' },
    { value: 'Shipping',  label: 'Đang giao',     icon: '🚚' },
    { value: 'Completed', label: 'Đã nhận',       icon: '✅' },
    { value: 'Cancelled', label: 'Đã hủy',        icon: '❌' },
  ];

  statItems = [
    { key: 'Pending',   label: 'Chờ xác nhận' },
    { key: 'Shipping',  label: 'Đang giao' },
    { key: 'Completed', label: 'Đã nhận' },
    { key: 'Cancelled', label: 'Đã hủy' },
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,   // ← inject ActivatedRoute
  ) {}

  ngOnInit(): void {
    // ── 1. Đọc query params từ MoMo redirect ───────────────────
    // MoMo redirect về: /ordersusers?resultCode=0&orderId=123_638xxx&...
    this.route.queryParams.subscribe(params => {
      const resultCode = params['resultCode'];
      const rawOrderId = params['orderId'];   // "123_638xxxxxxx"

      if (resultCode !== undefined) {
        this.momoResult = resultCode === '0' ? 'success' : 'failed';

        if (rawOrderId) {
          // Tách "123_638xxx" → 123
          const parsed = parseInt(rawOrderId.split('_')[0], 10);
          this.momoOrderId = isNaN(parsed) ? null : parsed;
        }

        if (this.momoResult === 'success') {
          this.showToast('🎉 Thanh toán MoMo thành công!', 'success');

          // ── 2. Nếu IPN chưa kịp xử lý (redirect nhanh hơn IPN),
          //       đợi 1.5s rồi load để DB chắc chắn đã được cập nhật
          setTimeout(() => this.load(), 1500);
        } else {
          this.showToast('❌ Thanh toán MoMo thất bại', 'error');
          this.load();
        }
      } else {
        // Vào trang bình thường, không phải từ MoMo redirect
        this.load();
      }
    });
  }

  load(): void {
    this.isLoading = true;
    this.http.get<Order[]>(`${this.API}/my`).subscribe({
      next: data => {
        this.orders = data ?? [];
        this.applyFilter();
        this.isLoading = false;

        // ── 3. Nếu vừa thanh toán MoMo thành công,
        //       tự động mở đơn hàng vừa thanh toán ──────────────
        if (this.momoResult === 'success' && this.momoOrderId) {
          const target = this.orders.find(o => o.orderID === this.momoOrderId);
          if (target) this.selectOrder(target);
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Không tải được danh sách đơn hàng', 'error');
      },
    });
  }

  applyFilter(): void {
    const key    = this.searchText.toLowerCase().trim();
    const status = this.filterStatus;
    this.filteredOrders = this.orders.filter(o => {
      const matchText = !key ||
        o.orderID.toString().includes(key) ||
        (o.receiverName    ?? '').toLowerCase().includes(key) ||
        (o.shippingAddress ?? '').toLowerCase().includes(key);
      return matchText && (!status || o.status === status);
    });
    if (this.selectedOrder && !this.filteredOrders.find(o => o.orderID === this.selectedOrder!.orderID)) {
      this.selectedOrder = undefined;
    }
  }

  selectOrder(order: Order): void {
    if (this.selectedOrder?.orderID === order.orderID) {
      this.selectedOrder = undefined;
      return;
    }

    // Luôn gọi API lấy data mới nhất (bao gồm payment status mới nhất)
    this.http.get<Order>(`${this.API}/my/${order.orderID}`).subscribe({
      next: o => {
        this.selectedOrder = o;
        const idx = this.orders.findIndex(x => x.orderID === o.orderID);
        if (idx !== -1) this.orders[idx] = { ...this.orders[idx], ...o };
        this.cdr.detectChanges();
      },
      error: () => {
        this.selectedOrder = order;
      },
    });
  }

  closeMomoBanner(): void { this.momoResult = null; }

  openCancelPopup(order: Order): void { this.cancelPopup = { show: true, order }; }
  closeCancelPopup(): void            { this.cancelPopup = { show: false }; }

  confirmCancel(): void {
    if (!this.cancelPopup.order) return;
    this.isCancelling = true;
    const id = this.cancelPopup.order.orderID;
    this.http.put(`${this.API}/my/${id}/cancel`, {}).subscribe({
      next: () => {
        this.showToast(`Đã hủy đơn hàng #${id}`, 'success');
        this.isCancelling = false;
        this.closeCancelPopup();
        this.selectedOrder = undefined;
        this.load();
      },
      error: () => {
        this.isCancelling = false;
        this.showToast('Hủy đơn thất bại, vui lòng thử lại', 'error');
      },
    });
  }

  canCancel(order: Order): boolean       { return order.status === 'Pending'; }
  currentStep(status: string): number    { return STATUS_STEPS.indexOf(status as any); }
  countByStatus(key: string): number     { return this.orders.filter(o => o.status === key).length; }
  trackById(_: number, o: Order): number { return o.orderID; }

  private showToast(message: string, type: Toast['type']): void {
    this.toast = { show: true, message, type };
    setTimeout(() => { this.toast.show = false; this.cdr.detectChanges(); }, 3500);
  }
}