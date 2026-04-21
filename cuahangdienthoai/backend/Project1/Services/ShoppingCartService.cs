using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Models.DTOs;
using Project1.Models.Entities;

namespace Project1.Services
{
    public class ShoppingCartService : IShoppingCartService
    {
        private readonly AppDbContext _context;

        public ShoppingCartService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ShoppingCartDTO>> GetCart(int userId)
        {
            return await _context.ShoppingCart
                .Where(c => c.UserID == userId)
                .Select(c => new ShoppingCartDTO
                {
                    ProductID = c.ProductID,
                    ProductName = c.Product.Name,
                    Price = c.Product.Price,
                    Discount = c.Product.Discount,
                    Quantity = c.Quantity,
                    StockQuantity = c.Product.StockQuantity, // ← THÊM
                    Thumbnail = c.Product.Images
                        .Where(i => i.IsThumbnail)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault()
                })
                .ToListAsync();
        }

        public async Task AddToCart(int userId, int productId, int quantity)
        {
            var item = await _context.ShoppingCart
                .FirstOrDefaultAsync(c => c.UserID == userId && c.ProductID == productId);

            if (item != null)
                item.Quantity += quantity;
            else
            {
                _context.ShoppingCart.Add(new ShoppingCart
                {
                    UserID = userId,
                    ProductID = productId,
                    Quantity = quantity
                });
            }

            await _context.SaveChangesAsync();
        }

        public async Task UpdateQuantity(int userId, int productId, int quantity)
        {
            var item = await _context.ShoppingCart
                .FirstOrDefaultAsync(c => c.UserID == userId && c.ProductID == productId);

            if (item == null) throw new Exception("Không tìm thấy sản phẩm trong giỏ");

            item.Quantity = quantity;
            await _context.SaveChangesAsync();
        }

        public async Task RemoveFromCart(int userId, int productId)
        {
            var item = await _context.ShoppingCart
                .FirstOrDefaultAsync(c => c.UserID == userId && c.ProductID == productId);

            if (item != null)
            {
                _context.ShoppingCart.Remove(item);
                await _context.SaveChangesAsync();
            }
        }

        public async Task ClearCart(int userId)
        {
            var items = _context.ShoppingCart.Where(c => c.UserID == userId);
            _context.ShoppingCart.RemoveRange(items);
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetStockQuantity(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            return product?.StockQuantity ?? 0;
        }
    }
}