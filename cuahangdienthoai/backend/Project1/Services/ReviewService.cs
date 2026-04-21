using Microsoft.EntityFrameworkCore;
using Project1.Data;
using Project1.Models.DTOs;
using Project1.Models.Entities;

namespace Project1.Services
{
    public class ReviewService
    {
        private readonly AppDbContext _context;

        public ReviewService(AppDbContext context)
        {
            _context = context;
        }
        public async Task<List<ReviewDTO>> GetAll()
        {
            return await _context.Reviews
                .Select(r => new ReviewDTO
                {
                    ReviewID = r.ReviewID,
                    ProductID = r.ProductID,
                    UserID = r.UserID,
                    UserName = r.User != null ? r.User.FullName : "User #" + r.UserID,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }

        // Lấy review theo product
        public async Task<List<ReviewDTO>> GetByProduct(int productId)
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.ProductID == productId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewDTO
                {
                    ReviewID = r.ReviewID,
                    ProductID = r.ProductID,
                    UserID = r.UserID,
                    UserName = r.User != null ? r.User.FullName : "Khách #" + r.UserID,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }

        // Create
        //public async Task Create(ReviewCreateDTO dto)
        //{
        //    var review = new Review
        //    {
        //        ProductID = dto.ProductID,
        //        UserID = dto.UserID,
        //        Rating = dto.Rating,
        //        Comment = dto.Comment,
        //        CreatedAt = DateTime.Now
        //    };

        //    _context.Reviews.Add(review);
        //    await _context.SaveChangesAsync();
        //}
        public async Task Create(ReviewCreateDTO dto)
        {
            var user = await _context.Users.FindAsync(dto.UserID);
            if (user == null)
                throw new KeyNotFoundException("User không tồn tại");

            var product = await _context.Products.FindAsync(dto.ProductID);
            if (product == null)
                throw new KeyNotFoundException("Product không tồn tại");

            var review = new Review
            {
                ProductID = dto.ProductID,
                UserID = dto.UserID,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedAt = DateTime.Now
            };
            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
        }

        // Update
        public async Task Update(int id, ReviewUpdateDTO dto)
        {
            var review = await _context.Reviews.FindAsync(id);

            if (review == null) return;

            review.Rating = dto.Rating;
            review.Comment = dto.Comment;

            await _context.SaveChangesAsync();
        }

        // Delete
        public async Task Delete(int id)
        {
            var review = await _context.Reviews.FindAsync(id);

            if (review == null) return;

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
        }

        // Rating trung bình
        public async Task<double> GetAverageRating(int productId)
        {
            return await _context.Reviews
                .Where(r => r.ProductID == productId)
                .AverageAsync(r => (double?)r.Rating) ?? 0;
        }
    }
}