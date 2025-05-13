using dyVisions.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Zelu.Property.Domain
{
    public class PropertyView 
    {
        private PropertyView(string entityId, Address address, PropertyCategory propertyCategory, string externalId, decimal? size,
                                string parentEntityId, string unitNumber, bool isDeleted,
                                decimal? numberOfBeds, decimal? numberOfBaths, bool? isMultiUnit, int? totalOccupied, int? totalUnits)
        {
            EntityId = entityId;
            Address = address;
            PropertyCategory = propertyCategory;
            ExternalId = externalId;
            Size = size;
            ParentEntityId = parentEntityId;
            UnitNumber = unitNumber;
            IsDeleted = isDeleted;
            NumberOfBeds = numberOfBeds;
            NumberOfBaths = numberOfBaths;
            IsMultiUnit = isMultiUnit;
            TotalOccupied = totalOccupied;
            TotalUnits = totalUnits;
        }

        public string? EntityId { get; private set; }

        [JsonInclude]
        public Address Address { get; private set; }

        [JsonInclude]
        public PropertyCategory PropertyCategory { get; private set; }

        [JsonInclude]
        public string ExternalId { get; private set; }

        [JsonInclude]
        public decimal? Size { get; private set; }

        public string ParentEntityId { get; private set; }
        public string UnitNumber { get; private set; }

        public string LeaseAgreementEntityId { get; set; }
        public decimal? NumberOfBeds { get; private set; }
        public decimal? NumberOfBaths { get; private set; }

        public bool? IsMultiUnit { get; set; }

        [JsonInclude]
        public bool IsDeleted { get; private set; } = false;

        [JsonInclude]
        public int? TotalOccupied { get; private set; }

        [JsonInclude]
        public int? TotalUnits { get; private set; }

        public static PropertyView Load(string entityId, Address address, PropertyCategory propertyCategory, string externalId, decimal? size,
                                        string unitNumber, bool isDeleted, decimal? numberOfBeds, decimal? numberOfBaths, bool? isMultiUnit, string? parentEntityId = null,
                                        int? totalOccupied = null, int? totalUnits = null)
        {
            return new PropertyView(entityId, address, propertyCategory, externalId, size, parentEntityId!, unitNumber, isDeleted, numberOfBeds, numberOfBaths, isMultiUnit,
                                    totalOccupied, totalUnits);
        }
    }
}
