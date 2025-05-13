using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Queries
{
    public class GetAllPropertyAmenityQuery : IRequest<List<Amenity>>
    {
        public GetAllPropertyAmenityQuery()
        {
            
        }
    }

    public class GetAllPropertyAmenityQueryHandler : IRequestHandler<GetAllPropertyAmenityQuery, List<Amenity>>
    {
        private readonly ILogger<GetAllPropertyAmenityQueryHandler> logger;
        private readonly IAmenityRepository propertyAmenityRepository;

        public GetAllPropertyAmenityQueryHandler(ILogger<GetAllPropertyAmenityQueryHandler> logger, IAmenityRepository propertyAmenityRepository)
        {
            this.logger = logger;
            this.propertyAmenityRepository = propertyAmenityRepository;
        }

        async Task<List<Amenity>> IRequestHandler<GetAllPropertyAmenityQuery, List<Amenity>>.Handle(GetAllPropertyAmenityQuery request, CancellationToken cancellationToken)
        {
            return await propertyAmenityRepository.GetAll();
        }
    }
}
