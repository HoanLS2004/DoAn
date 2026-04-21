using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Models.DTOs;
using Project1.Models.Entities;
using System.Security.Claims;

namespace Project1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrdersController(AppDbContext context)
    {
        _context = context;
    }
    [HttpGet]
    public async Task<ActionResult<List<OrderResponseDto>>> GetOrders()
    {
        var orders = await _context.Orders
            .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
            .Select(o => new OrderResponseDto
            {
                OrderID = o.OrderID,
                UserID = o.UserID,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                OrderDetails = o.OrderDetails.Select(od => new OrderDetailDto
                {
                    ProductID = od.ProductID,
                    ProductName = od.Product.Name,
                    Quantity = od.Quantity,
                    UnitPrice = od.UnitPrice
                }).ToList()
            })
            .ToListAsync();

        return Ok(orders);
    }
    [Authorize]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyOrders()
    {
        // Lấy UserID từ JWT claim
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                       ?? User.FindFirst("sub");

        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized("Token không hợp lệ");

        var orders = await _context.Orders
            .Where(o => o.UserID == userId)
            .Include(o => o.Payment)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new
            {
                o.OrderID,
                o.UserID,
                o.ReceiverName,
                o.ReceiverPhone,
                o.ShippingAddress,
                o.OrderDate,
                o.TotalAmount,
                o.Status,
                Payment = o.Payment == null ? null : new
                {
                    o.Payment.PaymentMethod,
                    o.Payment.PaymentStatus
                },
                // Không include OrderDetails ở list (nhẹ hơn), lấy ở /my/{id}
                ItemCount = o.OrderDetails.Count
            })
            .ToListAsync();

        return Ok(orders);
    }

    // ==============================
    // GET: api/orders/my/{id}  (User — chi tiết đơn của chính mình)
    // ==============================
    [Authorize]
    [HttpGet("my/{id}")]
    public async Task<IActionResult> GetMyOrder(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                       ?? User.FindFirst("sub");

        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized("Token không hợp lệ");

        var order = await _context.Orders
            .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
            .Include(o => o.Payment)
            .Where(o => o.OrderID == id && o.UserID == userId)  // chỉ đơn của mình
            .Select(o => new
            {
                o.OrderID,
                o.UserID,
                o.ReceiverName,
                o.ReceiverPhone,
                o.ShippingAddress,
                o.OrderDate,
                o.TotalAmount,
                o.Status,
                Payment = o.Payment == null ? null : new
                {
                    o.Payment.PaymentMethod,
                    o.Payment.PaymentStatus
                },
                OrderDetails = o.OrderDetails.Select(od => new OrderDetailDto
                {
                    ProductID = od.ProductID,
                    ProductName = od.Product.Name,
                    Quantity = od.Quantity,
                    UnitPrice = od.UnitPrice
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (order == null)
            return NotFound("Không tìm thấy đơn hàng");

        return Ok(order);
    }

    // ==============================
    // PUT: api/orders/my/{id}/cancel  (User — chỉ hủy đơn Pending của mình)
    // ==============================
    [Authorize]
    [HttpPut("my/{id}/cancel")]
    public async Task<IActionResult> CancelMyOrder(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                       ?? User.FindFirst("sub");

        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized("Token không hợp lệ");

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.OrderID == id && o.UserID == userId);

        if (order == null)
            return NotFound("Không tìm thấy đơn hàng");

        if (order.Status != "Pending")
            return BadRequest($"Không thể hủy đơn hàng đang ở trạng thái '{order.Status}'. Chỉ hủy được khi đơn đang chờ xác nhận.");

        order.Status = "Cancelled";
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Đã hủy đơn hàng #{id} thành công" });
    }

    // ==============================
    // GET: api/orders/{id}  (Admin)
    // ==============================
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        var order = await _context.Orders
            .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
            .Include(o => o.Payment)
            .Where(o => o.OrderID == id)
            .Select(o => new
            {
                o.OrderID,
                o.UserID,
                o.ReceiverName,
                o.ReceiverPhone,
                o.ShippingAddress,
                o.OrderDate,
                o.TotalAmount,
                o.Status,
                Payment = o.Payment == null ? null : new
                {
                    o.Payment.PaymentMethod,
                    o.Payment.PaymentStatus
                },
                OrderDetails = o.OrderDetails.Select(od => new OrderDetailDto
                {
                    ProductID = od.ProductID,
                    ProductName = od.Product.Name,
                    Quantity = od.Quantity,
                    UnitPrice = od.UnitPrice
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (order == null) return NotFound();

        return Ok(order);
    }
    [HttpPut("{id}/info")]
    public async Task<IActionResult> UpdateOrderInfo(int id, [FromBody] UpdateOrderInfoDto dto)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderID == id);
        if (order == null) return NotFound("Không tìm thấy đơn hàng");

        if (!string.IsNullOrWhiteSpace(dto.ReceiverName))
            order.ReceiverName = dto.ReceiverName;
        if (!string.IsNullOrWhiteSpace(dto.ReceiverPhone))
            order.ReceiverPhone = dto.ReceiverPhone;
        if (!string.IsNullOrWhiteSpace(dto.ShippingAddress))
            order.ShippingAddress = dto.ShippingAddress;

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Đã cập nhật thông tin đơn hàng #{id}" });
    }


    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto dto)
    {
        if (dto.OrderDetails == null || !dto.OrderDetails.Any())
            return BadRequest("Đơn hàng phải có sản phẩm");

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var productIds = dto.OrderDetails.Select(x => x.ProductID).ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.ProductID))
                .ToListAsync();

            if (products.Count != productIds.Count)
                return BadRequest("Có sản phẩm không tồn tại trong hệ thống");

            var productDict = products.ToDictionary(p => p.ProductID);

            var order = new Order
            {
                UserID = dto.UserID,
                ReceiverName = dto.ReceiverName,
                ReceiverPhone = dto.ReceiverPhone,
                ShippingAddress = dto.ShippingAddress,
                Status = "Pending",
                OrderDate = DateTime.Now
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var orderDetails = new List<OrderDetail>();

            foreach (var item in dto.OrderDetails)
            {
                var product = productDict[item.ProductID];

                if (item.Quantity <= 0)
                    return BadRequest("Số lượng không hợp lệ");

                if (product.StockQuantity < item.Quantity)
                    return BadRequest($"Sản phẩm {product.Name} không đủ hàng");

                var price = product.Price - (product.Price * product.Discount / 100m);

                orderDetails.Add(new OrderDetail
                {
                    OrderID = order.OrderID,
                    ProductID = item.ProductID,
                    Quantity = item.Quantity,
                    UnitPrice = price
                });
            }

            _context.OrderDetails.AddRange(orderDetails);
            await _context.SaveChangesAsync();

            decimal total = orderDetails.Sum(x => x.Quantity * x.UnitPrice);

            if (!string.IsNullOrEmpty(dto.VoucherCode))
            {
                var promotion = await _context.Promotions
                    .FirstOrDefaultAsync(p =>
                        p.Code.Trim().ToLower() == dto.VoucherCode.Trim().ToLower());

                if (promotion == null) return BadRequest("Mã không tồn tại");
                if (!promotion.IsActive) return BadRequest("Mã chưa kích hoạt");
                if (DateTime.Now.Date < promotion.StartDate.Date ||
                    DateTime.Now.Date > promotion.EndDate.Date)
                    return BadRequest("Mã đã hết hạn");
                if (total < promotion.MinOrderValue)
                    return BadRequest($"Đơn tối thiểu {promotion.MinOrderValue:n0} mới dùng được mã");
                if (promotion.Quantity <= 0) return BadRequest("Mã đã hết lượt sử dụng");

                decimal discountAmount = promotion.DiscountType == "Percent"
                    ? total * promotion.DiscountValue / 100m
                    : promotion.DiscountValue;

                total -= discountAmount;
                if (total < 0) total = 0;

                promotion.Quantity -= 1;
                var orderPromotion = new OrderPromotion
                {
                    OrderID = order.OrderID,
                    PromotionID = promotion.PromotionID,
                    DiscountAmount = discountAmount
                };
                _context.OrderPromotions.Add(orderPromotion);
            }

            order.TotalAmount = total;
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { orderId = order.OrderID, total });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return BadRequest(ex.InnerException?.Message ?? ex.Message);
        }
    }
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        var order = await _context.Orders
            .Include(o => o.OrderDetails)
            .Include(o => o.Payment)   // ✅ thêm include Payment
            .FirstOrDefaultAsync(o => o.OrderID == id);

        if (order == null) return NotFound();

        // ✅ Kiểm tra payment trước khi cho phép Completed
        if (dto.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase))
        {
            if (order.Payment == null ||
                !order.Payment.PaymentStatus.Equals("Completed", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Đơn hàng chưa được thanh toán, không thể hoàn thành!");
            }
        }

        if (dto.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase)
            && !order.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase))
        {
            foreach (var detail in order.OrderDetails)
            {
                var product = await _context.Products
                    .FirstAsync(p => p.ProductID == detail.ProductID);

                product.StockQuantity -= detail.Quantity;
                if (product.StockQuantity <= 0)
                {
                    product.StockQuantity = 0;
                    product.Status = false;
                }
            }
        }

        order.Status = dto.Status;
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrder(int id)
    {
        var order = await _context.Orders
            .Include(o => o.OrderDetails)
            .FirstOrDefaultAsync(o => o.OrderID == id);

        if (order == null) return NotFound();

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();

        return NoContent();
    }
    [HttpGet("count-pending")]
    public async Task<IActionResult> CountPendingOrders()
    {
        var total = await _context.Orders.CountAsync(o => o.Status == "Pending");
        return Ok(new { total });
    }
    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenue()
    {
        var totalRevenue = await _context.Orders
            .Where(o => o.Status == "Completed")
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

        return Ok(new { total = totalRevenue });
    }
}