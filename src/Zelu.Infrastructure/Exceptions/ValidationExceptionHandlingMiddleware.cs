using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace Zelu.Infrastructure.Exceptions
{
    public class ValidationExceptionHandlingMiddleware : IMiddleware
    {
        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            try
            {
                await next(context);
            }
            catch (ValidationException exception)
            {
                var problemDetails = new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Type = "ValidationFailure",
                    Title = "Validation error",
                    Detail = "One or more validation errors has occurred"
                };

                if (exception.Errors is not null)
                {
                    problemDetails.Extensions["errors"] = exception.Errors;
                }

                context.Response.ContentType = "application/json";
                context.Response.StatusCode = StatusCodes.Status400BadRequest;

                var json = JsonConvert.SerializeObject(problemDetails);
                await context.Response.WriteAsync(json);
            }
        }
    }
}
