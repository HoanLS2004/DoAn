using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Entities;
using Project1.Models.DTOs;
using Project1.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext db;
    private readonly IMapper mapper;

    public ProductService(AppDbContext db, IMapper mapper)
    {
        this.db = db;
        this.mapper = mapper;
    }

    public async Task<(IEnumerable<ProductDto> Items, int Total)> QueryAsync(
        string? search, int? brandId, decimal? minPrice, decimal? maxPrice, bool? status,
        string? sortBy, string? sortDir, int page, int pageSize)
    {
        var q = db.Products
            .AsNoTracking()
            .Include(p => p.Brand)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(p => p.Name.Contains(search));

        if (brandId is not null)
            q = q.Where(p => p.BrandID == brandId);

        if (minPrice is not null)
            q = q.Where(p => p.Price >= minPrice);

        if (maxPrice is not null)
            q = q.Where(p => p.Price <= maxPrice);

        if (status is not null)
            q = q.Where(p => p.Status == status);

        // Sorting
        bool desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        q = (sortBy?.ToLowerInvariant()) switch
        {
            "price" => desc ? q.OrderByDescending(p => p.Price) : q.OrderBy(p => p.Price),
            "discount" => desc ? q.OrderByDescending(p => p.Discount) : q.OrderBy(p => p.Discount),
            "createdat" => desc ? q.OrderByDescending(p => p.CreatedAt) : q.OrderBy(p => p.CreatedAt),
            "name" => desc ? q.OrderByDescending(p => p.Name) : q.OrderBy(p => p.Name),
            _ => q.OrderByDescending(p => p.CreatedAt)
        };

        var total = await q.CountAsync();

        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<ProductDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        return (items, total);
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var q = db.Products.AsNoTracking().Include(p => p.Brand).Where(p => p.ProductID == id);
        return await q.ProjectTo<ProductDto>(mapper.ConfigurationProvider).FirstOrDefaultAsync();
    }

    public async Task<int> CreateAsync(ProductCreateDto dto)
    {
        bool brandExists = await db.Brands.AnyAsync(b => b.BrandID == dto.BrandID);
        if (!brandExists) throw new InvalidOperationException("Brand not found or inactive.");

        var entity = mapper.Map<Product>(dto);
        entity.CreatedAt = DateTime.UtcNow;

        db.Products.Add(entity);
        await db.SaveChangesAsync();
        return entity.ProductID;
    }

    public async Task<bool> UpdateAsync(int id, ProductUpdateDto dto)
    {
        var entity = await db.Products.FirstOrDefaultAsync(p => p.ProductID == id);
        if (entity is null) return false;

        bool brandExists = await db.Brands.AnyAsync(b => b.BrandID == dto.BrandID);
        if (!brandExists) throw new InvalidOperationException("Brand not found.");

        mapper.Map(dto, entity);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SoftDeleteAsync(int id)
    {
        var entity = await db.Products.FirstOrDefaultAsync(p => p.ProductID == id);
        if (entity is null) return false;

        entity.Status = false;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> HardDeleteAsync(int id)
    {
        var entity = await db.Products.FirstOrDefaultAsync(p => p.ProductID == id);
        if (entity is null) return false;

        db.Products.Remove(entity);
        await db.SaveChangesAsync();
        return true;
    }
    public async Task<object> GetRatingSummary(int productId)
    {
        return await db.Reviews
            .Where(r => r.ProductID == productId)
            .GroupBy(r => r.Rating)
            .Select(g => new
            {
                rating = g.Key,
                count = g.Count()
            })
            .ToListAsync();
    }
}
