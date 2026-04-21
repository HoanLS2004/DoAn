namespace Project1.Models.DTOs
{
    public class OrderDTO
    {
        public int ProductID { get; set; }
        public int Quantity { get; set; }
    }
    public class OrderCreateDto
    {
        public int UserID { get; set; }
        public string ReceiverName { get; set; }
        public string ReceiverPhone { get; set; }
        public string ShippingAddress { get; set; }
        public string? VoucherCode { get; set; }
        public string PaymentMethod { get; set; }
        public List<OrderDTO> OrderDetails { get; set; } = new();
    }
    public class OrderDetailDto
    {
        public int ProductID { get; set; }
        public string ProductName { get; set; } = "";
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class OrderResponseDto
    {
        public int OrderID { get; set; }
        public int UserID { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public List<OrderDetailDto> OrderDetails { get; set; } = new();
    }
    public class UpdateOrderStatusDto
    {
        public string Status { get; set; } = "";
    }
    public class UpdateOrderInfoDto
    {
        public string? ReceiverName { get; set; }
        public string? ReceiverPhone { get; set; }
        public string? ShippingAddress { get; set; }
    }

}
