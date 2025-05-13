using FluentResults;
using IdGen;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Commands
{
    public class CreatePropertyAmenityCommand : IRequest<Result<Amenity>>
    {
        public CreatePropertyAmenityCommand(string name)
        {
            Name = name;
        }

        public string Name { get; }
    }

    public class CreatePropertyAmenityCommandHandler : IRequestHandler<CreatePropertyAmenityCommand, Result<Amenity>>
    {
        private readonly ILogger<CreatePropertyAmenityCommandHandler> logger;
        private readonly IAmenityRepository propertyAmenityRepository;
        private readonly IdGenerator idGenerator;

        public CreatePropertyAmenityCommandHandler(ILogger<CreatePropertyAmenityCommandHandler> logger, IAmenityRepository propertyAmenityRepository, IdGenerator idGenerator)
        {
            this.logger = logger;
            this.propertyAmenityRepository = propertyAmenityRepository;
            this.idGenerator = idGenerator;
        }

        public async Task<Result<Amenity>> Handle(CreatePropertyAmenityCommand request, CancellationToken cancellationToken)
        {
            var key = $"CUST-{idGenerator.CreateId().ToString()}";

            var propertyAmenity = Amenity.Create(key, request.Name);
            await propertyAmenityRepository.Add(propertyAmenity);
            await propertyAmenityRepository.Save();

            return Result.Ok(propertyAmenity);
        }
    }
}
