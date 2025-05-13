using Zelu.Property.Domain;

namespace Zelu.Api.Controllers.PropertyManagement.Extensions
{
    public static class PropertyInvoiceResponse
    {
        public static dynamic ToResponseV10(this PropertyInvoice entity)
        {
            return new
            {
                entity.EntityId
                ,entity.ExternalId
                ,entity.TransactionStatusId
                ,entity.InvoiceCategoryId
                ,entity.TransactionTypeId
                ,entity.Description
                ,InvoiceAmount = Math.Abs(entity.InvoiceAmount)
                ,AmountDue = entity.AmountDue
                ,PaymentTotal = Math.Abs(entity.PaymentTotal)
                ,entity.DueDate
                ,entity.IssuedDate
                ,entity.IsDeleted
            };
        }
    }
}
