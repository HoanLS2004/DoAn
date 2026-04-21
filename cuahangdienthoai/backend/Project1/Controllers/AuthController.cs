using Project1.Helpers;
using Project1.Models.DTOs;
using Project1.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Data;

namespace Project1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly TokenService _tokenService;

        public AuthController(AppDbContext context, TokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO request)
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
                return BadRequest(new { message = "Email này đã được sử dụng. Vui lòng dùng email khác." });

            string hashedPassword = PasswordHasher.HashPassword(request.Password);
            var user = new Models.Entities.User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = hashedPassword,
                Phone = request.Phone,
                Role = "Customer",
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = _tokenService.CreateToken(user);
            return Ok(new { token, message = "Đăng ký thành công!" });
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return Unauthorized("Email hoặc mật khẩu không đúng.");

            bool validPassword = PasswordHasher.VerifyPassword(request.Password, user.PasswordHash);
            if (!validPassword)
                return Unauthorized("Email hoặc mật khẩu không đúng.");

            var token = _tokenService.CreateToken(user);
            return Ok(new
            {
                token,
                role = user.Role
            });
        }
        
    }
}
