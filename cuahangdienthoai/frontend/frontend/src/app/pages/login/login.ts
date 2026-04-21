import { Component, AfterViewInit, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../../config/api.config';
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  visible: boolean;
  leaving: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  isLogin = true;

  email = '';
  password = '';
  showPassword = false;

  registerFullName = '';
  registerEmail = '';
  registerPassword = '';
  registerPhone = '';

  registerFullNameError = '';
  registerEmailError = '';
  registerPasswordError = '';
  registerPhoneError = '';
  forgotPopup = false;

  toasts: Toast[] = [];
  private toastCounter = 0;

  constructor(private http: HttpClient, private router: Router, private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initAnimatedBg();
    });}
  /* ─── Background Animation ─── */
  private initAnimatedBg(): void {
    // Fireflies
    const canvas = document.getElementById('fireflies-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d')!;
    const ff = Array.from({ length: 40 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.6 + 0.8,
      vx: (Math.random() - .5) * 0.35,
      vy: (Math.random() - .5) * 0.35,
      life: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.018 + 0.008,
      maxA: Math.random() * 0.5 + 0.15
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ff.forEach(f => {
        f.life += f.speed;
        f.x += f.vx;
        f.y += f.vy;
        if (f.x < 0) f.x = W;
        if (f.x > W) f.x = 0;
        if (f.y < 0) f.y = H;
        if (f.y > H) f.y = 0;
        const a = Math.abs(Math.sin(f.life)) * f.maxA;
        ctx.save();
        ctx.globalAlpha = a;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 3.5);
        g.addColorStop(0, 'rgba(244,63,94,0.9)');
        g.addColorStop(1, 'rgba(244,63,94,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(draw);
    };
    draw();

    // Sparks
    const sp = document.getElementById('sparks-container');
    if (!sp) return;
    [[8,20],[22,65],[78,12],[91,50],[15,80],[60,8],[70,75],[45,55],[35,30],[85,85]]
      .forEach(([x, y], i) => {
        const el = document.createElement('div');
        el.className = 'spark';
        const angle = (Math.random() * 60 - 30) + 'deg';
        el.style.cssText = `left:${x}%;top:${y}%;--r:${angle};`
          + `animation-duration:${2.2 + i * 0.35}s;animation-delay:${i * 0.28}s`;
        sp.appendChild(el);
      });
  }

 /* ─── Toast System ─── */
  showToast(type: ToastType, title: string, message: string): void {
    this.ngZone.run(() => {
      const id = ++this.toastCounter;
      const toast: Toast = { id, type, title, message, visible: false, leaving: false };
      this.toasts = [...this.toasts, toast];         

      setTimeout(() => {
        this.ngZone.run(() => {
          const t = this.toasts.find(x => x.id === id);
          if (t) {
            t.visible = true;
            this.toasts = [...this.toasts];          
          }
        });
      }, 20);

      setTimeout(() => this.dismissToast(id), 4000);
    });
  }

  dismissToast(id: number): void {
    this.ngZone.run(() => {
      const toast = this.toasts.find(t => t.id === id);
      if (!toast || toast.leaving) return;
      toast.leaving = true;
      this.toasts = [...this.toasts];                  

      setTimeout(() => {
        this.ngZone.run(() => {
          this.toasts = this.toasts.filter(t => t.id !== id);
        });
      }, 500);
    });
}

  /* ─── Auth Actions ─── */
  onLogin(): void {
    if (!this.email.trim()) {
      this.showToast('error', 'Thiếu thông tin', 'Tài khoản không được để trống!');
      return;
    }
    if (!this.password.trim()) {
      this.showToast('error', 'Thiếu thông tin', 'Mật khẩu không được để trống!');
      return;
    }

    this.http
      .post<{ token: string; role: string }>(`${API_BASE_URL}/api/auth/login`, {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', res.role);
          this.showToast('success', 'Đăng nhập thành công!', 'Chào mừng bạn trở lại 👋');
          setTimeout(() => {
            if (res.role !== 'Admin' && res.role !== 'Staff') {
              localStorage.setItem('justLoggedIn', '1');
            }
            this.router.navigate(
              res.role === 'Admin' || res.role === 'Staff' ? ['/admin'] : ['/']
            );
          }, 1400);
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Sai tài khoản hoặc mật khẩu. Vui lòng thử lại.';
          this.showToast('error', 'Đăng nhập thất bại', msg);
        },
      });
  }

  onRegister(): void {
  // Reset errors
  this.registerFullNameError = '';
  this.registerEmailError = '';
  this.registerPasswordError = '';
  
  let hasError = false;

  if (!this.registerFullName.trim()) {
    this.registerFullNameError = 'Họ và tên không được để trống!';
    hasError = true;
  }
  
  if (!this.registerEmail.trim()) {
    this.registerEmailError = 'Email không được để trống!';
    hasError = true;
  }
  
  if (!this.registerPassword.trim()) {
    this.registerPasswordError = 'Mật khẩu không được để trống!';
    hasError = true;
  } else if (this.registerPassword.length < 8) {
    this.registerPasswordError = 'Mật khẩu phải có ít nhất 8 ký tự!';
    hasError = true;
  } else if (!/[A-Z]/.test(this.registerPassword)) {
    this.registerPasswordError = 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa!';
    hasError = true;
  } 
  if (!this.registerPhone.trim()) {
    this.registerPhoneError = 'Số điện thoại không được để trống!';
    hasError = true;
  }else if (this.registerPhone.length > 10) {  
    this.registerPhoneError = 'Số điện thoại không được vượt quá 10 ký tự.';
    hasError = true;
  }else if (!/^\d+$/.test(this.registerPhone)) {
    this.registerPhoneError = 'Số điện thoại chỉ được chứa chữ số.';
    hasError = true;
  }

  if (hasError) return;

  this.http
    .post('http://localhost:5201/api/auth/register', {
      fullName: this.registerFullName,
      email: this.registerEmail,
      password: this.registerPassword,
      phone: this.registerPhone,
    })
    .subscribe({
      next: () => {
        this.showToast('success', 'Đăng ký thành công!', 'Tài khoản đã sẵn sàng. Hãy đăng nhập!');
        setTimeout(() => (this.isLogin = true), 1400);
      },
      error: (err) => {
        if (err.status === 400) {
          const msg = err?.error?.message ?? err?.error ?? 'Email hoặc tài khoản đã được sử dụng.';
          this.showToast('error', 'Đăng ký thất bại', msg);
        } else {
          this.showToast('error', 'Đăng ký thất bại', 'Đã có lỗi xảy ra. Vui lòng thử lại.');
        }
      },
    });
}
  onMicrosoftLogin(): void {
    this.showToast('info', 'Đang kết nối...', 'Đang chuyển hướng đến Microsoft.');
  }
}