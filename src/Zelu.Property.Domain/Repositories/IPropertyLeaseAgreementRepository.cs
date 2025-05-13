using dyVisions.Data.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Integrations.Lease;

namespace Zelu.Property.Domain.Repositories
{
    public interface IPropertyLeaseAgreementRepository : IRepository<PropertyLeaseAgreement, int>, IRepository, IUnitOfWorkParticipant
    {
        Task<PropertyLeaseAgreement?> FindByPropertyEntityId(string propertyEntityId);
        Task<PropertyLeaseAgreement?> FindByLeaseAgreementEntityId(string leaseEntityId);
        Task<List<PropertyLeaseAgreement>?> FindByContactEntityId(string contactEntityId);
    }
}
