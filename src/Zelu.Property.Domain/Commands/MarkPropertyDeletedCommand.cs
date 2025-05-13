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
using Zelu.Infrastructure.Notifications;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Commands
{
    public class MarkPropertyDeletedCommand : IRequest<Result>
    {
        public MarkPropertyDeletedCommand(string entityId)
        {
            EntityId = entityId ?? throw new ArgumentNullException(entityId);
        }

        public string EntityId { get; }        
    }

    public class MarkPropertyUnitDeletedCommand : IRequest<Result>
    {
        public MarkPropertyUnitDeletedCommand(string entityId)
        {
            EntityId = entityId ?? throw new ArgumentNullException(entityId);
        }

        public string EntityId { get; }
    }

    public class MarkPropertyDeletedCommandHandler : IRequestHandler<MarkPropertyDeletedCommand, Result>, IRequestHandler<MarkPropertyUnitDeletedCommand, Result>
    {
        private readonly ILogger<MarkPropertyDeletedCommandHandler> logger;
        private readonly IPropertyRepository propertyRepository;
        private readonly ISessionContext sessionContext;
        private readonly IMediator mediator;

        public MarkPropertyDeletedCommandHandler(ILogger<MarkPropertyDeletedCommandHandler> logger, IPropertyRepository propertyRepository, ISessionContext sessionContext, IMediator mediator)
        {
            this.logger = logger;
            this.propertyRepository = propertyRepository;
            this.sessionContext = sessionContext;
            this.mediator = mediator;
        }
        public async Task<Result> Handle(MarkPropertyDeletedCommand request, CancellationToken cancellationToken)
        {
            var property = await MarkForDelete(request.EntityId);
            if (property == null)
            {
                var msg = $"{nameof(Property)} '{request.EntityId}' not found.";
                var error = new Error($"{nameof(Property)} search", new Error(msg));
                return Result.Fail(error.WithMetadata("ValidationError", $"{nameof(Property)}"));
            }

            var systemEvent = new PropertyDeleted(property.EntityId!, property.ParentEntityId);
            await mediator.Publish(systemEvent);

            return Result.Ok();
        }

        public async Task<Result> Handle(MarkPropertyUnitDeletedCommand request, CancellationToken cancellationToken)
        {
            //get property
            var property = await MarkForDelete(request.EntityId);
            if (property == null)
            {
                var msg = $"{nameof(Property)} '{request.EntityId}' not found.";
                var error = new Error($"{nameof(Property)} search", new Error(msg));
                return Result.Fail(error.WithMetadata("ValidationError", $"{nameof(Property)}"));
            }

            var systemEvent = new PropertyDeleted(property.EntityId!, property.ParentEntityId);
            await mediator.Publish(systemEvent);

            return Result.Ok();
        }

        private async Task<Property?> MarkForDelete(string entityId)
        {
            //get property
            var property = await propertyRepository.FindByEntityId(entityId);
            if (property == null)
            {
                var msg = $"{nameof(Property)} '{entityId}' not found.";
                var error = new Error($"{nameof(Property)} search", new Error(msg));
                return null;
            }

            property.MarkDeleted();

            await propertyRepository.SoftDelete(property);
            await propertyRepository.Save();

            return property;
        }
    }
}
