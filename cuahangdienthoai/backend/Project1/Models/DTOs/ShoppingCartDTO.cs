namespace Project1.Models.DTOs
{
    public class ShoppingCartDTO
    {
        public int ProductID { get; set; }
        public string ProductName { get; set; }
        public string Thumbnail { get; set; }
        public decimal Price { get; set; }
        public decimal Discount { get; set; }
        public int Quantity { get; set; }
        public int StockQuantity { get; set; }
        public decimal FinalPrice => Price * (1 - Discount / 100);
    }
}
