using Dapper;
using dyVisions.Data.Abstractions;
using dyVisions.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Zelu.Property.Domain;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Persistence
{
    public class PropertyLeaseAgreementRepository : BaseRepository<PropertyLeaseAgreement, int>, IPropertyLeaseAgreementRepository
    {
        private readonly ISessionContext sessionContext;

        public PropertyLeaseAgreementRepository(IUnitOfWork unitOfWork, ISessionContext sessionContext) : base(unitOfWork)
        {
            this.sessionContext = sessionContext;
        }

        public override async Task Add(PropertyLeaseAgreement entity)
        {
            await AddRange(new List<PropertyLeaseAgreement> { entity });
            
        }

        public override async Task AddRange(List<PropertyLeaseAgreement> entities)
        {
            string sql = "INSERT INTO [prop].[PropertyLeaseAgreement] " +
                         "    ([PropertyEntityId] " +
                         "    ,[LeaseAgreementEntityId] " +
                         "    ,TenantContactEntityId " +
                         "    ,TenantName " +
                         "    ,TenantPhoneNumber " +
                         "    ,CoTenantContactEntityId " +
                         "    ,CoTenantName " +
                         "    ,CoTenantPhoneNumber " +
                         "    ,[StartDate] " +
                         "    ,[EndDate] " +
                         "    ,[RentAmount] " +
                         "    ,[StatusKey] " +
                         "    ,CreateDate " +
                         "    ,CreatedBy " +
                         "    ,ModifiedDate " +
                         "    ,ModifiedBy) " +
                         "VALUES " +
                         "    (@PropertyEntityId " +
                         "    ,@LeaseAgreementEntityId " +
                         "    ,@TenantContactEntityId " +
                         "    ,@TenantName " +
                         "    ,@TenantPhoneNumber " +
                         "    ,@CoTenantContactEntityId " +
                         "    ,@CoTenantName " +
                         "    ,@CoTenantPhoneNumber " +
                         "    ,@StartDate " +
                         "    ,@EndDate " +
                         "    ,@RentAmount " +
                         "    ,@StatusKey" +
                         "    ,@CreateDate " +
                         "    ,@CreatedBy " +
                         "    ,@ModifiedDate " +
                         "    ,@ModifiedBy)";

            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql, entities.Select(e => new
                {
                    e.PropertyEntityId
                    ,e.LeaseAgreementEntityId
                    ,TenantContactEntityId = e.TenantContactEntityId
                    ,e.TenantName
                    ,e.TenantPhoneNumber
                    ,CoTenantContactEntityId = e.CoTenantContactEntityId
                    ,e.CoTenantName
                    ,e.CoTenantPhoneNumber
                    ,e.StartDate
                    ,e.EndDate
                    ,e.RentAmount
                    ,e.StatusKey
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

        public override async Task Update(PropertyLeaseAgreement entity)
        {
            string sql = "UPDATE [prop].[PropertyLeaseAgreement] " +
                         "SET [LeaseAgreementEntityId] = @LeaseAgreementEntityId " +
                         "   ,TenantContactEntityId = @TenantContactEntityId " +
                         "   ,TenantName = @TenantName " +
                         "   ,TenantPhoneNumber = @TenantPhoneNumber " +
                         "   ,CoTenantContactEntityId = @CoTenantContactEntityId " +
                         "   ,CoTenantName = @CoTenantName " +
                         "   ,CoTenantPhoneNumber = @CoTenantPhoneNumber " +
                         "   ,[StartDate] = @StartDate " +
                         "   ,[EndDate] = @EndDate " +
                         "   ,[RentAmount] = @RentAmount " +
                         "   ,[StatusKey] = @StatusKey " +
                         "   ,[ModifiedDate] = @ModifiedDate " +
                         "   ,[ModifiedBy] = @ModifiedBy " +
                         "WHERE Id = @Id ";
            
            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql,
                        new 
                        { 
                            entity.LeaseAgreementEntityId
                            ,entity.TenantContactEntityId
                            ,entity.TenantName
                            ,entity.TenantPhoneNumber
                            ,entity.CoTenantContactEntityId
                            ,entity.CoTenantName
                            ,entity.CoTenantPhoneNumber
                            ,entity.StartDate
                            ,entity.EndDate
                            ,entity.RentAmount
                            ,entity.StatusKey
                            ,ModifiedDate = DateTimeOffset.UtcNow
                            ,ModifiedBy = sessionContext.UserName
                            ,entity.Id
                        },
                        transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                UnitOfWork.Rollback();
                throw;
            }
        }

        public override async Task Delete(PropertyLeaseAgreement entity)
        {
            string sql = $"DELETE FROM prop.PropertyLeaseAgreement WHERE [Id] = @Id ";

            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql, new { Id = entity.Id }, transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<PropertyLeaseAgreement?> FindByPropertyEntityId(string propertyEntityId)
        {
            var sql = "SELECT " +
                      "     [Id] " +
                      "    ,[PropertyEntityId] " +
                      "    ,[LeaseAgreementEntityId] " +
                      "    ,TenantContactEntityId " +
                      "    ,TenantName " +
                      "    ,TenantPhoneNumber " +
                      "    ,CoTenantContactEntityId " +
                      "    ,CoTenantName " +
                      "    ,CoTenantPhoneNumber " +
                      "    ,[StartDate] " +
                      "    ,[EndDate] " +
                      "    ,[RentAmount] " +
                      "    ,[StatusKey] " +
                      "FROM [prop].[PropertyLeaseAgreement] " +
                      "WHERE PropertyEntityId = @PropertyEntityId";

            var result = await UnitOfWork.Connection.QuerySingleOrDefaultAsync<PropertyLeaseAgreement>(sql, 
                            new 
                            {
                                PropertyEntityId = propertyEntityId
                            }, transaction: UnitOfWork.Transaction);

            return result;
        }

        public async Task<List<PropertyLeaseAgreement>?> FindByContactEntityId(string contactEntityId)
        {
            var sql = "SELECT " +
                      "     [Id] " +
                      "    ,[PropertyEntityId] " +
                      "    ,[LeaseAgreementEntityId] " +
                      "    ,TenantContactEntityId " +
                      "    ,TenantName " +
                      "    ,TenantPhoneNumber " +
                      "    ,CoTenantContactEntityId " +
                      "    ,CoTenantName " +
                      "    ,CoTenantPhoneNumber " +
                      "    ,[StartDate] " +
                      "    ,[EndDate] " +
                      "    ,[RentAmount] " +
                      "    ,[StatusKey] " +
                      "FROM [prop].[PropertyLeaseAgreement] " +
                      "WHERE TenantContactEntityId = @contactEntityId OR CoTenantContactEntityId = @contactEntityId";

            var result = await UnitOfWork.Connection.QueryAsync<PropertyLeaseAgreement>(sql,
                            new
                            {
                                contactEntityId
                            }, transaction: UnitOfWork.Transaction);

            return result.ToList();
        }

        public async Task<PropertyLeaseAgreement?> FindByLeaseAgreementEntityId(string leaseEntityId)
        {
            var sql = "SELECT " +
                      "     [Id] " +
                      "    ,[PropertyEntityId] " +
                      "    ,[LeaseAgreementEntityId] " +
                      "    ,TenantContactEntityId " +
                      "    ,TenantName " +
                      "    ,TenantPhoneNumber " +
                      "    ,CoTenantContactEntityId " +
                      "    ,CoTenantName " +
                      "    ,CoTenantPhoneNumber " +
                      "    ,[StartDate] " +
                      "    ,[EndDate] " +
                      "    ,[RentAmount] " +
                      "    ,[StatusKey] " +
                      "FROM [prop].[PropertyLeaseAgreement] " +
                      "WHERE LeaseAgreementEntityId = @LeaseAgreementEntityId";

            var result = await UnitOfWork.Connection.QuerySingleOrDefaultAsync<PropertyLeaseAgreement>(sql,
                            new
                            {
                                LeaseAgreementEntityId = leaseEntityId
                            }, transaction: UnitOfWork.Transaction);

            return result;
        }
    }
}
