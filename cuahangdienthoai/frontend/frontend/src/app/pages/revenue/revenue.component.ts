import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import * as XLSX from 'xlsx-js-style';

interface ChartRow {
  label: string;    // Giờ / Ngày / Tháng
  value: number;    // Doanh thu
  orders: number;   // Số đơn hàng
  hasData: boolean;
}

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revenue.component.html',
  styleUrls: ['./revenue.component.css'],
})
export class RevenueComponent implements OnInit, OnDestroy {

  @ViewChild('revenueChart') chartRef!: ElementRef<HTMLCanvasElement>;

  viewType: 'day' | 'month' | 'year' = 'month';

  selectedDate  = new Date().toISOString().slice(0, 10);
  selectedMonth = new Date().toISOString().slice(0, 7);
  selectedYear  = new Date().getFullYear();

  years: number[] = [];
  chartData: ChartRow[] = [];
  chart?: Chart;
  isExporting = false;
  toastVisible  = false;
  toastMessage  = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer?: any;

  private apiBase = 'https://localhost:7152/api/revenue';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  // ── INIT ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const now = new Date().getFullYear();
    for (let y = now; y >= now - 5; y--) this.years.push(y);
    this.loadRevenue();
  }

  ngOnDestroy(): void { this.chart?.destroy(); }

  // ── LOAD DATA ─────────────────────────────────────────────────────────────
  loadRevenue(): void {
    let url = '';
    let params: any = {};

    if (this.viewType === 'day') {
      if (!this.selectedDate) return;
      url = `${this.apiBase}/day`;
      params.date = this.selectedDate;
    }

    if (this.viewType === 'month') {
      if (!this.selectedMonth) return;
      const [year, month] = this.selectedMonth.split('-');
      url = `${this.apiBase}/month`;
      params.year = year;
      params.month = month;
    }

    if (this.viewType === 'year') {
      url = `${this.apiBase}/year`;
      params.year = this.selectedYear;
    }

    this.http.get<any[]>(url, { params }).subscribe({
      next: data => this.processData(data),
      error: () => { this.chartData = []; this.chart?.destroy(); }
    });
    error: () => {
      this.chartData = [];
      this.chart?.destroy();
      this.showToast('Không tải được dữ liệu', 'error');
    }
  }

  // ── XỬ LÝ DỮ LIỆU: điền đủ khung giờ/ngày/tháng ─────────────────────────
  private processData(raw: any[]): void {
    const map = new Map<string, { revenue: number; orders: number }>();
    (raw ?? []).forEach(x => {
      const period: string = x.period ?? x.Period ?? '';
      if (!period) return;
      const key     = this.buildKey(period);
      const revenue = x.totalRevenue ?? x.TotalRevenue ?? 0;
      const orders  = x.totalOrders  ?? x.TotalOrders  ?? 0;
      const prev    = map.get(key) ?? { revenue: 0, orders: 0 };
      map.set(key, { revenue: prev.revenue + revenue, orders: prev.orders + orders });
    });

    this.chartData = this.buildFullSlots().map(slot => ({
      label:   slot.label,
      value:   map.get(slot.key)?.revenue ?? 0,
      orders:  map.get(slot.key)?.orders  ?? 0,
      hasData: map.has(slot.key),
    }));

    this.cdr.detectChanges();
    setTimeout(() => this.renderChart());
  }

  /**
   * API luôn trả về period dạng ISO: "YYYY-MM-DDTHH:00:00"
   * - /day   → group theo giờ  → lấy phần HH  → key = "10"
   * - /month → group theo ngày → lấy phần DD   → key = "20"
   * - /year  → group theo tháng → lấy phần MM  → key = "3"
   */
  private buildKey(period: string): string {
    // Bỏ milliseconds, chuẩn hoá space → T
    const s = period.replace(' ', 'T').split('.')[0];  // "2026-03-20T10:00:00"
    const [datePart, timePart = ''] = s.split('T');    // "2026-03-20", "10:00:00"
    const [, mm, dd] = datePart.split('-');             // ["2026","03","20"]
    const [hh]       = timePart.split(':');             // ["10","00","00"]

    if (this.viewType === 'day')   return String(Number(hh));   // "10"
    if (this.viewType === 'month') return String(Number(dd));   // "20"
    return String(Number(mm));                                   // "3"
  }

  /** Tạo toàn bộ slot: 0-23h / 1-n ngày / 1-12 tháng */
  private buildFullSlots(): { key: string; label: string }[] {
    if (this.viewType === 'day') {
      return Array.from({ length: 24 }, (_, h) => ({
        key:   String(h),
        label: `${String(h).padStart(2, '0')}h`,
      }));
    }

    if (this.viewType === 'month') {
      const [y, m] = this.selectedMonth.split('-').map(Number);
      const days = new Date(y, m, 0).getDate();          // số ngày trong tháng
      return Array.from({ length: days }, (_, i) => ({
        key:   String(i + 1),
        label: `${String(i + 1).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
      }));
    }

    // year → 12 tháng
    return Array.from({ length: 12 }, (_, i) => ({
      key:   String(i + 1),
      label: `T${i + 1}`,
    }));
  }

  // ── RENDER CHART ─────────────────────────────────────────────────────────
  renderChart(): void {
    if (!this.chartRef) return;
    this.chart?.destroy();

    const ctx    = this.chartRef.nativeElement.getContext('2d');
    const labels = this.chartData.map(r => r.label);
    const values = this.chartData.map(r => r.value);
    const max    = Math.max(...values, 1);

    // Màu: có doanh thu → đậm, không → xám nhạt
    const bgColors = this.chartData.map(r =>
      r.value === max && r.hasData ? 'rgba(215,0,24,0.90)'
      : r.hasData                  ? 'rgba(215,0,24,0.40)'
                                   : 'rgba(200,200,210,0.25)'
    );

    this.chart = new Chart(ctx!, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Doanh thu (₫)',
          data: values,
          backgroundColor: bgColors,
          borderColor: this.chartData.map(r =>
            r.hasData ? 'rgba(215,0,24,0.75)' : 'rgba(200,200,210,0.4)'
          ),
          borderWidth: 1.2,
          borderRadius: 5,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1f36',
            titleColor: '#fff',
            bodyColor: '#e2e5ed',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: items => {
                const lbl = items[0].label;
                if (this.viewType === 'day')   return `Giờ ${lbl}`;
                if (this.viewType === 'month') return `Ngày ${lbl}`;
                return `${lbl}/${this.selectedYear}`;
              },
              label: ctx => {
                const v = ctx.parsed.y as number;
                return v > 0
                  ? ` ${v.toLocaleString('vi-VN')}₫`
                  : ' Không có doanh thu';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#6b7394',
              font: { size: this.viewType === 'month' ? 9 : 11, weight: 600 },
              maxRotation: this.viewType === 'month' ? 60 : 0,
            },
            border: { display: false },
          },
          y: {
            grid: { color: '#f0f2f5' },
            ticks: {
              color: '#6b7394',
              font: { size: 11, weight: 600 },
              callback: v =>
                Number(v) >= 1_000_000
                  ? (Number(v) / 1_000_000).toFixed(1) + 'M₫'
                  : Number(v) > 0
                    ? Number(v).toLocaleString('vi-VN') + '₫'
                    : '0₫',
            },
            border: { display: false },
            beginAtZero: true,
          }
        }
      }
    });
  }

  // ── XUẤT EXCEL ───────────────────────────────────────────────────────────
  exportExcel(): void {
    if (!this.activeRows.length) return;
    this.isExporting = true;

    // ── Nhãn kỳ báo cáo ──────────────────────────────────────────────────
    let filterDisplay = '';
    let filterLabel   = '';
    if (this.viewType === 'day') {
      const [y, m, d] = this.selectedDate.split('-');
      filterDisplay = `Ngày ${d}/${m}/${y}`;
      filterLabel   = `Ngay_${d}-${m}-${y}`;
    }
    if (this.viewType === 'month') {
      const [y, m] = this.selectedMonth.split('-');
      filterDisplay = `Tháng ${m}/${y}`;
      filterLabel   = `Thang_${m}-${y}`;
    }
    if (this.viewType === 'year') {
      filterDisplay = `Năm ${this.selectedYear}`;
      filterLabel   = `Nam_${this.selectedYear}`;
    }

    const colLabel  = this.viewType === 'day' ? 'Giờ' : this.viewType === 'month' ? 'Ngày' : 'Tháng';
    const now       = new Date().toLocaleString('vi-VN');
    const maxRow    = this.activeRows.reduce((a, b) => b.value > a.value ? b : a, this.activeRows[0]);

    // Số thứ tự dòng (0-based) dùng để style sau
    const ROW_TITLE    = 0;   // Tiêu đề lớn
    const ROW_SUB      = 1;   // Công ty + kỳ
    const ROW_DATE     = 2;   // Ngày xuất
    const ROW_BLANK1   = 3;
    const ROW_SUM_HDR  = 4;   // "TỔNG HỢP"
    const ROW_SUM1     = 5;
    const ROW_SUM2     = 6;
    const ROW_SUM3     = 7;
    const ROW_SUM4     = 8;
    const ROW_SUM5     = 9;
    const ROW_BLANK2   = 10;
    const ROW_TBL_HDR  = 11;  // Header bảng chi tiết
    const DATA_START   = 12;
    const dataCount    = this.activeRows.length;
    const ROW_BLANK3   = DATA_START + dataCount;
    const ROW_TOTAL    = DATA_START + dataCount + 1;

    // ── Dữ liệu sheet ────────────────────────────────────────────────────
    const sheetData: any[][] = [
      /* 0  */ ['TUAN ANH MOBILE', '', '', '', ''],
      /* 1  */ [`BÁO CÁO DOANH THU - ${this.viewTypeLabel.toUpperCase()}`, '', '', '', ''],
      /* 2  */ [`Kỳ báo cáo: ${filterDisplay}`, '', '', `Ngày xuất: ${now}`, ''],
      /* 3  */ [],
      /* 4  */ ['TỔNG HỢP', '', '', '', ''],
      /* 5  */ ['Tổng doanh thu', this.totalRevenue, '', 'Số đơn hàng', this.totalOrders],
      /* 6  */ ['Doanh thu TB', Math.round(this.avgRevenue), '', `${colLabel} có doanh thu`, this.activeRows.length],
      /* 7  */ ['Cao nhất', this.maxRevenue, '', `${colLabel} cao nhất`, maxRow?.label ?? ''],
      /* 8  */ [],
      /* 9  */ [],
      /* 10 */ [],
      /* 11 */ ['#', colLabel, 'Số đơn hàng', 'Tỷ lệ (%)', 'Doanh thu (₫)'],
      ...this.activeRows.map((row, i) => [
        i + 1,
        row.label,
        row.orders,
        this.totalRevenue ? +((row.value / this.totalRevenue) * 100).toFixed(2) : 0,
        row.value,
      ]),
      /* blank */ [],
      /* total */ ['', 'TỔNG CỘNG', this.totalOrders, 100, this.totalRevenue],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // ── Độ rộng cột ──────────────────────────────────────────────────────
    ws['!cols'] = [
      { wch: 6  },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 },
    ];

    // ── Chiều cao hàng ───────────────────────────────────────────────────
    ws['!rows'] = [
      { hpt: 28 },  // 0 company
      { hpt: 24 },  // 1 title
      { hpt: 18 },  // 2 sub
    ];

    // ── Merge cells ──────────────────────────────────────────────────────
    ws['!merges'] = [
      { s: { r: 0,  c: 0 }, e: { r: 0,  c: 4 } },  // company
      { s: { r: 1,  c: 0 }, e: { r: 1,  c: 4 } },  // title
      { s: { r: 2,  c: 0 }, e: { r: 2,  c: 2 } },  // kỳ báo cáo
      { s: { r: 2,  c: 3 }, e: { r: 2,  c: 4 } },  // ngày xuất
      { s: { r: 4,  c: 0 }, e: { r: 4,  c: 4 } },  // TỔNG HỢP header
      { s: { r: 5,  c: 1 }, e: { r: 5,  c: 1 } },
    ];

    // ── Style từng cell ──────────────────────────────────────────────────
    const totalRows = sheetData.length;
    const totalCols = 5;

    // Helper tạo cell style
    const S = {
      company: {
        font: { name: 'Times New Roman', sz: 13, bold: true, color: { rgb: 'D70018' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      },
      title: {
        font: { name: 'Times New Roman', sz: 16, bold: true, color: { rgb: '1A1F36' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      },
      sub: {
        font: { name: 'Times New Roman', sz: 11, italic: true, color: { rgb: '555555' } },
        alignment: { horizontal: 'left', vertical: 'center' },
      },
      subRight: {
        font: { name: 'Times New Roman', sz: 11, italic: true, color: { rgb: '555555' } },
        alignment: { horizontal: 'right', vertical: 'center' },
      },
      sumHdr: {
        font: { name: 'Times New Roman', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1A3A5C' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this.border(),
      },
      sumLabel: {
        font: { name: 'Times New Roman', sz: 11, bold: false, color: { rgb: '444444' } },
        fill: { fgColor: { rgb: 'F3F6FB' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: this.border(),
      },
      sumValue: {
        font: { name: 'Times New Roman', sz: 12, bold: true, color: { rgb: 'D70018' } },
        fill: { fgColor: { rgb: 'FFF5F5' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: this.border(),
        numFmt: '#,##0',
      },
      sumValueNormal: {
        font: { name: 'Times New Roman', sz: 11, bold: true, color: { rgb: '1A1F36' } },
        fill: { fgColor: { rgb: 'F3F6FB' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: this.border(),
        numFmt: '#,##0',
      },
      tblHdr: {
        font: { name: 'Times New Roman', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1A1F36' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this.border(),
      },
      cell: {
        font: { name: 'Times New Roman', sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this.border(),
      },
      cellLeft: {
        font: { name: 'Times New Roman', sz: 11 },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: this.border(),
      },
      cellNum: {
        font: { name: 'Times New Roman', sz: 11 },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: this.border(),
        numFmt: '#,##0',
      },
      cellPct: {
        font: { name: 'Times New Roman', sz: 11 },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: this.border(),
        numFmt: '0.00"%"',
      },
      cellMax: {
        font: { name: 'Times New Roman', sz: 11, bold: true, color: { rgb: 'D70018' } },
        fill: { fgColor: { rgb: 'FFF5F5' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: this.border(),
        numFmt: '#,##0',
      },
      totalRow: {
        font: { name: 'Times New Roman', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1A3A5C' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: this.border(),
        numFmt: '#,##0',
      },
    };

    const cols = ['A','B','C','D','E'];

    // Áp style từng vùng
    this.setCellStyle(ws, 'A1', S.company);
    this.setCellStyle(ws, 'A2', S.title);
    this.setCellStyle(ws, 'A3', S.sub);
    this.setCellStyle(ws, 'D3', S.subRight);

    // Tổng hợp header
    cols.forEach(c => this.setCellStyle(ws, `${c}5`, S.sumHdr));

    // Tổng hợp rows 6-8
    [6, 7, 8].forEach(r => {
      this.setCellStyle(ws, `A${r}`, S.sumLabel);
      this.setCellStyle(ws, `B${r}`, r === 6 ? S.sumValue : S.sumValueNormal);
      this.setCellStyle(ws, `C${r}`, { ...S.sumLabel, fill: { fgColor: { rgb: 'FFFFFF' } } });
      this.setCellStyle(ws, `D${r}`, S.sumLabel);
      this.setCellStyle(ws, `E${r}`, S.sumValueNormal);
    });

    // Header bảng chi tiết (row 12 = index 11)
    cols.forEach(c => this.setCellStyle(ws, `${c}12`, S.tblHdr));

    // Dữ liệu
    this.activeRows.forEach((row, i) => {
      const r = 13 + i;
      const isMax = row.value === this.maxRevenue;
      const even  = i % 2 === 1;
      const baseFill = even ? 'F8FAFB' : 'FFFFFF';

      this.setCellStyle(ws, `A${r}`, { ...S.cell,    fill: { fgColor: { rgb: baseFill } } });
      this.setCellStyle(ws, `B${r}`, { ...S.cellLeft, fill: { fgColor: { rgb: baseFill } } });
      this.setCellStyle(ws, `C${r}`, { ...S.cellNum,  fill: { fgColor: { rgb: baseFill } } });
      this.setCellStyle(ws, `D${r}`, { ...S.cellPct,  fill: { fgColor: { rgb: baseFill } } });
      this.setCellStyle(ws, `E${r}`, isMax ? S.cellMax : { ...S.cellNum, fill: { fgColor: { rgb: baseFill } } });
    });

    // Dòng tổng
    const totalR = 13 + this.activeRows.length + 1;
    cols.forEach(c => this.setCellStyle(ws, `${c}${totalR}`, S.totalRow));

    XLSX.utils.book_append_sheet(wb, ws, 'Doanh Thu');

    const fileName = `doanh_thu_${filterLabel}_${this.formatDateForFile(new Date())}.xlsx`;
    XLSX.writeFile(wb, fileName);

    this.showToast('Xuất Excel thành công!');
  }

  /** Helper: set style cho 1 cell */
  private setCellStyle(ws: any, addr: string, style: any): void {
    if (!ws[addr]) ws[addr] = { t: 'z', v: '' };
    ws[addr].s = style;
  }

  /** Helper: border mỏng 4 cạnh */
  private border() {
    const b = { style: 'thin', color: { rgb: 'C8D1DF' } };
    return { top: b, bottom: b, left: b, right: b };
  }

  private formatDateForFile(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  }

  // ── IN BÁO CÁO ───────────────────────────────────────────────────────────
  printReport(): void {
    if (!this.activeRows.length) return;  

    let filterLabel = '';
    if (this.viewType === 'day') {
      // Parse thủ công tránh lệch timezone
      const [y, m, d] = this.selectedDate.split('-');
      filterLabel = `Ngày ${d}/${m}/${y}`;
    }
    if (this.viewType === 'month') {
      const [y, m] = this.selectedMonth.split('-');
      filterLabel = `Tháng ${m}/${y}`;
    }
    if (this.viewType === 'year') filterLabel = `Năm ${this.selectedYear}`;

    const colLabel = this.viewType === 'day' ? 'Giờ'
                   : this.viewType === 'month' ? 'Ngày' : 'Tháng';

    const now = new Date().toLocaleString('vi-VN');
    const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';
    const pct = (v: number) => this.totalRevenue
      ? ((v / this.totalRevenue) * 100).toFixed(1) + '%' : '—';

    // Chỉ in các slot có doanh thu
    const printRows = this.chartData.filter(r => r.hasData);

    const rows = printRows.map((row, i) => {
      const barW   = this.maxRevenue ? Math.round((row.value / this.maxRevenue) * 100) : 0;
      const isMax  = row.value === this.maxRevenue;
      return `
      <tr class="${isMax ? 'row-max' : ''}">
        <td class="center muted">${i + 1}</td>
        <td><span class="period">${row.label}</span></td>
        <td>
          <div class="bar-cell">
            <div class="bar-bg"><div class="bar-fill" style="width:${barW}%"></div></div>
            <span class="pct">${pct(row.value)}</span>
          </div>
        </td>
        <td class="right ${isMax ? 'val-max' : ''}">${fmt(row.value)}</td>
      </tr>`;
    }).join('');

    const emptyNote = printRows.length === 0
      ? `<tr><td colspan="4" class="center" style="padding:20px;color:#888">Không có dữ liệu doanh thu</td></tr>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="vi"><head>
<meta charset="UTF-8"/>
<title>Báo cáo doanh thu – Tuan Anh Mobile</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Times New Roman',serif;font-size:13px;color:#111;padding:28px 38px;background:#fff}
  .rpt-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;border-bottom:2px solid #d70018;padding-bottom:12px}
  .rpt-brand{font-size:17px;font-weight:bold;color:#d70018}
  .rpt-brand small{display:block;font-size:11px;color:#666;font-weight:normal;margin-top:2px}
  .rpt-title-block{text-align:center;flex:1}
  .rpt-title-block h1{font-size:16px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px}
  .rpt-title-block .sub{font-size:12px;color:#555;margin-top:4px}
  .rpt-meta{text-align:right;font-size:11px;color:#666;line-height:1.7}
  .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
  .sc{border:1px solid #e2e8f0;border-radius:7px;padding:10px 12px}
  .sc .lbl{font-size:11px;color:#6b7394;margin-bottom:3px}
  .sc .val{font-size:14px;font-weight:bold;color:#1a1f36}
  .sc.accent{border-color:#d70018}.sc.accent .val{color:#d70018}
  .fbar{background:#f8f9fb;border:1px solid #e2e8f0;border-radius:6px;padding:7px 13px;margin-bottom:16px;font-size:12px;color:#444;display:flex;gap:20px}
  .fbar span{font-weight:bold;color:#1a1f36}
  table{width:100%;border-collapse:collapse}
  thead th{background:#1a1f36;color:#fff;padding:8px 10px;font-size:12px;font-weight:700;border:1px solid #1a1f36;text-align:left}
  tbody td{padding:6px 10px;border:1px solid #dde2ec;font-size:12px;vertical-align:middle}
  tbody tr:nth-child(even) td{background:#f8f9fb}
  tbody tr.row-max td{background:#fff5f5!important}
  .center{text-align:center}.right{text-align:right;font-weight:600}.muted{color:#9aa3b2}
  .period{background:#eef2ff;color:#3730a3;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px}
  .val-max{color:#d70018!important}
  .bar-cell{display:flex;align-items:center;gap:8px}
  .bar-bg{flex:1;height:7px;background:#f0f2f5;border-radius:4px;overflow:hidden}
  .bar-fill{height:100%;background:#d70018;border-radius:4px}
  .pct{font-size:11px;color:#6b7394;font-weight:700;min-width:38px;text-align:right}
  .tbl-foot{margin-top:11px;display:flex;justify-content:space-between;font-size:12px;border-top:1px solid #dde2ec;padding-top:9px}
  .tbl-foot .total{font-weight:bold;font-size:14px;color:#d70018}
  .sign-row{display:flex;justify-content:flex-end;margin-top:34px;text-align:center}
  .sign-box p{font-size:12px;margin-bottom:3px}
  .sign-box .name{margin-top:50px;font-weight:bold}
  .no-print{margin-top:22px;text-align:center;display:flex;justify-content:center;gap:10px}
  .no-print button{padding:8px 22px;font-size:13px;border-radius:5px;cursor:pointer;font-family:inherit}
  .btn-p{background:#d70018;color:#fff;border:none}
  .btn-c{background:#fff;color:#333;border:1px solid #ccc}
  @media print{.no-print{display:none!important}body{padding:10px 18px}}
</style>
</head>
<body>
  <div class="rpt-head">
    <div class="rpt-brand">Tuan Anh Mobile<small>Hệ thống quản lý bán hàng</small></div>
    <div class="rpt-title-block">
      <h1>Báo Cáo Doanh Thu</h1>
      <div class="sub">${this.viewTypeLabel} &nbsp;|&nbsp; ${filterLabel}</div>
    </div>
    <div class="rpt-meta">Ngày in: ${now}<br/>Người in: Admin</div>
  </div>

  <div class="summary">
    <div class="sc accent"><div class="lbl">Tổng doanh thu</div><div class="val">${fmt(this.totalRevenue)}</div></div>
    <div class="sc"><div class="lbl">Số ${colLabel.toLowerCase()} có DT</div><div class="val">${printRows.length}</div></div>
    <div class="sc"><div class="lbl">Doanh thu TB / ${colLabel.toLowerCase()}</div><div class="val">${fmt(Math.round(printRows.length ? this.totalRevenue / printRows.length : 0))}</div></div>
    <div class="sc"><div class="lbl">Cao nhất / ${colLabel.toLowerCase()}</div><div class="val">${fmt(this.maxRevenue)}</div></div>
  </div>

  <div class="fbar">
    <div>Chế độ: <span>${this.viewTypeLabel}</span></div>
    <div>Kỳ: <span>${filterLabel}</span></div>
    <div>${colLabel} có doanh thu: <span>${printRows.length}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:42px" class="center">#</th>
        <th style="width:100px">${colLabel}</th>
        <th>Tỷ lệ</th>
        <th style="width:160px" class="right">Doanh thu</th>
      </tr>
    </thead>
    <tbody>${rows}${emptyNote}</tbody>
  </table>

  <div class="tbl-foot">
    <span>Tổng cộng: <span class="total">${fmt(this.totalRevenue)}</span></span>
    <span style="color:#9aa3b2;font-size:11px">Tuan Anh Mobile Revenue Analyzer v1.0</span>
  </div>

  <div class="sign-row">
    <div class="sign-box">
      <p>Người lập báo cáo</p>
      <p style="font-size:11px;color:#888">(Ký, ghi rõ họ tên)</p>
      <p class="name">................................</p>
    </div>
  </div>

  <div class="no-print">
    <button class="btn-p" onclick="window.print()">🖨 In ngay</button>
    <button class="btn-c" onclick="window.close()">Đóng</button>
  </div>
  <script>window.onload=()=>window.print();<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=1000,height=750');
    if (win) {
      win.document.write(html);
      win.document.close();

      // Poll mỗi 500ms, khi cửa sổ đóng → show toast
      const poll = setInterval(() => {
        if (win.closed) {
          clearInterval(poll);
          this.showToast('In / Lưu báo cáo thành công!');
          this.cdr.detectChanges();
        }
      }, 500);
    }
  }

  // ── HELPERS ──────────────────────────────────────────────────────────────
  formatLabel(period: string): string {
    const d = new Date(period);
    if (this.viewType === 'day')   return `${String(d.getHours()).padStart(2,'0')}h`;
    if (this.viewType === 'month') {
      const [, m] = this.selectedMonth.split('-');
      return `${String(d.getDate()).padStart(2,'0')}/${m}`;
    }
    return `T${d.getMonth() + 1}`;
  }

  get totalRevenue(): number { return this.chartData.reduce((s, r) => s + r.value, 0); }
  get totalOrders(): number  { return this.chartData.reduce((s, r) => s + r.orders, 0); }
  get maxRevenue(): number   { return this.chartData.length ? Math.max(...this.chartData.map(r => r.value)) : 0; }
  get avgRevenue(): number   {
    const active = this.activeRows.length;
    return active ? this.totalRevenue / active : 0;
  }

  get viewTypeLabel(): string {
    return { day: 'Theo giờ trong ngày', month: 'Theo ngày trong tháng', year: 'Theo tháng trong năm' }[this.viewType];
  }

  get activeRows(): ChartRow[] { return this.chartData.filter(r => r.hasData); }
    showToast(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType    = type;
    this.toastVisible = true;
    this.toastTimer   = setTimeout(() => { this.toastVisible = false; }, 3000);
  }
}