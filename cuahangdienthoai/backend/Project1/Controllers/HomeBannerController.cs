using Microsoft.AspNetCore.Mvc;
using Project1.Data;
using System.Linq;

namespace Project1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HomeBannerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HomeBannerController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("banners")]
        public IActionResult GetHomeBanners()
        {
            var banners = _context.HomeBanners
                .Where(b => b.IsActive)
                .OrderBy(b => b.DisplayOrder)
                .Select(b => new
                {
                    b.BannerID,
                    b.Title,
                    b.ImageUrl,
                    b.LinkUrl
                })
                .ToList();

            return Ok(banners);
        }
    }
}
