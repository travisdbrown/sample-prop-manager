namespace Zelu.Api.Controllers.PropertyManagement.Payloads
{
    public enum Direction
    {
        Ascending = 1,
        Descending = 2
    }

    public class SearchCriteriaRequest
    {
        public string? Criteria { get; set; }

        public Dictionary<string, object>? Params { get; set; }

        public string? OrderBy { get; set; }
        public string Direction { get; set; } = "ascending";
    }
}
