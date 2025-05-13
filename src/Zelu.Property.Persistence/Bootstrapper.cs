using Audit.Core;
using Microsoft.Extensions.DependencyInjection;
using dyVisions.Data.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain.Configuration;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Persistence
{
    public static class Bootstrapper
    {
        public static IServiceCollection AddDapperPersistence(this IServiceCollection services, Action<IConnectionOptionsBuilder> configure)
        {
            var options = new ConnectionOptionsBuilder();
            configure?.Invoke(options);

            return AddDapperPersistence(services, options);
        }

        public static IServiceCollection AddDapperPersistence(this IServiceCollection services, IConnectionOptionsBuilder configure)
        {
            services.AddScoped<IPropertyCategoryRepository, PropertyCategoryRepository>();
            services.AddScoped<IPropertyRepository, PropertyRepository>();
            services.AddScoped<IPropertyOwnerRepository, PropertyOwnerRepository>();
            services.AddScoped<IAmenityRepository, AmenityRepository>();
            services.AddScoped<IPropertyLeaseAgreementRepository, PropertyLeaseAgreementRepository>();

            //Audit.Core.Configuration.Setup()
            //    .UseSqlServer(o => o
            //        .ConnectionString(configure.ConnectionString)
            //        .Schema("prop")
            //        .TableName("AuditEvent")
            //        .IdColumnName("EventId")
            //        .JsonColumnName("Data")
            //        .LastUpdatedColumnName("LastUpdatedDate"));

            return services;
        }
    }
}
