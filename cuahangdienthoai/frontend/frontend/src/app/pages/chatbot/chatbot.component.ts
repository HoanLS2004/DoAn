// chatbot.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChangeDetectorRef } from '@angular/core';
import { API_BASE_URL } from '../../config/api.config';
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
})
export class ChatbotComponent {

  open     = false;
  typing   = false;
  message  = '';
  messages: { role: 'user' | 'bot'; text: string }[] = [];

  constructor(private http: HttpClient, private san: DomSanitizer, private cdr: ChangeDetectorRef,) {}

  // ── Toggle cửa sổ chat ─────────────────────────────
  toggle(): void { this.open = !this.open; }

  // ── Câu hỏi nhanh ──────────────────────────────────
  sendQuick(text: string): void {
    this.message = text;
    this.send();
  }

  // ── Gửi tin nhắn ───────────────────────────────────
  send(): void {
    const text = this.message.trim();
    if (!text || this.typing) return;

    this.messages = [...this.messages, { role: 'user', text }];
    this.message  = '';
    this.typing   = true;
    this.scroll();

    this.http.post<{ reply: string }>(`${API_BASE_URL}/chat`, { message: text })
      .subscribe({
        next: res => {
          this.typing   = false;
          this.messages = [...this.messages, { role: 'bot', text: res.reply ?? '' }];
          this.scroll();
          this.cdr.detectChanges();
        },
        error: () => {
          this.typing   = false;
          this.messages = [...this.messages, {
            role: 'bot',
            text: '❌ Xin lỗi, không kết nối được server. Vui lòng thử lại!',
          }];
          this.scroll();
        },
      });
  }

  // ── Render text bot: link in đậm + xuống dòng ──────
  renderText(raw: string): SafeHtml {
    if (!raw) return '';

    // 1. Escape HTML tránh XSS
    let html = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. URL → link in đậm, mở tab mới
    html = html.replace(/(https?:\/\/[^\s<>"']+)/g, url => {
      const label = url.length > 44 ? url.slice(0, 41) + '…' : url;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer"><strong>${label}</strong></a>`;
    });

    // 3. **bold** markdown
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // 4. Dòng mới → <br>
    html = html.replace(/\n/g, '<br>');

    return this.san.bypassSecurityTrustHtml(html);
  }

  // ── Scroll xuống cuối ──────────────────────────────
  private scroll(): void {
    setTimeout(() => {
      const el = document.getElementById('chat-body');
      if (el) el.scrollTop = el.scrollHeight;
    }, 60);
  }
}