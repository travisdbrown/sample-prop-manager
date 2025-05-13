using Microsoft.AspNetCore.Mvc;
using Zelu.Api.Authorization;
using Zelu.Api.Controllers.PropertyManagement.Extensions;
using Zelu.Api.Controllers.PropertyManagement.Payloads;
using Zelu.Api.Controllers.PropertyManagement.Payloads.v1;
using Zelu.Api.Extensions;
using Zelu.Property.Domain.Commands;
using Zelu.Property.Domain.Queries;

namespace Zelu.Api.Controllers.PropertyManagement
{
    [ApiVersion("1.0")]
    [Route("api/[controller]")]
    [ApiController]
    public class PropertyController : AuthorizedController
    {
        public PropertyController()
        {
        }


        [HttpGet("{entityId}")]
        public async Task<IActionResult> GetByEntityId(string entityId, bool includeDeleted = false)
        {
            var query = new GetPropertyByEntityIdQuery(entityId, includeDeleted);
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

        [HttpPost("page/{pageNumber}/pagesize/{pageSize}")]
        public async Task<IActionResult> SearchProperty(int pageNumber, int pageSize, [FromBody] SearchCriteriaRequest searchParameters, bool includeDeleted = false)
        {
            var query = new SearchPropertyQuery(pageNumber, pageSize, searchParameters.Criteria, searchParameters.Params, searchParameters.OrderBy, searchParameters.Direction, includeDeleted);
            var result = await mediator.Send(query);
            if (result.IsFailed)
            {

            }

            var resultResponse = result.Value.Results.Select(r => r.ToSearchResponseV10());
            return Ok(new { resultCount = result.Value.TotalResultCount, result = resultResponse });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePropertyRequest payload)
        {
            var command = new CreatePropertyCommand(payload.AddressLine1, payload.AddressLine2, payload.City,
                                payload.State, payload.PostalCode, payload.PropertyCategoryKey, payload.PropertyUnits.ToList<dynamic>(),
                                payload.IsMultiUnit, payload.Size, payload.ExternalId, payload.PropertyOwners.ToList<dynamic>(), payload.Amenities, payload.NumberOfBedrooms
                                , payload.NumberOfBaths);
            var result = await mediator.Send(command);

            if (result.IsFailed)
            {
                return BadRequest(result.ToValidationProblems("An error occurred creating a Property."));
            }

            return Created("", result.Value.ToResponseV10());
        }

        [HttpPost("unit/propertyid/{propertyEntityId}")]
        public async Task<IActionResult> CreatePropertyUnit(string propertyEntityId, [FromBody] CreatePropertyUnitRequest payload)
        {
            var command = new CreatePropertyUnitCommand(propertyEntityId, payload.UnitNumber, payload.NumberOfBedrooms, payload.NumberOfBaths, payload.Size, payload.ExternalId);
            var result = await mediator.Send(command);

            if (result.IsFailed)
            {
                return BadRequest(result.ToValidationProblems("An error occurred creating a Property Unit."));
            }

            return Created("", result.Value.ToResponseV10());
        }


        [HttpPost("markfordelete/{entityId}")]
        public async Task<IActionResult> MarkForDelete(string entityId)
        {
            var command = new MarkPropertyDeletedCommand(entityId);
            var result = await mediator.Send(command);
            if (result.IsFailed)
            {
                return BadRequest(result.ToValidationProblems("An error occurred marking Property for deletion."));
            }

            return Ok();
        }

        [HttpPost("restore/{entityId}")]
        public async Task<IActionResult> Restore(string entityId)
        {
            var command = new RestorePropertyCommand(entityId);
            var result = await mediator.Send(command);
            if (result.IsFailed)
            {
                return BadRequest(result.ToValidationProblems("An error occurred restoring the Property."));
            }

            return Ok();
        }

        [HttpPatch]
        [Route("{entityId}")]
        public async Task<IActionResult> Update(string entityId, UpdatePropertyRequest payload)
        {
            var command = new UpdatePropertyCommand(entityId, payload.AddressLine1, payload.AddressLine2, payload.City, payload.State, payload.PostalCode,
                                                    payload.PropertyCategoryKey, payload.UnitNumber, payload.Size, payload.NumberOfBedrooms, payload.NumberOfBaths);
            await mediator.Send(command);

            return Ok();
        }

        [HttpGet("{entityId}/invoices")]
        public async Task<IActionResult> GetPropertyInvoicesByTransactionType(string entityId, bool includeDeleted = false)
        {
            return await GetPropertyInvoices(entityId, includeDeleted);
        }

        [HttpGet("{entityId}/invoices/{transactionType}")]
        public async Task<IActionResult> GetPropertyInvoices(string entityId, bool includeDeleted = false, string? transactionType = null)
        {
            var query = new GetPropertyInvoicesQuery(entityId, includeDeleted, transactionType);
            var result = await mediator.Send(query);
            if (result.IsFailed)
            {
                if (result.HasNotFoundError())
                {
                    return NotFound();
                }
            }

            return Ok(result.Value.Select(e => e.ToResponseV10()));
        }
    }
}
