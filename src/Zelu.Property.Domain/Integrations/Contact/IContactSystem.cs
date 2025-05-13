using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Property.Domain.Integrations.Contact
{
    public interface IContactSystem
    {
        Task<Contact> CreateContact(string externalId, string contactType, bool isPerson, string firstName, string lastName, string? companyName = null,
                                string? addressLine1 = null, string? addressLine2 = null, string? addressLine3 = null, string? city = null, string? state = null, string? postalCode = null,
                                string? email = null, string? phoneNumber = null, string? mobileNumber = null, string? website = null);

        Task UpdateContact(string entityId, bool? isPerson = null, string? firstName = null, string? lastName = null, string? companyName = null,
                        string? addressLine1 = null, string? addressLine2 = null, string? addressLine3 = null, string? city = null, string? state = null, string? postalCode = null,
                        string? email = null, string? phoneNumber = null, string? mobileNumber = null, string? website = null);

        Task DeleteContact(string entityId);
    }
}
