using System.ComponentModel.DataAnnotations;

namespace Project1.Models.Entities
{
    public class HomeBanner
    {
        [Key]
        public int BannerID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string? LinkUrl { get; set; }
        public bool IsActive { get; set; }
        public int DisplayOrder { get; set; }

        
        public int? BrandID { get; set; }
        public Brand? Brand { get; set; }
    }
}
