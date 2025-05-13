using FluentResults;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Queries
{
    public class GetPropertyOwnerByEntityIdQuery : IRequest<Result<PropertyOwner>>
    {
        public GetPropertyOwnerByEntityIdQuery(string entityId)
        {
            EntityId = entityId;
        }

        public string EntityId { get; }
    }

    public class GetPropertyOwnerByEntityIdQueryHandler : IRequestHandler<GetPropertyOwnerByEntityIdQuery, Result<PropertyOwner>>
    {
        private readonly IPropertyOwnerRepository propertyOwnerRepository;

        public GetPropertyOwnerByEntityIdQueryHandler(IPropertyOwnerRepository propertyOwnerRepository)
        {
            this.propertyOwnerRepository = propertyOwnerRepository;
        }
        public async Task<Result<PropertyOwner>> Handle(GetPropertyOwnerByEntityIdQuery request, CancellationToken cancellationToken)
        {
            var propertyOwner = await propertyOwnerRepository.FindByEntityIdAsync(request.EntityId);
            if (propertyOwner == null)
            {
                var msg = $"{nameof(PropertyOwner)} '{request.EntityId}' not found.";
                var error = new Error($"{nameof(PropertyOwner)} search", new Error(msg));
                return Result.Fail(error.WithMetadata("ValidationError", $"{nameof(PropertyOwner)}"));
            }

            return Result.Ok(propertyOwner);
        }
    }
}
