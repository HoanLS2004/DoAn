namespace Project1.Models.Entities
{
    public class Payment
    {
        public int PaymentID { get; set; }
        public int OrderID { get; set; }

        public string PaymentMethod { get; set; } = ""; // COD, Momo...
        public string PaymentStatus { get; set; } = "Pending";

        public string? TransactionID { get; set; }
        public DateTime? PaidAt { get; set; }

        public decimal Amount { get; set; }
    }
}
