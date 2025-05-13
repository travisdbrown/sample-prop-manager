using FluentResults;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Integrations.Contact;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Commands
{
    public class UpdatePropertyOwnerCommand : IRequest<Result>
    {
        public UpdatePropertyOwnerCommand(string entityId, string? firstName, string? lastName, string? companyName, string? addressLine1, 
                                            string? addressLine2, string? addressLine3, string? city, string? state, string? postalCode, string? phoneNumber,
                                            string? mobilePhone, string? email, string? website)
        {
            EntityId = entityId;
            FirstName = firstName;
            LastName = lastName;
            CompanyName = companyName;
            AddressLine1 = addressLine1;
            AddressLine2 = addressLine2;
            AddressLine3 = addressLine3;
            City = city;
            State = state;
            PostalCode = postalCode;
            PhoneNumber = phoneNumber;
            MobilePhone = mobilePhone;
            Email = email;
            Website = website;
        }

        public string EntityId { get; }
        public string? FirstName { get; }
        public string? LastName { get; }
        public string? CompanyName { get; }
        public string? AddressLine1 { get; }
        public string? AddressLine2 { get; }
        public string? AddressLine3 { get; }
        public string? City { get; }
        public string? State { get; }
        public string? PostalCode { get; }
        public string? PhoneNumber { get; }
        public string? MobilePhone { get; }
        public string? Email { get; }
        public string? Website { get; }
    }

    public class UpdatePropertyOwnerCommandHandler : IRequestHandler<UpdatePropertyOwnerCommand, Result>
    {
        private readonly IContactSystem contactSystem;
        private readonly IPropertyOwnerRepository propertyOwnerRepository;

        public UpdatePropertyOwnerCommandHandler(IContactSystem contactSystem, IPropertyOwnerRepository propertyOwnerRepository)
        {
            this.contactSystem = contactSystem;
            this.propertyOwnerRepository = propertyOwnerRepository;
        }

        public async Task<Result> Handle(UpdatePropertyOwnerCommand request, CancellationToken cancellationToken)
        {
            var propertyOwner = await propertyOwnerRepository.FindByEntityIdAsync(request.EntityId);
            if(propertyOwner == null)
            {
                var error = new Error($"{nameof(PropertyOwner)} search", new Error($"{nameof(PropertyOwner)} '{request.EntityId}' not found."));
                return Result.Fail(error.WithMetadata("ValidationError", $"{nameof(PropertyOwner)}"));
            }

            propertyOwner.ApplyUpdates(request);
            await contactSystem.UpdateContact(propertyOwner.ContactEntityId, firstName: propertyOwner.Owner?.FirstName, lastName: propertyOwner.Owner!.LastName, companyName: propertyOwner.CompanyName,
                                                addressLine1: propertyOwner.Address?.AddressLine1, addressLine2: propertyOwner.Address?.AddressLine2, addressLine3: propertyOwner.Address?.AddressLine3,
                                                city: propertyOwner.Address?.City, state:propertyOwner.Address?.State, postalCode: propertyOwner.Address?.PostalCode, email: propertyOwner.Owner.EmailAddress, 
                                                phoneNumber: propertyOwner.PhoneNumber, mobileNumber: propertyOwner.Owner.PhoneNumber, website: propertyOwner.Website);

            return Result.Ok();
        }
    }
}
