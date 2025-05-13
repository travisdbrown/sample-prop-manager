using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using IdGen;
using IdGen.DependencyInjection;
using dyVisions.Data.Abstractions;
using Microsoft.Extensions.Options;
using System.Runtime.CompilerServices;
using System.Transactions;
using FluentValidation;
using Zelu.Property.Domain.Validators;
using Zelu.Infrastructure.Configuration;

[assembly: InternalsVisibleTo("Zelu.Property.Persistence")]
namespace Zelu.Property.Domain.Configuration
{
    public static class Bootstrapper
    {
        public static IServiceCollection AddPropertyDomain(this IServiceCollection services, Action<IdGeneratorKeyOptionsBuilder> configure)
        {
            var options = new IdGeneratorKeyOptionsBuilder();
            configure?.Invoke(options);

            return AddPropertyDomain(services, options);
        }

        public static IServiceCollection AddPropertyDomain(this IServiceCollection services, IdGeneratorKeyOptionsBuilder configure)
        {
            var assemblies = new List<Assembly>();
            assemblies.Add(Assembly.Load("Zelu.Property.Domain"));
            services.AddMediatR(c => c.RegisterServicesFromAssemblies(assemblies.ToArray()));

            services.AddIdGen(configure.IdGeneratorKey);
            //services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddValidatorsFromAssemblyContaining<CreatePropertyCommandValidator>();

            return services;
        }
    }
}
