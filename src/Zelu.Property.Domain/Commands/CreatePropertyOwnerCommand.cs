using FluentResults;
using IdGen;
using MediatR;
using dyVisions.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Integrations.Contact;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Commands
{
    public class CreatePropertyOwnerCommand : IRequest<Result<PropertyOwner>>
    {
        public CreatePropertyOwnerCommand(string propertyEntityId, string contactTypeKey, bool isPerson, string? firstName = null, string? lastName = null, string? companyName = null, string? addressLine1 = null,
                                    string? addressLine2 = null, string? addressLine3 = null, string? city = null, string? state = null, string? postalCode = null, string? phoneNumber = null,
                                    string? mobilePhone = null, string? email = null, string? website = null, string? externalId = null)
        {
            PropertyEntityId = propertyEntityId;
            ContactTypeKey = contactTypeKey;
            IsPerson = isPerson;
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
            ExternalId = externalId;
        }

        public string PropertyEntityId { get; }
        public string ContactTypeKey { get; }
        public bool IsPerson { get; }
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
        public string? ExternalId { get; }
    }

    public class CreatePropertyOwnerCommandHandler : IRequestHandler<CreatePropertyOwnerCommand, Result<PropertyOwner>>
    {
        private readonly IContactSystem contactSystem;
        private readonly IPropertyOwnerRepository propertyOwnerRepository;
        private readonly IdGenerator idGenerator;

        public CreatePropertyOwnerCommandHandler(IContactSystem contactSystem, IPropertyOwnerRepository propertyOwnerRepository, IdGenerator idGenerator)
        {
            this.contactSystem = contactSystem;
            this.propertyOwnerRepository = propertyOwnerRepository;
            this.idGenerator = idGenerator;
        }

        public async Task<Result<PropertyOwner>> Handle(CreatePropertyOwnerCommand request, CancellationToken cancellationToken)
        {
            var contact = await contactSystem.CreateContact(request.ExternalId!, request.ContactTypeKey, request.IsPerson, request.FirstName!, request.LastName!,
                                                        request.CompanyName, request.AddressLine1, request.AddressLine2, request.AddressLine3, request.City, request.State, request.PostalCode,
                                                        request.Email, request.PhoneNumber, request.MobilePhone, request.Website);

            var person = Person.Create(request.FirstName!, request.LastName!, request.Email!, request.MobilePhone!);
            var address = Address.Create(request.AddressLine1!, request.AddressLine2!, request.AddressLine3!, request.City!, request.State!, request.PostalCode!);

            var propertyOwner = PropertyOwner.Create(idGenerator.CreateId().ToString(), request.PropertyEntityId, contact.EntityId, person, address, request.CompanyName, 
                                                        request.Website, request.PhoneNumber);

            await propertyOwnerRepository.Add(propertyOwner);
            await propertyOwnerRepository.Save();

            return Result.Ok(propertyOwner);
        }
    }
}
