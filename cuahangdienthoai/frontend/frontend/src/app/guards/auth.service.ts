// auth.service.ts
import { Injectable } from '@angular/core';

export type UserRole = 'Admin' | 'Staff' | 'Customer' | null;

@Injectable({ providedIn: 'root' })
export class AuthService {

  getRole(): UserRole {
    try {
      // Login lưu: localStorage.setItem('role', res.role)
      const role = localStorage.getItem('role') || sessionStorage.getItem('role');
      if (role) return role as UserRole;

      // Fallback: nếu lưu dạng object { role: '...' }
      const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        return user?.role ?? user?.Role ?? null;
      }
      return null;
    } catch { return null; }
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  isLoggedIn():     boolean { return !!this.getToken(); }
  isAdmin():        boolean { return this.getRole() === 'Admin'; }
  isStaff():        boolean { return this.getRole() === 'Staff'; }
  isAdminOrStaff(): boolean {
    const r = this.getRole();
    return r === 'Admin' || r === 'Staff';
  }
}