using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Zelu.Infrastructure.Configuration;
using Zelu.Property.Domain.Integrations.Contact;
using Zelu.Property.Domain.Integrations.Invoice;
using Zelu.Property.Domain.Validators;

namespace Zelu.Property.Ac
{
    public static class Bootstrapper
    {
        public static IServiceCollection AddPropertyAc(this IServiceCollection services)
        {
            services.AddScoped<IContactSystem, ContactSystem>();
            services.AddScoped<IInvoiceSystem, InvoiceSystem>();

            return services;
        }
    }
}
