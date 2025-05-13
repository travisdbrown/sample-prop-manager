using IdGen;
using MediatR;
using dyVisions.Domain;
using System.Reflection.Metadata.Ecma335;
using System.Text.Json.Serialization;
using Zelu.Infrastructure.Domain;
using Zelu.Infrastructure.Extensions;
using Zelu.Property.Domain;
using Zelu.Property.Domain.Integrations.Lease;

namespace Zelu.Property.Domain
{
    public class Property : AggregateRoot
    {
        public Property() { }

        protected Property(string entityId, string externalId, Address? address, PropertyCategory? propertyCategory, decimal? size, string? parentEntityId,
                            string? unitNumber, decimal? numberOfBedrooms, decimal? numberOfBaths, bool isMultiUnit) : base(entityId)
        {
            EntityId = entityId ?? throw new ArgumentNullException(nameof(entityId));
            ExternalId = externalId ?? throw new ArgumentNullException(nameof(externalId));
            Address = address;
            PropertyCategory = propertyCategory;
            Size = size;
            ParentEntityId = parentEntityId;
            UnitNumber = unitNumber;
            NumberOfBedrooms = numberOfBedrooms;
            NumberOfBaths = numberOfBaths;
            IsMultiUnit = isMultiUnit;
        }

        public string? ParentEntityId { get; protected set; }

        [JsonInclude]
        public Address? Address { get; private set; }

        [JsonInclude]
        public PropertyCategory? PropertyCategory { get; internal set; }

        [JsonInclude]
        public string ExternalId { get; private set; }

        [JsonInclude]
        public decimal? Size { get; private set; }

        [JsonInclude]
        public string? UnitNumber { get; private set; }

        [JsonInclude]
        public decimal? NumberOfBedrooms { get; private set; }

        [JsonInclude]
        public decimal? NumberOfBaths { get; private set; }

        [JsonInclude]
        public bool IsDeleted { get; private set; } = false;

        [JsonInclude]
        public bool IsMultiUnit { get; private set; } = false;

        private readonly List<PropertyLeaseAgreement> leaseAgreements = new List<PropertyLeaseAgreement>();
        public IEnumerable<PropertyLeaseAgreement> LeaseAgreements => leaseAgreements.AsReadOnly();


        private readonly List<Property> propertyUnits = new List<Property>();
        public IEnumerable<Property> PropertyUnits => propertyUnits.AsReadOnly();

        private readonly List<PropertyOwner> propertyOwners = new List<PropertyOwner>();
        public IEnumerable<PropertyOwner> PropertyOwners => propertyOwners.AsReadOnly();

        private readonly List<Amenity> amenities = new List<Amenity>();
        public IEnumerable<Amenity> Amenities => amenities.AsReadOnly();

        public Property AddUnit(string entityId, string unitNumber, string? externalId = null, decimal? size = null, decimal? numberOfBedrooms = null, 
                            decimal? numberOfBaths = null)
        {
            if(this.IsMultiUnit == false)
            {
                throw new Exception($"Property '{this.EntityId}' is not a multi-unit property. Unable to add property unit.");
            }

            if (string.IsNullOrEmpty(unitNumber))
            {
                throw new ArgumentNullException(nameof(unitNumber));
            };

            var unit = Property.Create(entityId, this.Address, null, false, size: size, parentEntityId: this.EntityId, unitNumber: unitNumber,
                                        numberOfBedrooms: numberOfBedrooms, numberOfBaths: numberOfBaths);

            propertyUnits.Add(unit);

            return unit;
        }

        public void AddLeaseAgreement(PropertyLeaseAgreement leaseAgreement) 
        { 
            leaseAgreements.Add(leaseAgreement);
        }

        public void LoadLeaseAgreement(PropertyLeaseAgreement leaseAgreement)
        {
            leaseAgreements.Add(leaseAgreement);
        }

        public void UpdateLeaseAgreement(PropertyLeaseAgreement leaseAgreement)
        {
            var exitingAgreement = leaseAgreements.Find(a => a.LeaseAgreementEntityId == leaseAgreement.LeaseAgreementEntityId);
            if(exitingAgreement is null)
            {
                throw new IndexOutOfRangeException(nameof(leaseAgreement));
            }

            exitingAgreement = leaseAgreement;
        }

        public void CreateOwner(string ownerEntityId, string contactEntityId, string firstName, string lastName, string phoneNumber)
        {
            //var owner = Person.Create(firstName, lastName, phoneNumber);
            //var propertyOwner = PropertyOwner.Create(ownerEntityId, this.EntityId, contactEntityId, owner, phoneNumber);
            //propertyOwners.Add(propertyOwner);
        }

        internal void LoadUnits(List<Property> units)
        {
            propertyUnits.AddRange(units);
        }

        public void LoadOwners(List<PropertyOwner> owners)
        {
            propertyOwners.AddRange(owners);
        }

        public void AddAmenity(Amenity amenity)
        {
            _ = amenity ?? throw new ArgumentNullException(nameof(amenity));

            amenities.Add(amenity);
        }

        public void MarkDeleted()
        {
            IsDeleted = true;
            foreach (var item in propertyUnits)
            {
                item.MarkDeleted();
            }
        }

        public void Restore()
        {
            IsDeleted = false;
        }

        internal void ApplyUpdates(dynamic changes)
        {            
            if (DynamicHelper.HasProperty(changes, nameof(Size)) && changes.Size is not null)
            {
                Size = changes.Size;
            }

            if (DynamicHelper.HasProperty(changes, nameof(UnitNumber)) && changes.UnitNumber is not null)
            {
                UnitNumber = changes.UnitNumber;
            }

            if (DynamicHelper.HasProperty(changes, nameof(NumberOfBedrooms)) && changes.NumberOfBedrooms is not null)
            {
                NumberOfBedrooms = changes.NumberOfBedrooms;
            }

            if (DynamicHelper.HasProperty(changes, nameof(NumberOfBaths)) && changes.NumberOfBaths is not null)
            {
                NumberOfBaths = changes.NumberOfBaths;
            }

            Address = UpdateAddress(changes);
        }

        private Address? UpdateAddress(dynamic changes)
        {
            string? addressLine1 = Address?.AddressLine1;
            string? addressLine2 = Address?.AddressLine2;
            string? city = Address?.City;
            string? state = Address?.State;
            string? postalCode = Address?.PostalCode;

            if (!string.IsNullOrEmpty(changes.AddressLine1))
            {
                addressLine1 = changes.AddressLine1;
            }

            if (!string.IsNullOrEmpty(changes.AddressLine2))
            {
                addressLine2 = changes.AddressLine2;
            }

            if (!string.IsNullOrEmpty(changes.City))
            {
                city = changes.City;
            }

            if (!string.IsNullOrEmpty(changes.State))
            {
                state = changes.State;
            }

            if (!string.IsNullOrEmpty(changes.PostalCode))
            {
                postalCode = changes.PostalCode;
            }

            return Address.Create(addressLine1!, addressLine2!, null, city!, state!, postalCode!);
        }

        public static Property Create(string entityId, Address? address, PropertyCategory? propertyCategory, bool isMultiUnit, string? externalId = null, decimal? size = null, 
                                        string? parentEntityId = null, string? unitNumber = null, decimal? numberOfBedrooms = null, decimal? numberOfBaths = null)
        {
            if (string.IsNullOrEmpty(externalId))
            {
                externalId = entityId;
            }

            return new Property(entityId, externalId, address, propertyCategory, size, parentEntityId, unitNumber, numberOfBedrooms, numberOfBaths, isMultiUnit);
        }

        public static Property Load(int? Id, string entityId, Address? address, PropertyCategory? propertyCategory,bool isMultiUnit, bool? isDeleted, string? externalId = null, decimal? size = null,
                                    string? parentEntityId = null, string? unitNumber = null, decimal? numberOfBedrooms = null, decimal? numberOfBaths = null)
        {
            var property = new Property(entityId, externalId, address, propertyCategory, size, parentEntityId, unitNumber,numberOfBedrooms, numberOfBaths, isMultiUnit);
            property.Id = Id.GetValueOrDefault();
            property.IsDeleted = isDeleted.GetValueOrDefault();

            return property;
        }
    }
}