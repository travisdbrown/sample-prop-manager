using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Property.Domain
{
    public class PropertyInvoice
    {
        public PropertyInvoice(string entityId, string externalId, string transactionStatusId, string transactionTypeId, string description, long invoiceAmount, long amountDue, long paymentTotal,
                                                DateTimeOffset? dueDate, DateTimeOffset? issuedDate, bool isDeleted, string invoiceCategoryId)
        {
            EntityId = entityId;
            ExternalId = externalId;
            TransactionStatusId = transactionStatusId;
            TransactionTypeId = transactionTypeId;
            Description = description;
            InvoiceAmount = invoiceAmount;
            AmountDue = amountDue;
            PaymentTotal = paymentTotal;
            DueDate = dueDate;
            IssuedDate = issuedDate;
            IsDeleted = isDeleted;
            InvoiceCategoryId = invoiceCategoryId;
        }

        public string EntityId { get; private set; }
        public string ExternalId { get; private set; }
        public string TransactionStatusId { get; private set; }
        public string TransactionTypeId { get; private set; }
        public string Description { get; private set; }
        public long InvoiceAmount { get; private set; }
        public long AmountDue  { get; private set; }
        public long PaymentTotal { get; private set; }
        public DateTimeOffset? DueDate { get; private set; }
        public DateTimeOffset? IssuedDate { get; private set; }
        public bool IsDeleted { get; private set; }
        public string InvoiceCategoryId { get; set; }
    }
}
