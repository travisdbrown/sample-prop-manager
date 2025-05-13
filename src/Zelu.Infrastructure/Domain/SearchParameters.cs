using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Domain
{
    public record SearchParameters (int PageNumber, int PageSize, string? Criteria, Dictionary<string, object>? Parameters = null, string? OrderBy = null, string Direction = "ascending", bool IncludeDeleted = false);

}
