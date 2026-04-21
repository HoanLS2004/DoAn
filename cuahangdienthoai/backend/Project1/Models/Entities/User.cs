namespace Project1.Models.Entities
{
    public class User
    {
        public int UserID { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string? Phone { get; set; }
        public string Role { get; set; } = "Customer";
        public DateTime CreatedAt { get; set; }
    }
}
