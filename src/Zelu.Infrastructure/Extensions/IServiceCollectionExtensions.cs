using Microsoft.Extensions.DependencyInjection;
using dyVisions.Data.Abstractions;
using dyVisions.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Extensions
{
    public static class IServiceCollectionExtensions
    {
        public static IServiceCollection AddTransientSqlDbConnection(this IServiceCollection services, Action<IConnectionOptionsBuilder> configure)
        {
            services.AddTransient<IConnectionOptionsBuilder>((s) =>
             {
                 var options = new SqlServerConnectionBuilder();
                 configure?.Invoke(options);

                 return options;
             });

            services.AddTransient<IUnitOfWork, UnitOfWork>();
            services.AddTransient<IDataAccessSession, SqlDataAccessSession>();

            return services;
        }
    }
}
