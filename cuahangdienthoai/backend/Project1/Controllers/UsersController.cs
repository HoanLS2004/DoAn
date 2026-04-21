using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Models.Entities;
using Project1.Models.DTOs;
using BCrypt.Net;

namespace Project1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // ================= Create =================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UsersDTO dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email đã tồn tại!");

            if (string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Password không được để trống!");

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Phone = dto.Phone,
                Role = dto.Role,
                CreatedAt = DateTime.UtcNow,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm tài khoản thành công!" });
        }

        // ================= Update =================
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UsersUpdateRequest dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.FullName = dto.FullName;
            user.Email = dto.Email;
            user.Phone = dto.Phone;
            user.Role = dto.Role;

            // Nếu có password mới thì hash
            if (!string.IsNullOrWhiteSpace(dto.Password))
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công!" });
        }

        // ================= GetAll =================
        [HttpGet]
        public async Task<IActionResult> GetAll(int page = 1, int pageSize = 10, string? keyword = null)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(u =>
                    u.FullName.ToLower().Contains(keyword) ||
                    u.Email.ToLower().Contains(keyword) ||
                    (u.Phone != null && u.Phone.Contains(keyword))
                );
            }

            var totalRecords = await query.CountAsync();
            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                totalRecords,
                page,
                pageSize,
                data = users.Select(u => new {
                    u.UserID,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Role,
                    u.CreatedAt
                }) // không trả PasswordHash ra frontend
            });
        }

        // ================= Delete =================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa thành công!" });
        }
    }
}
