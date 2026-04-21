namespace Project1.Models.Entities
{
    public class Brand
    {
        public int BrandID { get; set; }
        public string Name { get; set; } = null!;

        public ICollection<HomeBanner> HomeBanners { get; set; } = new List<HomeBanner>();
    }
}
