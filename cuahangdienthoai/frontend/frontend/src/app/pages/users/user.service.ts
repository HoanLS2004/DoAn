import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user.model';
import { UserCreateDTO } from './user.model'; 

import { UserUpdateDTO } from './user.model'; 

interface UserApiResponse {
  totalRecords: number;
  page: number;
  pageSize: number;
  data: User[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5201/api/users';

  constructor(private http: HttpClient) {}

  getUsers(page = 1, pageSize = 10, keyword = ''): Observable<UserApiResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (keyword) {
      params = params.set('keyword', keyword);
    }
    return this.http.get<UserApiResponse>(this.apiUrl, { params });
  }

 createUser(user: UserCreateDTO) {
    return this.http.post(this.apiUrl, user);
  }

 updateUser(id: number, user: UserUpdateDTO) {
  return this.http.put(`${this.apiUrl}/${id}`, user);
}

  deleteUser(id: number) {
    return this.http.delete(`http://localhost:5201/api/users/${id}`);
  }
}
