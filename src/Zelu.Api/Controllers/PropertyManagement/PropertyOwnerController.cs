using AspNetCore.Authentication.ApiKey;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Zelu.Api.Authorization;
using Zelu.Api.Controllers.PropertyManagement.Extensions;
using Zelu.Api.Controllers.PropertyManagement.Payloads.v1;
using Zelu.Api.Extensions;
using Zelu.Property.Domain.Commands;
using Zelu.Property.Domain.Queries;

namespace Zelu.Api.Controllers.PropertyManagement
{
    [ApiVersion("1.0")]
    [Route("api/[controller]")]
    [ApiController]
    public class PropertyOwnerController : AuthorizedController
    {
        private const string DefaultPropertyOwnerKey = "DFLT-OWN";

        public PropertyOwnerController()
        {
        }

        [HttpGet]
        [Route("{entityId}")]
        public async Task<IActionResult> Get(string entityId)
        {
            var query = new GetPropertyOwnerByEntityIdQuery(entityId);
            var result = await mediator.Send(query);
            if (result.IsFailed)
            {
                if (result.HasNotFoundError())
                {
                    return NotFound();
                }

                return BadRequest(result.ToValidationProblems("An error occurred marking Property Unit for deletion."));
            }

            return Ok(result.Value.ToResponseV10());
        }
    
        [HttpPost]
        [Route("propertyEntityId/{propertyEntityId}")]
        public async Task<IActionResult> Create(string propertyEntityId, CreatePropertyOwnerRequest request)
        {
            var command = new CreatePropertyOwnerCommand(propertyEntityId, DefaultPropertyOwnerKey, request.IsPerson, request.FirstName, request.LastName,
                                request.CompanyName, request.AddressLine1, request.AddressLine2, request.AddressLine3, request.City, request.State, request.PostalCode,
                                request.PhoneNumber, request.MobilePhone, request.Email, request.Website, request.ExternalId);

            await mediator.Send(command);

            return Ok();
        }

        [HttpDelete]
        [Route("{entityId}")]
        public async Task<IActionResult> Delete(string entityId)
        {
            var command = new DeletePropertyOwnerCommand(entityId);
            await mediator.Send(command);

            return Ok();
        }

        [HttpPatch]
        [Route("{entityId}")]
        public async Task<IActionResult> Update(string entityId, UpdatePropertyOwnerRequest payload)
        {
            var command = new UpdatePropertyOwnerCommand(entityId, payload.FirstName, payload.LastName, payload.CompanyName, payload.AddressLine1, payload.AddressLine2, payload.AddressLine3,
                                                            payload.City, payload.State, payload.PostalCode, payload.PhoneNumber, payload.MobilePhone, payload.Email, payload.Website);
            await mediator.Send(command);

            return Ok();
        }
    }
}
