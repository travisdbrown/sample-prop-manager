using Dapper;
using dyVisions.Data.Abstractions;
using dyVisions.Data.SqlClient;
using dyVisions.Session;
using Zelu.Infrastructure.Extensions;
using Zelu.Property.Domain;
using Zelu.Property.Domain.Repositories;
using static Dapper.SqlMapper;

namespace Zelu.Property.Persistence
{
    public class PropertyCategoryRepository : BaseRepository<PropertyCategory, string>, IPropertyCategoryRepository
    {
        private readonly ISessionContext sessionContext;

        public PropertyCategoryRepository(ISessionContext sessionContext, IUnitOfWork unitOfWork) : base(unitOfWork) 
        {
            this.sessionContext = sessionContext ?? throw new ArgumentNullException(nameof(sessionContext));
        }

        public override async Task Add(PropertyCategory entity)
        {
            await AddRange(new List<PropertyCategory>() { entity });
        }

        public override async Task AddRange(List<PropertyCategory> entities)
        {
            string sql = $"INSERT INTO prop.PropertyCategory ( " +
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
                                    Key = e.Key
                                    ,TenantId = sessionContext.GetApplicationId()
                                    ,Name = e.Name 
                                    ,CreateDate = DateTimeOffset.UtcNow
                                    ,CreatedBy = sessionContext.UserName
                                    ,ModifiedDate = DateTimeOffset.UtcNow
                                    ,ModifiedBy = sessionContext.UserName
                                }), transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                UnitOfWork.Rollback();
                throw;
            }
        }

        public override async Task Delete(PropertyCategory entity)
        {
            string sql = $"DELETE FROM prop.PropertyCategory WHERE [Key] = @Key AND ApplicationId = @TenantId";

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

        public override Task<PropertyCategory> FindByIdAsync(string id)
        {
            throw new NotImplementedException();
        }

        public async Task<PropertyCategory?> FindByKey(string key)
        {
            string sql = $"SELECT " +
                            $"[Key] " +
                            $", [Name] " +
                            $"FROM prop.PropertyCategory " +
                            $"WHERE [Key] = @Key";

            var result = await UnitOfWork.Connection.QueryFirstOrDefaultAsync<PropertyCategory>(sql, new { Key = key }, transaction: UnitOfWork.Transaction);

            return result;
        }

        public async Task<List<PropertyCategory>> GetAll()
        {
            string sql = $"SELECT " +
                            $"[Key] " +
                            $", [Name] " +
                            $"FROM prop.PropertyCategory " +
                            $"WHERE [ApplicationId] is NULL OR [ApplicationId] = @TenantId";

            var result = await UnitOfWork.Connection.QueryAsync<PropertyCategory>(sql, new { TenantId = sessionContext.GetApplicationId() }, transaction: UnitOfWork.Transaction);

            return result.ToList();
        }

        public override async Task Update(PropertyCategory entity)
        {
            string sql = $"UPDATE prop.PropertyCategory SET " +
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
    }
}