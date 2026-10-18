# Campus Commerce

**A Spring-Based E-Commerce System with Shopper and Administrator Interfaces**

Campus Commerce is a web-based commerce system designed to support online shopping and administrative operations through dedicated browser interfaces. It combines product browsing, cart management, checkout, order tracking, account management, and payment integration within a structured backend architecture.

The project separates shopper-facing functionality from administrative operations while organizing backend responsibilities into controllers, services, and repositories.

## Overview

Campus Commerce provides two primary interfaces:

- **Shopper Interface** — Supports account access, product browsing, shopping cart management, checkout, order tracking, and profile management.
- **Administrator Interface** — Provides access to management workflows involving users, products, orders, reports, and face-based access functionality.

The backend contains dedicated modules for commerce operations, user account management, OTP verification, email delivery, payment processing, and chatbot functionality.

## Key Features

### Shopper Experience
- Account registration and sign-in functionality
- Product catalog and browsing
- Shopping cart management
- Checkout and order processing
- Order tracking and payment status
- User profile management

### Administrator Experience
- Administrative sign-in
- Admin dashboard interface
- User management workflows
- Product management
- Order management
- Reporting interface
- Face-based access functionality

### Backend Services
- Product catalog services
- Cart operations
- Order processing
- User account management
- OTP verification
- Email delivery
- PayMongo payment integration
- Chatbot assistance

## Technology Stack

### Backend
- Java
- Spring-based application architecture

### Frontend
- HTML and JavaScript
- Browser-based shopper and administrator interfaces
- Static JavaScript resources and UI templates

### Persistence
- Repository-layer architecture for product, cart, order, and user records

### Integrations
- PayMongo for payment processing
- Email delivery service for verification workflows
- Chatbot service for assistance functionality

## Architecture

The application is organized into several functional layers.

### 1. Presentation Layer

Provides the browser interfaces for shoppers and administrators, including dashboard scripts, account-access scripts, and UI templates.

### 2. Controller Layer

Exposes backend endpoints for application operations, including products, carts, orders, authentication, payment status, and chatbot requests.

### 3. Service Layer

Organizes application logic into dedicated services for product operations, cart management, order processing, user accounts, OTP verification, email delivery, payments, and chatbot assistance.

### 4. Repository Layer

Provides persistence-related modules for product, cart, order, and user records.

### 5. External Integrations

Connects application workflows to PayMongo and email delivery services.

## Repository Structure

The following paths were identified in the repository architecture:

```text
src/
└── main/
    ├── java/com/example/backend/
    │   ├── controller/
    │   │   ├── ProductController.java
    │   │   ├── CartController.java
    │   │   ├── OrderController.java
    │   │   ├── PaymentStatusController.java
    │   │   ├── AuthController.java
    │   │   └── ChatbotController.java
    │   ├── service/
    │   │   ├── ProductService.java
    │   │   ├── CartService.java
    │   │   ├── OrderService.java
    │   │   ├── PayMongoService.java
    │   │   ├── UserService.java
    │   │   ├── OtpService.java
    │   │   ├── EmailService.java
    │   │   └── ChatbotService.java
    │   └── repository/
    │       ├── ProductRepository.java
    │       ├── CartRepository.java
    │       ├── OrderRepository.java
    │       └── UserRepository.java
    └── resources/
        └── static/
            ├── dashboard.js
            ├── div.js
            ├── script.js
            ├── admin.js
            └── login.js
```

*This is a partial structure based on the identified files, not a complete directory listing.*

## Project Goals

Campus Commerce explores the development of a commerce platform through:

- Separation of frontend interfaces and backend responsibilities
- Modular organization of business logic
- Structured product, cart, order, and user operations
- Integration with external payment services
- Account verification and email workflows
- Dedicated administrative interfaces

## Setup and Configuration

Local setup instructions depend on the repository's actual build configuration, database setup, and environment variables.

Before running the application:

1. Clone the repository.
2. Review the project's build configuration and Java version requirements.
3. Configure the required database connection and application properties.
4. Configure the necessary credentials for payment, email, and other integrations.
5. Follow the build and startup commands appropriate to the project's actual configuration.

**Security note:** Keep API credentials, database passwords, and other secrets out of version control. Use environment variables or appropriate server-side configuration.

## Project Status

This README documents the architecture and functionality identified from the available repository analysis. Detailed implementation behavior, endpoint mappings, deployment instructions, and integration configuration should be verified against the source code before being documented as confirmed.

## License

No license has been specified in this README. Add a license if you intend to define permissions for use, modification, and redistribution.
