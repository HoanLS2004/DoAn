// user-management.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOnlyDirective } from '../../guards/adminonly.directive';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

interface Toast { show: boolean; message: string; type: 'success' | 'error'; }

interface User {
  userID:     number;
  fullName:   string;
  email:      string;
  phone:      string;
  role:       string;
  createdAt:  string;
}

interface UserForm {
  fullName: string;
  email:    string;
  password: string;
  phone:    string;
  role:     string;
}

const EMPTY_FORM = (): UserForm => ({
  fullName: '', email: '', password: '', phone: '', role: 'Customer',
});

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminOnlyDirective],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
})
export class UserManagementComponent implements OnInit {

  private readonly API = 'https://inconceivable-matrilineal-gaylene.ngrok-free.dev';

  users:         User[] = [];
  filteredUsers: User[] = [];
  searchText  = '';
  filterRole  = '';
  isEdit      = false;
  form: UserForm = EMPTY_FORM();

  toast: Toast = { show: false, message: '', type: 'success' };

  // Popup: view detail
  viewPopup: { show: boolean; user: User | null } = { show: false, user: null };

  // Popup: add / edit form
  formPopup: { show: boolean; loading: boolean } = { show: false, loading: false };

  // Popup: delete confirm
  delPopup: { show: boolean; id: number; fullName: string; email: string; loading: boolean } =
    { show: false, id: 0, fullName: '', email: '', loading: false };

  // Pagination
  readonly PAGE_SIZE = 20;
  currentPage = 1;

  private editingId?: number;

  get totalRecords(): number { return this.users.length; }
  get totalPages(): number   { return Math.max(1, Math.ceil(this.filteredUsers.length / this.PAGE_SIZE)); }
  get pagedUsers(): User[] {
    const s = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filteredUsers.slice(s, s + this.PAGE_SIZE);
  }

  pageNumbers(): number[] {
    const total = this.totalPages, cur = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }
  goPage(p: number): void { if (p >= 1 && p <= this.totalPages) this.currentPage = p; }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  // ── LOAD ─────────────────────────────────────────────
  load(): void {
    this.http.get<User[]>(`${this.API}/api/users`).subscribe({
      next: (res: any) => {
        // API có thể trả về: array thẳng, { data: [] }, { users: [] }, { value: [] }
        if (Array.isArray(res)) {
          this.users = res;
        } else if (Array.isArray(res?.data)) {
          this.users = res.data;
        } else if (Array.isArray(res?.users)) {
          this.users = res.users;
        } else if (Array.isArray(res?.value)) {
          this.users = res.value;
        } else {
          this.users = [];
          console.warn('API response không phải array:', res);
        }
        this.filteredUsers = [...this.users];
        this.currentPage   = 1;
        this.cdr.detectChanges();
      },
      error: () => this.showToast('❌ Không tải được danh sách người dùng', 'error'),
    });
  }

  // ── SEARCH / FILTER ───────────────────────────────────
  onSearch(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filteredUsers = this.users.filter(u => {
      const matchText = !q ||
        (u.fullName ?? '').toLowerCase().includes(q) ||
        (u.email    ?? '').toLowerCase().includes(q) ||
        (u.phone    ?? '').toLowerCase().includes(q);
      const matchRole = !this.filterRole || u.role === this.filterRole;
      return matchText && matchRole;
    });
    this.currentPage = 1;
  }

  clearSearch(): void { this.searchText = ''; this.filterRole = ''; this.onSearch(); }

  // ── STAT ─────────────────────────────────────────────
  countByRole(role: string): number {
    return this.users.filter(u => u.role === role).length;
  }

  // ── POPUP: VIEW ───────────────────────────────────────
  openViewPopup(u: User): void { this.viewPopup = { show: true, user: u }; }
  closeViewPopup(): void { this.viewPopup = { show: false, user: null }; }

  editFromView(u: User | null): void {
    if (!u) return;
    this.closeViewPopup();
    setTimeout(() => this.openEditPopup(u), 180);
  }

  // ── POPUP: ADD ────────────────────────────────────────
  openAddPopup(): void {
    this.isEdit      = false;
    this.editingId   = undefined;
    this.form        = EMPTY_FORM();
    this.formPopup   = { show: true, loading: false };
  }

  // ── POPUP: EDIT ───────────────────────────────────────
  openEditPopup(u: User): void {
    this.isEdit    = true;
    this.editingId = u.userID;
    this.form = {
      fullName: u.fullName,
      email:    u.email,
      password: '',
      phone:    u.phone || '',
      role:     u.role,
    };
    this.formPopup = { show: true, loading: false };
  }

  closeFormPopup(): void {
    if (this.formPopup.loading) return;
    this.formPopup = { show: false, loading: false };
  }

  // ── POPUP: DELETE ─────────────────────────────────────
  openDelPopup(u: User): void {
    this.delPopup = { show: true, id: u.userID, fullName: u.fullName, email: u.email, loading: false };
  }
  closeDelPopup(): void { if (!this.delPopup.loading) this.delPopup.show = false; }

  // ── CRUD ─────────────────────────────────────────────
  create(): void {
    if (!this.form.fullName.trim() || !this.form.email.trim()) {
      this.showToast('Vui lòng nhập đầy đủ họ tên và email', 'error'); return;
    }
    this.formPopup.loading = true;
    const payload: any = {
      FullName: this.form.fullName.trim(),
      Email:    this.form.email.trim(),
      Phone:    this.form.phone.trim(),
      Role:     this.form.role,
    };
    if (this.form.password.trim()) payload.Password = this.form.password.trim();

    this.http.post<User>(`${this.API}/api/users`, payload).subscribe({
      next: () => {
        this.formPopup.loading = false;
        this.formPopup.show    = false;
        this.showToast('✅ Thêm người dùng thành công!', 'success');
        this.load();
      },
      error: () => {
        this.formPopup.loading = false;
        this.showToast('❌ Thêm thất bại — kiểm tra lại kết nối server', 'error');
      },
    });
  }

  update(): void {
    if (!this.editingId) {
      this.showToast('❌ Không tìm được ID người dùng', 'error'); return;
    }
    this.formPopup.loading = true;
    const payload: any = {
      FullName: this.form.fullName.trim(),
      Email:    this.form.email.trim(),   // API yêu cầu Email kể cả khi update
      Phone:    this.form.phone.trim(),
      Role:     this.form.role,
    };
    if (this.form.password.trim()) payload.Password = this.form.password.trim();

    this.http.put(`${this.API}/api/users/${this.editingId}`, payload).subscribe({
      next: () => {
        this.formPopup.loading = false;
        this.formPopup.show    = false;
        this.showToast('💾 Cập nhật thành công!', 'success');
        this.load();
      },
      error: () => {
        this.formPopup.loading = false;
        this.showToast('❌ Cập nhật thất bại — kiểm tra lại kết nối server', 'error');
      },
    });
  }

  confirmDelete(): void {
    this.delPopup.loading = true;
    this.http.delete(`${this.API}/api/users/${this.delPopup.id}`).subscribe({
      next: () => {
        this.showToast(`🗑️ Đã xóa người dùng ${this.delPopup.fullName}`, 'success');
        this.delPopup.show = false;
        this.load();
      },
      error: () => {
        this.delPopup.loading = false;
        this.showToast('❌ Xóa thất bại', 'error');
      },
    });
  }

  // ── HELPERS ──────────────────────────────────────────
  getInitial(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1]?.[0]?.toUpperCase() ?? '?';
  }

  getRoleIcon(role: string): string {
    if (role === 'Admin')    return '🛡️';
    if (role === 'Staff')    return '🧑‍💼';
    if (role === 'Customer') return '🛒';
    return '👤';
  }

  // Phím Escape đóng popup
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.delPopup.show)       this.closeDelPopup();
    else if (this.formPopup.show) this.closeFormPopup();
    else if (this.viewPopup.show) this.closeViewPopup();
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message: msg, type };
    setTimeout(() => (this.toast.show = false), 2800);
  }
}