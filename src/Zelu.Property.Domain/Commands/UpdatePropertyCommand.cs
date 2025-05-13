using FluentResults;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Commands
{
    public class UpdatePropertyCommand : IRequest<Result>
    {
        public UpdatePropertyCommand(string entityId, string? addressLine1 = null, string? addressLine2 = null, string? city = null, string? state = null, string? postalCode = null, string? propertyCategoryKey = null,
                                        string? unitNumber = null, decimal? size = null, decimal? numberOfBedrooms = null, decimal? numberOfBaths = null)
        {
            EntityId = entityId;
            AddressLine1 = addressLine1;
            AddressLine2 = addressLine2;
            City = city;
            State = state;
            PostalCode = postalCode;
            PropertyCategoryKey = propertyCategoryKey;
            UnitNumber = unitNumber;
            Size = size;
            NumberOfBedrooms = numberOfBedrooms;
            NumberOfBaths = numberOfBaths;
        }

        public string EntityId { get; }
        public string? AddressLine1 { get; }
        public string? AddressLine2 { get; }
        public string? City { get; }
        public string? State { get; }
        public string? PostalCode { get; }
        public string? PropertyCategoryKey { get; }
        public string? UnitNumber { get; }
        public decimal? Size { get; }
        public decimal? NumberOfBedrooms { get; }
        public decimal? NumberOfBaths { get; }
    }

    public class UpdatePropertyCommandHandler : IRequestHandler<UpdatePropertyCommand, Result>
    {
        private readonly IPropertyRepository propertyRepository;
        private readonly IPropertyCategoryRepository propertyCategoryRepository;

        public UpdatePropertyCommandHandler(IPropertyRepository propertyRepository, IPropertyCategoryRepository propertyCategoryRepository)
        {
            this.propertyRepository = propertyRepository;
            this.propertyCategoryRepository = propertyCategoryRepository;
        }

        public async Task<Result> Handle(UpdatePropertyCommand request, CancellationToken cancellationToken)
        {
            var property = await propertyRepository.FindByEntityId(request.EntityId);
            if(property == null)
            {
                var error = new Error($"{nameof(Property)} search", new Error($"{nameof(Property)} '{request.EntityId}' not found."));
                return Result.Fail(error.WithMetadata("ValidationError", $"{nameof(Property)}"));
            }

            if(request.PropertyCategoryKey is not null)
            {
                var propertyCategory = await propertyCategoryRepository.FindByKey(request.PropertyCategoryKey);
                property.PropertyCategory = propertyCategory;
            }

            property.ApplyUpdates(request);

            await propertyRepository.Update(property);
            await propertyRepository.Save();

            return Result.Ok();
        }
    }
}
