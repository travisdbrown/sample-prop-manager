using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Property.Domain.Integrations.Lease
{
    public record LeaseAgreement(string EntityId, string propertyEntityId, DateTimeOffset startDate, DateTimeOffset? endDate, long leaseAmount, string? statusKey);
}
