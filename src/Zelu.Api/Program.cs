using AspNetCore.Authentication.ApiKey;
using Audit.Core;
using dyVisions.Security.Abstractions;
using dyVisions.Security.Abstractions.Configuration;
using dyVisions.Session;
using dyVisions.Storage.Abstractions;
using dyVisions.Storage.Azure;
using dyVisions.Web.Api.Exceptions;
using dyVisions.Web.Api.Swagger;
using dyVisions.Web.Api.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.FeatureManagement;
using Microsoft.Net.Http.Headers;
using Zelu.Api.Authorization;
using Zelu.Api.Configuration;
using Zelu.Api.Features;
using Zelu.Api.Identity;
using Zelu.Infrastructure.Configuration;
using Zelu.Property.Ac;
using Zelu.Property.Domain.Configuration;
using Zelu.Property.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SessionContextPolicy", policy =>
    {
        policy.Requirements.Add(new SessionContextRequirement());
    });
    options.AddPolicy(AuthorizationKey.SystemUserOnlyPolicy, policy => 
    { 
        policy.RequireClaim("permissions", AuthorizationKey.FinanceSystemUserClaim); 
    });
});

builder.Services.AddScoped<IAuthorizationHandler, SessionContextHandler>();

builder.Services.AddSingleton<BasicTenantSystemOptions>(o => 
{
    var c = new BasicTenantSystemOptions();
    builder.Configuration.GetSection("Security").Bind(c);
    return c;
});

builder.Services.AddScoped<ITenantSystem, ApplicationTenantSystem>();

builder.Services.AddAuthentication(ApiKeyDefaults.AuthenticationScheme)
                .AddApiKeyInHeaderOrQueryParams<ApiKeyProvider>(options =>
                {
                    options.Realm = "API Subscription Key";
                    options.KeyName = "x-subscription-key";
                });

builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("Main")));

builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme)
    .AddCookie(o => o.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.None);

builder.Services.AddIdentityApiEndpoints<IdentityUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddUserManager<UserManager<IdentityUser>>();

builder.Services.AddScoped<ISessionContext, ZeluSessionContext>();
builder.Services.AddTransient<IEmailSender<IdentityUser>, IdentityEmailProvider>();
builder.Services.AddTransient<IEmailSender, IdentityEmailProvider>();

//builder.Services.AddSmartSaasSession();

builder.Services.AddPropertyDomain(o => builder.Configuration.GetSection("IdGenerator").Bind(o));

builder.Services.AddDapperPersistence(o => { o.ConnectionString = builder.Configuration.GetConnectionString("Main"); });

builder.Services.AddOptions<EmailOptions>().Configure<IConfiguration>((o, config) => config.GetSection("EmailProvider").Bind(o));
builder.Services.AddOptions<CloudStorageProviderOptions>().Configure<IConfiguration>((o, config) => config.GetSection("BlobStorage").Bind(o));
builder.Services.AddScoped<ICloudStorageProvider, CloudStorageProvider>();

builder.Services.AddPropertyAc();

builder.Services.AddFeatureManagement()
    .AddFeatureFilter<PlanFilter>();


builder.Services.AddSSVersioningSupport(new ApiVersion(1, 0));
builder.Services.AddSSSwaggerSupport("Property Management API");

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(o =>
{
    var allowedOrigins = builder.Configuration.GetValue<string>("AllowedOrigins").Split(';');
    o.AddDefaultPolicy(p =>
    {
        p.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .WithHeaders(HeaderNames.ContentType, HeaderNames.Authorization, "x-username")
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseGlobalExceptionHandler();


app.UseSSSwaggerSupport();

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
