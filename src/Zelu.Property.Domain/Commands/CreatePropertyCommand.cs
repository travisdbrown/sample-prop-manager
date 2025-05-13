using Audit.Core;
using FluentResults;
using FluentValidation;
using IdGen;
using MediatR;
using Microsoft.Extensions.Logging;
using dyVisions.Data.Abstractions;
using dyVisions.Domain;
using dyVisions.Domain.Exceptions;
using dyVisions.Exceptions;
using dyVisions.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Infrastructure.Notifications;
using Zelu.Property.Domain.Extensions;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Commands
{
    public class CreatePropertyCommand : IRequest<Result<Property>>
    {
        public CreatePropertyCommand(string addressLine1, string? addressLine2, string city, string state, string postalCode,
                                        string propertyCategoryKey, List<dynamic> propertyUnits, bool isMultiUnit, decimal? size = null, string? externalId = null, List<dynamic>? propertyOwners = null, 
                                        List<string>? amentities = null, decimal? numberOfBedrooms = null, decimal? numberOfBaths = null)
        {
            AddressLine1 = addressLine1;
            AddressLine2 = addressLine2;
            City = city;
            State = state;
            PostalCode = postalCode;
            PropertyCategoryKey = propertyCategoryKey;
            PropertyUnits = propertyUnits;
            IsMultiUnit = isMultiUnit;
            Size = size;
            ExternalId = externalId;
            PropertyOwners = propertyOwners;
            Amentities = amentities;
            NumberOfBedrooms = numberOfBedrooms;
            NumberOfBaths = numberOfBaths;
        }

        public string AddressLine1 { get; }
        public string? AddressLine2 { get; }
        public string City { get; }
        public string State { get; }
        public string PostalCode { get; }
        public string PropertyCategoryKey { get; }
        public List<dynamic> PropertyUnits { get; }
        public bool IsMultiUnit { get; }
        public decimal? Size { get; }
        public string? ExternalId { get; }
        public List<dynamic>? PropertyOwners { get; }
        public List<string>? Amentities { get; }
        public decimal? NumberOfBedrooms { get; }
        public decimal? NumberOfBaths { get; }
    }

    public class CreatePropertyCommandHandler : IRequestHandler<CreatePropertyCommand, Result<Property>>
    {
        private readonly ILogger<CreatePropertyCommandHandler> logger;
        private readonly IPropertyRepository propertyRepository;
        private readonly IPropertyCategoryRepository propertyCategoryRepository;
        private readonly IPropertyOwnerRepository propertyOwnerRepository;
        private readonly IdGenerator idGenerator;
        private readonly IDataAccessSession session;
        private readonly ISessionContext sessionContext;
        private readonly IValidator<CreatePropertyCommand> validator;
        private readonly IAmenityRepository propertyAmenityRepository;
        private readonly IMediator mediator;

        public CreatePropertyCommandHandler(ILogger<CreatePropertyCommandHandler> logger, IPropertyRepository propertyRepository, 
                                            IPropertyCategoryRepository propertyCategoryRepository, IPropertyOwnerRepository propertyOwnerRepository, IdGenerator idGenerator,
                                            IDataAccessSession session, ISessionContext sessionContext, IValidator<CreatePropertyCommand> validator,
                                            IAmenityRepository propertyAmenityRepository, IMediator mediator)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.propertyRepository = propertyRepository ?? throw new ArgumentNullException(nameof(propertyRepository));
            this.propertyCategoryRepository = propertyCategoryRepository ?? throw new ArgumentNullException(nameof(propertyCategoryRepository));
            this.propertyOwnerRepository = propertyOwnerRepository;
            this.idGenerator = idGenerator;
            this.session = session;
            this.sessionContext = sessionContext;
            this.validator = validator;
            this.propertyAmenityRepository = propertyAmenityRepository;
            this.mediator = mediator;
        }

        public async Task<Result<Property>> Handle(CreatePropertyCommand request, CancellationToken cancellationToken)
        {
            var validationResult = await validator.ValidateAsync(request);
            if (validationResult.ToFluentResult().IsFailed)
            {
                return validationResult.ToFluentResult();
            }

            var propertyCategory = await propertyCategoryRepository.FindByKey(request.PropertyCategoryKey);
            if(propertyCategory is null)
            {
                var error = new Error($"{nameof(PropertyCategory)} search", new Error($"{nameof(PropertyCategory)} '{request.PropertyCategoryKey}' not found."));
                return Result.Fail(error.WithMetadata("ValidationError", $"{nameof(PropertyCategory)}"));
            }

            var address = Address.Create(request.AddressLine1, request.AddressLine2!, string.Empty, request.City, request.State, request.PostalCode);

            var property = Property.Create(idGenerator.CreateId().ToString(), address, propertyCategory, request.IsMultiUnit, request.ExternalId, request.Size,
                numberOfBedrooms: request.NumberOfBedrooms, numberOfBaths: request.NumberOfBaths);

            //using (AuditScope.Create(_ => _
            //.EventType($"{nameof(Property)}:Create")
            //            .ExtraFields(new { ApplicationUser = sessionContext.UserName })
            //            .Target(() => property)))
            //{
                //if (request.PropertyOwners != null)
                //{
                //    foreach (var item in request.PropertyOwners)
                //    {
                //        property.CreateOwner(idGenerator.CreateId().ToString(), item.ContactEntityId, item.FirstName, item.LastName, item.PhoneNumber);
                //    }
                //}

                if (request.Amentities != null)
                {
                    var amenities = await propertyAmenityRepository.FindAll(request.Amentities.ToArray());
                    amenities.ForEach(a => property.AddAmenity(a));
                }

            request.PropertyUnits.ForEach(u =>
            {
                property.AddUnit(idGenerator.CreateId().ToString(), u.UnitNumber, u.ExternalId, u.Size, u.NumberOfBedrooms, u.NumberOfBaths);
            });

            session.AddRepository(propertyRepository, propertyOwnerRepository, propertyAmenityRepository);

                using (session.UnitOfWork)
                {
                    session.UnitOfWork.Begin();

                    try
                    {
                        await propertyRepository.Add(property);
                        await propertyOwnerRepository.AddRange(property.PropertyOwners.ToList());
                        //await propertyUnitRepository.AddRange(property.PropertyUnits.ToList());

                        await propertyRepository.Save();

                        var systemEvent = new PropertyCreated(property.EntityId!);
                        await mediator.Publish(systemEvent);
                    }
                    catch (Exception ex)
                    {
                        session.UnitOfWork.Rollback();
                        return Result.Fail(new ExceptionalError("Unable to create property.", ex));
                    }
                //}
            }

            return property;
        }
    }
}
