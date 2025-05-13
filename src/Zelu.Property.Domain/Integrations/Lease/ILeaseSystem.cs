using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Property.Domain.Integrations.Lease
{
    public interface ILeaseSystem
    {
        Task<LeaseAgreement> CreateLeaseAgreement(DateTimeOffset startDate, int rentAmount, string propertyEntityId, string paymentFrequencyKey, string renewalTermKey, string leaseTermKey,
                                    bool isPerson, DateTimeOffset? endDate = null, int? paymentDay = null, int? deposit = null, string? firstName = null, string? lastName = null,
                                    string? companyName = null, string? addressLine1 = null, string? addressLine2 = null, string? addressLine3 = null, string? city = null,
                                    string? state = null, string? postalCode = null, string? phoneNumber = null, string? mobilePhone = null, string? email = null,
                                    string? website = null, string? externalId = null);

    }
}
