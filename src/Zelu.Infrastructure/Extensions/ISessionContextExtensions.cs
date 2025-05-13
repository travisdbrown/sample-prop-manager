using dyVisions.Session;
using Zelu.Infrastructure.Configuration;

namespace Zelu.Infrastructure.Extensions
{
    public static class ISessionContextExtensions
    {
        public static void SetApplicationId(this ISessionContext context, string applicationId)
        {
            var zeluContext = context as ZeluSessionContext;
            if (zeluContext is null)
            {
                throw new ArgumentException("Expected ZeluSessionContext not found.");
            }

            zeluContext.ApplicationId = applicationId;
        }

        public static string GetApplicationId(this ISessionContext context)
        {
            var zeluContext = context as ZeluSessionContext;
            if (zeluContext is null)
            {
                throw new ArgumentException("Expected ZeluSessionContext not found.");
            }

            return zeluContext.ApplicationId;
        }

        public static string GetApplicationPlan(this ISessionContext context)
        {
            var zeluContext = context as ZeluSessionContext;
            if (zeluContext is null)
            {
                throw new ArgumentException("Expected ZeluSessionContext not found.");
            }

            return zeluContext.ApplicationPlan;
        }

        public static void SetApplicationPlan(this ISessionContext context, string applicationPlan)
        {
            var zeluContext = context as ZeluSessionContext;
            if (zeluContext is null)
            {
                throw new ArgumentException("Expected ZeluSessionContext not found.");
            }

            zeluContext.ApplicationPlan = applicationPlan;
        }
    }
}
