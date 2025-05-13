using FluentResults;
using Microsoft.AspNetCore.Mvc;
using dyVisions.Domain.Exceptions;
using dyVisions.Exceptions;

namespace Zelu.Api.Extensions
{
    public static class FluentResultExtentions
    {
        public static bool HasNotFoundError(this ResultBase result)
        {
            var exceptionalErrors = result.Errors.Where(e => e.GetType() == typeof(ExceptionalError));
            if (exceptionalErrors.Any(e => ((ExceptionalError)e).Exception.GetType() == typeof(FinderException)) ||
                result.Errors.Where(e => e.HasMetadataKey("FinderError")).Any())
            {
                return true;
            }

            return false;
        }

        public static bool HasValidationError(this ResultBase result)
        {
            return result.Errors.Where(e => e.HasMetadataKey("ValidationError")).Any();
        }

        public static ProblemDetails ToValidationProblems(this ResultBase result, string message)
        {
            ProblemDetails problemDetails = new ProblemDetails();
            var d = new Dictionary<string, string[]>();

            var validationErrors = result.Errors.Where(e => e.HasMetadataKey("ValidationError"));
            if (validationErrors.Any())
            {
                foreach (var e in result.Errors)
                {
                    d.Add(e.Message, e.Reasons.Select(r => r.Message).ToArray());
                }
            }
            problemDetails = new ValidationProblemDetails(d);
            problemDetails.Detail = message;

            return problemDetails;
        }
    }
}
