using FluentResults;
using MediatR;
using dyVisions.Data.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Infrastructure.Notifications;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Notifications.Handlers
{
    public class ContactUpdatedHandler : INotificationHandler<ContactUpdated>
    {
        private readonly IPropertyLeaseAgreementRepository propertyLeaseAgreementRepository;
        private readonly IDataAccessSession session;

        public ContactUpdatedHandler(IPropertyLeaseAgreementRepository propertyLeaseAgreementRepository, IDataAccessSession session)
        {
            this.propertyLeaseAgreementRepository = propertyLeaseAgreementRepository;
            this.session = session;
        }

        public async Task Handle(ContactUpdated notification, CancellationToken cancellationToken)
        {
            var propertyLeaseAgreements = await propertyLeaseAgreementRepository.FindByContactEntityId(notification.EntityId);
            if (propertyLeaseAgreements is null)
            {
                return;
            }

            session.AddRepository(propertyLeaseAgreementRepository);

            using (session.UnitOfWork)
            {
                session.UnitOfWork.Begin();

                try
                {
                    foreach (var propertyLeaseAgreement in propertyLeaseAgreements)
                    {
                        var isCoTenant = propertyLeaseAgreement.CoTenantContactEntityId == notification.EntityId;

                        dynamic? updates = null;
                        if (isCoTenant)
                        {
                            updates = new
                            {
                                CoTenantContactEntityId = notification.EntityId
                                ,CoTenantName = $"{notification.FirstName} {notification.LastName}"
                                ,CoTenantPhoneNumber = notification.PhoneNumber
                            };
                        }
                        else
                        {
                            updates = new
                            {
                                TenantContactEntityId = notification.EntityId
                                ,TenantName = $"{notification.FirstName} {notification.LastName}"
                                ,TenantPhoneNumber = notification.PhoneNumber
                            };
                        }

                        propertyLeaseAgreement.ApplyUpdates(updates);
                        await propertyLeaseAgreementRepository.Update(propertyLeaseAgreement);
                    }

                    session.UnitOfWork.Commit();
                }
                catch (Exception)
                {
                    session.UnitOfWork.Rollback();
                }
            }

        }
    }
}
