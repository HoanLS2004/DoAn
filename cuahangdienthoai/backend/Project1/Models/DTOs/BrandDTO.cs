using System.ComponentModel.DataAnnotations;

namespace Project1.Models.DTOs
{
    public record BrandDto
    {
        public int BrandID { get; set; }
        public string Name { get; set; } = default!;
    }

    public record BrandCreateDto(
        [Required, MaxLength(200)] string Name
    );

    public record BrandUpdateDto(
        [Required, MaxLength(200)] string Name
    );
}
