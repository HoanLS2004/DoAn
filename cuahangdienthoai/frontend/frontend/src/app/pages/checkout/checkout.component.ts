// checkout.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { API_BASE_URL } from '../../config/api.config';

interface Toast { show: boolean; message: string; type: 'success' | 'error' | 'info'; }

interface OrderDTO      { productID: number; quantity: number; }
interface OrderCreateDto {
  userID: number; receiverName: string; receiverPhone: string;
  shippingAddress: string; voucherCode?: string;
  paymentMethod: string; orderDetails: OrderDTO[];
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {

  cartItems: any[] = [];

  order: OrderCreateDto = {
    userID: 0, receiverName: '', receiverPhone: '',
    shippingAddress: '', voucherCode: '',
    paymentMethod: 'COD', orderDetails: [],
  };

  totalAmount    = 0;
  discountAmount = 0;
  finalAmount    = 0;
  orderId: number | null = null;
  isLoading = false;

  // ── Popups ────────────────────────────────────────────────
  confirmPopup = false;
  successPopup = false;
  voucherPopup = false;

  toast: Toast = { show: false, message: '', type: 'success' };

  private readonly API = `${API_BASE_URL}/api`;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const data = localStorage.getItem('checkoutItems');
    if (data) {
      this.cartItems   = JSON.parse(data);
      this.totalAmount = this.cartItems.reduce(
        (s: number, i: any) => s + i.quantity * i.price * (1 - i.discount / 100), 0,
      );
      this.finalAmount = this.totalAmount;
    }
  }

  // ── CONFIRM POPUP ─────────────────────────────────────────
  openConfirmPopup(): void {
    if (!this.order.receiverName.trim())   { this.showToast('Vui lòng nhập họ tên người nhận', 'error'); return; }
    if (!this.order.receiverPhone.trim())  { this.showToast('Vui lòng nhập số điện thoại', 'error'); return; }
    if (!this.order.shippingAddress.trim()){ this.showToast('Vui lòng nhập địa chỉ nhận hàng', 'error'); return; }
    if (this.cartItems.length === 0)       { this.showToast('Không có sản phẩm nào', 'error'); return; }
    this.confirmPopup = true;
  }

  // ── CHECKOUT ──────────────────────────────────────────────
  doCheckout(): void {
    this.mapToOrder();
    this.order.userID = this.getUserIdFromToken();
    this.isLoading    = true;

    this.http.post<any>(`${this.API}/api/orders`, this.order).subscribe({
      next: orderRes => {
        this.orderId = orderRes.orderId;

        this.http.post<any>(`${this.API}/api/payments`, {
          orderID:       orderRes.orderId,
          amount:        this.finalAmount,
          paymentMethod: this.order.paymentMethod,
        }).subscribe({
          next: () => {
            if (this.order.paymentMethod === 'Momo') {
              this.createMomo(orderRes.orderId);
            } else {
              this.onSuccess();
            }
          },
          error: () => {
            this.isLoading = false;
            this.showToast('❌ Lỗi tạo payment', 'error');
          },
        });
      },
      error: err => {
        this.isLoading = false;
        this.showToast(`❌ ${err?.error ?? 'Đặt hàng thất bại'}`, 'error');
      },
    });
  }

  // ── MOMO ──────────────────────────────────────────────────
  createMomo(orderId: number): void {
    this.http.post<any>(`${this.API}/api/payments/momo/${orderId}`, {}).subscribe({
      next: res => {
        this.isLoading = false;
        if (res?.payUrl) { window.location.href = res.payUrl; }
        else { this.showToast('Không lấy được link MoMo', 'error'); }
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Không tạo được thanh toán MoMo', 'error');
      },
    });
  }

  // ── SUCCESS ───────────────────────────────────────────────
  onSuccess(): void {
    this.isLoading    = false;
    this.confirmPopup = false;

    // Chỉ xóa các sản phẩm đã đặt, không xóa toàn bộ giỏ
    const removeRequests = this.cartItems.map(item =>
      this.http.delete(`${this.API}/api/cart/remove`, {
        params: { productId: item.productID.toString() }
      }).toPromise()
    );

    Promise.all(removeRequests)
      .catch(() => {}) // bỏ qua lỗi, vẫn hiện popup thành công
      .finally(() => {
        localStorage.removeItem('checkoutItems');
        this.successPopup = true;
        this.cdr.detectChanges();
      });
  }

  goHome(): void {
    this.successPopup = false;
    window.location.href = '/';
  }

  // ── VOUCHER ───────────────────────────────────────────────
  applyVoucher(): void {
    if (!this.order.voucherCode?.trim()) {
      this.discountAmount = 0; this.finalAmount = this.totalAmount; return;
    }
    this.isLoading = true;
    this.http.post<any>(`${this.API}/api/promotions/apply`, {
      code: this.order.voucherCode, orderValue: this.totalAmount,
    }).subscribe({
      next: res => {
        this.discountAmount = res.discount;
        this.finalAmount    = res.finalAmount;
        this.isLoading      = false;
        this.voucherPopup   = true;
        this.cdr.detectChanges();
      },
      error: err => {
        this.isLoading = false;
        this.showToast(`❌ ${err?.error ?? 'Voucher không hợp lệ'}`, 'error');
        this.cdr.detectChanges();
      },
    });
  }

  // ── HELPERS ───────────────────────────────────────────────
  mapToOrder(): void {
    this.order.orderDetails = this.cartItems.map(i => ({
      productID: i.productID, quantity: i.quantity,
    }));
  }

  getUserIdFromToken(): number {
    try {
      const payload = JSON.parse(atob((localStorage.getItem('token') ?? '').split('.')[1]));
      return Number(
        payload.nameid ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        payload.sub || 0,
      );
    } catch { return 0; }
  }

  onImgErr(e: Event): void {
    (e.target as HTMLImageElement).src = 'assets/no-image.png';
  }

  // ── TOAST ─────────────────────────────────────────────────
  private showToast(message: string, type: 'success' | 'error' | 'info'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => (this.toast.show = false), 2800);
  }
}
