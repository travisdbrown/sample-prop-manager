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
    public class PropertyCategoryController : AuthorizedController
    {
        public PropertyCategoryController()
        {
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAsync()
        {
            var command = new GetAllPropertyCategoryQuery();
            var results = await mediator.Send(command);

            var response = results.Select(r => r.ToResponseV10());
            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePropertyCategoryRequest payload)
        {
            var command = new CreatePropertyCategoryCommand(payload.Name);
            var result = await mediator.Send(command);
            if (result.IsFailed)
            {
                if (result.HasValidationError())
                {
                    return BadRequest(result.ToValidationProblems("An error occurred creating a Property Category."));
                }

                return Problem(statusCode: 500, title: "Unknown error occurred.", detail: "Unable to create Property Category");
            }

            return Created("", result.Value.ToResponseV10());
        }

        [HttpDelete]
        [Route("{key}")]
        public async Task<IActionResult> Delete(string key)
        {
            var command = new DeletePropertyCategoryCommand(key);
            await mediator.Send(command);

            return Ok();
        }

        [HttpPatch]
        [Route("{key}")]
        public async Task<IActionResult> Update(string key, UpdatePropertyCategoryRequest payload)
        {
            var command = new UpdatePropertyCategoryCommand(key, payload.Name);
            await mediator.Send(command);

            return Ok();
        }
    }
}
