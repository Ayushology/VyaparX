# VyaparX – Microservices-Based Online Marketplace

An enterprise-grade, cloud-native e-commerce marketplace built using the MERN stack, event-driven microservices architecture, distributed caching, and role-based access control (RBAC).

## Overview

VyaparX is a scalable online marketplace designed using domain-driven microservices. Instead of a monolithic architecture, each business domain operates as an independent service, enabling better fault isolation, scalability, maintainability, and deployment flexibility.

The platform allows:

* Buyers to browse products and manage carts
* Sellers to create and manage product inventories
* Secure online payments through Razorpay
* Real-time order processing and status tracking
* Platform-wide authentication and authorization
* Event-driven communication between services

---

## Key Features

### Buyer Features

* User registration and login
* Browse and search products
* Product details and inventory visibility
* Shopping cart management
* Order placement
* Secure online payments
* Order tracking

### Seller Features

* Product creation and management
* Inventory management
* Product image uploads
* Product updates and deletion
* Seller-specific dashboard APIs

### Platform Features

* JWT Authentication
* Refresh Token Support
* Role-Based Access Control (RBAC)
* Redis Caching
* RabbitMQ Event Processing
* Distributed Microservices
* Cloud Image Storage
* API Gateway Routing
* Centralized Logging
* Scalable Deployment

---

## Tech Stack

### Frontend

* React.js
* Vite
* Redux Toolkit
* RTK Query
* Tailwind CSS

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose

### Messaging & Caching

* RabbitMQ
* Redis

### Authentication & Security

* JWT Access Tokens
* JWT Refresh Tokens
* Helmet
* CORS
* Rate Limiting
* RBAC

### Payment Gateway

* Razorpay

### Media Storage

* ImageKit

### DevOps & Deployment

* Docker
* AWS ECS Fargate
* AWS ECR
* Application Load Balancer
* CloudWatch

---

## System Architecture

```text
React Frontend (Vite)
          │
          ▼
 API Gateway / Reverse Proxy
          │
 ┌────────┼────────┐
 ▼        ▼        ▼
Auth   Product   Cart
Service Service  Service
 │        │        │
 ▼        ▼        ▼
UsersDB ProductsDB CartsDB

          │
          ▼
     RabbitMQ
          │
 ┌────────┼────────┐
 ▼        ▼        ▼
Order   Payment  Notification
Service Service    Service
 │        │
 ▼        ▼
OrdersDB PaymentsDB

          │
          ▼
      Razorpay
```

---

## Microservices

### Auth Service

Responsible for:

* Registration
* Login
* JWT generation
* Refresh tokens
* RBAC enforcement

Database:

* Users Database

---

### Product Service

Responsible for:

* Product creation
* Product updates
* Product deletion
* Product listing
* Product image management

Database:

* Products Database

---

### Cart Service

Responsible for:

* Add to cart
* Remove from cart
* Cart retrieval
* Quantity management

Database:

* Carts Database

---

### Order Service

Responsible for:

* Order creation
* Order lifecycle management
* Order status updates

Database:

* Orders Database

---

### Payment Service

Responsible for:

* Razorpay integration
* Payment verification
* Payment status tracking

Database:

* Payments Database

---

## Security

VyaparX follows multiple security layers:

* Access Token Authentication
* Refresh Token Rotation
* Role-Based Authorization
* Secure HTTP-only Cookies
* Request Validation
* Input Sanitization
* Rate Limiting
* Secure Headers using Helmet
* Environment Variable Management

---

## Project Structure

```text
src/
├── config/
├── controllers/
├── services/
├── repositories/
├── models/
├── routes/
├── middlewares/
├── validators/
├── utils/
├── events/
├── cache/
├── tests/
└── docs/
```

---

## Future Enhancements

* Notification Service
* Email Service
* Recommendation Engine
* AI Shopping Assistant
* Elasticsearch Integration
* Distributed Tracing
* Kubernetes Deployment
* Multi-vendor Analytics Dashboard

---

## Learning Outcomes

This project demonstrates:

* Microservices Architecture
* Event-Driven Systems
* Distributed Systems Design
* Message Queues with RabbitMQ
* Redis Caching Strategies
* Authentication & Authorization
* Scalable Cloud Deployments
* Production-Ready Backend Development

---

## Author

**Ayush**

B.Tech Student | MERN Stack Developer | Backend & Cloud Enthusiast

*"Building scalable systems one service at a time."*
