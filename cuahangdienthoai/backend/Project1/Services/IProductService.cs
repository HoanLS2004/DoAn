using Project1.Models.DTOs;

namespace Project1.Services
{
    public interface IProductService
    {
        // Trả về danh sách ProductDto luôn, không cần ProductListItemDto
        Task<(IEnumerable<ProductDto> Items, int Total)> QueryAsync(
            string? search, int? brandId, decimal? minPrice, decimal? maxPrice, bool? status,
            string? sortBy, string? sortDir, int page, int pageSize);

        // Trả về chi tiết ProductDto luôn, không cần ProductDetailDto
        Task<ProductDto?> GetByIdAsync(int id);

        Task<int> CreateAsync(ProductCreateDto dto);

        Task<bool> UpdateAsync(int id, ProductUpdateDto dto);

        Task<bool> SoftDeleteAsync(int id);

        Task<bool> HardDeleteAsync(int id);
    }
}
