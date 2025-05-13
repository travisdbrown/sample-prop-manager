using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Notifications
{
    public class PropertyCreated : INotification
    {
        public PropertyCreated(string propertyEntityId, string? parentPropertyEntityId = null)
        {
            PropertyEntityId = propertyEntityId;
            ParentPropertyEntityId = parentPropertyEntityId;
        }

        public string PropertyEntityId { get; }
        public string? ParentPropertyEntityId { get; }
    }
}
