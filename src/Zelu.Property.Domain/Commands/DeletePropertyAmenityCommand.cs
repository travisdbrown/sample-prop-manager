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
    public class DeletePropertyAmenityCommand : IRequest<Result>
    {
        public DeletePropertyAmenityCommand(string key)
        {
            Key = key;
        }

        public string Key { get; }
    }

    public class DeletePropertyAmenityCommandHandler : IRequestHandler<DeletePropertyAmenityCommand, Result>
    {
        private readonly ILogger<DeletePropertyAmenityCommandHandler> logger;
        private readonly IAmenityRepository propertyAmenityRepository;

        public DeletePropertyAmenityCommandHandler(ILogger<DeletePropertyAmenityCommandHandler> logger, IAmenityRepository propertyAmenityRepository)
        {
            this.logger = logger;
            this.propertyAmenityRepository = propertyAmenityRepository;
        }

        public async Task<Result> Handle(DeletePropertyAmenityCommand request, CancellationToken cancellationToken)
        {
            var propertyAmenity = await propertyAmenityRepository.FindByKey(request.Key);
            if (propertyAmenity is null)
            {
                logger.LogWarning($"{nameof(Amenity)} {request.Key} not found.");
                return Result.Ok();
            }

            await propertyAmenityRepository.Delete(propertyAmenity);
            await propertyAmenityRepository.Save();

            return Result.Ok();
        }
    }
}
