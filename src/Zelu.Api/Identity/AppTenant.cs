using dyVisions.Security.Abstractions;

namespace Zelu.Api.Identity
{
    public class AppTenant : ITenant
    {
        public string AppId { get; set; }
        public List<ISystemPermission>? AssignedPermissions { get; set; }
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
