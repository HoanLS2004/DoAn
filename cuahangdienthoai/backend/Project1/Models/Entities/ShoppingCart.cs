using Project1.Entities;
using System.ComponentModel.DataAnnotations;

namespace Project1.Models.Entities
{
    public class ShoppingCart
    {
        [Key]
        public int CartId { get; set; }
        public int UserID { get; set; }
        public int ProductID { get; set; }
        public int Quantity { get; set; }
       
        // Navigation properties
        public Product Product { get; set; }
        public User User { get; set; }
    }
}
