import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Brand } from './brand.model';
import { API_BASE_URL } from '../../config/api.config';
@Injectable({ providedIn: 'root' })
export class BrandService {
  private apiUrl = `${API_BASE_URL}/api/brands`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  getAll() {
    return this.http.get<Brand[]>(this.apiUrl);
  }

  create(data: { name: string; status?: boolean }) {
    return this.http.post(
      this.apiUrl,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  update(id: number, data: { name: string; status?: boolean }) {
    return this.http.put(
      `${this.apiUrl}/${id}`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  delete(id: number) {
    return this.http.delete(
      `${this.apiUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }
}