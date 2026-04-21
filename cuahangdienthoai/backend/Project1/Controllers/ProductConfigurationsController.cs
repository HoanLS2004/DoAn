using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Models.DTOs;
using Project1.Models.Entities;
namespace Project1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductConfigurationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductConfigurationsController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            var config = await _context.ProductConfigurations
                .Where(x => x.ProductID == productId)
                .FirstOrDefaultAsync();

            if (config == null)
                return NotFound("Không có cấu hình");

            return Ok(config);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var configs = await _context.ProductConfigurations.ToListAsync();
            return Ok(configs);
        }

        // =============================
        // Thêm cấu hình
        // =============================

        [HttpPost]
        public async Task<IActionResult> Create(ProductConfigurationDTO dto)
        {
            var config = new ProductConfiguration
            {
                ConfigCode = dto.ConfigCode,
                ProductID = dto.ProductID,
                Color = dto.Color,
                Screen = dto.Screen,
                OperatingSystem = dto.OperatingSystem,
                RearCamera = dto.RearCamera,
                FrontCamera = dto.FrontCamera,
                CPU = dto.CPU,
                GPU = dto.GPU,
                RAM = dto.RAM,
                InternalStorage = dto.InternalStorage,
                SIM = dto.SIM,
                Network = dto.Network,
                Battery = dto.Battery,
                Charging = dto.Charging,
                RefreshRate = dto.RefreshRate,
                Fingerprint = dto.Fingerprint,
                WaterResistance = dto.WaterResistance,
                Weight = dto.Weight,
                Design = dto.Design,
                CreatedAt = DateTime.Now
            };

            _context.ProductConfigurations.Add(config);
            await _context.SaveChangesAsync();

            return Ok(config);
        }

        // =============================
        // Cập nhật cấu hình
        // =============================

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ProductConfigurationDTO dto)
        {
            var config = await _context.ProductConfigurations.FindAsync(id);

            if (config == null)
                return NotFound();

            config.Color = dto.Color;
            config.Screen = dto.Screen;
            config.OperatingSystem = dto.OperatingSystem;
            config.RearCamera = dto.RearCamera;
            config.FrontCamera = dto.FrontCamera;
            config.CPU = dto.CPU;
            config.GPU = dto.GPU;
            config.RAM = dto.RAM;
            config.InternalStorage = dto.InternalStorage;
            config.SIM = dto.SIM;
            config.Network = dto.Network;
            config.Battery = dto.Battery;
            config.Charging = dto.Charging;
            config.RefreshRate = dto.RefreshRate;
            config.Fingerprint = dto.Fingerprint;
            config.WaterResistance = dto.WaterResistance;
            config.Weight = dto.Weight;
            config.Design = dto.Design;

            await _context.SaveChangesAsync();

            return Ok(config);
        }

        // =============================
        // Xóa cấu hình
        // =============================

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var config = await _context.ProductConfigurations.FindAsync(id);

            if (config == null)
                return NotFound();

            _context.ProductConfigurations.Remove(config);
            await _context.SaveChangesAsync();

            return Ok("Đã xóa cấu hình");
        }
    }
}
