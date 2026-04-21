using Microsoft.AspNetCore.Mvc;
using Project1.Models.DTOs;
using Project1.Services;

namespace Project1.Controllers
{
    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly ChatService _chatService;

        public ChatController(ChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpPost]
        public async Task<IActionResult> Chat([FromBody] ChatbotDTO req)
        {
            var reply = await _chatService.Process(req.Message);

            return Ok(new { reply });
        }
    }
}