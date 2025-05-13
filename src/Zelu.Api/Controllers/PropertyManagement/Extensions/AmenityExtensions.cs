using FluentResults;
using Zelu.Property.Domain;

namespace Zelu.Api.Controllers.PropertyManagement.Extensions
{
    public static class AmenityExtensions
    {
        public static dynamic ToResponseV10(this Amenity amenity)
        {
            return new KeyValuePair<string, string>(amenity.Key, amenity.Name);
        }
    }
}
