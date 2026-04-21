import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ProductDto, ProductCreateDto, ProductUpdateDto } from './products.model';
import { Observable } from 'rxjs';
import { Category } from '../category/category.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = 'https://localhost:7152/api/products';
  private brandUrl = 'https://localhost:7152/api/brands';
  private categoryUrl = 'https://localhost:7152/api/category';


  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Lấy token sau khi login
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }
  createProduct(dto: ProductCreateDto): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.apiUrl, dto, { headers: this.getAuthHeaders() });
  }

  updateProduct(id: number, dto: ProductUpdateDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto, { headers: this.getAuthHeaders() });
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  getBrands(): Observable<{ brandID: number; name: string }[]> {
    return this.http.get<{ brandID: number; name: string }[]>(this.brandUrl, { headers: this.getAuthHeaders() });
  }
 getTotalProducts() {
  return this.http.get<{ total: number }>(
    `${this.apiUrl}/total`
    );
  }
  getProductById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
   getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.categoryUrl);
  }
  getTotalActiveProducts() {
    return this.http.get<any>('http://localhost:5201/api/products/total-active');
  }
  getProducts(params?: any): Observable<{ items: ProductDto[], totalItems: number }> {
  const defaultParams = { pageSize: 999, page: 1, ...(params || {}) };
  return this.http.get<{ items: ProductDto[], totalItems: number }>(
    this.apiUrl,
    { params: defaultParams }
  );
}
}

