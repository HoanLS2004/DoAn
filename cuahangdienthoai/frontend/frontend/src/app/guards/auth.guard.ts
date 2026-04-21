// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token       = localStorage.getItem('token') || sessionStorage.getItem('token');
    const role        = localStorage.getItem('role')  || sessionStorage.getItem('role');
    const allKeys     = Object.keys(localStorage);

    console.log('token:', token);
    console.log('role:', role);
    if (token) {
      console.log('✅ Có token → cho vào');
      return true;
    }

    console.log('❌ Không có token → redirect login');
    this.router.navigate(['/login']);
    return false;
  }
}