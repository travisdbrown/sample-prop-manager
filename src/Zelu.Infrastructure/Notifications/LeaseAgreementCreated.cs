using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Notifications
{
    public class LeaseAgreementCreated : INotification
    {
        public LeaseAgreementCreated(string externalId, string leaseEntityId, string propertyEntityId, DateTimeOffset startDate, DateTimeOffset? endDate, long leaseAmount, string? statusKey,
                                        string? tenantContactEntityId, string? tenantName, string? tenantPhoneNumber, string? coTenantContactEntityId, string? coTenantName, string? coTenantPhoneNumber,
                                        string? paymentFrequencyPattern = null)
        {
            ExternalId = externalId;
            LeaseEntityId = leaseEntityId;
            PropertyEntityId = propertyEntityId;
            StartDate = startDate;
            EndDate = endDate;
            LeaseAmount = leaseAmount;
            StatusKey = statusKey;
            TenantContactEntityId = tenantContactEntityId;
            TenantName = tenantName;
            TenantPhoneNumber = tenantPhoneNumber;
            CoTenantContactEntityId = coTenantContactEntityId;
            CoTenantName = coTenantName;
            CoTenantPhoneNumber = coTenantPhoneNumber;
            PaymentFrequencyPattern = paymentFrequencyPattern;
        }

        public string ExternalId { get; }
        public string LeaseEntityId { get; }
        public string PropertyEntityId { get; }
        public DateTimeOffset StartDate { get; }
        public DateTimeOffset? EndDate { get; }
        public long LeaseAmount { get; }
        public string? StatusKey { get; }
        public string? TenantContactEntityId { get; }
        public string? TenantName { get; }
        public string? TenantPhoneNumber { get; }
        public string? CoTenantContactEntityId { get; }
        public string? CoTenantName { get; }
        public string? CoTenantPhoneNumber { get; }
        public string? PaymentFrequencyPattern { get; }
    }
}
