using System.Text;
using Newtonsoft.Json;
using System.Net.Http;

namespace Project1.Services
{
    public class GeminiService
    {
        private readonly HttpClient _http;

        private string API_KEY = "AIzaSyBCuqCsM2WZyIYD4WYXiEZP1FZl_Hh4Xp8";

        public GeminiService(HttpClient http)
        {
            _http = http;
        }

        public async Task<string> AskAI(string message)
        {
            var url =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + API_KEY;

            var body = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = message }
                        }
                    }
                }
            };

            var json = JsonConvert.SerializeObject(body);

            var response = await _http.PostAsync(
                url,
                new StringContent(json, Encoding.UTF8, "application/json")
            );

            var result = await response.Content.ReadAsStringAsync();

            Console.WriteLine(result);

            dynamic data = JsonConvert.DeserializeObject(result);

            if (data?.candidates == null)
                return "Không có thông tin vui lòng thử lại sau";

            return data.candidates[0].content.parts[0].text.ToString();
        }
    }
}