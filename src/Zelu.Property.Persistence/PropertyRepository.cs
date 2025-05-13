
namespace Zelu.Property.Persistence
{
    using Dapper;
    using IdGen;
    using Microsoft.EntityFrameworkCore.Metadata.Internal;
    using dyVisions.Data.Abstractions;
    using dyVisions.Data.SqlClient;
    using dyVisions.Domain;
    using dyVisions.Session;
    using System.Collections.Generic;
    using System.Dynamic;
    using System.Text.Json;
    using System.Text.RegularExpressions;
    using Zelu.Infrastructure.Extensions;
    using Zelu.Property.Domain;
    using Zelu.Property.Domain.Queries;
    using Zelu.Property.Domain.Repositories;
    using static Dapper.SqlBuilder;
    using static Dapper.SqlMapper;
    using Property = Domain.Property;

    public class PropertyRepository : BaseRepository<Property, int>, IPropertyRepository
    {
        private readonly ISessionContext sessionContext;
        private readonly IdGenerator idGenerator;

        public PropertyRepository(ISessionContext sessionContext, IdGenerator idGenerator, IUnitOfWork unitOfWork) : base(unitOfWork)
        {
            this.sessionContext = sessionContext ?? throw new ArgumentNullException(nameof(sessionContext));
            this.idGenerator = idGenerator;
        }

        public override async Task Add(Property entity)
        {
            string sql = $"INSERT INTO prop.Property ( " +
                            $"[EntityId] " +
                            $",ExternalId " +
                            $",[ApplicationId] " +
                            $",[ParentEntityId]" +
                            $",AddressLine1 " +
                            $",AddressLine2 " +
                            $",[City] " +
                            $",[State] " +
                            $",PostalCode " +
                            $",PropertyCategoryKey " +
                            $",Size " +
                            $",UnitNumber " +
                            $",NumberOfBedrooms " +
                            $",NumberOfBaths " +
                            $",IsMultiUnit " +
                            $",IsDeleted " +
                            $",CreateDate " +
                            $",CreatedBy " +
                            $",ModifiedDate " +
                            $",ModifiedBy) " +
                            $"VALUES ( " +
                            $"@EntityId " +
                            $",@ExternalId " +
                            $",@TenantId " +
                            $",@ParentEntityId " +
                            $",@AddressLine1 " +
                            $",@AddressLine2 " +
                            $",@City " +
                            $",@State " +
                            $",@PostalCode " +
                            $",@PropertyCategoryKey " +
                            $",@Size " +
                            $",@UnitNumber " +
                            $",@NumberOfBedrooms " +
                            $",@NumberOfBaths " +
                            $",@IsMultiUnit " +
                            $",@IsDeleted " +
                            $",@CreateDate " +
                            $",@CreatedBy " +
                            $",@ModifiedDate " +
                            $",@ModifiedBy) ";

            try
            {
                List<Property> flattenPropertyList = new();
                flattenPropertyList.Add(entity);
                flattenPropertyList.AddRange(entity.PropertyUnits);

                var result = await UnitOfWork.Connection.ExecuteAsync(sql,
                            flattenPropertyList.Select(p =>
                            new
                            {
                                p.EntityId,
                                p.ExternalId,
                                TenantId = sessionContext.GetApplicationId(),
                                p.ParentEntityId,
                                AddressLine1 = p.Address?.AddressLine1,
                                AddressLine2 = p.Address?.AddressLine2,
                                City = p.Address?.City,
                                State = p.Address?.State,
                                PostalCode = p.Address?.PostalCode,
                                PropertyCategoryKey = p.PropertyCategory?.Key,
                                p.Size,
                                p.UnitNumber,
                                p.NumberOfBedrooms,
                                p.NumberOfBaths,
                                p.IsMultiUnit,
                                p.IsDeleted,
                                CreateDate = DateTimeOffset.UtcNow,
                                CreatedBy = sessionContext.UserName,
                                ModifiedDate = DateTimeOffset.UtcNow,
                                ModifiedBy = sessionContext.UserName,
                            }),
                            transaction: UnitOfWork.Transaction);

                await AddPropertyAmenity(entity);
            }
            catch (Exception)
            {
                UnitOfWork.Rollback();
                throw;
            }
        }

        public async Task AddPropertyAmenity(Property property)
        {
            await AddPropertyAmenities(property.ExternalId, property.Amenities.ToList());
        }

        public async Task AddPropertyAmenities(string propertyEntityId, List<Amenity> amenities)
        {
            string sql = $"INSERT INTO [prop].[PropertyAmenity] " +
                         $"      ([ApplicationId] " +
                         $"      ,[PropertyEntityId] " +
                         $"      ,[AmenityKey]) " +
                         $"VALUES " +
                         $"      (@TenantId " +
                         $"      ,@PropertyEntityId " +
                         $"      ,@AmenityKey)";

            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql,
                            amenities.Select(a => new { TenantId = sessionContext.GetApplicationId(), PropertyEntityId = propertyEntityId, AmenityKey = a.Key }),
                            transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                UnitOfWork.Rollback();
                throw;
            }
        }

        public async Task<Property?> FindByEntityId(string entityId, bool includeDeleted = false)
        {
            string sql = "EXEC prop.GetProperty @EntityId, @ApplicationId, @IncludeDeleted; ";
            var dynamicResult = await UnitOfWork.Connection.QueryMultipleAsync(sql,
                            new { EntityId = entityId, ApplicationId = sessionContext.GetApplicationId(), IncludeDeleted = includeDeleted },
                            transaction: UnitOfWork.Transaction);

            using (dynamicResult)
            {
                Property property = null;

                var propertyData = await dynamicResult.ReadFirstOrDefaultAsync<dynamic>();
                if (propertyData != null)
                {
                    var address = Address.Create(propertyData.AddressLine1, propertyData.AddressLine2, "", propertyData.City, propertyData.State, propertyData.PostalCode);
                    var propertyCategory = PropertyCategory.Load(propertyData.PropertyCategoryKey, propertyData.PropertyCategoryName);
                    property = Property.Load(propertyData.Id, propertyData.EntityId, address, propertyCategory, propertyData.IsMultiUnit, propertyData.IsDeleted, propertyData.ExternalId, 
                                                        propertyData.Size, propertyData.ParentEntityId, unitNumber: propertyData.UnitNumber, numberOfBedrooms: propertyData.NumberOfBedrooms, 
                                                        numberOfBaths: propertyData.NumberOfBaths);

                    List<Property> propertyUnits = new();
                    var propertyUnitData = await dynamicResult.ReadAsync<dynamic>();
                    if (propertyUnitData != null)
                    {
                        foreach (var propUnit in propertyUnitData.ToList())
                        {
                            var propertyUnit = Property.Load(propUnit.Id, propUnit.EntityId,null, null, isMultiUnit: propertyData.IsMultiUnit, isDeleted: propUnit.IsDeleted, externalId: propUnit.ExternalId, 
                                                                size: propUnit.Size, parentEntityId: propUnit.ParentEntityId, unitNumber: propUnit.UnitNumber, 
                                                                numberOfBedrooms: propUnit.NumberOfBedrooms, numberOfBaths: propUnit.NumberOfBaths);
                            propertyUnits.Add(propertyUnit);
                        }

                        property.LoadUnits(propertyUnits);
                    }
                }
                else
                {
                    var propertyUnitData = await dynamicResult.ReadFirstOrDefaultAsync<dynamic>();
                    if(propertyUnitData is null)
                    {
                        //No property or property unit found. Can't move forward
                        return null;
                    }

                    var address = Address.Create(propertyUnitData.AddressLine1, propertyUnitData.AddressLine2, "", propertyUnitData.City, propertyUnitData.State, propertyUnitData.PostalCode);
                    var propertyCategory = PropertyCategory.Load(propertyUnitData.PropertyCategoryKey, propertyUnitData.PropertyCategoryName);
                    property = Property.Load(propertyUnitData.Id, propertyUnitData.EntityId, address, null, false, propertyUnitData.IsDeleted, propertyUnitData.ExternalId,
                                                        propertyUnitData.Size, propertyUnitData.ParentEntityId, unitNumber: propertyUnitData.UnitNumber, numberOfBedrooms: propertyUnitData.NumberOfBedrooms,
                                                        numberOfBaths: propertyUnitData.NumberOfBaths);

                }

                List<PropertyOwner> propertyOwners = new();
                var propertyOwnerData = await dynamicResult.ReadAsync<dynamic>();
                if (propertyOwnerData != null)
                {
                    foreach (var propOwner in propertyOwnerData.ToList())
                    {
                        var propertyOwner = PropertyOwner.Load(propOwner.Id, propOwner.EntityId, propOwner.PropertyEntityId, propOwner.ContactEntityId,
                                                name: propOwner.Name, phoneNumber: propOwner.PhoneNumber);
                        propertyOwners.Add(propertyOwner);
                    }
                }

                property.LoadOwners(propertyOwners);

                List<Amenity> amenities = new();
                var dynamicAmenities = await dynamicResult.ReadAsync<dynamic>();
                if (dynamicAmenities != null)
                {
                    foreach (var item in dynamicAmenities.ToList())
                    {
                        var amenity = Amenity.Load(item.Key, item.Name);
                        amenities.Add(amenity);
                    }
                }

                amenities.ForEach(a => property.AddAmenity(a));

                var dynamicLeaseAgreement = await dynamicResult.ReadAsync<dynamic>();
                if (dynamicLeaseAgreement != null)
                {
                    foreach (var item in dynamicLeaseAgreement.ToList())
                    {
                        var leaseAgreement = PropertyLeaseAgreement.Load(item.Id, item.PropertyEntityId, item.LeaseAgreementEntityId,
                                                                            item.StartDate, item.RentAmount, item.EndDate, item.StatusKey, item.TenantContactEntityId, item.TenantName, item.TenantPhoneNumber,
                                                                            item.CoTenantContactEntityId, item.CoTenantName, item.CoTenantPhoneNumber);
                        property.LoadLeaseAgreement(leaseAgreement);
                    }
                }

                return property;
            }
        }

        public override async Task Update(Property entity)
        {
            string sql = $"UPDATE prop.Property SET " +
                            $"[AddressLine1] = @AddressLine1 " +
                            $",[AddressLine2] = @AddressLine2 " +
                            $",[City] = @City " +
                            $",[State] = @State " +
                            $",[PostalCode] = @PostalCode " +
                            $",[PropertyCategoryKey] = @PropertyCategoryKey " +
                            $",[Size] = @Size" +
                            $",UnitNumber = @UnitNumber" +
                            $",NumberOfBedrooms = @NumberOfBedrooms" +
                            $",NumberOfBaths = @NumberOfBaths " +
                            $",IsDeleted = @IsDeleted " +
                            $",ModifiedDate = @ModifiedDate " +
                            $",ModifiedBy = @ModifiedBy " +
                        $"WHERE Id = @Id ";

            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql,
                        new 
                        { 
                            entity.Address?.AddressLine1
                            ,entity.Address?.AddressLine2
                            ,entity.Address?.City
                            ,entity.Address?.State
                            ,entity.Address?.PostalCode
                            ,PropertyCategoryKey = entity.PropertyCategory?.Key
                            ,entity.Size
                            ,entity.UnitNumber
                            ,entity.NumberOfBedrooms
                            ,entity.NumberOfBaths
                            ,entity.IsDeleted
                            ,entity.Id
                            ,ModifiedDate = DateTimeOffset.UtcNow
                            ,ModifiedBy = sessionContext.UserName
                        },
                        transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                UnitOfWork.Rollback();
                throw;
            }
        }

        public async Task<(int TotalResultCount, IEnumerable<PropertyView> Results)> SearchProperty(int pageNumber, int pageSize, SearchPropertyQuery searchPropertyQuery, bool includeDeleted = false)
        {
            var orderBy = searchPropertyQuery.OrderBy;
            if(string.IsNullOrEmpty(searchPropertyQuery.OrderBy))
            {
                orderBy = "AddressLine1";
            }

            string sql = $"SELECT COUNT(*) FROM [prop].[PropertyView] " +
                         $" WHERE (ApplicationId = {sessionContext.GetApplicationId()}) AND ({searchPropertyQuery.Criteria}) AND (@IncludeDeleted = 1 OR IsDeleted = 0) " +
                         $";SELECT [Id] " +
                         $"    ,[EntityId] " +
                         $"    ,[ExternalId] " +
                         $"    ,ParentEntityId " +
                         $"    ,[ApplicationId] " +
                         $"    ,[AddressLine1] " +
                         $"    ,[AddressLine2] " +
                         $"    ,[City] " +
                         $"    ,[State] " +
                         $"    ,[PostalCode] " +
                         $"    ,[PropertyCategoryKey] " +
                         $"    ,[Size]" +
                         $"    ,IsMultiUnit " +
                         $"    ,[PropertyFinancialId] " +
                         $"    ,[IsDeleted] " +
                         $"    ,PropertyCategoryName " +
                         $"    ,UnitNumber" +
                         $"    ,LeaseAgreementEntityId" +
                         $"    ,NumberOfBedrooms " +
                         $"    ,NumberOfBaths " +
                         $"    ,TotalOccupied " +
                         $"    ,TotalUnits " +
                         $"FROM [prop].[PropertyView] " +
                         $" WHERE (ApplicationId = {sessionContext.GetApplicationId()}) AND ({searchPropertyQuery.Criteria}) AND (@IncludeDeleted = 1 OR IsDeleted = 0) " +
                         $"  ORDER BY {orderBy} " +
                         $"OFFSET(@pageNumber - 1) * @pageSize ROWS " +
                         $"FETCH NEXT @pageSize ROWS ONLY ";

            var builder = new SqlBuilder();
            var selectTemplate = CreateSqlTemplate(builder, sql, searchPropertyQuery.Parameters);

            builder.AddParameters(new { pageNumber });
            builder.AddParameters(new { pageSize });
            builder.AddParameters(new { IncludeDeleted = includeDeleted });

            if(UnitOfWork.Connection.State == System.Data.ConnectionState.Closed)
            {
                UnitOfWork.Connection.Open();
            }

            var result = await UnitOfWork.Connection.QueryMultipleAsync(selectTemplate.RawSql, selectTemplate.Parameters);
            using (result)
            {
                int totalCount = await result.ReadFirstAsync<int>();
                var resultDtoSet = await result.ReadAsync<dynamic>();

                var x = resultDtoSet.Where(x => x.UnitEntityId != null).GroupBy(x => x.EntityId);

                List<PropertyView> properties = new();
                resultDtoSet.ToList().ForEach(dynamicResult =>
                {
                    var address = Address.Create(dynamicResult.AddressLine1, dynamicResult.AddressLine2, "", dynamicResult.City, dynamicResult.State, dynamicResult.PostalCode);
                    var propertyCategory = PropertyCategory.Load(dynamicResult.PropertyCategoryKey, dynamicResult.PropertyCategoryName);
                    var amenity = Amenity.Load(dynamicResult.PropertyCategoryKey, dynamicResult.PropertyCategoryName);

                    PropertyView p = PropertyView.Load(dynamicResult.EntityId, address, propertyCategory, dynamicResult.ExternalId, dynamicResult.Size, dynamicResult.UnitNumber, 
                                                        dynamicResult.IsDeleted, dynamicResult.NumberOfBedrooms, dynamicResult.NumberOfBaths, dynamicResult.IsMultiUnit, dynamicResult.ParentEntityId,
                                                        dynamicResult.TotalOccupied, dynamicResult.TotalUnits);
                    properties.Add(p);
                });


                return (totalCount, properties);
            }
        }

        private Template CreateSqlTemplate(SqlBuilder builder, string sqlStatement, Dictionary<string, object> parameters)
        {
            if (parameters != null)
            {
                foreach (var item in parameters)
                {
                    ExpandoObject p = new ExpandoObject();
                    p.TryAdd(item.Key, item.Value.ToString());

                    builder.AddParameters(p);
                }
            }

            return builder.AddTemplate(sqlStatement);
        }

        public async Task AddTotalUnitsStat(Property property, int value)
        {
            string sql = "EXEC prop.AddTotalUnitsStat @PropertyEntityId, @Value; ";

            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql,
                        new 
                        { 
                            PropertyEntityId = property.EntityId,
                            Value = value
                        },
                        transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                UnitOfWork.Rollback();
                throw;
            }
        }

        public async Task AddTotalOccupiedStat(Property property, int value)
        {
            string sql = "EXEC prop.AddTotalOccupiedStat @PropertyEntityId, @Value; ";

            try
            {
                var result = await UnitOfWork.Connection.ExecuteAsync(sql,
                        new
                        {
                            PropertyEntityId = property.EntityId,
                            Value = value
                        },
                        transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                UnitOfWork.Rollback();
                throw;
            }
        }

        public async Task SoftDelete(Property entity)
        {
            string sql = $"UPDATE prop.Property SET " +
                            $"IsDeleted = @IsDeleted " +
                            $",ModifiedDate = @ModifiedDate " +
                            $",ModifiedBy = @ModifiedBy " +
                        $"WHERE Id = @Id ";

            try
            {
                List<Property> flattenPropertyList = new();
                flattenPropertyList.Add(entity);
                flattenPropertyList.AddRange(entity.PropertyUnits);

                var result = await UnitOfWork.Connection.ExecuteAsync(sql,
                        flattenPropertyList.Select(p => 
                        new 
                        { 
                             p.IsDeleted
                            ,p.Id
                            ,ModifiedDate = DateTimeOffset.UtcNow
                            ,ModifiedBy = sessionContext.UserName
                        }),
                        transaction: UnitOfWork.Transaction);
            }
            catch (Exception)
            {
                UnitOfWork.Rollback();
                throw;
            }
        }
    }
}