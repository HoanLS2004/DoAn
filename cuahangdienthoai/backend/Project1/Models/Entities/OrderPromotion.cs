namespace Project1.Models.Entities
{
    public class OrderPromotion
    {
        public int OrderPromotionID { get; set; }
        public int OrderID { get; set; }
        public int PromotionID { get; set; }
        public decimal DiscountAmount { get; set; }

        public Order Order { get; set; }
        public Promotion Promotion { get; set; }
    }
}
