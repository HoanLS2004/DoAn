// product.component.ts
import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from './products.service';
import { ProductDto, ProductCreateDto, ProductUpdateDto } from './products.model';
import { Router } from '@angular/router';

interface Toast { show: boolean; message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './product.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductComponent implements OnInit {

  products: ProductDto[] = [];
  total    = 0;
  page     = 1;
  pageSize = 5;
  search   = '';

  brands:     { brandID: number; brandName: string }[] = [];
  categories: { categoryID: string; name: string }[]   = [];

  form!: FormGroup;
  isEdit           = false;
  editingProductId: number | null = null;

  toast: Toast = { show: false, message: '', type: 'success' };

  // ── Popup: thêm / sửa ─────────────────────────────────────
  formPopup: { show: boolean; loading: boolean } = { show: false, loading: false };

  // ── Popup: xóa ────────────────────────────────────────────
  delPopup: { show: boolean; id: number; name: string; brandName: string; loading: boolean } =
    { show: false, id: 0, name: '', brandName: '', loading: false };

  constructor(
    private productService: ProductService,
    private fb:             FormBuilder,
    private router:         Router,
    private cdr:            ChangeDetectorRef,
  ) {}

  // ── INIT ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
    this.loadBrands();
    this.loadCategories();
  }

  initForm(): void {
    this.form = this.fb.group({
      name:          ['', Validators.required],
      brandID:       [null, Validators.required],
      categoryID:    ['',   Validators.required],
      price:         [0, [Validators.required, Validators.min(0)]],
      discount:      [0,  Validators.min(0)],
      description:   [''],
      stockQuantity: [0,  Validators.min(0)],
      status:        [true],
    });
  }

  // ── LOAD ──────────────────────────────────────────────────
  loadProducts(): void {
    this.productService
      .getProducts({ search: this.search, page: this.page, pageSize: this.pageSize })
      .subscribe({
        next: res => {
          this.products = [...res.items];
          this.total    = res.totalItems;
          this.cdr.detectChanges();
        },
        error: () => this.showToast('Không tải được sản phẩm', 'error'),
      });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (res: any) => {
        this.categories = Array.isArray(res) ? res : (res.items ?? []);
        this.cdr.detectChanges();
      },
      error: () => this.showToast('Không tải được danh mục', 'error'),
    });
  }

  loadBrands(): void {
    this.productService.getBrands().subscribe(data => {
      this.brands = data.map(b => ({ brandID: b.brandID, brandName: b.name }));
    });
  }

  // ── SEARCH ────────────────────────────────────────────────
  searchProducts(): void {
    this.page = 1;
    this.loadProducts();
  }

  // ── POPUP: THÊM ───────────────────────────────────────────
  openAddPopup(): void {
    this.isEdit          = false;
    this.editingProductId = null;
    this.form.reset({ status: true, price: 0, discount: 0, stockQuantity: 0 });
    this.formPopup = { show: true, loading: false };
  }

  // ── POPUP: SỬA ────────────────────────────────────────────
  openEditPopup(p: ProductDto): void {
    this.isEdit          = true;
    this.editingProductId = p.productID;
    this.form.patchValue({
      name: p.name, brandID: p.brandID, categoryID: p.categoryID,
      price: p.price, discount: p.discount, description: p.description,
      stockQuantity: p.stockQuantity, status: p.status,
    });
    this.formPopup = { show: true, loading: false };
  }

  closeFormPopup(): void {
    if (this.formPopup.loading) return;
    this.formPopup = { show: false, loading: false };
    this.editingProductId = null;
    this.form.reset({ status: true, price: 0, discount: 0, stockQuantity: 0 });
  }

  // ── POPUP: XÓA ────────────────────────────────────────────
  openDelPopup(p: ProductDto): void {
    this.delPopup = { show: true, id: p.productID, name: p.name, brandName: p.brandName ?? '', loading: false };
  }

  closeDelPopup(): void {
    if (this.delPopup.loading) return;
    this.delPopup = { show: false, id: 0, name: '', brandName: '', loading: false };
  }

  confirmDelete(): void {
    this.delPopup.loading = true;
    this.productService.deleteProduct(this.delPopup.id).subscribe({
      next: () => {
        this.showToast(`🗑️ Đã xóa sản phẩm "${this.delPopup.name}"`, 'success');
        this.delPopup = { show: false, id: 0, name: '', brandName: '', loading: false };
        this.loadProducts();
      },
      error: () => { this.delPopup.loading = false; this.showToast('Xóa thất bại', 'error'); },
    });
  }

  // ── SAVE (thêm hoặc sửa) ──────────────────────────────────
  saveProduct(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.formPopup.loading = true;
    const dto: ProductCreateDto | ProductUpdateDto = this.form.value;

    if (this.isEdit && this.editingProductId) {
      this.productService.updateProduct(this.editingProductId, dto).subscribe({
        next: () => {
          this.formPopup.loading = false;
          this.showToast('💾 Cập nhật sản phẩm thành công!', 'success');
          this.closeFormPopup();
          this.loadProducts();
        },
        error: () => { this.formPopup.loading = false; this.showToast('Cập nhật thất bại', 'error'); },
      });
    } else {
      this.productService.createProduct(dto).subscribe({
        next: () => {
          this.formPopup.loading = false;
          this.showToast('➕ Thêm sản phẩm thành công!', 'success');
          this.closeFormPopup();
          this.loadProducts();
        },
        error: () => { this.formPopup.loading = false; this.showToast('Thêm sản phẩm thất bại', 'error'); },
      });
    }
  }

  // ── PAGINATION ────────────────────────────────────────────
  changePage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadProducts();
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.total / this.pageSize)); }

  pageNumbers(): number[] {
    const total = this.totalPages, cur = this.page;
    if (total <= 10) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  // ── STATS ─────────────────────────────────────────────────
  countByStatus(status: boolean): number { return this.products.filter(p => p.status === status).length; }
  countDiscounted(): number              { return this.products.filter(p => p.discount > 0).length; }

  // ── ESCAPE KEY ────────────────────────────────────────────
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.delPopup.show)   this.closeDelPopup();
    else if (this.formPopup.show) this.closeFormPopup();
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message: msg, type };
    setTimeout(() => (this.toast.show = false), 2800);
  }

  goToHome(): void { this.router.navigate(['/home']); }
}