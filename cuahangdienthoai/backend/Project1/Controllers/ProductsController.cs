using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Entities;
using Project1.Models.DTOs;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Project1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public ProductsController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // GET: api/products
        [HttpGet]
        public async Task<IActionResult> GetAll(
    string? search = null,
    int? brandId = null,
    int page = 1,
    int pageSize = 10)
        {
            var query = _db.Products
                .Include(p => p.Brand)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p => p.Name.Contains(search));

            if (brandId.HasValue)
                query = query.Where(p => p.BrandID == brandId.Value);

            var totalItems = await query.CountAsync();

            var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

            var result = items.Select(p => _mapper.Map<ProductDto>(p)).ToList();

            return Ok(new { totalItems, page, pageSize, items = result });

        }
        // GET: api/products/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _db.Products
                 .Include(p => p.Brand)
                 .Include(p => p.Category)
                 .Include(p => p.Images)
                 .AsNoTracking()
                 .FirstOrDefaultAsync(p => p.ProductID == id);

                  if (product == null) return NotFound();

                     var result = _mapper.Map<ProductDto>(product);

                    return Ok(result);
        }

        // POST: api/products
        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Create(ProductCreateDto dto)
        {
            if (!await _db.Brands.AnyAsync(b => b.BrandID == dto.BrandID))
                return BadRequest("Brand không tồn tại.");
            if (!await _db.Categories.AnyAsync(c => c.CategoryID == dto.CategoryID))
                return BadRequest("Category không tồn tại.");

            var entity = _mapper.Map<Product>(dto);
            _db.Products.Add(entity);
            await _db.SaveChangesAsync();

            var product = await _db.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .Include(p => p.Images)
            .FirstAsync(p => p.ProductID == entity.ProductID);

            var result = _mapper.Map<ProductDto>(product);

            return CreatedAtAction(nameof(GetById), new { id = entity.ProductID }, result);
        }

        // PUT: api/products/5
        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, ProductUpdateDto dto)
        {
            var entity = await _db.Products.FirstOrDefaultAsync(p => p.ProductID == id);
            if (entity is null) return NotFound();

            if (!await _db.Brands.AnyAsync(b => b.BrandID == dto.BrandID))
                return BadRequest("Brand không tồn tại.");
            if (!await _db.Categories.AnyAsync(c => c.CategoryID == dto.CategoryID))
                return BadRequest("Category không tồn tại.");
            _mapper.Map(dto, entity);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/products/5
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _db.Products.FirstOrDefaultAsync(p => p.ProductID == id);
            if (entity is null) return NotFound();

            _db.Products.Remove(entity);
            await _db.SaveChangesAsync();

            return NoContent();
        }
        [HttpGet("total")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTotalProducts()
        {
            var total = await _db.Products.CountAsync();
            return Ok(new { total });
        }
        [HttpGet("rating-summary/{productId}")]
        public async Task<IActionResult> GetRatingSummary(int productId)
        {
            var result = await _db.Reviews
                .Where(r => r.ProductID == productId)
                .GroupBy(r => r.Rating)
                .Select(g => new
                {
                    rating = g.Key,
                    count = g.Count()
                })
                .ToListAsync();

            return Ok(result);
        }
    }
}
