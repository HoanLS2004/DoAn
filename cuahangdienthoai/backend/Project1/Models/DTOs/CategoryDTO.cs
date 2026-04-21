namespace Project1.Models.DTOs
{
    public class CategoryDTO
    {
        public string CategoryID { get; set; }
        public string Name { get; set; } = default!;
        public string? Description { get; set; }
    }
    public class CategoryCreateDto
    {
        public string CategoryID { get; set; }
        public string Name { get; set; } = default!;
        public string? Description { get; set; }
    }
    public class CategoryUpdateDto
    {
        public string Name { get; set; } = default!;
        public string? Description { get; set; }
    }
}
