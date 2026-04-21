using Project1.Models.Entities;

namespace Project1.Entities
{
    public class Product
    {
        public int ProductID { get; set; }
        public string Name { get; set; } = default!;
        public int BrandID { get; set; }
        public string CategoryID { get; set; } 
        public Category Category { get; set; }
        public decimal Price { get; set; }
        public decimal Discount { get; set; } = 0;
        public string? Description { get; set; }
        public int StockQuantity { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public bool Status { get; set; } = true;
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();

        // Quan hệ n-1: N Product thuộc 1 Brand
        public Brand Brand { get; set; } = default!;
    }
}
