// home-user.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { ProductService } from '../products/products.service';
import { ChatbotComponent } from '../chatbot/chatbot.component';
import { API_BASE_URL } from '../../config/api.config';
interface PriceRange { label: string; min: number; max: number; }

@Component({
  selector: 'app-home-user',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ChatbotComponent],
  templateUrl: './home-user.html',
  styleUrls: ['./home-user.css'],
})
export class HomeUserComponent implements OnInit {

  banners:    any[] = [];
  products:   any[] = [];
  categories: any[] = [];
  brands:     any[] = [];

  search = '';

  selectedCategory: string | null = null;
  selectedBrand:    string | null = null;
  selectedPrice:    string | null = null;
  selectedPriceRange: PriceRange | null = null;

  // ── Popup state ───────────────────────────────────────────
  popupVisible = false;
  isChatOpen = false;
  popupProduct: any = null;
  cartCount    = 0;
  aboutPopupVisible = false;
  aboutActiveKey: string | null = null;
  policyPopupVisible = false;
  policyActiveKey: string | null = null;
  loginRequiredVisible = false;
  logoutToastVisible = false;
  priceRanges: PriceRange[] = [
    { label: 'Dưới 2 triệu',    min: 0,          max: 2_000_000 },
    { label: '2 – 5 triệu',     min: 2_000_000,  max: 5_000_000 },
    { label: '5 – 10 triệu',    min: 5_000_000,  max: 10_000_000 },
    { label: '10 – 20 triệu',   min: 10_000_000, max: 20_000_000 },
    { label: '20 – 35 triệu',   min: 20_000_000, max: 35_000_000 },
    { label: 'Trên 35 triệu',   min: 35_000_000, max: Infinity },
  ];

  configMap: Map<number, string> = new Map(); 
  soldMap:   Map<number, number> = new Map(); 
  ratingMap: Map<number, number> = new Map();
  reviewCountMap: Map<number, number> = new Map();
  ramRomMap: Map<number, string> = new Map();

  private readonly API = `${API_BASE_URL}`;

  constructor(
    private http:           HttpClient,
    private productService: ProductService,
    private cdr:            ChangeDetectorRef,
  ) {}

  userName = '';
  loginSuccess = false;
  sidebarOpen = false;

  // ── POLICY ACCORDION ──────────────────────────────────────
  openPolicyKey: string | null = null;
  openAboutKey: string | null = null;
  activeSupport: string | null = null;

  aboutItems = [
    {
      key: 'gioithieu',
      label: 'Giới thiệu cửa hàng',
      lines: [
        'TUAN ANH MOBILE - chuyên điện thoại chính hãng',
        'Uy tín - Chất lượng - Giá tốt',
      ]
    },
    {
      key: 'tuyendung',
      label: 'Tuyển dụng',
      lines: [
        'Nhân viên bán hàng',
        'Lương 7–12 triệu + thưởng',
        'Liên hệ: 0394 140 197',
      ]
    },
    {
      key: 'tintuc',
      label: 'Tin tức & khuyến mãi',
      lines: [
        'Sale hàng tháng cực lớn',
        'Giảm giá 500k cho 50 khách hàng đầu tiên',
      ]
    },
    {
      key: 'hethong',
      label: 'Hệ thống cửa hàng',
      lines: [
        'Đ/C CS1: 45 Xuân Thủy - Cầu Giấy - Hà Nội',
        'Đ/C CS2: 343 Phạm Văn Đồng - TT Liễu Đề - Nghĩa Hưng - Nam Định',
        
      ]
    },
    {
      key: 'hoptac',
      label: 'Liên hệ hợp tác',
      lines: [
        'Hợp tác phân phối sản phẩm',
        'Số điện thoại: 076 597 9999',
      ]
    }
  ];

  policyItems = [
    {
      key: 'baohanh', label: 'Chính sách bảo hành', hotline: true,
      lines: [
        '✔ Hư gì đổi nấy (tháng đầu tiên)',
        '✔ Lỗi nhà sản xuất → đổi mới miễn phí',
        '✔ Bảo hành chính hãng 12–24 tháng',
        '✔ Sửa quá 15 ngày → đổi máy mới',
        '⚠ Không áp dụng nếu máy rơi vỡ, vào nước',
      ]
    },
    {
      key: 'doitra', label: 'Chính sách đổi trả', hotline: true,
      lines: [
        '✔ Đổi trả miễn phí trong 30 ngày',
        '✔ Còn nguyên hộp, phụ kiện đầy đủ',
        '✔ Lỗi kỹ thuật → đổi máy mới',
        '⚠ Không áp dụng nếu rơi vỡ, vào nước',
      ]
    },
    {
      key: 'giaohang', label: 'Chính sách giao hàng', hotline: false,
      lines: [
        '✔ Miễn phí vận chuyển toàn quốc',
        '✔ Hà Nội: giao hỏa tốc trong 2 giờ',
        '✔ Tỉnh khác: 1–3 ngày tùy đơn vị',
      ]
    },
    {
      key: 'thanhtoan', label: 'Chính sách thanh toán', hotline: false,
      lines: [
        '✔ Tiền mặt khi nhận hàng (COD)',
        '✔ Chuyển khoản ngân hàng',
        '✔ MoMo, ZaloPay, VNPay',
        '✔ Trả góp 0% qua thẻ tín dụng',
      ]
    },
    {
      key: 'baomat', label: 'Bảo mật thông tin', hotline: false,
      lines: [
        '✔ Dữ liệu mã hóa bảo mật',
        '✔ Không chia sẻ với bên thứ ba',
        '✔ Cổng thanh toán chuẩn PCI',
      ]
    },
  ];

  togglePolicy(key: string): void {
    this.openPolicyKey = this.openPolicyKey === key ? null : key;
  }

  supportItems = [
    {
      key: 'buy',
      label: 'Hướng dẫn mua hàng',
      lines: [
        'Chọn sản phẩm → bấm "Thêm vào giỏ hàng" → vào giỏ hàng → bấm "Đặt hàng" → nhập thông tin nhận hàng → nhập voucher (nếu có) → xác nhận đơn hàng.',
        'Thanh toán tiền mặt: thanh toán khi nhận hàng (COD). Thanh toán MoMo: hệ thống sẽ chuyển sang giao diện MoMo để hoàn tất thanh toán.'
      ]
    },
    {
      key: 'order',
      label: 'Tra cứu đơn hàng',
      children: [
        { label: 'Kiểm tra trạng thái', link: '/ordersusers' }
      ]
    },
    {
      key: 'warranty',
      label: 'Đăng ký bảo hành',
      link:'https://forms.gle/6Ac6MPMeh7wtMqcN8'
    },
   {
      key: 'faq',
      label: 'Câu hỏi thường gặp',
      children: [
        { label: '📸 Điện thoại chụp ảnh đẹp?', link: '/productss/26' },
        { label: '🔥 Điện thoại bán chạy nhất?', link: '/productss/15' },
        { label: '⚡ Điện thoại chip mạnh, mượt?', link: '/productss/46' }
      ]
    },
    {
      key: 'feedback',
      label: 'Phản hồi & khiếu nại',
      link: 'https://docs.google.com/forms/d/e/1FAIpQLSdspC-6Vei20CzzF_9IAuzP_ROc_N-tAAZdKdGwnUMakUxGXA/viewform?usp=publish-editor' 
    }
  ];
  toggleSupport(item: any) {
      this.activeSupport = this.activeSupport === item.key ? null : item.key;
    }
  ngOnInit(): void {
    this.loadBanners();
    this.loadProducts();
    this.loadConfigs();
    this.loadSoldCounts();
    this.loadRatings();
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const jsonStr = new TextDecoder('utf-8').decode(bytes);
        const payload = JSON.parse(jsonStr);
        this.userName =
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
          payload.name ?? payload.unique_name ?? payload.sub ?? payload.email ?? '';
        this.cdr.detectChanges();
      } catch (e) {
        console.error('Token error:', e);
      }
    }
    if (localStorage.getItem('justLoggedIn') === '1') {
      localStorage.removeItem('justLoggedIn');
      setTimeout(() => {
        this.loginSuccess = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.loginSuccess = false;
          this.cdr.detectChanges();
        }, 2800);
      }, 300);
    }
  }

  // ── LOAD DATA ─────────────────────────────────────────────
  loadBanners(): void {
    this.http.get<any[]>(`${this.API}/api/HomeBanner/banners`).subscribe({
      next: res => (this.banners = res),
    });
  }

  loadProducts(): void {
    this.productService.getProducts(this.search).subscribe({
      next: (res: any) => {
        this.products = res.items ?? res;
        this.buildFilters();
        this.cdr.detectChanges();
      },
    });
  }

  loadConfigs(): void {
    this.http.get<any[]>(`${this.API}/api/ProductConfigurations`).subscribe({
      next: (res) => {
        this.configMap.clear();
        this.ramRomMap.clear(); // ← thêm dòng này
        for (const cfg of (res ?? [])) {
          const id = cfg.productID ?? cfg.ProductID;
          const screen = cfg.screen ?? cfg.Screen ?? '';
          if (id && screen) this.configMap.set(Number(id), screen);

          // ── Thêm đoạn này ──
          const ram = cfg.ram ?? cfg.Ram ?? '';
          const rom = cfg.internalStorage ?? cfg.InternalStorage ?? '';
          if (id && (ram || rom)) {
            const parts = [];
            if (ram) parts.push(ram);
            if (rom) parts.push(rom);
            this.ramRomMap.set(Number(id), parts.join('/'));
          }
        }
        this.cdr.detectChanges();
      },
    });
  }

  loadSoldCounts(): void {
    this.http.get<any[]>(`${this.API}/api/orders`).subscribe({
      next: (orders) => {
        this.soldMap.clear();
        for (const order of (orders ?? [])) {
          const st = (order.status ?? order.Status ?? '').toLowerCase();
          if (st !== 'completed') continue;
          const details = order.orderDetails ?? order.OrderDetails ?? [];
          for (const d of details) {
            const pid = d.productID ?? d.ProductID;
            const qty = Number(d.quantity ?? d.Quantity ?? 1);
            if (pid) this.soldMap.set(Number(pid), (this.soldMap.get(Number(pid)) ?? 0) + qty);
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }
  loadRatings(): void {
  this.http.get<any[]>(`${this.API}/api/reviews`).subscribe({
    next: (reviews) => {
      const map = new Map<number, number[]>();
      for (const r of (reviews ?? [])) {
        const pid    = Number(r.productID ?? r.ProductID ?? r.product_id);
        const rating = Number(r.rating    ?? r.Rating    ?? r.star);
        if (!pid || isNaN(rating) || rating === 0) continue;
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid)!.push(rating);
      }
      this.ratingMap.clear();
      this.reviewCountMap.clear();
      map.forEach((ratings, pid) => {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        this.ratingMap.set(pid, Math.round(avg * 10) / 10);
        this.reviewCountMap.set(pid, ratings.length);
      });
      console.log('ratingMap:', [...this.ratingMap.entries()]);
      this.cdr.detectChanges();
    },
    error: (err) => console.error('Lỗi load reviews:', err)
  });
}

  getScreen(productID: number): string {
    const s = this.configMap.get(productID) ?? '';
    if (!s) return '';
    const size  = s.match(/(\d+[.,]\d+)\s*[""]?\s*inch|(\d+[.,]\d+)\s*"/i);
    const panel = s.match(/OLED|AMOLED|LCD|IPS|LTPO|ProMotion/i);
    const hz    = s.match(/(\d+)\s*Hz/i);
    const parts: string[] = [];
    if (size)  parts.push((size[1] ?? size[2]).replace(',', '.') + '"');
    if (panel) parts.push(panel[0].toUpperCase());
    if (hz)    parts.push(hz[1] + 'Hz');
    return parts.length ? parts.join(' · ') : s.slice(0, 22);
  }

  getSold(productID: number): number {
    return this.soldMap.get(productID) ?? 0;
  }

  buildFilters(): void {
    const catSet   = new Map<string, number>();
    const brandSet = new Map<string, number>();
    for (const p of this.products) {
      if (p.categoryName) catSet.set(p.categoryName,   (catSet.get(p.categoryName)   ?? 0) + 1);
      if (p.brandName)    brandSet.set(p.brandName,    (brandSet.get(p.brandName)    ?? 0) + 1);
    }
    this.categories = [...catSet.entries()].map(([name, count]) => ({ name, count }));
    this.refreshBrands();
  }

  refreshBrands(): void {
    const src = this.selectedCategory
      ? this.products.filter(p => p.categoryName === this.selectedCategory)
      : this.products;
    const brandSet = new Map<string, number>();
    for (const p of src) {
      if (p.brandName) brandSet.set(p.brandName, (brandSet.get(p.brandName) ?? 0) + 1);
    }
    this.brands = [...brandSet.entries()].map(([name, count]) => ({ name, count }));
  }

  // ── FILTERED PRODUCTS ──────────────────────────────────────
  get filteredProducts(): any[] {
    return this.products.filter(p => {
      const price      = p.price * (1 - (p.discount ?? 0) / 100);
      const matchCat   = !this.selectedCategory   || p.categoryName === this.selectedCategory;
      const matchBrand = !this.selectedBrand      || p.brandName    === this.selectedBrand;
      const matchPrice = !this.selectedPriceRange
        || (price >= this.selectedPriceRange.min && price < this.selectedPriceRange.max);
      const matchQ     = !this.search.trim()
        || p.name.toLowerCase().includes(this.search.toLowerCase());
      return matchCat && matchBrand && matchPrice && matchQ;
    });
  }

  selectCategory(name: string | null): void {
    this.selectedCategory = this.selectedCategory === name ? null : name;
    this.selectedBrand = null;
    this.refreshBrands();
  }

  selectBrand(name: string | null): void {
    this.selectedBrand = this.selectedBrand === name ? null : name;
  }

  selectPrice(range: PriceRange | null): void {
    if (!range) { this.selectedPrice = null; this.selectedPriceRange = null; return; }
    if (this.selectedPrice === range.label) {
      this.selectedPrice = null; this.selectedPriceRange = null;
    } else {
      this.selectedPrice = range.label; this.selectedPriceRange = range;
    }
  }

  clearFilters(): void {
    this.selectedCategory   = null;
    this.selectedBrand      = null;
    this.selectedPrice      = null;
    this.selectedPriceRange = null;
    this.refreshBrands();
  }

  // ── SEARCH ─────────────────────────────────────────────────
  onSearch(): void { this.loadProducts(); }

  // ── CART + POPUP ───────────────────────────────────────────
  addToCart(product: any): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.loginRequiredVisible = true;
      return;
    }
    this.http.post(
      `${this.API}/api/cart/add?productId=${product.productID}&quantity=1`, {},
    ).subscribe({
      next: () => {
        this.cartCount++;
        this.popupProduct = product;
        this.popupVisible = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.popupProduct = null;
        this.popupVisible = true;
        this.cdr.detectChanges();
      },
    });
  }

  closePopup(): void {
    this.popupVisible = false;
    this.popupProduct = null;
  }
  closeLoginRequired(): void {
    this.loginRequiredVisible = false;
  }
  // ── HELPERS ────────────────────────────────────────────────
  countByCategory(name: string): number {
    return this.products.filter(p => p.categoryName === name).length;
  }

  getImage(p: any): string {
    if (p?.thumbnailUrl) return `${this.API}${p.thumbnailUrl}`;
    if (p?.imageUrl)     return `${this.API}${p.imageUrl}`;
    return 'assets/no-image.jpg';
  }

  onImgErr(e: Event): void {
    (e.target as HTMLImageElement).src = 'assets/no-image.jpg';
  }

  getCatIcon(name: string): string {
    const m: Record<string, string> = {
      'Điện thoại': '📱', 'Laptop': '💻', 'Máy tính bảng': '📟',
      'Phụ kiện': '🎧', 'Tivi': '📺', 'Đồng hồ thông minh': '⌚',
      'Máy tính': '🖥️', 'Camera': '📷',
    };
    return m[name] ?? '📦';
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.userName = '';
    this.logoutToastVisible = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.logoutToastVisible = false;
      this.cdr.detectChanges();
    }, 3000);
  }
  toggleAbout(key: string) {
    this.openAboutKey = this.openAboutKey === key ? null : key;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
  openChatbot() {
    this.isChatOpen = true;
  }
  getStars(rating: number): string[] {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if      (rating >= i)        stars.push('full');
      else if (rating >= i - 0.5)  stars.push('half');
      else                         stars.push('empty');
    }
    return stars;
  }

  getRating(productID: number): number {
    return this.ratingMap.get(productID) ?? 0;
  }

  getReviewCount(productID: number): number {
    return this.reviewCountMap.get(productID) ?? 0;
  }
  getRamRom(productID: number): string {
    return this.ramRomMap.get(productID) ?? '';
  }
}