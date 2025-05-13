using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Infrastructure.Exceptions
{
    public class ValidationError
    {
        public ValidationError(string propertyName, string errorMessage)
        {
            PropertyName = propertyName;
            ErrorMessage = errorMessage;
        }

        public string PropertyName { get; }
        public string ErrorMessage { get; }
    }
}
