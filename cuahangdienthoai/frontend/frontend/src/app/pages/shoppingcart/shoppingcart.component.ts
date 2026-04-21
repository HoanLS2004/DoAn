// shoppingcart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ShoppingCartService, ShoppingCart } from './shoppingcart.service';

interface Toast { show: boolean; message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './shoppingcart.component.html',
  styleUrls: ['./shoppingcart.component.css'],
})
export class ShoppingCartComponent implements OnInit, OnDestroy {

  shoppingCart: ShoppingCart[] = [];
  selectAll = false;

  // ── Popups ────────────────────────────────────────────────
  delPopup: { show: boolean; item: ShoppingCart | null } = { show: false, item: null };
  checkPopup = false;
  errPopup: { show: boolean; title: string; message: string } = { show: false, title: '', message: '' };

  toast: Toast = { show: false, message: '', type: 'success' };

  // ── Mỗi productID có 1 Subject riêng để hủy request cũ ──
  private qtySubjects = new Map<number, Subject<number>>();

  constructor(
    private cartService: ShoppingCartService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.loadCart(); }

  ngOnDestroy(): void {
    this.qtySubjects.forEach(s => s.complete());
  }

  // ── LOAD ──────────────────────────────────────────────────
  loadCart(): void {
    this.cartService.getCart().subscribe({
      next: res => {
        const old = this.shoppingCart;
        this.shoppingCart = res.map(item => ({
          ...item,
          quantity:      Number(item.quantity),
          stockQuantity: Number(item.stockQuantity),
          selected: old.find(i => i.productID === item.productID)?.selected ?? false,
        }));
        this.updateSelectAll();
        this.cdr.detectChanges();
      },
      error: () => this.showToast('❌ Không tải được giỏ hàng', 'error'),
    });
  }

  // ── QTY ───────────────────────────────────────────────────
  increase(item: ShoppingCart): void {
    if (item.quantity >= item.stockQuantity) {
      this.openErrPopup('Không đủ hàng', `Chỉ còn ${item.stockQuantity} sản phẩm trong kho!`);
      return;
    }
    item.quantity++;
    this.cdr.detectChanges();
    this.pushQtyUpdate(item);
  }

  decrease(item: ShoppingCart): void {
    if (item.quantity <= 1) return;
    item.quantity--;
    this.cdr.detectChanges();
    this.pushQtyUpdate(item);
  }

  private pushQtyUpdate(item: ShoppingCart): void {
    if (!this.qtySubjects.has(item.productID)) {
      const subject = new Subject<number>();
      this.qtySubjects.set(item.productID, subject);

      subject.pipe(
        switchMap(qty =>
          this.cartService.updateQuantity(item.productID, qty).pipe(
            catchError((err) => {
              // Chỉ báo lỗi nếu backend trả 400 (vượt tồn kho)
              if (err?.status === 400) {
                const msg = err?.error?.message ?? 'Số lượng vượt quá tồn kho!';
                this.openErrPopup('Không đủ hàng', msg);
                this.loadCart();
              }
              return of(null);
            })
          )
        )
      ).subscribe();
    }
    this.qtySubjects.get(item.productID)!.next(item.quantity);
  }

  // ── STOCK HELPERS ─────────────────────────────────────────
  isOverStock(item: ShoppingCart): boolean {
    return item.quantity > item.stockQuantity;
  }

  hasOverStockItem(): boolean {
    return this.selectedItems().some(i => this.isOverStock(i));
  }

  // ── ERROR POPUP ───────────────────────────────────────────
  openErrPopup(title: string, message: string): void {
    this.errPopup = { show: true, title, message };
  }

  closeErrPopup(): void {
    this.errPopup = { show: false, title: '', message: '' };
  }

  // ── DELETE POPUP ──────────────────────────────────────────
  openDelPopup(item: ShoppingCart | null): void {
    this.delPopup = { show: true, item };
  }

  closeDelPopup(): void {
    this.delPopup = { show: false, item: null };
  }

  confirmDelete(): void {
    if (this.delPopup.item) {
      // single
      const name = this.delPopup.item.productName?.slice(0, 28) ?? '';
      this.cartService.remove(this.delPopup.item.productID).subscribe({
        next: () => {
          this.showToast(`🗑️ Đã xoá "${name}..."`, 'success');
          this.closeDelPopup();
          this.loadCart();
        },
        error: () => this.showToast('❌ Xoá thất bại', 'error'),
      });
    } else {
      // batch
      const selected = this.shoppingCart.filter(i => i.selected);
      Promise.all(selected.map(i => this.cartService.remove(i.productID).toPromise()))
        .then(() => {
          this.showToast(`🗑️ Đã xoá ${selected.length} sản phẩm`, 'success');
          this.closeDelPopup();
          this.loadCart();
        })
        .catch(() => this.showToast('❌ Xoá thất bại', 'error'));
    }
  }

  // ── CHECKOUT POPUP ────────────────────────────────────────
  openCheckoutPopup(): void {
    if (this.getSelectedCount() === 0) {
      this.showToast('Vui lòng chọn ít nhất 1 sản phẩm!', 'error');
      return;
    }
    if (this.hasOverStockItem()) {
      this.showToast('❌ Có sản phẩm vượt số lượng tồn kho!', 'error');
      return;
    }
    this.checkPopup = true;
  }

  confirmCheckout(): void {
    localStorage.setItem('checkoutItems', JSON.stringify(this.selectedItems()));
    this.checkPopup = false;
    this.router.navigate(['/checkout']);
  }

  // ── SELECT ────────────────────────────────────────────────
  toggleAll(): void {
    this.shoppingCart.forEach(i => i.selected = this.selectAll);
  }

  updateSelection(): void { this.updateSelectAll(); }

  private updateSelectAll(): void {
    this.selectAll = this.shoppingCart.length > 0 && this.shoppingCart.every(i => i.selected);
  }

  // ── TOTALS ────────────────────────────────────────────────
  selectedItems(): ShoppingCart[]  { return this.shoppingCart.filter(i => i.selected); }
  getSelectedCount(): number        { return this.selectedItems().length; }

  getSelectedTotal(): number {
    return this.selectedItems().reduce((s, i) => s + i.quantity * i.price * (1 - i.discount / 100), 0);
  }

  getOriginalTotal(): number {
    return this.selectedItems().reduce((s, i) => s + i.quantity * i.price, 0);
  }

  getSavings(): number { return this.getOriginalTotal() - this.getSelectedTotal(); }

  getTotal(): number { return this.getSelectedTotal(); }

  // ── HELPERS ───────────────────────────────────────────────
  onImgErr(e: Event): void {
    (e.target as HTMLImageElement).src = 'assets/no-image.png';
  }

  // ── TOAST ─────────────────────────────────────────────────
  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message: msg, type };
    setTimeout(() => (this.toast.show = false), 2800);
  }
  getThumbUrl(thumbnail: string): string {
      if (!thumbnail) return 'assets/no-image.png';
      if (thumbnail.startsWith('http')) return thumbnail;
      return 'https://inconceivable-matrilineal-gaylene.ngrok-free.dev' + thumbnail;
    }
}