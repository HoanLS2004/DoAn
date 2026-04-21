using Newtonsoft.Json;
using Project1.Models.DTOs;
using Project1.Models.Entities;
using System.Security.Cryptography;
using System.Text;
public class MomoService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _http;

    public MomoService(IConfiguration config)
    {
        _config = config;
        _http = new HttpClient();
    }

    public async Task<MomoDTO> CreatePayment(long amount, string orderId)
    {
        var partnerCode = _config["MoMo:PartnerCode"];
        var accessKey = _config["MoMo:AccessKey"];
        var secretKey = _config["MoMo:SecretKey"];
        var endpoint = _config["MoMo:Endpoint"];
        var redirectUrl = _config["MoMo:RedirectUrl"];
        var ipnUrl = _config["MoMo:IpnUrl"];

        string requestId = Guid.NewGuid().ToString();
        string orderInfo = "Thanh toan don hang";
        string requestType = "captureWallet";
        string momoOrderId = orderId + "_" + DateTime.Now.Ticks;
        string rawHash =
            $"accessKey={accessKey}" +
            $"&amount={amount}" +
            $"&extraData=" +
            $"&ipnUrl={ipnUrl}" +
            $"&orderId={momoOrderId}" +
            $"&orderInfo={orderInfo}" +
            $"&partnerCode={partnerCode}" +
            $"&redirectUrl={redirectUrl}" +
            $"&requestId={requestId}" +
            $"&requestType={requestType}";
        string signature = SignSHA256(rawHash, secretKey);

        var request = new
        {
            partnerCode,
            accessKey,
            requestId,
            amount = amount.ToString(),
            orderId = momoOrderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData = "",
            requestType,
            signature
        };

        var json = JsonConvert.SerializeObject(request);

        var response = await _http.PostAsync(
            endpoint,
            new StringContent(json, Encoding.UTF8, "application/json")
        );

        var result = await response.Content.ReadAsStringAsync();

        Console.WriteLine("MOMO RESPONSE: " + result);

        return JsonConvert.DeserializeObject<MomoDTO>(result);
    }

    private string SignSHA256(string message, string key)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var messageBytes = Encoding.UTF8.GetBytes(message);

        using var hmac = new HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(messageBytes);

        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}
