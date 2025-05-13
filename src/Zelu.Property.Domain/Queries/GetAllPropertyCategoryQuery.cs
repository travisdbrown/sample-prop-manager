using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Commands;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Queries
{
    public class GetAllPropertyCategoryQuery : IRequest<List<PropertyCategory>>
    {
        public GetAllPropertyCategoryQuery() { }
    }

    public class GetAllPropertyCategoryQueryHandler : IRequestHandler<GetAllPropertyCategoryQuery, List<PropertyCategory>>
    {
        private readonly ILogger<GetAllPropertyCategoryQueryHandler> logger;
        private readonly IPropertyCategoryRepository propertyCategoryRepository;

        public GetAllPropertyCategoryQueryHandler(ILogger<GetAllPropertyCategoryQueryHandler> logger, IPropertyCategoryRepository propertyCategoryRepository)
        {
            this.logger = logger;
            this.propertyCategoryRepository = propertyCategoryRepository;
        }

        async Task<List<PropertyCategory>> IRequestHandler<GetAllPropertyCategoryQuery, List<PropertyCategory>>.Handle(GetAllPropertyCategoryQuery request, CancellationToken cancellationToken)
        {
            return await propertyCategoryRepository.GetAll();
        }
    }
}
