using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using Project1.Data;
using Project1.Models.DTOs;

namespace Project1.Services
{
    public class ChatService
    {
        private readonly AppDbContext _context;
        private readonly GeminiService _gemini;

        public ChatService(AppDbContext context, GeminiService gemini)
        {
            _context = context;
            _gemini = gemini;
        }

        public async Task<string> Process(string message)
        {
            message = message.ToLower();

            // ================= FAQ =================

            // 1. điện thoại chụp ảnh đẹp
            if (message.Contains("chụp ảnh"))
            {
                return "📸 Điện thoại chụp ảnh đẹp nhất hiện nay:\n\n" +
                       "iPhone 17 Pro Max\n" +
                       "Xem sản phẩm: http://localhost:4200/productss/12";
            }

            // 2. điện thoại bán chạy
            if (message.Contains("bán chạy"))
            {
                return "🔥 Điện thoại bán chạy nhất hiện nay:\n\n" +
                       "iPhone 14 Pro Max\n" +
                       "Xem sản phẩm: http://localhost:4200/productss/7";
            }

            // 3. điện thoại chip mạnh
            if (message.Contains("chip") || message.Contains("mượt"))
            {
                return "⚡ Điện thoại có chip xử lý mạnh:\n\n" +
                       "iQOO 12\n" +
                       "Xem sản phẩm: http://localhost:4200/productss/8\n\n" +
                       "iPhone 15 Pro Max\n" +
                       "Xem sản phẩm: http://localhost:4200/productss/9";
            }

            // 4. phí ship
            if (message.Contains("ship") || message.Contains("vận chuyển"))
            {
                return "🚚 Phí ship vận chuyển: MIỄN PHÍ\n\n" +
                       "📍 Hà Nội: giao hỏa tốc trong 2 giờ\n" +
                       "📦 Các tỉnh khác: 1 - 3 ngày tùy đơn vị vận chuyển.";
            }

            // 5. bảo hành / đổi trả
            if (message.Contains("bảo hành") || message.Contains("đổi trả"))
            {
                return "🛠 Chính sách bảo hành:\n\n" +
                       "✔ Hư gì đổi nấy (tháng đầu)\n" +
                       "✔ Lỗi nhà sản xuất → đổi mới miễn phí\n" +
                       "✔ Bảo hành chính hãng\n" +
                       "✔ Sửa quá 15 ngày → hỗ trợ đổi máy mới\n\n" +
                       "📞 Hotline: 0394140197\n\n" +
                       "⚠ Điều kiện: máy không rơi vỡ, vào nước.";
            }

            // 6. hủy đơn hàng
            if (message.Contains("hủy đơn"))
            {
                return "📞 Để hủy đơn hàng, vui lòng liên hệ hotline:\n\n0394140197\n\nNhân viên sẽ hỗ trợ ngay.";
            }

            // 7. giờ làm việc
            if (message.Contains("giờ làm việc") || message.Contains("mở cửa"))
            {
                return "🕒 Thời gian làm việc:\n\n" +
                       "08:00 - 23:00 hàng ngày\n" +
                       "Nghỉ lễ, tết.";
            }

            // ================= LỊCH SỬ MUA HÀNG =================

            if (message.Contains("lịch sử mua"))
            {
                var phoneMatch = Regex.Match(message, @"\d{9,11}");

                if (!phoneMatch.Success)
                    return "Vui lòng nhập số điện thoại để kiểm tra lịch sử mua hàng.";

                string phone = phoneMatch.Value;

                var orders = await _context.Orders
                     .Include(o => o.Payment)
                     .Where(o => o.ReceiverPhone == phone
                         && o.Payment.PaymentStatus == "Completed")
                     .Take(5)
                     .ToListAsync();

                if (!orders.Any())
                    return "Không tìm thấy đơn hàng nào.";

                string result = $"📦 Lịch sử mua hàng của {phone}:\n\n";

                foreach (var o in orders)
                {
                    result += $"Đơn #{o.OrderID} - {o.TotalAmount:n0}đ - {o.Payment?.PaidAt:dd/MM/yyyy}\n";
                }

                return result;
            }

            // ================= TÌM KIẾM THEO HÃNG =================
            if (message.Contains("tầm trung") || message.Contains("tam trung") ||
               message.Contains("giá rẻ") || message.Contains("gia re") ||
               message.Contains("sinh viên") || message.Contains("sinh vien") ||
               message.Contains("rẻ") || message.Contains("budget"))
            {
                return "💸 Điện thoại tầm trung đáng mua nhất:\n\n" +
                       "Samsung Galaxy A55 - 8.990.000đ\n" +
                       "Xem sản phẩm: http://localhost:4200/productss/18\n\n" +
                       "Xiaomi Redmi Note 13 Pro - 7.565.000đ\n" +
                       "Xem sản phẩm: http://localhost:4200/productss/11";
            }

            if (message.Contains("samsung"))
                return await GetPhones("Samsung", message);

            if (message.Contains("iphone") || (message.Contains("apple")))
                return await GetPhones("Apple", message);

            if (message.Contains("xiaomi"))
                return await GetPhones("Xiaomi", message);

            if (message.Contains("oppo"))
                return await GetPhones("Oppo", message);

            if (message.Contains("vivo"))
                return await GetPhones("Vivo", message);


            // 8. thanh toán
            if (message.Contains("thanh toán") || message.Contains("payment"))
            {
                return "💳 Các hình thức thanh toán:\n\n" +
                       "✔ Tiền mặt khi nhận hàng (COD)\n" +
                       "✔ Chuyển khoản ngân hàng\n" +
                       "✔ Ví điện tử: MoMo, ZaloPay, VNPay\n" +
                       "✔ Quẹt thẻ tại cửa hàng (Visa, Mastercard)\n" +
                       "✔ Trả góp 0% qua thẻ tín dụng";
            }

            // 9. khuyến mãi / giảm giá
            if (message.Contains("khuyến mãi") || message.Contains("giảm giá") || message.Contains("voucher") || message.Contains("coupon"))
            {
                return "🎁 Chương trình khuyến mãi hiện tại:\n\n" +
                       "✔ Miễn phí vận chuyển trên tianf quốc\n" +
                       "✔ Tặng ốp lưng + cường lực khi mua iPhone\n" +
                       "✔ Giảm thêm 500.000đ khi trade-in máy cũ\n\n" +
                       "📞 Liên hệ hotline 0394140197 để biết thêm chi tiết.";
            }

            // 10. địa chỉ cửa hàng
            if (message.Contains("địa chỉ") || message.Contains("cửa hàng") || message.Contains("showroom") || message.Contains("ở đâu"))
            {
                return "📍 Hệ thống cửa hàng:\n\n" +
                       "🏪 CS1: 123 Nguyễn Trãi, Hà Nội\n" +
                       "🏪 CS2: 456 Lê Văn Việt, TP.HCM\n" +
                       "🏪 CS3: 789 Hùng Vương, Đà Nẵng\n\n" +
                       "🕒 Giờ mở cửa: 08:00 - 23:00 hàng ngày";
            }

            // 11. trả góp
            if (message.Contains("trả góp") || message.Contains("góp"))
            {
                return "💰 Chính sách trả góp:\n\n" +
                       "✔ Trả góp 0% lãi suất qua thẻ tín dụng\n" +
                       "✔ Trả góp qua Home Credit, FE Credit\n" +
                       "✔ Phân kỳ 3 - 6 - 12 tháng\n" +
                       "✔ Chỉ cần CMND/CCCD + hợp đồng lao động\n\n" +
                       "📞 Tư vấn: 0394140197";
            }

            // 12. thu cũ đổi mới / trade-in
            if (message.Contains("thu cũ") || message.Contains("trade") || message.Contains("đổi máy cũ"))
            {
                return "🔄 Chương trình Thu cũ - Đổi mới:\n\n" +
                       "✔ Định giá máy cũ minh bạch, nhanh chóng\n" +
                       "✔ Cộng thêm 500.000đ so với giá thị trường\n" +
                       "✔ Áp dụng cho tất cả các hãng\n\n" +
                       "📍 Mang máy đến cửa hàng hoặc gọi 0394140197 để được tư vấn.";
            }

            // 13. pin / sạc
            if (message.Contains("pin") || message.Contains("sạc nhanh") || message.Contains("battery"))
            {
                return "🔋 Điện thoại pin trâu, sạc nhanh:\n\n" +
                       "Samsung Galaxy S25 Ultra - Pin 5000mAh, sạc 45W\n" +
                       "Xem sản phẩm: http://localhost:4200/productss/5\n\n" +
                       "Xiaomi 14 - Pin 4610mAh, sạc 90W\n" +
                       "Xem sản phẩm: http://localhost:4200/productss/10";
            }

            // 14. điện thoại chơi game
            if (message.Contains("chơi game") || message.Contains("gaming") || message.Contains("game"))
            {
                return "🎮 Điện thoại chơi game mạnh nhất:\n\n" +
                       "iQOO 12 - Snapdragon 8 Gen 3, màn 144Hz\n" +
                       "Xem sản phẩm: http://localhost:4200/productss/8\n\n" +
                       "Xiaomi 14 - GPU Adreno 750, tản nhiệt buồng hơi\n" +
                       "Xem sản phẩm: http://localhost:4200/productss/10";
            }

            // 15. liên hệ / hotline
            if (message.Contains("liên hệ") || message.Contains("hotline") || message.Contains("số điện thoại") || message.Contains("hỗ trợ"))
            {
                return "📞 Thông tin liên hệ:\n\n" +
                       "Hotline: 0394140197 (08:00 - 23:00)\n" +
                       "Email: support@phoneshop.vn\n" +
                       "Facebook: fb.com/phoneshop\n\n" +
                       "💬 Hoặc chat trực tiếp tại đây, mình luôn sẵn sàng hỗ trợ!";
            }

         
           

            // 17. so sánh sản phẩm
            if (message.Contains("so sánh") || message.Contains("khác nhau") || message.Contains("nên mua"))
            {
                return "🤔 Bạn muốn so sánh sản phẩm nào?\n\n" +
                       "Ví dụ: 'so sánh iPhone 15 và Samsung S24'\n\n" +
                       "Hoặc cho mình biết nhu cầu của bạn:\n" +
                       "📸 Chụp ảnh đẹp\n" +
                       "🎮 Chơi game mạnh\n" +
                       "🔋 Pin trâu\n" +
                       "💸 Giá rẻ\n" +
                       "Mình sẽ tư vấn sản phẩm phù hợp nhất!";
            }
            return await _gemini.AskAI(message);
        }

        // Trả về (minPrice, maxPrice) dựa trên từ khóa trong message
        private (int minPrice, int maxPrice) GetPriceRange(string message)
        {
            int minPrice = 0;
            int maxPrice = int.MaxValue;

            // "từ X đến Y triệu" — ưu tiên match trước
            var tuDen = Regex.Match(message, @"từ\s*(\d+)\s*đến\s*(\d+)\s*triệu");
            if (tuDen.Success)
            {
                minPrice = int.Parse(tuDen.Groups[1].Value) * 1_000_000;
                maxPrice = int.Parse(tuDen.Groups[2].Value) * 1_000_000;
                return (minPrice, maxPrice);
            }

            // "trên X triệu"
            var tren = Regex.Match(message, @"trên\s*(\d+)\s*triệu");
            if (tren.Success)
            {
                minPrice = int.Parse(tren.Groups[1].Value) * 1_000_000;
                return (minPrice, maxPrice);
            }

            // "dưới X triệu"
            var duoi = Regex.Match(message, @"dưới\s*(\d+)\s*triệu");
            if (duoi.Success)
            {
                maxPrice = int.Parse(duoi.Groups[1].Value) * 1_000_000;
                return (minPrice, maxPrice);
            }

            // Fallback: "X triệu" không có từ khóa → hiểu là "dưới X triệu"
            var exact = Regex.Match(message, @"(\d+)\s*triệu");
            if (exact.Success)
                maxPrice = int.Parse(exact.Groups[1].Value) * 1_000_000;

            return (minPrice, maxPrice);
        }

        // Các từ nhiễu cần loại bỏ khi trích tên sản phẩm
        private static readonly string[] NoiseWords = new[]
        {
            "điện thoại", "dt", "máy", "smartphone",
            "iphone", "samsung", "xiaomi", "oppo", "vivo", "apple",
            "giá", "rẻ", "mới", "tốt", "ngon", "xịn",
            "cho", "tôi", "mình", "xem", "tìm", "muốn", "cần",
            "trên", "dưới", "từ", "đến", "khoảng", "tầm"
        };

        // Trích tên sản phẩm cụ thể từ message (bỏ brand, từ nhiễu và từ khóa giá)
        private string? ExtractProductName(string message, string brand)
        {
            string cleaned = message;

            // Bước 1: Xóa TOÀN BỘ cụm giá trước (vd: "trên 20 triệu", "từ 10 đến 20 triệu")
            cleaned = Regex.Replace(cleaned, @"(từ\s*)?\d+\s*triệu(\s*đến\s*\d+\s*triệu)?", " ");
            cleaned = Regex.Replace(cleaned, @"(trên|dưới|từ|đến|khoảng|tầm)\s*\d*", " ");

            // Bước 2: Xóa các từ nhiễu
            foreach (var word in NoiseWords)
                cleaned = cleaned.Replace(word, " ");

            // Bước 3: Chỉ giữ lại ký tự chữ/số, xóa ký tự lạ
            cleaned = Regex.Replace(cleaned, @"[^\p{L}\p{N}\s]", " ");

            // Bước 4: Chuẩn hóa khoảng trắng
            cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();

            // Chỉ dùng làm keyword nếu còn lại ít nhất 3 ký tự có nghĩa
            // (tránh các từ đơn lẻ như "pro", "se" vẫn hợp lệ)
            return cleaned.Length >= 2 ? cleaned : null;
        }

        private async Task<string> GetPhones(string brand, string message)
        {
            var (minPrice, maxPrice) = GetPriceRange(message);
            string? productKeyword = ExtractProductName(message, brand);

            var query = _context.Products
                .Include(p => p.Brand)
                .Include(p => p.Category)   // FIX: include Category để filter
                .Include(p => p.Images)
                .Where(p => p.Brand.Name == brand
                         && p.Category.Name == "Điện thoại"  // FIX: chỉ lấy điện thoại
                         && p.Price >= minPrice
                         && p.Price <= maxPrice);

            // Nếu có tên sản phẩm cụ thể thì lọc thêm theo tên
            if (!string.IsNullOrEmpty(productKeyword))
                query = query.Where(p => p.Name.ToLower().Contains(productKeyword));

            var products = await query.Take(5).ToListAsync();

            if (!products.Any())
                return $"Không tìm thấy sản phẩm {brand} phù hợp với yêu cầu của bạn.";

            string result = $"📱 Các điện thoại {brand} phù hợp:\n\n";

            foreach (var p in products)
            {
                string link = $"http://localhost:4200/productss/{p.ProductID}";
                result += $"{p.Name} - {p.Price:n0}đ\n";
                result += $"Xem sản phẩm: {link}\n\n";
            }

            return result;
        }
    }
}