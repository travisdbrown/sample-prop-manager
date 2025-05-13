namespace Zelu.Api.Controllers.PropertyManagement.Extensions
{
    using Zelu.Property.Domain;

    public static class PropertyExtensions
    {
        public static dynamic ToSearchResponseV10(this PropertyView property)
        {
            return new
            {
                property.EntityId,
                property.ExternalId,
                property.Address?.AddressLine1,
                property.Address?.AddressLine2,
                property.Address?.City,
                property.Address?.State,
                property.Address?.PostalCode,
                PropertyCategoryKey = property.PropertyCategory.Key,
                property.Size,
                property.IsDeleted,
                property.ParentEntityId,
                property.UnitNumber,
                property.LeaseAgreementEntityId,
                property.NumberOfBeds,
                property.NumberOfBaths,
                property.IsMultiUnit,
                property.TotalOccupied,
                property.TotalUnits
            };
        }

        public static dynamic ToResponseV10(this Property property)
        {
            return new
            {
                property.EntityId,
                property.ExternalId,
                property.ParentEntityId,
                property.Address?.AddressLine1,
                property.Address?.AddressLine2,
                property.Address?.City,
                property.Address?.State,
                property.Address?.PostalCode,
                PropertyCategoryKey = property.PropertyCategory?.Key,
                PropertyCategoryName = property.PropertyCategory?.Name,
                property.Size,
                property.UnitNumber,
                property.NumberOfBaths,
                property.NumberOfBedrooms,
                Amenities = property.Amenities?.Select(e => e.Key).ToArray(),
                PropertyOwners = property.PropertyOwners?.Select(o => new 
                {
                    o.EntityId,
                    o.ContactEntityId, 
                    o.Name, 
                    o.PhoneNumber 
                }),
                PropertyUnits = property.PropertyUnits?.Select(u => new
                {
                    u.EntityId,
                    u.ExternalId,
                    property.Address?.AddressLine1,
                    property.Address?.AddressLine2,
                    property.Address?.City,
                    property.Address?.State,
                    property.Address?.PostalCode,
                    PropertyCategoryKey = property.PropertyCategory.Key,
                    u.Size,
                    u.UnitNumber,
                    u.NumberOfBaths,
                    u.NumberOfBedrooms,
                    u.IsDeleted
                }),
                LeaseAgreements = property.LeaseAgreements?.Select(l => new
                {
                    EntityId = l.LeaseAgreementEntityId
                    ,l.StartDate
                    ,l.EndDate
                    ,l.RentAmount
                    ,l.TenantContactEntityId
                    ,l.TenantName
                    ,l.TenantPhoneNumber
                    ,l.CoTenantContactEntityId
                    ,l.CoTenantName
                    ,l.CoTenantPhoneNumber
                }),
                property.IsMultiUnit,
                property.IsDeleted,
            };
        }
    }
}
