using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Models.DTOs;
using Project1.Models.Entities;

namespace Project1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PromotionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PromotionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Promotions
        [HttpGet]
        public async Task<IActionResult> GetPromotions()
        {
            var promos = await _context.Promotions.ToListAsync();
            return Ok(promos);
        }

        // GET: api/Promotions/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPromotion(int id)
        {
            var promo = await _context.Promotions.FindAsync(id);
            if (promo == null) return NotFound();
            return Ok(promo);
        }

        // POST: api/Promotions
        [HttpPost]
        public async Task<IActionResult> CreatePromotion([FromBody] Promotion promo)
        {
            _context.Promotions.Add(promo);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetPromotion), new { id = promo.PromotionID }, promo);
        }

        // PUT: api/Promotions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePromotion(int id, [FromBody] Promotion promo)
        {
            if (id != promo.PromotionID) return BadRequest();

            _context.Entry(promo).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Promotions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePromotion(int id)
        {
            var promo = await _context.Promotions.FindAsync(id);
            if (promo == null) return NotFound();

            _context.Promotions.Remove(promo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpPost("apply")]
        public async Task<IActionResult> ApplyPromotion([FromBody] PromotionDTO? request)
        {
            if (request == null)
                return BadRequest("Dữ liệu không hợp lệ");

            if (request.OrderValue <= 0)
                return BadRequest("Giá trị đơn hàng không hợp lệ");

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return Ok(new
                {
                    discount = 0,
                    finalAmount = request.OrderValue
                });
            }

            var promo = await _context.Promotions
                .FirstOrDefaultAsync(p =>
                    p.Code == request.Code &&
                    p.IsActive &&
                    p.Quantity > 0 &&
                    DateTime.Now >= p.StartDate &&
                    DateTime.Now <= p.EndDate
                );

            if (promo == null)
                return BadRequest("Mã không hợp lệ");

            if (request.OrderValue < promo.MinOrderValue)
                return BadRequest("Chưa đủ giá trị tối thiểu");

            decimal discount = promo.DiscountType == "Percent"
                ? request.OrderValue * (promo.DiscountValue / 100)
                : promo.DiscountValue;

            discount = Math.Min(discount, request.OrderValue);

            return Ok(new
            {
                discount,
                finalAmount = request.OrderValue - discount
            });
        }

    }
}
