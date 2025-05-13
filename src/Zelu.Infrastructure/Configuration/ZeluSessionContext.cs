using dyVisions.Session;

namespace Zelu.Infrastructure.Configuration
{
    public class ZeluSessionContext : ISessionContext
    {
        public string ApplicationId { get; set; } = string.Empty;
        public string ApplicationPlan { get; set; } = string.Empty;

        [Obsolete("TenantId is obsolete. Use the applicationid.", true)]
        public int? TenantId { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }

        public string UserName { get; set; } = string.Empty;
    }
}
