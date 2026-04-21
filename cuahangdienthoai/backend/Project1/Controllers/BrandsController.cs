using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Entities;
using Project1.Models.DTOs;
using Project1.Models.Entities;

namespace Project1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BrandsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public BrandsController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // GET: api/brands
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _db.Brands
                .AsNoTracking()
                .ProjectTo<BrandDto>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return Ok(items);
        }

        // GET: api/brands/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _db.Brands
                .AsNoTracking()
                .Where(b => b.BrandID == id)
                .ProjectTo<BrandDto>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync();

            return item is null ? NotFound() : Ok(item);
        }

        // POST: api/brands
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create(BrandCreateDto dto)
        {
            var entity = _mapper.Map<Brand>(dto);
            _db.Brands.Add(entity);
            await _db.SaveChangesAsync();

            var result = _mapper.Map<BrandDto>(entity);
            return CreatedAtAction(nameof(GetById), new { id = entity.BrandID }, result);
        }

        // PUT: api/brands/5
        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, BrandUpdateDto dto)
        {
            var entity = await _db.Brands.FirstOrDefaultAsync(b => b.BrandID == id);
            if (entity is null) return NotFound();

            _mapper.Map(dto, entity);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/brands/5
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _db.Brands.FirstOrDefaultAsync(b => b.BrandID == id);
            if (entity is null) return NotFound();

            _db.Brands.Remove(entity);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
