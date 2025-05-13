using Microsoft.Extensions.DependencyInjection;
using dyVisions.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Domain
{
    public class AggregateRoot : BaseAggregateRoot<int>
    {
        protected AggregateRoot() { }

        protected AggregateRoot(string entityId)
        {
            EntityId = entityId;
        }

        public string? EntityId { get; protected set; }
    }
}
