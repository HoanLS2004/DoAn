// home.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../products/products.service';
import { ChangeDetectorRef } from '@angular/core';
import { OrderService } from '../orders/orders.service';
import { AuthService } from '../../guards/auth.service';
import { filter } from 'rxjs/operators';
import { API_BASE_URL } from '../../config/api.config';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit {

  banners:       any[] = [];
  totalProducts  = 0;
  pendingOrders  = 0;
  revenue        = 0;

  sidebarOpen = false;

  userName = '';
  userRole = ''; // 'Admin' | 'Staff'

  // Tất cả sections — có thêm field `adminOnly`
  private allSections = [
    { name: 'Quản lý Người dùng',        route: '/admin/users',          adminOnly: true  },
    { name: 'Quản lý Sản phẩm',          route: '/admin/products',       adminOnly: false },
    { name: 'Quản lý Cấu hình sản phẩm', route: '/admin/productconfig',  adminOnly: false },
    { name: 'Quản lý Hình ảnh Sản phẩm', route: '/admin/product-images', adminOnly: false },
     { name: 'Quản lý danh mục sản phẩm', route: '/admin/category',       adminOnly: false },
    { name: 'Quản lý Đơn hàng',          route: '/admin/orders',         adminOnly: false },
    { name: 'Quản lý Thanh toán',        route: '/admin/payments',       adminOnly: false },
    // ── Admin only ──
    { name: 'Quản lý Khuyến mãi',        route: '/admin/promotions',     adminOnly: true  },
    { name: 'Quản lý Thương hiệu',         route: '/admin/brands',         adminOnly: true  },
    { name: 'Quản lý Đánh giá',             route: '/admin/reviews',        adminOnly: false  },
    { name: 'Thống kê Doanh thu',             route: '/admin/revenue',        adminOnly: true  },
  ];

  // Menu hiển thị tuỳ role
  get managementSections() {
    return this.auth.isAdmin()
      ? this.allSections
      : this.allSections.filter(s => !s.adminOnly);
  }

  get isAdmin(): boolean  { return this.auth.isAdmin(); }
  get isStaff(): boolean  { return this.auth.isStaff(); }

  constructor(
    private http:           HttpClient,
    private productService: ProductService,
    private orderService:   OrderService,
    public  router:         Router,
    private cdr:            ChangeDetectorRef,
    public  auth:           AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();

    this.http.get<any[]>(`${API_BASE_URL}/HomeBanner/banners`).subscribe({
      next: data => { this.banners = data.map(b => ({ ...b, LinkUrl: b.LinkUrl || '/' })); },
      error: err  => console.error('Failed to load banners', err),
    });

    this.productService.getTotalProducts().subscribe((res: any) => {
      this.totalProducts = res.total ?? 0;
      this.cdr.detectChanges();
    });

    this.orderService.getPendingOrdersCount().subscribe((res: any) => {
      this.pendingOrders = res.total ?? 0;
      this.cdr.detectChanges();
    });

    // Chỉ Admin mới load revenue
    if (this.auth.isAdmin()) {
      this.orderService.getRevenue().subscribe((res: any) => {
        this.revenue = res.total ?? 0;
        this.cdr.detectChanges();
      });
    }

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.closeSidebar());
  }

  // ── USER INFO ─────────────────────────────────────────────
  private loadUserInfo(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const base64  = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bytes   = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const payload = JSON.parse(new TextDecoder('utf-8').decode(bytes));

      this.userName =
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
        payload.name ?? payload.unique_name ?? payload.sub ?? payload.email ?? '';

      // Lấy role từ token
      const rawRole: string =
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        payload.role ?? payload.Role ?? '';

      this.userRole = rawRole; // 'Admin' hoặc 'Staff'
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Token parse error:', e);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.userName = '';
    this.userRole = '';
    this.router.navigate(['/login']);
    this.cdr.detectChanges();
  }

  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar():  void { this.sidebarOpen = false; }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeSidebar(); }

  navigateTo(route: string): void { this.router.navigate([route]); }

  getIcon(sectionName: string): string {
    const iconMap: Record<string, string> = {
      'Quản lý Người dùng':        '👤',
      'Quản lý Sản phẩm':          '📱',
      'Quản lý Cấu hình sản phẩm': '⚙️',
      'Quản lý Hình ảnh Sản phẩm': '🖼️',
      'Quản lý danh mục sản phẩm': '📂',
      'Quản lý Đơn hàng':          '🛒',
      'Quản lý Khuyến mãi':        '💰',
      'Quản lý Thanh toán':        '💳',
      'Quản lý Thương hiệu':         '🏷️',
      'Quản lý Đánh giá':          '💬',
      'Thống kê Doanh thu':        '📈',
    };
    return iconMap[sectionName] ?? '📋';
  }
}