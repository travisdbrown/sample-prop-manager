using dyVisions.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Zelu.Property.Domain
{
    public class Amenity : ValueObject
    {
        private Amenity(string key, string name)
        {
            Key = key;
            Name = name;
        }
        public string Key { get; private set; }
        public string Name { get; private set; }

        public static Amenity Create(string key, string name)
        {
            _ = key ?? throw new ArgumentNullException(nameof(key));
            _ = name ?? throw new ArgumentNullException(nameof(name));

            return new Amenity(key, name);
        }

        public static Amenity Load(string key, string name)
        {
            return new Amenity(key, name);
        }

        public override string ToString()
        {
            return Key;
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Key;
            yield return Name;
        }
    }
}
