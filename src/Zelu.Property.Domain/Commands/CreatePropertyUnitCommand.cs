using FluentResults;
using IdGen;
using MediatR;
using dyVisions.Data.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Infrastructure.Notifications;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Commands
{
    public class CreatePropertyUnitCommand : IRequest<Result<Property>>
    {
        public CreatePropertyUnitCommand(string propertyEntityId, string? unitNumber, decimal? numberOfBeds, decimal? numberofBaths, decimal? size, string? externalId)
        {
            PropertyEntityId = propertyEntityId;
            UnitNumber = unitNumber;
            NumberOfBeds = numberOfBeds;
            NumberofBaths = numberofBaths;
            Size = size;
            ExternalId = externalId;
        }

        public string PropertyEntityId { get; }
        public string? UnitNumber { get; }
        public decimal? NumberOfBeds { get; }
        public decimal? NumberofBaths { get; }
        public decimal? Size { get; }
        public string? ExternalId { get; }
    }

    public class CreatePropertyUnitCommandHandler : IRequestHandler<CreatePropertyUnitCommand, Result<Property>>
    {
        private readonly IPropertyRepository propertyRepository;
        private readonly IdGenerator idGenerator;
        private readonly IDataAccessSession dataAccessSession;
        private readonly IMediator mediator;

        public CreatePropertyUnitCommandHandler(IPropertyRepository propertyRepository, IdGenerator idGenerator, IDataAccessSession dataAccessSession,
                                                IMediator mediator)
        {
            this.propertyRepository = propertyRepository;
            this.idGenerator = idGenerator;
            this.dataAccessSession = dataAccessSession;
            this.mediator = mediator;
        }

        public async Task<Result<Property>> Handle(CreatePropertyUnitCommand request, CancellationToken cancellationToken)
        {
            var property = await propertyRepository.FindByEntityId(request.PropertyEntityId);
            if (property is null)
            {
                var error = new Error($"{nameof(Property)} search", new Error($"{nameof(Property)} '{request.PropertyEntityId}' not found."));
                return Result.Fail(error.WithMetadata("ValidationError", $"{nameof(Property)}"));
            }

            var propertyUnit = property.AddUnit(idGenerator.CreateId().ToString(), request.UnitNumber!, request.ExternalId, request.Size, request.NumberOfBeds, request.NumberofBaths);

            await propertyRepository.Add(propertyUnit);
            await propertyRepository.Save();

            var systemEvent = new PropertyCreated(propertyUnit.EntityId!, propertyUnit.ParentEntityId);
            await mediator.Publish(systemEvent);

            return Result.Ok(propertyUnit);
        }
    }
}
