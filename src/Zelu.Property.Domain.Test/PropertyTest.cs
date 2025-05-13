using Castle.Core.Logging;
using MediatR;
using Microsoft.Extensions.Logging;
using Moq;
using dyVisions.Domain;
using dyVisions.Exceptions;
using dyVisions.Session;
using System.Net;
using Zelu.Property.Domain.Commands;
using Zelu.Property.Domain.Repositories;

namespace Zelu.Property.Domain.Test
{
    public class PropertyTest
    {
        [Fact]
        public void Create_Property_With_Null_Address_Throws_ArgumentNullException()
        {
            Assert.Throws<ArgumentNullException>(() => Property.Create("", null, PropertyCategory.Create("Test", "Test"), false));
        }

        [Fact]
        public void Create_Property_With_Null_PropertyCategory_Throws_ArgumentNullException()
        {
            var address = Address.Create("addressline1", "", "", "", "", "");
            Assert.Throws<ArgumentNullException>(() => Property.Create("", address, null, false));
        }

        [Fact]
        public void Create_Property_Successful()
        {
            var address = Address.Create("111 Test St.", "", "", "Testville", "GA", "30333");
            var propertyCategory = PropertyCategory.Create("TST", "Test");

            var property = Property.Create("", address, propertyCategory, false);

            Assert.Equal(property.Address, address);
            Assert.Equal(property.PropertyCategory, propertyCategory);
            Assert.False(property.IsDeleted);
        }

        [Fact]
        public async Task Property_MarkDeleted_SuccessfulAsync()
        {
            //Arrange
            var logger = new Mock<ILogger<MarkPropertyDeletedCommandHandler>>();
            var repository = new Mock<IPropertyRepository>();
            var sessionContext = new Mock<ISessionContext>();

            repository.Setup(r => r.FindByEntityId(It.IsAny<string>(), It.IsAny<bool>())).ReturnsAsync(CreateStandardProperty());

            MarkPropertyDeletedCommand command = new MarkPropertyDeletedCommand("999");
            MarkPropertyDeletedCommandHandler handler = new MarkPropertyDeletedCommandHandler(logger.Object, repository.Object, sessionContext.Object, Mock.Of<IMediator>());

            //Act
            await handler.Handle(command, new System.Threading.CancellationToken());

        }

        [Fact]
        public async Task MarkPropertyDeleteCommand_NotFound_Property_Throws_FinderException()
        {
            //Arrange
            var logger = new Mock<ILogger<MarkPropertyDeletedCommandHandler>>();
            var repository = new Mock<IPropertyRepository>();
            var sessionContext = new Mock<ISessionContext>();

            repository.Setup(r => r.FindByEntityId(It.IsAny<string>(), It.IsAny<bool>())).ReturnsAsync(null as Property);

            MarkPropertyDeletedCommand command = new MarkPropertyDeletedCommand("999");
            MarkPropertyDeletedCommandHandler handler = new MarkPropertyDeletedCommandHandler(logger.Object, repository.Object, sessionContext.Object, Mock.Of<IMediator>());

            //Act
            _ = Assert.ThrowsAsync<FinderException>(async () => await handler.Handle(command, new System.Threading.CancellationToken()));
        }

        private Property CreateStandardProperty()
        {
            var address = Address.Create("111 Test St.", "", "", "Testville", "GA", "30333");
            var propertyCategory = PropertyCategory.Create("TST", "Test");

            return Property.Create("", address, propertyCategory, false);
        }
    }
}