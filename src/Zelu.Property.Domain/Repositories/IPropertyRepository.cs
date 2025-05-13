using dyVisions.Data.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Queries;

namespace Zelu.Property.Domain.Repositories
{
    public interface IPropertyRepository : IRepository<Property, int>, IRepository, IUnitOfWorkParticipant
    {
        Task<Property?> FindByEntityId(string entityId, bool includeDeleted = false);
        Task AddPropertyAmenity(Property property);
        Task AddPropertyAmenities(string propertyEntityId, List<Amenity> amenities);
        Task<(int TotalResultCount, IEnumerable<PropertyView> Results)> SearchProperty(int page, int pageSize, SearchPropertyQuery searchPropertyQuery, bool includeDeleted = false);
        Task AddTotalUnitsStat(Property property, int val);
        Task AddTotalOccupiedStat(Property property, int val);
        Task SoftDelete(Property entity);
    }
}
