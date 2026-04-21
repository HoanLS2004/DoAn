import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../config/api.config';
export interface Review {
  reviewID: number;
  productID: number;
  userID: number;
  userName:  string; 
  rating: number;
  comment: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {

  private api = `${API_BASE_URL}/reviews`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Review[]> {
    return this.http.get<Review[]>(this.api).pipe(
      map(reviews => reviews.map(r => ({
        ...r,
        rating:    Number(r.rating),
        reviewID:  Number(r.reviewID),
        productID: Number(r.productID),
        userID:    Number(r.userID),
      })))
    );
  }

  getByProduct(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.api}/product/${productId}`).pipe(
      map(reviews => reviews.map(r => ({
        ...r,
        rating:    Number(r.rating),
        reviewID:  Number(r.reviewID),
        productID: Number(r.productID),
        userID:    Number(r.userID),
      })))
    );
  }

  create(data: any) {
    return this.http.post(this.api, data);
  }

  update(id: number, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  getAverage(productId: number) {
    return this.http.get<any>(`${this.api}/avg/${productId}`);
  }
}