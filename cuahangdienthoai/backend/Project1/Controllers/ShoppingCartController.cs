using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project1.Services;
using System.Security.Claims;

namespace Project1.Controllers
{
    [ApiController]
    [Route("api/cart")]
    [Authorize] // ✅ BẮT BUỘC
    public class CartController : ControllerBase
    {
        private readonly IShoppingCartService _cartService;

        public CartController(IShoppingCartService cartService)
        {
            _cartService = cartService;
        }
        private int GetUserId()
        {
            var claims = User.Claims;

            foreach (var c in claims)
            {
                Console.WriteLine($"{c.Type} = {c.Value}");
            }

            var userId =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("nameid")?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("userId")?.Value;

            if (userId == null)
                throw new Exception("Token không chứa userId");

            return int.Parse(userId);
        }
        // ✅ GET CART
        [HttpGet]
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            Console.WriteLine("===== CALL GET CART =====");

            var userId = GetUserId();

            Console.WriteLine("UserId sau khi parse: " + userId);

            var cart = await _cartService.GetCart(userId);

            Console.WriteLine("Số item trong cart: " + cart.Count);

            return Ok(cart);
        }

        // ✅ ADD
        [HttpPost("add")]
        public async Task<IActionResult> AddToCart(int productId, int quantity)
        {
            var userId = GetUserId();

            await _cartService.AddToCart(userId, productId, quantity);
            return Ok(new { message = "Đã thêm vào giỏ" });
        }

        // ✅ UPDATE
        [HttpPut("update")]
        public async Task<IActionResult> Update(int productId, int quantity)
        {
            try
            {
                var userId = GetUserId();
                await _cartService.UpdateQuantity(userId, productId, quantity);
                return Ok("Đã cập nhật");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Update error: {ex.Message}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ✅ REMOVE
        [HttpDelete("remove")]
        public async Task<IActionResult> Remove(int productId)
        {
            var userId = GetUserId();

            await _cartService.RemoveFromCart(userId, productId);
            return Ok(new { message = "Đã xoá" });
        }

        // ✅ CLEAR
        [HttpDelete("clear")]
        public async Task<IActionResult> Clear()
        {
            var userId = GetUserId();

            await _cartService.ClearCart(userId);
            return Ok(new { message = "Đã xoá toàn bộ giỏ hàng" });
        }

        // ✅ HELPER (CHỐNG CRASH)
    }
}