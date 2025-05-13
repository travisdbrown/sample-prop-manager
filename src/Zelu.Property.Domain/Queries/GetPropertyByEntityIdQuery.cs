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
    public class GetPropertyByEntityIdQuery : IRequest<Result<Property>>
    {
        public GetPropertyByEntityIdQuery(string entityId, bool includeDeleted = false)
        {
            EntityId = entityId;
            IncludeDeleted = includeDeleted;
        }

        public string EntityId { get; }
        public bool IncludeDeleted { get; }
    }

    public class GetPropertyByEntityIdQueryHandler : IRequestHandler<GetPropertyByEntityIdQuery, Result<Property>>
    {
        private readonly IPropertyRepository propertyRepository;

        public GetPropertyByEntityIdQueryHandler(IPropertyRepository propertyRepository)
        {
            this.propertyRepository = propertyRepository;
        }

        public async Task<Result<Property>> Handle(GetPropertyByEntityIdQuery request, CancellationToken cancellationToken)
        {
            var property = await propertyRepository.FindByEntityId(request.EntityId, request.IncludeDeleted);
            if (property == null)
            {
                var msg = $"{nameof(Property)} '{request.EntityId}' not found.";
                var error = new Error($"{nameof(Property)} search", new Error(msg));
                return Result.Fail(error.WithMetadata("FinderError", $"{nameof(Property)}"));
            }

            return Result.Ok(property);
        }
    }
}
