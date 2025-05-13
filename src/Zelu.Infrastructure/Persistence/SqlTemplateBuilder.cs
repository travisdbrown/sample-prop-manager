using Dapper;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Dapper.SqlBuilder;

namespace Zelu.Infrastructure.Persistence
{
    public class SqlTemplateBuilder
    {
        public SqlBuilder SqlBuilder { get; private set; } = new SqlBuilder();

        public Template CreateSqlTemplate(string sqlStatement, Dictionary<string, object> parameters)
        {
            if (parameters != null)
            {
                foreach (var item in parameters)
                {
                    ExpandoObject p = new ExpandoObject();
                    p.TryAdd(item.Key, item.Value.ToString());

                    SqlBuilder.AddParameters(p);
                }
            }

            return SqlBuilder.AddTemplate(sqlStatement);
        }
    }
}
