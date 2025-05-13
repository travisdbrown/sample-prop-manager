using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Models
{
    public class SearchCriteria
    {
        public string? Criteria { get; set; }

        public object[]? Params { get; set; }

        public string? OrderBy { get; set; }
        public string Direction { get; set; } = "ascending";
    }
}
