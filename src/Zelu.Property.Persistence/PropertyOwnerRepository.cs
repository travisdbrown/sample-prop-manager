using Dapper;
using dyVisions.Data.Abstractions;
using dyVisions.Data.SqlClient;
using dyVisions.Domain;
using dyVisions.Session;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Infrastructure.Extensions;
using Zelu.Property.Domain;
using Zelu.Property.Domain.Repositories;
using static Dapper.SqlMapper;

namespace Zelu.Property.Persistence
{
    public class PropertyOwnerRepository : BaseRepository<PropertyOwner, int>, IPropertyOwnerRepository
    {
        private readonly ISessionContext sessionContext;

        public PropertyOwnerRepository(ISessionContext sessionContext, IUnitOfWork unitOfWork) : base(unitOfWork)
        {
            this.sessionContext = sessionContext ?? throw new ArgumentNullException(nameof(sessionContext));
        }

        public override async Task Add(PropertyOwner entity)
        {
            await AddRange(new List<PropertyOwner> { entity });
        }

        public override async Task AddRange(List<PropertyOwner> entities)
        {
            string sql = $"INSERT INTO prop.PropertyOwner ([EntityId], [ApplicationId], [PropertyEntityId], [ContactEntityId]) " +
                            $"VALUES (@EntityId, @TenantId, @PropertyEntityId, @ContactEntityId) ";

            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql,
                                entities.Select(e => new { EntityId = e.EntityId, TenantId = sessionContext.GetApplicationId(), PropertyEntityId = e.PropertyEntityId, ContactEntityId = e.ContactEntityId }),
                                transaction: UnitOfWork.Transaction);

                //throw new Exception("Transaciton Test...");
            }
            catch (Exception)
            {
                throw;
            }
        }
        public override async Task Delete(PropertyOwner entity)
        {
            string sql = $"DELETE FROM prop.PropertyOwner WHERE [Id] = @Id";

            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql, new { Id = entity.Id, TenantId = sessionContext.GetApplicationId() }, transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<PropertyOwner> FindByEntityIdAsync(string entityId)
        {
            string sql = $"SELECT " +
                            $"[Id] " +
                            $",[EntityId] " +
                            $",[PropertyEntityId] " +
                            $",[ContactEntityId] " +
                            $",[Name] " +
                            $",FirstName " +
                            $",LastName " +
                            $",CompanyName " +
                            $",AddressLine1 " +
                            $",AddressLine2 " +
                            $",AddressLine3 " +
                            $",City " +
                            $",State " +
                            $",PostalCode " +
                            $",Email " +
                            $",[PhoneNumber] " +
                            $",Mobile " +
                            $",Website " +
                            $",IsDeleted " +
                            $"FROM prop.PropertyOwnerView " +
                            $"WHERE [EntityId] = @EntityId";

            var result = await UnitOfWork.Connection.QuerySingleAsync(sql, new { EntityId = entityId }, transaction: UnitOfWork.Transaction);

            var person = Person.Create(result.FirstName, result.LastName, result.Email, result.Mobile);
            var address = Address.Create(result.AddressLine1, result.AddressLine2, result.AddressLine3, result.City, result.State, result.PostalCode);
            var owner = PropertyOwner.Load(result.Id, result.EntityId, result.PropertyEntityId, result.ContactEntityId, person, address, result.CompanyName, result.Website, result.PhoneNumber);

            return owner;
        }

        public override async Task Update(PropertyOwner entity)
        {
            throw new NotImplementedException();
            //string sql = $"UPDATE prop.PropertyOwner SET [Name] = @Name, [PhoneNumber] = @PhoneNumber WHERE [Id] = @Id";

            //try
            //{
            //    var result = await UnitOfWork.Connection.ExecuteAsync(sql, new { Id = entity.Id, Name = entity.Name, PhoneNumber = entity.PhoneNumber }, transaction: UnitOfWork.Transaction);
            //}
            //catch (Exception)
            //{
            //    throw;
            //}
        }
    }
}
