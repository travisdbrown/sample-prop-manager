using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace Zelu.Api.Identity
{
    //public class ZeluUserManager : UserManager<User>
    //{
    //    public ZeluUserManager(IUserStore<User> store, IOptions<IdentityOptions> optionsAccessor, IPasswordHasher<User> passwordHasher, IEnumerable<IUserValidator<User>> userValidators, 
    //                            IEnumerable<IPasswordValidator<User>> passwordValidators, ILookupNormalizer keyNormalizer, IdentityErrorDescriber errors, IServiceProvider services, 
    //                            ILogger<UserManager<User>> logger) 
    //        : base(store, optionsAccessor, passwordHasher, userValidators, passwordValidators, keyNormalizer, errors, services, logger)
    //    {
    //    }

    //    //public override async Task<IdentityResult> CreateAsync(User user, string password)
    //    //{
    //    //    var identityResult = await base.CreateAsync(user, password);
    //    //    if (identityResult.Succeeded)
    //    //    {
    //    //        //create tenant

    //    //        //create tenant claim for user
    //    //        var r = await AddClaimAsync(user, new Claim("tenant_id", "2"));
    //    //    }

    //    //    return identityResult;
    //    //}
    //}
}
