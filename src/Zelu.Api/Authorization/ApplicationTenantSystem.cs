using dyVisions.Security.Abstractions;
using MediatR;
using Zelu.Api.Identity;

namespace Zelu.Api.Authorization
{
    public class ApplicationTenantSystem : ITenantSystem
    {
        private readonly IMediator mediator;

        public ApplicationTenantSystem(IMediator mediator)
        {
            this.mediator = mediator;
        }

        public async Task<ITenant?> GetTenantByAppId(string appId)
        {
            return new AppTenant
            {
                AppId = appId,
                AssignedPermissions = new()
            };
        }
    }
}
