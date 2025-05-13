namespace Zelu.Api.Controllers.PropertyManagement.Payloads.v1
{
    public class CreatePropertyOwnerRequest
    {
        public bool IsPerson { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? CompanyName { get; set; }
        public string? AddressLine1 { get; set;}
        public string? AddressLine2 { get; set;}
        public string? AddressLine3 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? PhoneNumber { get; set; }
        public string? MobilePhone { get; set; }
        public string? Email { get; set; }
        public string? Website { get; set; }
        public string? ExternalId { get; set; }
    }
}
