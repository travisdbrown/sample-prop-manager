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
    public class TotalUnitCountChangedHandler : INotificationHandler<PropertyCreated>, INotificationHandler<PropertyDeleted>
    {
        private readonly IPropertyRepository propertyRepository;

        public TotalUnitCountChangedHandler(IPropertyRepository propertyRepository)
        {
            this.propertyRepository = propertyRepository;
        }

        public async Task Handle(PropertyCreated notification, CancellationToken cancellationToken)
        {
            await UpdateCount(notification.PropertyEntityId, notification.ParentPropertyEntityId);
        }

        public async Task Handle(PropertyDeleted notification, CancellationToken cancellationToken)
        {
            await UpdateCount(notification.PropertyEntityId, notification.ParentPropertyEntityId);
        }

        private async Task UpdateCount(string propertyEntityId, string? parentEntityId)
        {
            if(parentEntityId is not null)
            {
                var property = await propertyRepository.FindByEntityId(parentEntityId, true);
                if (property != null)
                {
                    var unitTotalCount = property.PropertyUnits.Where(u => u.IsDeleted == false).Count();

                    await propertyRepository.AddTotalUnitsStat(property, unitTotalCount);
                    await propertyRepository.Save();
                }
            }
        }
    }
}
