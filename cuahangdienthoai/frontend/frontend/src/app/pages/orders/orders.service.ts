import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from './order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = 'http://localhost:5201/api/orders'; // 🔥 thống nhất

  constructor(private http: HttpClient) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  getOrder(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createOrder(payload: any) {
    return this.http.post(this.apiUrl, payload);
  }

  updateStatus(id: number, status: string) {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status });
  }
  updateOrderInfo(id: number, dto: { receiverName: string; receiverPhone: string; shippingAddress: string }) {
      return this.http.put(`${this.apiUrl}/${id}/info`, dto);
    }

  deleteOrder(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getPendingOrdersCount() {
    return this.http.get(`${this.apiUrl}/count-pending`);
  }

  getRevenue() {
    return this.http.get<any>(`${this.apiUrl}/revenue`);
  }

}

