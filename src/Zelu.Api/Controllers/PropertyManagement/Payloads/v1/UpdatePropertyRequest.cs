namespace Zelu.Api.Controllers.PropertyManagement.Payloads.v1
{
    public class UpdatePropertyRequest
    {
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; } 
        public string? PostalCode { get; set; }
        public string? PropertyCategoryKey { get; set; }
        public decimal? Size { get; set; }
        public string? UnitNumber { get; set; }
        public decimal? NumberOfBedrooms { get; set; }
        public decimal? NumberOfBaths { get; set; }
    }
}
