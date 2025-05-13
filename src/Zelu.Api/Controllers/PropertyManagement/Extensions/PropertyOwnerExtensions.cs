using Zelu.Property.Domain;

namespace Zelu.Api.Controllers.PropertyManagement.Extensions
{
    public static class PropertyOwnerExtensions
    {
        public static dynamic ToResponseV10(this PropertyOwner entity)
        {
            return new
            {
                entity.EntityId
                ,entity.PropertyEntityId
                ,entity.ContactEntityId
                ,entity.Owner?.Name
                ,entity.Owner?.FirstName
                ,entity.Owner?.LastName
                ,entity.CompanyName
                ,Email = entity.Owner?.EmailAddress
                ,MobilePhone = entity.Owner?.PhoneNumber
                ,entity.PhoneNumber
                ,entity.Address?.AddressLine1
                ,entity.Address?.AddressLine2
                ,entity.Address?.AddressLine3
                ,entity.Address?.City
                ,entity.Address?.State
                ,entity.Address?.PostalCode
                ,entity.Website
            };
        }
    }
}
