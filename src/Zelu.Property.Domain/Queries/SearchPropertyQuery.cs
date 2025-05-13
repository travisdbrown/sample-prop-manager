using FluentResults;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Commands;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Queries
{
    public class SearchPropertyQuery : IRequest<Result<(int TotalResultCount, IEnumerable<PropertyView> Results)>>
    {
        public SearchPropertyQuery(int pageNumber, int pageSize, string? criteria, Dictionary<string, object>? parameters, string? orderBy, string direction, bool includeDeleted)
        {
            PageNumber = pageNumber;
            PageSize = pageSize;
            Criteria = criteria;
            Parameters = parameters;
            OrderBy = orderBy;
            Direction = direction;
            IncludeDeleted = includeDeleted;
        }

        public int PageNumber { get; }
        public int PageSize { get; }
        public string? Criteria { get; }

        public Dictionary<string, object>? Parameters { get; }

        public string? OrderBy { get; }
        public string Direction { get; } = "ascending";
        public bool IncludeDeleted { get; }
    }

    public class SearchPropertyQueryHandler : IRequestHandler<SearchPropertyQuery, Result<(int TotalResultCount, IEnumerable<PropertyView> Results)>>
    {
        private readonly IPropertyRepository propertyRepository;

        public SearchPropertyQueryHandler(IPropertyRepository propertyRepository)
        {
            this.propertyRepository = propertyRepository;
        }

        public async Task<Result<(int TotalResultCount, IEnumerable<PropertyView> Results)>> Handle(SearchPropertyQuery request, CancellationToken cancellationToken)
        {
            var properties = await propertyRepository.SearchProperty(request.PageNumber, request.PageSize, request, request.IncludeDeleted);

            return Result.Ok(properties);
        }
    }
}
