using FluentResults;
using MediatR;
using dyVisions.Data.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Infrastructure.Notifications;
using Zelu.Property.Domain.Integrations.Lease;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Notifications.Handlers
{
    public class LeaseCreatedHandler : INotificationHandler<LeaseAgreementCreated>
    {
        private readonly IPropertyRepository propertyRepository;
        private readonly IPropertyLeaseAgreementRepository propertyLeaseAgreementRepository;
        private readonly IDataAccessSession session;

        public LeaseCreatedHandler(IPropertyRepository propertyRepository, IPropertyLeaseAgreementRepository propertyLeaseAgreementRepository, IDataAccessSession session)
        {
            this.propertyRepository = propertyRepository;
            this.propertyLeaseAgreementRepository = propertyLeaseAgreementRepository;
            this.session = session;
        }

        public async Task Handle(LeaseAgreementCreated notification, CancellationToken cancellationToken)
        {
            var property = await propertyRepository.FindByEntityId(notification.PropertyEntityId);
            if(property is null)
            {
                return;
            }

            session.AddRepository(propertyRepository, propertyLeaseAgreementRepository);

            using (session.UnitOfWork)
            {
                session.UnitOfWork.Begin();

                try
                {
                    var propertyLeaseAgreement = PropertyLeaseAgreement.Create(notification.PropertyEntityId, notification.LeaseEntityId, notification.StartDate, notification.LeaseAmount,
                                                                                    notification.EndDate, notification.StatusKey,notification.TenantContactEntityId, notification.TenantName, notification.TenantPhoneNumber,
                                                                                    notification.CoTenantContactEntityId, notification.CoTenantName, notification.CoTenantPhoneNumber);

                    property.AddLeaseAgreement(propertyLeaseAgreement);

                    await propertyLeaseAgreementRepository.Add(propertyLeaseAgreement);
                    await propertyRepository.AddTotalOccupiedStat(property, property.LeaseAgreements.Count());

                    session.UnitOfWork.Commit();
                }
                catch (Exception)
                {
                    session.UnitOfWork.Rollback();
                    return;
                }
            }

        }
    }
}
