using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Domain
{
    public interface IDeletable
    {
        public bool IsDeleted { get; set; }

        public void MarkDeleted()
        {
            IsDeleted = true;
        }

        public void Restore()
        {
            IsDeleted = false;
        }
    }
}
