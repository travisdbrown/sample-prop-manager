using Azure.Core;
using System.Text.Json.Serialization;

namespace Zelu.Api.Controllers.PropertyManagement.Payloads.v1
{
    public class CreatePropertyRequest
    {
        public string AddressLine1 { get; set; } = string.Empty;
        public string? AddressLine2 { get; set; }
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string PropertyCategoryKey { get; set; } = string.Empty;
        public decimal? Size { get; set; }
        public string? UnitNumber { get; set; }
        public decimal? NumberOfBedrooms { get; set; }
        public decimal? NumberOfBaths { get; set; }
        public string? ExternalId { get; set; }
        public bool IsMultiUnit { get; set; }
        public List<PropertyOwner> PropertyOwners { get; set; } = new List<PropertyOwner>();
        public List<string>? Amenities { get; set; } = new List<string>();
        public List<CreatePropertyUnitRequest> PropertyUnits { get; set; } = new List<CreatePropertyUnitRequest>();
    }

    public class PropertyOwner
    {
        public string ContactEntityId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
