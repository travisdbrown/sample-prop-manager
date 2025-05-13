using dyVisions.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Zelu.Infrastructure.Domain;

namespace Zelu.Property.Domain
{
    public class PropertyOwner : AggregateRoot
    {
        private PropertyOwner() : base() { }

        private PropertyOwner(string entityId, string propertyEntityId, string contactEntityId, Person? owner, Address? address, string? companyName,
                                string? website, string? phoneNumber) : base(entityId)
        {
            PropertyEntityId = propertyEntityId;
            ContactEntityId = contactEntityId;
            Owner = owner;
            Address = address;
            CompanyName = companyName;
            Website = website;
            PhoneNumber = phoneNumber;
        }

        public string PropertyEntityId { get; private set; } = string.Empty;

        public string ContactEntityId { get; private set; } = string.Empty;
        public string Name { get; private set; }
        public Person? Owner { get; private set; }
        public Address? Address { get; private set; }
        public string? CompanyName { get; private set; }
        public string? PhoneNumber { get; private set; }
        public string? Website { get; private set; }
        public bool IsDeleted { get; private set; } = false;

        internal void ApplyUpdates(dynamic changes)
        {
            if (changes.FirstName != null)
            {
                Owner?.SetFirstName(changes.FirstName);
            }

            if (changes.LastName != null)
            {
                Owner?.SetLastName(changes.LastName);
            }

            if (changes.MobilePhone != null)
            {
                Owner?.SetPhoneNumber(changes.MobilePhone);
            }
            
            if (changes.Email != null)
            {
                Owner?.SetEmailAddress(changes.Email);
            }

            if (changes.PhoneNumber != null)
            {
                PhoneNumber = changes.PhoneNumber;
            }

            if(changes.CompanyName != null)
            {
                CompanyName = changes.CompanyName;
            }

            if (changes.Website != null)
            {
                Website = changes.Website;
            }

            Address = UpdateAddress(changes);
        }

        private Address? UpdateAddress(dynamic changes)
        {
            string? addressLine1 = Address?.AddressLine1;
            string? addressLine2 = Address?.AddressLine2;
            string? addressLine3 = Address?.AddressLine3;
            string? city = Address?.City;
            string? state = Address?.State;
            string? postalCode = Address?.PostalCode;

            if (changes.AddressLine1 != null)
            {
                addressLine1 = changes.AddressLine1;
            }

            if (changes.AddressLine2 != null)
            {
                addressLine2 = changes.AddressLine2;
            }

            if (changes.AddressLine3 != null)
            {
                addressLine3 = changes.AddressLine3;
            }

            if (changes.City != null)
            {
                city = changes.City;
            }

            if (changes.State != null)
            {
                state = changes.State;
            }

            if (changes.PostalCode != null)
            {
                postalCode = changes.PostalCode;
            }

            return Address.Create(addressLine1!, addressLine2!, addressLine3!, city!, state!, postalCode!);
        }

        public static PropertyOwner Create(string entityId, string propertyEntityId, string contactEntityId, Person? owner, Address? address, string? companyName,
                                            string? website, string? phoneNumber)
        {
            return new PropertyOwner(entityId, propertyEntityId, contactEntityId, owner, address, companyName, website, phoneNumber);
        }


        public static PropertyOwner Load(int id, string entityId, string propertyEntityId, string contactEntityId, string name, string? phoneNumber = null)
        {
            var propertyOwner = new PropertyOwner(entityId, propertyEntityId, contactEntityId, null, null, null, null, phoneNumber);
            propertyOwner.Id = id;
            propertyOwner.Name = name;

            return propertyOwner;
        }
    
        public static PropertyOwner Load(int id, string entityId, string propertyEntityId, string contactEntityId, Person? owner = null, Address? address = null,
                                            string? companyName = null, string? website = null, string? phoneNumber = null)
        {
            var propertyOwner = new PropertyOwner(entityId, propertyEntityId, contactEntityId, owner, address, companyName, website, phoneNumber);
            propertyOwner.Id = id;

            return propertyOwner;
        }
    }
}
