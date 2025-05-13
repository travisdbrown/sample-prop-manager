using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Notifications
{
    public class LeaseAgreementUpdated : INotification
    {
        public LeaseAgreementUpdated(string entityId, DateTimeOffset? startDate, DateTimeOffset? endDate, long? leaseAmount, string? tenantContactEntityId, string? coTenantContactEntityId, string? statusKey)
        {
            EntityId = entityId;
            StartDate = startDate;
            EndDate = endDate;
            LeaseAmount = leaseAmount;
            TenantContactEntityId = tenantContactEntityId;
            CoTenantContactEntityId = coTenantContactEntityId;
            StatusKey = statusKey;
        }

        public string EntityId { get; }
        public DateTimeOffset? StartDate { get; }
        public DateTimeOffset? EndDate { get; }
        public long? LeaseAmount { get; }
        public string? TenantContactEntityId { get; }
        public string? CoTenantContactEntityId { get; }
        public string? StatusKey { get; }
    }
}
