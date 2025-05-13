using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Infrastructure.Notifications;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Notifications.Handlers
{
    public class LeaseUpdatedHandler : INotificationHandler<LeaseAgreementUpdated>
    {
        private readonly IPropertyLeaseAgreementRepository propertyLeaseAgreementRepository;

        public LeaseUpdatedHandler(IPropertyLeaseAgreementRepository propertyLeaseAgreementRepository)
        {
            this.propertyLeaseAgreementRepository = propertyLeaseAgreementRepository;
        }

        public async Task Handle(LeaseAgreementUpdated notification, CancellationToken cancellationToken)
        {
            var propertyLeaseAgreement = await propertyLeaseAgreementRepository.FindByLeaseAgreementEntityId(notification.EntityId);
            if(propertyLeaseAgreement == null)
            {
                return;
            }

            propertyLeaseAgreement.ApplyUpdates(new 
            {
                notification.StartDate
                ,notification.EndDate
                ,RentAmount = notification.LeaseAmount
                ,notification.StatusKey
            });

            await propertyLeaseAgreementRepository.Update(propertyLeaseAgreement);
            await propertyLeaseAgreementRepository.Save();
        }
    }
}
