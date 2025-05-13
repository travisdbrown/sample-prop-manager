# Property Management System

A modern, scalable property management system built with .NET Core, following clean architecture principles and best practices.

## Architecture Overview

This solution follows a clean architecture pattern with the following layers:

- **API Layer** (`Zelu.Api`): RESTful API endpoints and controllers
- **Domain Layer** (`Zelu.Property.Domain`): Core business logic and entities
- **Persistence Layer** (`Zelu.Property.Persistence`): Data access and storage
- **Application Core** (`Zelu.Property.Ac`): Application services and use cases
- **Infrastructure** (`Zelu.Infrastructure`): Cross-cutting concerns and external services

## Key Features

- Property management with support for multiple units
- Property owner management
- Lease agreement handling
- Invoice generation and tracking
- Amenity management
- Property categorization
- Role-based access control
- API key authentication
- Swagger/OpenAPI documentation
- Feature flags support
- Email notifications
- Cloud storage integration

## Core Domain Entities

### Property
- Central entity representing a property
- Supports multiple units
- Includes property details, status, and categorization
- Manages lease agreements and invoices

### PropertyUnit
- Represents individual units within a property
- Tracks unit status, amenities, and occupancy

### PropertyOwner
- Manages property ownership information
- Handles owner contact details and relationships

### PropertyLeaseAgreement
- Manages lease terms and conditions
- Tracks tenant information and lease periods

### PropertyInvoice
- Handles billing and payment tracking
- Supports multiple invoice types and statuses

## Technical Stack

- **Framework**: .NET Core
- **Database**: SQL Server with Entity Framework Core
- **Authentication**: 
  - API Key authentication
  - Identity-based authentication
- **API Documentation**: Swagger/OpenAPI
- **Feature Management**: Microsoft.FeatureManagement
- **Storage**: Azure Blob Storage
- **Email**: Custom email provider implementation

## Getting Started

### Prerequisites

- .NET Core SDK
- SQL Server
- Azure Storage Account (for blob storage)

### Configuration

The application requires the following configuration sections:

- Connection strings
- Security settings
- Email provider configuration
- Blob storage settings
- Allowed origins for CORS

### Running the Application

1. Update the connection strings in your configuration
2. Run database migrations
3. Start the API project
4. Access the Swagger documentation at `/swagger`

## Security

The application implements multiple security layers:

- API Key authentication for external services
- Identity-based authentication for user management
- Role-based authorization
- Session context validation
- CORS policies

## Development Guidelines

- Follow clean architecture principles
- Implement proper validation in the domain layer
- Use feature flags for new functionality
- Maintain proper separation of concerns
- Write unit tests for domain logic

## API Documentation

The API is documented using Swagger/OpenAPI. Access the documentation at `/swagger` when running the application.

## Contributing

1. Follow the established architecture patterns
2. Write unit tests for new functionality
3. Update documentation as needed
4. Use feature flags for new features

## License

[Specify your license here]
