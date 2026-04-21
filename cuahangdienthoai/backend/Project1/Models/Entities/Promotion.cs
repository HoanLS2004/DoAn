namespace Project1.Models.Entities
{
    public class Promotion
    {
        public int PromotionID { get; set; }
        public string Code { get; set; }
        public string Description { get; set; }
        public string DiscountType { get; set; }   // "Percent" hoặc "Amount"
        public decimal DiscountValue { get; set; }
        public decimal MinOrderValue { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Quantity { get; set; }
        public bool IsActive { get; set; }
    }
}
