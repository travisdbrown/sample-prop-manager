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
    public class LeaseDeletedHandler : INotificationHandler<LeaseAgreementDeleted>
    {
        private readonly IPropertyLeaseAgreementRepository propertyLeaseAgreementRepository;

        public LeaseDeletedHandler(IPropertyLeaseAgreementRepository propertyLeaseAgreementRepository)
        {
            this.propertyLeaseAgreementRepository = propertyLeaseAgreementRepository;
        }

        public async Task Handle(LeaseAgreementDeleted notification, CancellationToken cancellationToken)
        {
            return;

            //ignoring this code for now b/c the logic does not seem correct

            //var propertyLeaseAgreement = await propertyLeaseAgreementRepository.FindByPropertyEntityId(notification.PropertyEntityId);
            //if (propertyLeaseAgreement == null)
            //{
            //    return;
            //}

            //await propertyLeaseAgreementRepository.Delete(propertyLeaseAgreement);
            //await propertyLeaseAgreementRepository.Save();
        }
    }
}
