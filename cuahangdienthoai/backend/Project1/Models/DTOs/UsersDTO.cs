namespace Project1.Models.DTOs
{
    public class UsersDTO
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Password { get; set; } // password gốc từ frontend
        public string? Phone { get; set; }
        public string Role { get; set; } = "Customer";
    }

    public class UsersUpdateRequest
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Password { get; set; } // optional
        public string? Phone { get; set; }
        public string Role { get; set; } = "Customer";
    }
}
