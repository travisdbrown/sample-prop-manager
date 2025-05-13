using dyVisions.Data.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Property.Domain.Repositories
{
    public interface IAmenityRepository : IRepository<Amenity, string>, IRepository, IUnitOfWorkParticipant
    {
        Task<Amenity?> FindByKey(string key);
        Task<List<Amenity>> GetAll();
        Task<List<Amenity>> FindAll(string[] keys);
    }
}
