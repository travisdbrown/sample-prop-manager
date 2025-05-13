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
    public class DeletePropertyCategoryCommand : IRequest<Result>
    {
        public DeletePropertyCategoryCommand(string key)
        {
            Key = key;
        }

        public string Key { get; }
    }

    public class DeletePropertyCategoryCommandHandler : IRequestHandler<DeletePropertyCategoryCommand, Result>
    {
        private readonly ILogger<DeletePropertyCategoryCommandHandler> logger;
        private readonly IPropertyCategoryRepository propertyCategoryRepository;

        public DeletePropertyCategoryCommandHandler(ILogger<DeletePropertyCategoryCommandHandler> logger, IPropertyCategoryRepository propertyCategoryRepository)
        {
            this.logger = logger;
            this.propertyCategoryRepository = propertyCategoryRepository;
        }

        public async Task<Result> Handle(DeletePropertyCategoryCommand request, CancellationToken cancellationToken)
        {
            var propertyCategory = await propertyCategoryRepository.FindByKey(request.Key);
            if(propertyCategory is null)
            {
                logger.LogWarning($"PropertyCategory {request.Key} not found.");
                return Result.Ok();
            }

            await propertyCategoryRepository.Delete(propertyCategory);
            await propertyCategoryRepository.Save();

            return Result.Ok();
        }
    }
}
