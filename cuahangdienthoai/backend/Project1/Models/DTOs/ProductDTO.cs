using System.ComponentModel.DataAnnotations;

namespace Project1.Models.DTOs
{
    public class ProductDto
    {
        public int ProductID { get; set; }
        public string Name { get; set; }
        public int BrandID { get; set; }
        public string BrandName { get; set; }
        public string CategoryID { get; set; }  
        public string CategoryName { get; set; }
        public decimal Price { get; set; }
        public decimal Discount { get; set; }
        public string? Description { get; set; }
        public int StockQuantity { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool Status { get; set; }
        public string? ThumbnailUrl { get; set; }
    }

    public class ProductCreateDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = null!;

    [Required]
    public int BrandID { get; set; }

    [Required]
     public string CategoryID { get; set; } = null!;
        public decimal Price { get; set; }

    public decimal Discount { get; set; } = 0;
    public string? Description { get; set; }
    public int StockQuantity { get; set; } = 0;
    public bool Status { get; set; } = true;
}

    public class ProductUpdateDto
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = null!;

        [Required]
        public int BrandID { get; set; }

        [Required]
        public string CategoryID { get; set; } = null!;
        public decimal Price { get; set; }

        public decimal Discount { get; set; } = 0;

        public string? Description { get; set; }

        public int StockQuantity { get; set; } = 0;

        public bool Status { get; set; } = true;
    }
}
