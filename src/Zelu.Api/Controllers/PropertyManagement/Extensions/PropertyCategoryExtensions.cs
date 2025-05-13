using Zelu.Property.Domain;

namespace Zelu.Api.Controllers.PropertyManagement.Extensions
{
    public static class PropertyCategoryExtensions
    {
        public static dynamic ToResponseV10(this PropertyCategory propertyCategory)
        {
            return new KeyValuePair<string, string>(propertyCategory.Key, propertyCategory.Name );
        }
    }
}
