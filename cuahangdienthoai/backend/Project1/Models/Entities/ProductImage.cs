using System.ComponentModel.DataAnnotations;

namespace Project1.Entities
{
    public class ProductImage
    {
        public int ImageID { get; set; }

        [Required]
        public int ProductID { get; set; }

        [Required, MaxLength(500)]
        public string ImageUrl { get; set; } = default!;

        public bool IsThumbnail { get; set; } = false;

        // Quan hệ n-1: N image thuộc 1 Product
        public Product Product { get; set; } = default!;
    }
}
