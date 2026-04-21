using Project1.Entities;
namespace Project1.Models.Entities
{
    public class Category
    {
        public String CategoryID { get; set; }
        public string Name { get; set; } = default!;
        public string? Description { get; set; }
        // Quan hệ 1-n: 1 Category có nhiều Product
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
