using Audit.Core;
using FluentResults;
using MediatR;
using Microsoft.Extensions.Logging;
using dyVisions.Exceptions;
using dyVisions.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Commands
{
    public class RestorePropertyCommand : IRequest<Result>
    {
        public RestorePropertyCommand(string entityId)
        {
            EntityId = entityId ?? throw new ArgumentNullException(entityId);
        }

        public string EntityId { get; }
    }

    public class RestorePropertyCommandHandler : IRequestHandler<RestorePropertyCommand, Result>
    {
        private readonly ILogger<RestorePropertyCommandHandler> logger;
        private readonly IPropertyRepository propertyRepository;
        private readonly ISessionContext sessionContext;

        public RestorePropertyCommandHandler(ILogger<RestorePropertyCommandHandler> logger, IPropertyRepository propertyRepository, ISessionContext sessionContext)
        {
            this.logger = logger;
            this.propertyRepository = propertyRepository;
            this.sessionContext = sessionContext;
        }
        public async Task<Result> Handle(RestorePropertyCommand request, CancellationToken cancellationToken)
        {
            //get property
            var property = await propertyRepository.FindByEntityId(request.EntityId);
            if (property == null)
            {
                var msg = $"{nameof(Property)} '{request.EntityId}' not found.";
                var error = new Error($"{nameof(Property)} search", new Error(msg));
                return Result.Fail(error.WithMetadata("ValidationError", $"{nameof(Property)}"));
            }

            using (AuditScope.Create(_ => _
                        .EventType($"{nameof(Property)}:Restored")
                        .ExtraFields(new { ApplicationUser = sessionContext.UserName })
                        .Target(() => property)))
            {
                property.Restore();
                await propertyRepository.Update(property);
                await propertyRepository.Save();
            }

            return Result.Ok();
        }
    }
}
