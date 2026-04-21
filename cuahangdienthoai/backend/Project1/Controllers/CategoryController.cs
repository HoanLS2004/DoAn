using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Models.DTOs;
using Project1.Models.Entities;

namespace Project1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public CategoryController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // GET: api/category
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _db.Categories
                .AsNoTracking()
                .ToListAsync();

            var result = _mapper.Map<List<CategoryDTO>>(categories);

            return Ok(result);
        }

        // GET: api/category/CAT001
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var category = await _db.Categories
                .FirstOrDefaultAsync(c => c.CategoryID == id);

            if (category == null) return NotFound();

            return Ok(_mapper.Map<CategoryDTO>(category));
        }

        // POST: api/category
        [HttpPost]
        public async Task<IActionResult> Create(CategoryCreateDto dto)
        {
            if (await _db.Categories.AnyAsync(c => c.CategoryID == dto.CategoryID))
                return BadRequest("Category đã tồn tại");

            var entity = _mapper.Map<Category>(dto);

            _db.Categories.Add(entity);
            await _db.SaveChangesAsync();

            return Ok(_mapper.Map<CategoryDTO>(entity));
        }

        // PUT: api/category/CAT001
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, CategoryUpdateDto dto)
        {
            var category = await _db.Categories
                .FirstOrDefaultAsync(c => c.CategoryID == id);

            if (category == null) return NotFound();

            _mapper.Map(dto, category);

            await _db.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/category/CAT001
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var category = await _db.Categories
                .FirstOrDefaultAsync(c => c.CategoryID == id);

            if (category == null) return NotFound();

            _db.Categories.Remove(category);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}