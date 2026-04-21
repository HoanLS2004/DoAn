using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Models.DTOs;

namespace Project1.Controllers
{
    [ApiController]
    [Route("api/revenue")]
    public class RevenueController : ControllerBase
    {
        private readonly AppDbContext _context;
        public RevenueController(AppDbContext context)
        {
            _context = context;
        }

        // ===================== 📅 THEO NGÀY → group từng GIỜ =====================
        [HttpGet("day")]
        public async Task<IActionResult> RevenueByDay([FromQuery] DateTime date)
        {
            var raw = await _context.Orders
                .Where(o =>
                    o.Status == "Completed" &&
                    o.OrderDate.Date == date.Date)
                .GroupBy(o => o.OrderDate.Hour)          // ← group theo GIỜ
                .Select(g => new
                {
                    Hour = g.Key,
                    TotalRevenue = g.Sum(x => x.TotalAmount),
                    TotalOrders = g.Count()
                })
                .OrderBy(x => x.Hour)
                .ToListAsync();

            // Trả về period dạng "YYYY-MM-DDThh:00:00" để frontend đọc đúng giờ
            var data = raw.Select(x => new RevenueDto
            {
                Period = new DateTime(date.Year, date.Month, date.Day, x.Hour, 0, 0),
                TotalRevenue = x.TotalRevenue,
                TotalOrders = x.TotalOrders
            });

            return Ok(data);
        }

        // ===================== 📆 THEO THÁNG → group từng NGÀY =====================
        [HttpGet("month")]
        public async Task<IActionResult> RevenueByMonth(
            [FromQuery] int year,
            [FromQuery] int month)
        {
            var start = new DateTime(year, month, 1);
            var end = start.AddMonths(1);

            var raw = await _context.Orders
                .Where(o =>
                    o.Status == "Completed" &&
                    o.OrderDate >= start &&
                    o.OrderDate < end)
                .GroupBy(o => o.OrderDate.Day)           // ← group theo NGÀY
                .Select(g => new
                {
                    Day = g.Key,
                    TotalRevenue = g.Sum(x => x.TotalAmount),
                    TotalOrders = g.Count()
                })
                .OrderBy(x => x.Day)
                .ToListAsync();

            // Trả về period dạng "YYYY-MM-DDT00:00:00" để frontend đọc đúng ngày
            var data = raw.Select(x => new RevenueDto
            {
                Period = new DateTime(year, month, x.Day),
                TotalRevenue = x.TotalRevenue,
                TotalOrders = x.TotalOrders
            });

            return Ok(data);
        }

        // ===================== 📊 THEO NĂM → group từng THÁNG =====================
        [HttpGet("year")]
        public async Task<IActionResult> RevenueByYear([FromQuery] int year)
        {
            var start = new DateTime(year, 1, 1);
            var end = start.AddYears(1);

            var raw = await _context.Orders
                .Where(o =>
                    o.Status == "Completed" &&
                    o.OrderDate >= start &&
                    o.OrderDate < end)
                .GroupBy(o => o.OrderDate.Month)         // ← group theo THÁNG
                .Select(g => new
                {
                    Month = g.Key,
                    TotalRevenue = g.Sum(x => x.TotalAmount),
                    TotalOrders = g.Count()
                })
                .OrderBy(x => x.Month)
                .ToListAsync();

            // Trả về period dạng "YYYY-MMT00:00:00" để frontend đọc đúng tháng
            var data = raw.Select(x => new RevenueDto
            {
                Period = new DateTime(year, x.Month, 1),
                TotalRevenue = x.TotalRevenue,
                TotalOrders = x.TotalOrders
            });

            return Ok(data);
        }
    }
}