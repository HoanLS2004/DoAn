using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Models.DTOs;
using Project1.Models.Entities;
using Project1.Services;
using System.Security.Claims;
namespace Project1.Controllers
{
    [ApiController]
    [Route("api/reviews")]
    public class ReviewsController : ControllerBase
    {
        private readonly ReviewService _service;

        public ReviewsController(ReviewService service)
        {
            _service = service;
        }

        // Lấy tất cả review
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var reviews = await _service.GetAll();
            return Ok(reviews);
        }
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            var reviews = await _service.GetByProduct(productId);
            return Ok(reviews);
        }
        [Authorize]
        [HttpPost]
            public async Task<IActionResult> Create(ReviewCreateDTO dto)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                    return Unauthorized("Token không hợp lệ");

            
                if (dto.UserID == 0)
                {
                    dto.UserID = int.Parse(userIdClaim.Value);
                }

                await _service.Create(dto);
                return Ok(new { message = "Review created successfully" });
            }


        // Update review
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ReviewUpdateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            await _service.Update(id, dto);

            return Ok(new { message = "Review updated successfully" });
        }

        // Delete review
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.Delete(id);

            return Ok(new { message = "Review deleted successfully" });
        }

        // Rating trung bình
        [HttpGet("avg/{productId}")]
        public async Task<IActionResult> GetAverage(int productId)
        {
            var avg = await _service.GetAverageRating(productId);

            return Ok(new
            {
                productId = productId,
                averageRating = avg
            });
        }
    }
}