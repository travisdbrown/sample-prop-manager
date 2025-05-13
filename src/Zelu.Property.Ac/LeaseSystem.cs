using MediatR;
using Zelu.Property.Domain.Integrations.Lease;

namespace Zelu.Property.Ac
{
    public class LeaseSystem : ILeaseSystem
    {
        private readonly IMediator mediator;

        public LeaseSystem(IMediator mediator)
        {
            this.mediator = mediator;
        }

        public async Task<LeaseAgreement> CreateLeaseAgreement(DateTimeOffset startDate, int rentAmount, string propertyEntityId, string paymentFrequencyKey, 
                                                            string renewalTermKey, string leaseTermKey, bool isPerson, DateTimeOffset? endDate = null, int? paymentDay = null, int? deposit = null, 
                                                            string? firstName = null, string? lastName = null, string? companyName = null, string? addressLine1 = null, 
                                                            string? addressLine2 = null, string? addressLine3 = null, string? city = null, string? state = null, 
                                                            string? postalCode = null, string? phoneNumber = null, string? mobilePhone = null, string? email = null, 
                                                            string? website = null, string? externalId = null)
        {
            return new LeaseAgreement(propertyEntityId, propertyEntityId, startDate, endDate, rentAmount, null);

            //var command = new CreateLeaseCommand(startDate, rentAmount, propertyEntityId, paymentFrequencyKey, renewalTermKey, leaseTermKey, isPerson, endDate, paymentDay, deposit, 
            //                                        firstName, lastName, companyName, addressLine1, addressLine2, addressLine3, city, state, postalCode, phoneNumber,
            //                                        mobilePhone, email, website, externalId);

            //var leaseAgreementResult = await mediator.Send(command);
            //if (leaseAgreementResult.IsFailed)
            //{
            //    return null!;
            //}

            //var lease = leaseAgreementResult.Value;

            //return new LeaseAgreement(lease.EntityId!, lease.PropertyEntityId, lease.StartDate, lease.EndDate, lease.RentAmount, null);
        }
    }
}
