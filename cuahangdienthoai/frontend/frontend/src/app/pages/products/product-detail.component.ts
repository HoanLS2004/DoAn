import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../config/api.config';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="container" *ngIf="product">

    <div class="left">
      <img [src]="API_BASE_URL + product.imageUrl" class="main-img"/>

      <div class="thumbs">
        <img *ngFor="let img of images"
             [src]="API_BASE_URL + img.imageUrl"
             (click)="product.imageUrl = img.imageUrl"/>
      </div>
    </div>

    <div class="right">
      <h2>{{ product.name }}</h2>

      <p class="price">{{ product.price | number }} đ</p>

      <p>{{ product.description }}</p>

      <button (click)="addToCart()">🛒 Thêm giỏ hàng</button>
    </div>

  </div>
  `,
  styles: [`
    .container {
      display: flex;
      gap: 30px;
      padding: 20px;
    }
    .left { width: 50%; }
    .right { width: 50%; }

    .main-img {
      width: 100%;
      height: 300px;
      object-fit: cover;
    }

    .thumbs img {
      width: 60px;
      margin: 5px;
      cursor: pointer;
      border: 1px solid #ccc;
    }

    .price {
      color: red;
      font-size: 20px;
      font-weight: bold;
    }

    button {
      padding: 10px;
      margin-top: 10px;
    }
  `]
})
export class ProductDetailComponent implements OnInit {

  product: any;
  images: any[] = [];
  id!: number;
  API_BASE_URL = API_BASE_URL;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProduct();
    this.loadImages();
  }

  loadProduct() {
    this.http.get(`${API_BASE_URL}/api/products/${this.id}`)
      .subscribe(res => this.product = res);
  }

  loadImages() {
    this.http.get<any[]>(`${API_BASE_URL}/api/ProductImages?productId=${this.id}`)
      .subscribe(res => this.images = res);
  }
  addToCart() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập!');
      return;
    }
    this.http.post(
      `${API_BASE_URL}/api/cart/add?productId=${this.product.productID}&quantity=1`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: () => alert('✅ Đã thêm vào giỏ hàng'),
      error: () => alert('❌ Thêm thất bại')
    });
  }
}