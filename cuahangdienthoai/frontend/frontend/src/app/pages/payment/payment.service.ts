import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Payment {
  paymentID: number;
  orderID: number;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  transactionID?: string;
  paidAt?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private api = 'http://localhost:5201/api/payments';

  constructor(private http: HttpClient) {}

  // ==========================
  // GET ALL + SEARCH (backend filter)
  // ==========================
  getAll(status?: string, method?: string): Observable<Payment[]> {
    let params = new HttpParams();

    if (status) params = params.set('status', status);
    if (method) params = params.set('method', method);

    return this.http.get<Payment[]>(this.api, { params });
  }

  // ==========================
  // GET BY ID
  // ==========================
  getById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.api}/${id}`);
  }

  // ==========================
  // CREATE
  // ==========================
  create(data: any) {
    return this.http.post(this.api, data);
  }

  // ==========================
  // UPDATE
  // ==========================
  update(id: number, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  // ==========================
  // DELETE
  // ==========================
  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  // ==========================
  // FAKE PAY
  // ==========================
  fakePay(orderId: number) {
    return this.http.post(`${this.api}/${orderId}/pay`, {});
  }

  // ==========================
  // CHECK STATUS
  // ==========================
  checkStatus(orderId: number) {
    return this.http.get(`${this.api}/${orderId}/status`);
  }
}