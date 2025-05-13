using dyVisions.Data.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Property.Domain.Repositories
{
    public interface IPropertyOwnerRepository : IRepository<PropertyOwner, int>, IRepository, IUnitOfWorkParticipant
    {
        Task<PropertyOwner> FindByEntityIdAsync(string entityId);
    }
}
