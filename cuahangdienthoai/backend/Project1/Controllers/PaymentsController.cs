using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Models;
using Project1.Models.DTOs;
using Project1.Models.Entities;
using Project1.Services;
using System.Text;
using System.Text.Json;
namespace Project1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly MomoService _momo;
        public PaymentsController(AppDbContext context, IConfiguration config, MomoService momo)
        {
            _context = context;
            _config = config;
            _momo = momo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            string? status,
            string? method)
        {
            var query = _context.Payments.AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(p => p.PaymentStatus == status);

            if (!string.IsNullOrEmpty(method))
                query = query.Where(p => p.PaymentMethod == method);

            var data = await query
                .OrderByDescending(p => p.PaidAt)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var payment = await _context.Payments.FindAsync(id);

            if (payment == null) return NotFound();

            return Ok(payment);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Payment model)
        {
            model.PaymentStatus = "Pending";
            model.PaidAt = null;

            _context.Payments.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Payment model)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null) return NotFound();

            payment.PaymentMethod = model.PaymentMethod;
            payment.Amount = model.Amount;
            payment.PaymentStatus = model.PaymentStatus;
            payment.PaidAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(payment);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null) return NotFound();

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa payment" });
        }

        // ==============================
        // FAKE PAY (simulate Momo)
        // ==============================
        [HttpPost("{orderId}/pay")]
        public async Task<IActionResult> FakePay(int orderId)
        {
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.OrderID == orderId);

            if (payment == null) return NotFound();

            payment.PaymentStatus = "Completed";
            payment.PaidAt = DateTime.Now;
            payment.TransactionID = Guid.NewGuid().ToString();
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thanh toán thành công" });
        }
        [HttpPost("apply")]
        public async Task<IActionResult> ApplyPromotion([FromBody] PromotionDTO request)
        {
            if (request == null)
            {
                return BadRequest("Dữ liệu không hợp lệ");
            }

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
                return BadRequest($"Đơn tối thiểu {promo.MinOrderValue:n0}đ");

            decimal discount;

            if (promo.DiscountType == "Percent")
            {
                discount = request.OrderValue * (promo.DiscountValue / 100);

            }
            else
            {
                discount = promo.DiscountValue;
            }
            discount = Math.Min(discount, request.OrderValue);

            var finalAmount = request.OrderValue - discount;

            return Ok(new
            {
                discount,
                finalAmount
            });
        }
        [HttpPost("momo-ipn")]
        public async Task<IActionResult> MomoIpn([FromBody] JsonElement data)
        {
            try
            {
                Console.WriteLine("===== MOMO IPN RAW =====");
                Console.WriteLine(data.ToString());

                string rawOrderId = data.GetProperty("orderId").GetRawText().Trim('"');
                int resultCode = data.GetProperty("resultCode").GetInt32();
                string transId = data.GetProperty("transId").GetRawText().Trim('"');

                Console.WriteLine($"rawOrderId={rawOrderId}, resultCode={resultCode}, transId={transId}");

                if (!int.TryParse(rawOrderId.Split('_')[0], out int orderId))
                {
                    Console.WriteLine($"❌ Không parse được orderId từ '{rawOrderId}'");
                    return Ok();
                }

                var payment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.OrderID == orderId);

                if (payment == null)
                {
                    Console.WriteLine($"❌ Không tìm thấy payment cho orderId={orderId}");
                    return Ok();
                }

                if (resultCode == 0)
                {
                    payment.PaymentStatus = "Completed";
                    payment.TransactionID = transId;
                    payment.PaidAt = DateTime.Now;

                    // ── Xóa giỏ hàng: lấy userID từ order, xóa đúng sản phẩm đã đặt ──
                    var order = await _context.Orders
                        .Include(o => o.OrderDetails)
                        .FirstOrDefaultAsync(o => o.OrderID == orderId);

                    if (order != null)
                    {
                        var productIds = order.OrderDetails.Select(d => d.ProductID).ToList();

                        var cartItems = await _context.ShoppingCart
                            .Where(c => c.UserID == order.UserID && productIds.Contains(c.ProductID))
                            .ToListAsync();

                        if (cartItems.Any())
                        {
                            _context.ShoppingCart.RemoveRange(cartItems);
                            Console.WriteLine($"🗑️ Đã xóa {cartItems.Count} sản phẩm khỏi giỏ hàng của user {order.UserID}");
                        }
                    }

                    Console.WriteLine($"✅ IPN: orderId={orderId} → Completed");
                }
                else
                {
                    payment.PaymentStatus = "Failed";
                    Console.WriteLine($"❌ IPN: orderId={orderId} → Failed (resultCode={resultCode})");
                }

                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ MomoIpn EXCEPTION: " + ex.Message);
                Console.WriteLine(ex.StackTrace);
                return Ok();
            }
        }
        [HttpGet("{orderId}/status")]
        public async Task<IActionResult> CheckPayment(int orderId)
        {
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.OrderID == orderId);

            if (payment == null) return NotFound();

            return Ok(new
            {
                payment.PaymentStatus,
                payment.TransactionID,
                payment.PaidAt,
            });
        }

        [HttpPost("momo/{orderId}")]
        public async Task<IActionResult> CreateMomo(int orderId)
        {
            Console.WriteLine("===== CREATE MOMO PAYMENT =====");
            Console.WriteLine("OrderId: " + orderId);

            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.OrderID == orderId);

            if (payment == null)
            {
                Console.WriteLine("❌ Payment NULL");
                return NotFound("Payment không tồn tại");
            }

            Console.WriteLine("Payment Amount: " + payment.Amount);
            Console.WriteLine("Payment Method: " + payment.PaymentMethod);

            try
            {
                var result = await _momo.CreatePayment(
                    (long)payment.Amount,
                    orderId.ToString()
                );

                Console.WriteLine("===== MOMO RESULT =====");
                Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(result));

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ MOMO ERROR");
                Console.WriteLine(ex.Message);

                return StatusCode(500, ex.Message);
            }
        }
    }
}
