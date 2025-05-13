using Zelu.Property.Domain;

namespace Zelu.Api.Controllers.PropertyManagement.Extensions
{
    public static class PropertyUnitExtensions
    {
        public static dynamic ToResponseV10(this PropertyUnit propertyUnit)
        {
            return new
            {
                propertyUnit.EntityId
                ,propertyUnit.ExternalId
                ,PropertyEntityId = propertyUnit.Property.EntityId
                ,propertyUnit.UnitNumber
                ,propertyUnit.NumberOfBaths
                ,propertyUnit.NumberOfBeds
                ,propertyUnit.Size
                ,propertyUnit.IsDeleted
                ,Property = propertyUnit.Property.ToResponseV10()
            };
        }
    }
}
