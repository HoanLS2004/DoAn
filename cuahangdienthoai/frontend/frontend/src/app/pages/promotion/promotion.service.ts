// src/app/services/promotion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
export interface Promotion {
  promotionID?: number;
  code: string;
  description?: string;
  discountType: string;    // "Percent" hoặc "Amount"
  discountValue: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  quantity: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class PromotionService {
  private apiUrl = `${API_BASE_URL}/api/Promotions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.apiUrl);
  }

  getById(id: number): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.apiUrl}/${id}`);
  }

  create(promo: Promotion): Observable<Promotion> {
    return this.http.post<Promotion>(this.apiUrl, promo);
  }

  update(id: number, promo: Promotion): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, promo);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  applyPromotion(code: string, orderValue: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/apply?code=${code}&orderValue=${orderValue}`, {}
    );
  }
}
