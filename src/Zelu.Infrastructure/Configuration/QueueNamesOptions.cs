using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Configuration
{
    public class QueueNamesOptions
    {
        public string AutoCreateInvoiceQueue { get; set; } = string.Empty;
        public string OccurrenceStatusQueue { get; set; } = string.Empty;
    }
}
