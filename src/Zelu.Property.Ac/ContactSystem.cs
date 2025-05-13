
namespace Zelu.Property.Ac
{
    using MediatR;
    using Zelu.Property.Domain.Integrations.Contact;

    public class ContactSystem : IContactSystem
    {
        private readonly IMediator mediator;

        public ContactSystem(IMediator mediator)
        {
            this.mediator = mediator;
        }
        public async Task<Contact> CreateContact(string externalId, string contactType, bool isPerson, string firstName, string lastName, string? companyName = null, string? addressLine1 = null, 
                                            string? addressLine2 = null, string? addressLine3 = null, string? city = null, string? state = null, string? postalCode = null, string? email = null, 
                                            string? phoneNumber = null, string? mobileNumber = null, string? website = null)
        {
            return new Contact(externalId, $"{firstName} {lastName}", phoneNumber);
            //var command = new CreateContactCommand(contactType, isPerson, firstName, lastName, companyName, addressLine1, addressLine2, addressLine3, city, state, postalCode, 
            //                                        phoneNumber, mobileNumber, email, website, externalId);

            //var contactResult = await mediator.Send(command);
            //if(contactResult.IsFailed)
            //{
            //    return null!;
            //}

            //var contact = contactResult.Value;

            //return new(contact.EntityId!, contact.Person.Name, contact.PhoneNumber);
        }

        public async Task DeleteContact(string entityId)
        {
            //var command = new DeleteContactCommand(entityId);
            //await mediator.Send(command);
        }

        public async Task UpdateContact(string entityId, bool? isPerson = null, string? firstName = null, string lastName = null, string? companyName = null, 
                                    string? addressLine1 = null, string? addressLine2 = null, string? addressLine3 = null, string? city = null, string? state = null, 
                                    string? postalCode = null, string? email = null, string? phoneNumber = null, string? mobileNumber = null, string? website = null)
        {
            //var command = new UpdateContactCommand(entityId, isPerson, firstName, lastName, companyName, addressLine1, addressLine2, addressLine3, city, state, postalCode,
            //                                        phoneNumber, mobileNumber, email, website);

            //await mediator.Send(command);
        }
    }
}