using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Notifications
{
    public class ContactUpdated : INotification
    {
        public ContactUpdated(string entityId, string? firstName = null, string? lastName = null, string? companyName = null, string? addressLine1 = null,
                                    string? addressLine2 = null, string? addressLine3 = null, string? city = null, string? state = null, string? postalCode = null, string? phoneNumber = null,
                                    string? mobilePhone = null, string? email = null, string? website = null)
        {
            EntityId = entityId;
            FirstName = firstName;
            LastName = lastName;
            CompanyName = companyName;
            AddressLine1 = addressLine1;
            AddressLine2 = addressLine2;
            AddressLine3 = addressLine3;
            City = city;
            State = state;
            PostalCode = postalCode;
            PhoneNumber = phoneNumber;
            MobileNumber = mobilePhone;
            EmailAddress = email;
            Website = website;
        }

        public string EntityId { get; }
        public string? FirstName { get; }
        public string? LastName { get; }
        public string? CompanyName { get; }
        public string? AddressLine1 { get; }
        public string? AddressLine2 { get; }
        public string? AddressLine3 { get; }
        public string? City { get; }
        public string? State { get; }
        public string? PostalCode { get; }
        public string? PhoneNumber { get; }
        public string? MobileNumber { get; }
        public string? EmailAddress { get; }
        public string? Website { get; }
    }
}
