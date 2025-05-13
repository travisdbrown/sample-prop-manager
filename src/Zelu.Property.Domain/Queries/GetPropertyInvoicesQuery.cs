using FluentResults;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Integrations.Invoice;

namespace Zelu.Property.Domain.Queries
{
    public class GetPropertyInvoicesQuery : IRequest<Result<List<PropertyInvoice>>>
    {
        public GetPropertyInvoicesQuery(string propertyEntityId, bool includeDeleted = false, string? invoiceType = null)
        {
            PropertyEntityId = propertyEntityId;
            IncludeDeleted = includeDeleted;
            InvoiceType = invoiceType;
        }

        public string PropertyEntityId { get; }
        public bool IncludeDeleted { get; }
        public string? InvoiceType { get; }
    }

    public class GetPropertyInvoicesQueryHandler : IRequestHandler<GetPropertyInvoicesQuery, Result<List<PropertyInvoice>>>
    {
        private readonly IInvoiceSystem invoiceSystem;

        public GetPropertyInvoicesQueryHandler(IInvoiceSystem invoiceSystem)
        {
            this.invoiceSystem = invoiceSystem;
        }

        public async Task<Result<List<PropertyInvoice>>> Handle(GetPropertyInvoicesQuery request, CancellationToken cancellationToken)
        {
            var invoices = await invoiceSystem.GetPropertyInvoices(request.PropertyEntityId, request.IncludeDeleted, request.InvoiceType);
            return Result.Ok(invoices.ToList());
        }
    }
}
