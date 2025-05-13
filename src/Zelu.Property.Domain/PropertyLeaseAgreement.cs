using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Infrastructure.Domain;
using Zelu.Infrastructure.Extensions;

namespace Zelu.Property.Domain
{
    public class PropertyLeaseAgreement : AggregateRoot
    {
        private PropertyLeaseAgreement() { }

        private PropertyLeaseAgreement(string propertyEntityId, string leaseAgreementEntityId, DateTimeOffset startDate, DateTimeOffset? endDate, long rentAmount, string? statusKey,
                                        string? tenantContactEntityId, string? tenantName, string? tenantPhoneNumber,string? coTenantContactEntityId, string? coTenantName, string? coTenantPhoneNumber)
        {
            PropertyEntityId = propertyEntityId;
            LeaseAgreementEntityId = leaseAgreementEntityId;
            StartDate = startDate;
            EndDate = endDate;
            RentAmount = rentAmount;
            StatusKey = statusKey;
            TenantContactEntityId = tenantContactEntityId;
            TenantName = tenantName;
            TenantPhoneNumber = tenantPhoneNumber;
            CoTenantName = coTenantName;
            CoTenantPhoneNumber = coTenantPhoneNumber;
            CoTenantContactEntityId = coTenantContactEntityId;
        }

        private PropertyLeaseAgreement(int id, string propertyEntityId, string leaseAgreementEntityId, DateTimeOffset startDate, DateTimeOffset? endDate, long rentAmount, 
                                        string? statusKey, string? tenantContactEntityId, string? tenantName, string? tenantPhoneNumber, string? coTenantContactEntityId, string? coTenantName, string? coTenantPhoneNumber) 
            : this(propertyEntityId, leaseAgreementEntityId, startDate, endDate, rentAmount, statusKey, tenantContactEntityId, tenantName, tenantPhoneNumber, coTenantContactEntityId, coTenantName, coTenantPhoneNumber)
        {
            Id = id;
        }

        public string PropertyEntityId { get; private set; }
        public string LeaseAgreementEntityId { get; private set; }
        public DateTimeOffset StartDate { get; private set; }
        public DateTimeOffset? EndDate { get; private set; }
        public long RentAmount { get; private set; }
        public string? StatusKey { get; private set; }
        public string? TenantContactEntityId { get; private set; }
        public string? TenantName { get; private set; }
        public string? TenantPhoneNumber { get; private set; }
        public string? CoTenantContactEntityId { get; set; }
        public string? CoTenantName { get; private set; }
        public string? CoTenantPhoneNumber { get; private set; }

        internal void ApplyUpdates(dynamic changes)
        {
            if (DynamicHelper.HasProperty(changes, nameof(StartDate)) && changes.StartDate is not null)
            {
                StartDate = changes.StartDate;
            }

            if (DynamicHelper.HasProperty(changes, nameof(EndDate)) && changes.EndDate is not null)
            {
                EndDate = changes.EndDate;
            }

            if (DynamicHelper.HasProperty(changes, nameof(RentAmount)) && changes.RentAmount is not null)
            {
                RentAmount = changes.RentAmount;
            }

            if (DynamicHelper.HasProperty(changes, nameof(TenantContactEntityId)) && changes.TenantContactEntityId is not null)
            {
                TenantContactEntityId = changes.TenantContactEntityId;
            }

            if (DynamicHelper.HasProperty(changes, nameof(TenantName)) && changes.TenantName is not null)
            {
                TenantName = changes.TenantName;
            }

            if (DynamicHelper.HasProperty(changes, nameof(TenantPhoneNumber)) && changes.TenantPhoneNumber is not null)
            {
                TenantPhoneNumber = changes.TenantPhoneNumber;
            }

            if (DynamicHelper.HasProperty(changes, nameof(CoTenantContactEntityId)) && changes.CoTenantContactEntityId is not null)
            {
                CoTenantContactEntityId = changes.CoTenantContactEntityId;
            }

            if (DynamicHelper.HasProperty(changes, nameof(CoTenantName)) && changes.CoTenantName is not null)
            {
                CoTenantName = changes.CoTenantName;
            }

            if (DynamicHelper.HasProperty(changes, nameof(CoTenantPhoneNumber)) && changes.CoTenantPhoneNumber is not null)
            {
                CoTenantPhoneNumber = changes.CoTenantPhoneNumber;
            }

            if (DynamicHelper.HasProperty(changes, nameof(StatusKey)) && changes.StatusKey is not null)
            {
                StatusKey = changes.StatusKey;
            }
        }

        public static PropertyLeaseAgreement Create(string propertyEntityId, string leaseAgreementEntityId, DateTimeOffset startDate, long rentAmount, DateTimeOffset? endDate = null, 
                                                    string? statusKey = null, string? tenantContactEntityId = null, string? tenantName = null, string? tenantPhoneNumber = null, string? cotenantContactEntityId = null,
                                                    string? coTenantName = null, string? coTenantPhoneNumber = null)
        {
            return new PropertyLeaseAgreement(propertyEntityId, leaseAgreementEntityId, startDate, endDate, rentAmount, statusKey, tenantContactEntityId, tenantName, tenantPhoneNumber, cotenantContactEntityId,
                                                coTenantName, coTenantPhoneNumber);
        }

        public static PropertyLeaseAgreement Load(int id, string propertyEntityId, string leaseAgreementEntityId, DateTimeOffset startDate, long rentAmount, DateTimeOffset? endDate = null,
                                                    string? statusKey = null, string? tenantContactEntityId = null, string ? tenantName = null, string? tenantPhoneNumber = null, string? cotenantContactEntityId = null,
                                                    string? coTenantName = null, string? coTenantPhoneNumber = null)
        {
            return new PropertyLeaseAgreement(id, propertyEntityId, leaseAgreementEntityId, startDate, endDate, rentAmount, statusKey, tenantContactEntityId, tenantName, tenantPhoneNumber, cotenantContactEntityId, coTenantName, 
                                                coTenantPhoneNumber);
        }
    }
}
