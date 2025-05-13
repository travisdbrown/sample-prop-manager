using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Zelu.Api.Authorization
{
    [Authorize(AuthenticationSchemes = "Identity.BearerAndApplication")]
    [Authorize(AuthenticationSchemes = "ApiKey")]
    [Authorize(Policy = "SessionContextPolicy")]
    [ApiController]
    public class AuthorizedController : ControllerBase
    {
        protected IMediator mediator => this.HttpContext.RequestServices.GetRequiredService<IMediator>();
    }
}
