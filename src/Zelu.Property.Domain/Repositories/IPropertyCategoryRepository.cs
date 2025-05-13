using dyVisions.Data.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Property.Domain.Repositories
{
    public interface IPropertyCategoryRepository : IRepository<PropertyCategory, string>, IRepository, IUnitOfWorkParticipant
    {
        Task<PropertyCategory?> FindByKey(string key);
        Task<List<PropertyCategory>> GetAll();
    }
}
