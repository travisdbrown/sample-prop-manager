using FluentResults;
using IdGen;
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
    public class UpdatePropertyCategoryCommand : IRequest<Result>
    {
        public UpdatePropertyCategoryCommand(string key, string name)
        {
            Key = key;
            Name = name;
        }

        public string Key { get; }
        public string Name { get; }
    }

    public class UpdatePropertyCategoryCommandHandler : IRequestHandler<UpdatePropertyCategoryCommand, Result>
    {
        private readonly ILogger<UpdatePropertyCategoryCommandHandler> logger;
        private readonly IPropertyCategoryRepository propertyCategoryRepository;

        public UpdatePropertyCategoryCommandHandler(ILogger<UpdatePropertyCategoryCommandHandler> logger, IPropertyCategoryRepository propertyCategoryRepository)
        {
            this.logger = logger;
            this.propertyCategoryRepository = propertyCategoryRepository;
        }

        public async Task<Result> Handle(UpdatePropertyCategoryCommand request, CancellationToken cancellationToken)
        {
            var propertyCategory = await propertyCategoryRepository.FindByKey(request.Key);
            if(propertyCategory is null)
            {
                var msg = $"{nameof(PropertyCategory)} '{request.Key}' not found.";
                var error = new Error($"{nameof(PropertyCategory)} search", new Error(msg));
                return Result.Fail(error.WithMetadata("ValidationError", $"{nameof(PropertyCategory)}"));
            }

            propertyCategory.ApplyUpdates(new { Name =  request.Name });
            await propertyCategoryRepository.Update(propertyCategory);
            await propertyCategoryRepository.Save();

            return Result.Ok();
        }
    }
}
