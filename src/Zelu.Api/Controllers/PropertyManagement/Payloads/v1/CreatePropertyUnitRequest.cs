namespace Zelu.Api.Controllers.PropertyManagement.Payloads.v1
{
    public class CreatePropertyUnitRequest
    {
        public string? ExternalId { get; set; }
        public string? UnitNumber { get; set; }
        public decimal? NumberOfBedrooms { get; set; }
        public decimal? NumberOfBaths { get; set; }
        public decimal? Size { get; set; }
    }
}
