using FluentValidation;
using dyVisions.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Commands;

namespace Zelu.Property.Domain.Validators
{
    public class CreatePropertyCommandValidator : AbstractValidator<CreatePropertyCommand>
    {
        public CreatePropertyCommandValidator()
        {
            RuleFor(p => p.AddressLine1).NotEmpty().NotNull().MaximumLength(255);
            RuleFor(p => p.City).NotEmpty().NotNull().MaximumLength(255);
            RuleFor(p => p.State).NotEmpty().NotNull().MaximumLength(255);
            RuleFor(p => p.PostalCode).NotEmpty().NotNull().MaximumLength(255);
        }
    }
}
