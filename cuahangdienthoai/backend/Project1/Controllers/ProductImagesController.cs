using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Entities;
using Project1.Models.DTOs;

namespace Project1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductImagesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public ProductImagesController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // GET: api/ProductImages?productId=1
        [HttpGet]
        public async Task<IActionResult> GetAll(int? productId = null)
        {
            var query = _db.ProductImages.AsQueryable();

            if (productId.HasValue)
                query = query.Where(x => x.ProductID == productId.Value);

            var images = await query.ToListAsync();
            return Ok(_mapper.Map<List<ProductImageDto>>(images));
        }


        // POST: api/ProductImages
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Upload([FromForm] ProductImageCreateDto dto)
        {
            if (!await _db.Products.AnyAsync(p => p.ProductID == dto.ProductID))
                return BadRequest("Product không tồn tại.");

            if (dto.File == null || dto.File.Length == 0)
                return BadRequest("File không hợp lệ.");

            // Tạo tên file duy nhất
            var fileName = Guid.NewGuid() + Path.GetExtension(dto.File.FileName);
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsPath))
                Directory.CreateDirectory(uploadsPath);

            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = System.IO.File.Create(filePath))
            {
                await dto.File.CopyToAsync(stream);
            }

            var entity = new ProductImage
            {
                ProductID = dto.ProductID,
                ImageUrl = "/uploads/" + fileName,
                IsThumbnail = dto.IsThumbnail
            };

            _db.ProductImages.Add(entity);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new { productId = dto.ProductID }, _mapper.Map<ProductImageDto>(entity));
        }
        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> UpdateImage(int id, [FromForm] ProductImageUpdateDto dto)
        {
            var image = await _db.ProductImages.FindAsync(id);
            if (image == null) return NotFound("Không tìm thấy hình ảnh!");

            // cập nhật ProductID & IsThumbnail
            image.ProductID = dto.ProductID;
            image.IsThumbnail = dto.IsThumbnail;

            // nếu có upload file mới thì thay thế
            if (dto.File != null && dto.File.Length > 0)
            {
                var fileName = Guid.NewGuid() + Path.GetExtension(dto.File.FileName);
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

                if (!Directory.Exists(uploadsPath))
                    Directory.CreateDirectory(uploadsPath);

                var filePath = Path.Combine(uploadsPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.File.CopyToAsync(stream);
                }

                // xóa file cũ nếu tồn tại
                if (!string.IsNullOrEmpty(image.ImageUrl))
                {
                    var oldPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", image.ImageUrl.TrimStart('/').Replace("/", "\\"));
                    if (System.IO.File.Exists(oldPath))
                        System.IO.File.Delete(oldPath);
                }

                // cập nhật lại url
                image.ImageUrl = "/uploads/" + fileName;
            }

            await _db.SaveChangesAsync();

            return Ok(_mapper.Map<ProductImageDto>(image));
        }
        // DELETE: api/ProductImages/5
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _db.ProductImages.FirstOrDefaultAsync(x => x.ImageID == id);
            if (entity == null) return NotFound();

            _db.ProductImages.Remove(entity);
            await _db.SaveChangesAsync();

            // Xóa file trên server
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", entity.ImageUrl.TrimStart('/').Replace("/", "\\"));
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);

            return NoContent();
        }
    }
}
