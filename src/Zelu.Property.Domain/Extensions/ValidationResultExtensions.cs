
namespace Zelu.Property.Domain.Extensions
{
    using FluentResults;
    using FluentValidation;
    using FluentValidation.Results;
    using MediatR;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    public static class ValidationResultExtensions
    {
        public static Result ToFluentResult(this ValidationResult validationResult)
        {
            if (validationResult.IsValid)
            {
                return Result.Ok();
            }

            var errors = new List<IError>();

            foreach (var e in validationResult.Errors)
            {
                errors.Add(new Error(e.PropertyName, new Error(e.ErrorMessage)).WithMetadata("ValidationError", e.PropertyName));
            }

            return Result.Fail(errors);
        }
    }
}
