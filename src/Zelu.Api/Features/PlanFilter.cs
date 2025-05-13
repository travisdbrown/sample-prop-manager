using dyVisions.Session;
using MediatR;
using Microsoft.FeatureManagement;

namespace Zelu.Api.Features
{
    public class PlanFilter : IContextualFeatureFilter<string>
    {
        private readonly ISessionContext sessionContext;
        private readonly IMediator mediator;

        public PlanFilter(IMediator mediator)
        {
            this.mediator = mediator;
        }

        public async Task<bool> EvaluateAsync(FeatureFilterEvaluationContext featureFilterContext, string appContext)
        {
            var plans = featureFilterContext.Parameters.GetSection("Plans").Get<List<string>>();
            if(plans is null)
            {
                return false;
            }

            return plans.Contains(appContext, StringComparer.OrdinalIgnoreCase);
        }
    }
}
