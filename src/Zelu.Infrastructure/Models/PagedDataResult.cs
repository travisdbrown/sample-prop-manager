using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Models
{
    public class PagedDataResult<TItem>
    {
        public int ResultCount { get; set; }
        public IEnumerable<TItem> Result { get; set; } = new List<TItem>();
    }
}
