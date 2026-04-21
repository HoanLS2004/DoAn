using Microsoft.EntityFrameworkCore;
using Project1.Entities;
using Project1.Models.Entities;
using Project1.Models.DTOs;
namespace Project1.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<HomeBanner> HomeBanners { get; set; }
        public DbSet<Brand> Brands { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; } = default!;
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<OrderPromotion> OrderPromotions { get; set; }
        public DbSet<Promotion> Promotions { get; set; }
         public DbSet<RevenueDto> Revenues { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<ShoppingCart> ShoppingCart { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<ProductConfiguration> ProductConfigurations { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Khai báo primary key cho ProductImage
            modelBuilder.Entity<ProductImage>(entity =>
            {
                entity.HasKey(e => e.ImageID);
                entity.Property(e => e.ImageUrl)
                      .IsRequired()
                      .HasMaxLength(500);

                entity.HasOne(e => e.Product)
                      .WithMany(p => p.Images) // cần thêm ICollection<ProductImage> Images trong Product
                      .HasForeignKey(e => e.ProductID)
                      .OnDelete(DeleteBehavior.Cascade);
            });
            modelBuilder.Entity<RevenueDto>(entity =>
            {
                entity.HasNoKey();
                entity.ToView(null); // không map table
            });
        }
    }
}
