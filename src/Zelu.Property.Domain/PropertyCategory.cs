using dyVisions.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Property.Domain
{
    public class PropertyCategory : ValueObject
    {
        public PropertyCategory(string key, string name)
        {
            Key = key;
            Name = name;
        }

        public string Key { get; private set; }
        public string Name { get; private set; }

        public override string ToString()
        {
            return Key;
        }

        internal void ApplyUpdates(dynamic changes)
        {
            if(changes.Name != null)
            {
                Name = changes.Name;
            }
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Key;
            yield return Name;
        }

        public static PropertyCategory Create(string key, string name)
        {
            _ = key ?? throw new ArgumentNullException(nameof(key));
            _ = name ?? throw new ArgumentNullException(nameof(name));

            return new PropertyCategory(key, name);
        }

        public static PropertyCategory CreateCustom(string entityId, string name)
        {
            _ = name ?? throw new ArgumentNullException(nameof(name));

            var key = $"CUST-{entityId}";
            return new PropertyCategory("xxx", name);
        }

        public static PropertyCategory Load(string key, string name)
        {
            return new PropertyCategory(key, name);
        }
    }
}
