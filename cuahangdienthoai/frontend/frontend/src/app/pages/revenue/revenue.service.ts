import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
export interface RevenueDto {
  period: string;        // ISO date
  totalRevenue: number;
  totalOrders: number;
}

@Injectable({ providedIn: 'root' })
export class RevenueService {
  private apiUrl = `${API_BASE_URL}/api/revenue`;

  constructor(private http: HttpClient) {}

  getByDay(): Observable<RevenueDto[]> {
    return this.http.get<RevenueDto[]>(`${this.apiUrl}/day`);
  }

  getByMonth(): Observable<RevenueDto[]> {
    return this.http.get<RevenueDto[]>(`${this.apiUrl}/month`);
  }

  getByYear(): Observable<RevenueDto[]> {
    return this.http.get<RevenueDto[]>(`${this.apiUrl}/year`);
  }
}
