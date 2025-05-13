using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Zelu.Api.Authorization
{
    [Authorize(Policy = AuthorizationKey.SystemUserOnlyPolicy)]
    [ApiController]
    public class SystemAuthorizedController : ControllerBase
    {
        protected IMediator mediator => this.HttpContext.RequestServices.GetRequiredService<IMediator>();
    }
}
