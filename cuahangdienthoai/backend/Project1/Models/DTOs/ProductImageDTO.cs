namespace Project1.Models.DTOs
{
    public class ProductImageDto
    {
        public int ImageID { get; set; }
        public int ProductID { get; set; }
        public string ImageUrl { get; set; } = default!;
        public bool IsThumbnail { get; set; }
    }

    public class ProductImageCreateDto
    {
        public int ProductID { get; set; }
        public IFormFile File { get; set; } = default!;
        public bool IsThumbnail { get; set; } = false;
    }

    public class ProductImageUpdateDto
    {
        public int ProductID { get; set; }
        public bool IsThumbnail { get; set; }
        public IFormFile? File { get; set; }
    }
}
