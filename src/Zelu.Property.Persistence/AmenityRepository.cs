using Dapper;
using dyVisions.Data.Abstractions;
using dyVisions.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Infrastructure.Extensions;
using Zelu.Property.Domain;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Persistence
{
    public class AmenityRepository : BaseRepository<Amenity, string>, IAmenityRepository
    {
        private readonly ISessionContext sessionContext;

        public AmenityRepository(IUnitOfWork unitOfWork, ISessionContext sessionContext) : base(unitOfWork)
        {
            this.sessionContext = sessionContext;
        }

        public override async Task Add(Amenity entity)
        {
            await AddRange(new List<Amenity>() { entity });
        }

        public override async Task AddRange(List<Amenity> entities)
        {
            string sql = $"INSERT INTO prop.Amenity ( " +
                            $"[Key] " +
                            $",[ApplicationId]" +
                            $",[Name] " +
                            $",CreateDate " +
                            $",CreatedBy " +
                            $",ModifiedDate " +
                            $",ModifiedBy) " +
                            $"VALUES ( " +
                            $"@Key " +
                            $",@TenantId " +
                            $",@Name " +
                            $",@CreateDate " +
                            $",@CreatedBy " +
                            $",@ModifiedDate " +
                            $",@ModifiedBy) ";

            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql, entities.Select(e => new
                {
                    Key = e.Key,
                    TenantId = sessionContext.GetApplicationId(),
                    Name = e.Name,
                    CreateDate = DateTimeOffset.UtcNow,
                    CreatedBy = sessionContext.UserName,
                    ModifiedDate = DateTimeOffset.UtcNow,
                    ModifiedBy = sessionContext.UserName
                }), transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                UnitOfWork.Rollback();
                throw;
            }
        }

        public async Task<Amenity?> FindByKey(string key)
        {
            string sql = $"SELECT " +
                            $"[Key] " +
                            $", [Name] " +
                            $"FROM prop.Amenity " +
                            $"WHERE [Key] = @Key";

            var result = await UnitOfWork.Connection.QueryFirstOrDefaultAsync<Amenity>(sql, new { Key = key }, transaction: UnitOfWork.Transaction);

            return result;
        }

        public async Task<List<Amenity>> GetAll()
        {
            string sql = $"SELECT " +
                            $"[Key] " +
                            $", [Name] " +
                            $"FROM prop.Amenity " +
                            $"WHERE [ApplicationId] is NULL OR [ApplicationId] = @TenantId";

            var result = await UnitOfWork.Connection.QueryAsync<Amenity>(sql, new { TenantId = sessionContext.GetApplicationId() }, transaction: UnitOfWork.Transaction);

            return result.ToList();
        }

        public override async Task Delete(Amenity entity)
        {
            string sql = $"DELETE FROM prop.Amenity WHERE [Key] = @Key AND ApplicationId = @TenantId";

            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql, new { Key = entity.Key, TenantId = sessionContext.GetApplicationId() }, transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                UnitOfWork.Rollback();
                throw;
            }
        }

        public override async Task Update(Amenity entity)
        {
            string sql = $"UPDATE prop.Amenity SET " +
                            $"[Name] = @Name " +
                            $",ModifiedDate = @ModifiedDate " +
                            $",ModifiedBy = @ModifiedBy " +
                            $"WHERE [Key] = @Key AND ApplicationId = @TenantId";

            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql,
                                new
                                {
                                    Key = entity.Key
                                    ,TenantId = sessionContext.GetApplicationId()
                                    ,Name = entity.Name
                                    ,ModifiedDate = DateTimeOffset.UtcNow
                                    ,ModifiedBy = sessionContext.UserName
                                }, transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                UnitOfWork.Rollback();
                throw;
            }
        }

        public async Task<List<Amenity>> FindAll(string[] keys)
        {
            string sql = $"SELECT " +
                            $"[Key] " +
                            $", [Name] " +
                            $"FROM prop.Amenity " +
                            $"WHERE ([ApplicationId] is NULL OR [ApplicationId] = @TenantId) " +
                            $"  AND [Key] In @KeyList";

            var result = await UnitOfWork.Connection.QueryAsync<Amenity>(sql, 
                            new 
                            { 
                                TenantId = sessionContext.GetApplicationId()
                                ,KeyList = keys 
                            }, transaction: UnitOfWork.Transaction);

            return result.ToList();
        }
    }
}
