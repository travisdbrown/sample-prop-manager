using FluentResults;
using MediatR;
using Microsoft.Extensions.Logging;
using dyVisions.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Commands
{
    public class DeletePropertyOwnerCommand : IRequest<Result>
    {
        public DeletePropertyOwnerCommand(string entityId)
        {
            EntityId = entityId;
        }

        public string EntityId { get; }
    }

    public class DeletePropertyOwnerCommandHandler : IRequestHandler<DeletePropertyOwnerCommand, Result>
    {
        private readonly ILogger<DeletePropertyOwnerCommandHandler> logger;
        private readonly IPropertyOwnerRepository propertyOwnerRepository;

        public DeletePropertyOwnerCommandHandler(ILogger<DeletePropertyOwnerCommandHandler> logger, IPropertyOwnerRepository propertyOwnerRepository)
        {
            this.logger = logger;
            this.propertyOwnerRepository = propertyOwnerRepository;
        }

        public async Task<Result> Handle(DeletePropertyOwnerCommand request, CancellationToken cancellationToken)
        {
            var propertyOwner = await propertyOwnerRepository.FindByEntityIdAsync(request.EntityId);
            if (propertyOwner == null)
            {
                logger.LogWarning($"PropertyOwner {request.EntityId} not found.");
                return Result.Ok();
            }

            await propertyOwnerRepository.Delete(propertyOwner);
            await propertyOwnerRepository.Save();

            return Result.Ok();
        }
    }
}
