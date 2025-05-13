using Microsoft.AspNetCore.Authorization;
using dyVisions.Security.Abstractions;
using dyVisions.Session;
using System.Security.Claims;
using System.Linq;
using Microsoft.Extensions.Primitives;
using Zelu.Infrastructure.Extensions;

namespace Zelu.Api.Authorization
{
    public class SessionContextHandler : AuthorizationHandler<SessionContextRequirement>
    {
        private readonly IHttpContextAccessor httpContextAccessor;
        private readonly ISessionContext sessionContext;

        public SessionContextHandler(IHttpContextAccessor httpContextAccessor, ISessionContext sessionContext)
        {
            this.httpContextAccessor = httpContextAccessor;
            this.sessionContext = sessionContext;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, SessionContextRequirement requirement)
        {
            if(context.User?.Identity?.IsAuthenticated == true)
            {
                string? tenantId = null;
                string? userName = null;

                if(context.User.Identity.AuthenticationType == "ApiKey")
                {
                    var tenantIdClaim = context.User.Claims.SingleOrDefault(c => c.Type == "tenant_id");
                    if(tenantIdClaim != null)
                    {
                        tenantId = tenantIdClaim.Value;
                    }

                    StringValues userNameHeader = StringValues.Empty;
                    var wasUserNameFound = httpContextAccessor.HttpContext?.Request.Headers.TryGetValue("x-username", out userNameHeader);
                    userName = wasUserNameFound.HasValue && wasUserNameFound == true ? userNameHeader.ToString() : "unknown@zelupropertymanagement.com";
                }
                else
                {
                    var tenantClaim = GetTenantId(context.User.Claims.ToList());
                    if(tenantClaim != null)
                    {
                        tenantId = tenantClaim.Value; 
                    }

                    userName = context.User.Identity.Name;
                    //var emailsClaim = context.User.Claims.SingleOrDefault(c => c.Type == "emails");
                    //if (emailsClaim != null)
                    //{
                    //    userName = context.User.Identity.Name;
                    //}
                }

                PopulateSessionContext(tenantId, userName);
                context.Succeed(requirement);
            }
            else
            {
                context.Fail();
            }


            return; // Task.CompletedTask;
        }

        private void PopulateSessionContext(string? tenantId, string? userName)
        {
            sessionContext.SetApplicationId(tenantId);
            sessionContext.UserName = userName;
        }

        private Claim? GetTenantId(List<Claim> claims)
        {
            var identifier = string.Empty;

            return claims.SingleOrDefault(c => c.Type.EndsWith("tenant_id"));
        }

        private string GetNameIdentifier(List<Claim> claims)
        {
            var identifier = string.Empty;

            var claim = claims.SingleOrDefault(c => c.Type.EndsWith("nameidentifier"));
            if(claim != null)
            {
                identifier = claim.Value;
            }

            return identifier;
        }
    }
}
