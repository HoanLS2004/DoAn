import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ShoppingCart {
  productID: number;
  productName: string;
  price: number;
  discount: number;
  quantity: number;
  thumbnail: string;
  stockQuantity: number;
  selected?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ShoppingCartService {

  private apiUrl = 'http://localhost:5201/api/cart';

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  getCart(): Observable<ShoppingCart[]> {
  return this.http.get<ShoppingCart[]>(this.apiUrl, this.getAuthHeaders());
}

  addToCart(productId: number) {
  return this.http.post(
    `${this.apiUrl}/add?productId=${productId}&quantity=1`,
    {},
    this.getAuthHeaders()
  );
}

  updateQuantity(productId: number, quantity: number) {
    return this.http.put(
      `${this.apiUrl}/update?productId=${productId}&quantity=${quantity}`,
      {},
      this.getAuthHeaders()
    );
  }

  remove(productId: number) {
    return this.http.delete(
      `${this.apiUrl}/remove?productId=${productId}`,
      this.getAuthHeaders()
    );
  }

  clear() {
    return this.http.delete(
      `${this.apiUrl}/clear`,
      this.getAuthHeaders()
    );
  }
}