using MediatR;
using Zelu.Property.Domain;
using Zelu.Property.Domain.Integrations.Invoice;

namespace Zelu.Property.Ac
{
    public class InvoiceSystem : IInvoiceSystem
    {
        private readonly IMediator mediator;

        public InvoiceSystem(IMediator mediator)
        {
            this.mediator = mediator;
        }

        public async Task<IEnumerable<PropertyInvoice>> GetPropertyInvoices(string propertyEntityId, bool includeDeleted = false, string? invoiceType = null)
        {
            return new List<PropertyInvoice>();

            //string PropertyEntityIdField = "propertyentityid";
            //var query = new GetInvoiceByMetadataQuery(PropertyEntityIdField, propertyEntityId, includeDeleted);
            //var result = await mediator.Send(query);
            //if (result.IsFailed)
            //{

            //}

            //var invoiceResult = result.Value.ToList();
            //if(invoiceType is not null)
            //{
            //    invoiceResult = invoiceResult.Where(i => i.TransactionTypeId.Equals(invoiceType, StringComparison.OrdinalIgnoreCase)).ToList();
            //}

            //var invoices = invoiceResult.Select(i => new PropertyInvoice(i.EntityId!, i.ExternalId!, i.TransactionStatusId, i.TransactionTypeId, i.Description, i.Amount, i.AmountDue, i.PaymentTotal,
            //                                        i.DueDate, i.IssuedDate, i.IsDeleted, i.InvoiceCategoryId));

            //return invoices;
        }
    }
}
