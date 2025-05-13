namespace Zelu.Api.Controllers
{
    public class SearchRequest
    {
        public string? Criteria { get; set; }

        public Dictionary<string, object>? Params { get; set; }

        public string? OrderBy { get; set; }
        public string Direction { get; set; } = "ascending";
    }
}
