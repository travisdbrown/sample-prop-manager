using dyVisions.Domain;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Zelu.Infrastructure.Domain;

namespace Zelu.Property.Domain
{
    public class PropertyUnit : AggregateRoot
    {
        private PropertyUnit() { }
        protected PropertyUnit(string entityId, string externalId, Property property, string? unitNumber, decimal? numberOfBeds, decimal? numberOfBaths, decimal? size) : base(entityId)
        {
            ExternalId = externalId;
            Property = property;
            UnitNumber = unitNumber;
            NumberOfBeds = numberOfBeds;
            NumberOfBaths = numberOfBaths;
            Size = size;
        }
        [JsonInclude]
        public string ExternalId { get; private set; }

        [JsonInclude]
        public Property Property { get; private set; }
        [JsonInclude]
        public string? UnitNumber { get; private set; }

        [JsonInclude]
        public decimal? NumberOfBeds { get; private set; }

        [JsonInclude]
        public decimal? NumberOfBaths { get; private set; }

        [JsonInclude]
        public decimal? Size { get; private set; }

        public bool IsOccupied 
        { 
            get
            {
                return !string.IsNullOrEmpty(LeaseAgreementEntityId);
            }
        }

        [JsonInclude]
        public bool IsDeleted { get; private set; } = false;

        [JsonInclude]
        public string? LeaseAgreementEntityId { get; set; }

        public void AddLease(string leaseAgreementEntityId)
        {
            LeaseAgreementEntityId = leaseAgreementEntityId;
        }

        public void RemoveLease()
        {
            LeaseAgreementEntityId = null;
        }

        public void MarkDeleted()
        {
            IsDeleted = true;
        }

        public void Restore()
        {
            IsDeleted = false;
        }

        public static PropertyUnit Create(string entityId, Property property, string? unitNumber, decimal? numberOfBeds, decimal? numberOfBaths, decimal? size, string? externalId = null)
        {
            if (string.IsNullOrEmpty(externalId))
            {
                externalId = entityId;
            }

            return new PropertyUnit(entityId, externalId, property, unitNumber, numberOfBeds, numberOfBaths, size);
        }

        public static PropertyUnit Load (dynamic data, Property property)
        {
            var propertyUnit = new PropertyUnit(data.EntityId, data.ExternalId, property, data.UnitNumber, data.NumberOfBedrooms, data.NumberOfBaths, data.Size);
            propertyUnit.Id = data.Id;
            propertyUnit.IsDeleted = data.IsDeleted;
            return propertyUnit;
        }
    }
}
