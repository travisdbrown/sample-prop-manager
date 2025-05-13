using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Property.Domain.Integrations.Contact
{
    public record Contact(string EntityId, string? Name, string? PhoneNumber);
}
