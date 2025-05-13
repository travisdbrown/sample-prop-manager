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
    public class CreatePropertyCategoryCommand : IRequest<Result<PropertyCategory>>
    {
        public CreatePropertyCategoryCommand(string name)
        {
            Name = name;
        }

        public string Name { get; }
    }

    public class CreatePropertyCategoryCommandHandler : IRequestHandler<CreatePropertyCategoryCommand, Result<PropertyCategory>>
    {
        private readonly ILogger<CreatePropertyCategoryCommandHandler> logger;
        private readonly IPropertyCategoryRepository propertyCategoryRepository;
        private readonly IdGenerator idGenerator;

        public CreatePropertyCategoryCommandHandler(ILogger<CreatePropertyCategoryCommandHandler> logger, IPropertyCategoryRepository propertyCategoryRepository, IdGenerator idGenerator)
        {
            this.logger = logger;
            this.propertyCategoryRepository = propertyCategoryRepository;
            this.idGenerator = idGenerator;
        }

        public async Task<Result<PropertyCategory>> Handle(CreatePropertyCategoryCommand request, CancellationToken cancellationToken)
        {
            var key = $"CUST-{idGenerator.CreateId().ToString()}";
            var propertyCategory = PropertyCategory.Create(key, request.Name);
            await propertyCategoryRepository.Add(propertyCategory);
            await propertyCategoryRepository.Save();

            return Result.Ok(propertyCategory);
        }
    }
}
