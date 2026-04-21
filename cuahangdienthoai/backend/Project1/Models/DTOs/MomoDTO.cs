namespace Project1.Models.DTOs
{
    public class MomoDTO
    {
        public string partnerCode { get; set; }
        public string orderId { get; set; }
        public string requestId { get; set; }

        public long responseTime { get; set; }
        public int resultCode { get; set; }
        public string message { get; set; }

        public string payUrl { get; set; }
        public string qrCodeUrl { get; set; }
        public string deeplink { get; set; }
    }
}
