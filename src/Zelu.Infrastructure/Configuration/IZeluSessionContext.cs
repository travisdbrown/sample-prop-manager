using SmartSaas.Session;

namespace Zelu.Api
{
    public interface IZeluSessionContext : ISessionContext
    {
        string ApplicationId { get; set; }
    }
}
