import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../config/api.config';
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="container">
    <h2>📱 Danh sách sản phẩm</h2>

    <div class="grid">
      <div class="card" *ngFor="let p of products">
        <img [src]="${API_BASE_URL}" + (p.thumbnailUrl || '/uploads/default.png')" />

        <h3>{{ p.name }}</h3>

        <p class="price">
          {{ p.price | number }} đ
        </p>

        <button (click)="viewDetail(p.productID)">Xem chi tiết</button>
        <button (click)="addToCart(p)">🛒 Thêm giỏ</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
    }
    .card {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: center;
      border-radius: 10px;
    }
    img {
      width: 100%;
      height: 150px;
      object-fit: cover;
    }
    .price {
      color: red;
      font-weight: bold;
    }
    button {
      margin: 5px;
      padding: 5px 10px;
      cursor: pointer;
    }
  `]
})
export class ProductListComponent implements OnInit {

  products: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<any>(`${API_BASE_URL}/api/products`)
      .subscribe(res => {
        this.products = res.items;
      });
  }

  viewDetail(id: number) {
    this.router.navigate(['/user/products', id]);
  }

  addToCart(product: any) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const index = cart.findIndex((x: any) => x.productID === product.productID);

    if (index > -1) {
      cart[index].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    alert('✅ Đã thêm vào giỏ hàng');
  }
}