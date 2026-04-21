using Project1.Models.DTOs;

namespace Project1.Services
{
    public interface IShoppingCartService
    {
        Task<List<ShoppingCartDTO>> GetCart(int userId);
        Task AddToCart(int userId, int productId, int quantity);
        Task UpdateQuantity(int userId, int productId, int quantity);
        Task RemoveFromCart(int userId, int productId);
        Task<int> GetStockQuantity(int productId);
        Task ClearCart(int userId);
        
    }
}
