using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Property.Domain.Integrations.Invoice
{
    public interface IInvoiceSystem
    {
        Task<IEnumerable<PropertyInvoice>> GetPropertyInvoices(string propertyEntityId, bool includeDeleted = false, string? invoiceType = null);
    }
}
