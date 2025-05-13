using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Notifications
{
    public class LeaseAgreementDeleted : INotification
    {
        public LeaseAgreementDeleted(string leaseEntityId, string propertyEntityId)
        {
            LeaseEntityId = leaseEntityId;
            PropertyEntityId = propertyEntityId;
        }

        public string LeaseEntityId { get; }
        public string PropertyEntityId { get; }
    }
}
