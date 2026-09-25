# PulseBoard Backend

PulseBoard is a scalable, real-time backend service built with [NestJS](https://nestjs.com/). It provides a robust foundation for managing users, subscriptions, payments, and real-time notifications.

## 🚀 Technologies

*   **Framework:** NestJS (Node.js)
*   **Language:** TypeScript
*   **Database:** PostgreSQL (via TypeORM)
*   **Caching & Sessions:** Redis (via ioredis)
*   **Message Broker:** RabbitMQ (via amqplib)
*   **Real-time Communication:** WebSockets (via Socket.io)
*   **Authentication:** JWT, bcrypt, 2FA/MFA (otplib, qrcode)
*   **Payments Processing:** Cashfree PG
*   **API Documentation:** Swagger / OpenAPI
*   **Postman Integration:** Sync tools included

## 📦 Modules

*   **Users Module:** User management, authentication, and Multi-Factor Authentication (MFA).
*   **Payments Module:** Integration with Cashfree for processing transactions.
*   **Subscriptions Module:** Managing recurring billing and subscription plans.
*   **Notifications Module:** Real-time push notifications using WebSockets and email sending via Nodemailer.

## 🛠 Project Setup

### Prerequisites

*   Node.js (>= 20.0.0)
*   npm (>= 10.0.0)
*   PostgreSQL
*   Redis
*   RabbitMQ

### Installation

```bash
$ npm install
```

### Environment Variables

Copy the example environment file and configure it:

```bash
$ cp .env.example .env
```
Ensure all database, Redis, RabbitMQ, and Cashfree credentials are set correctly in the `.env` file.

## 🏃 Running the Application

```bash
# development
$ npm run start

# watch mode (recommended for development)
$ npm run start:dev

# production mode
$ npm run start:prod
```

## 🧪 Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## 📝 API Documentation

Once the application is running, the Swagger API documentation will be available at:
`http://localhost:<PORT>/api` (assuming default Swagger setup).

## 🔄 Postman Sync

The project includes a custom script to sync OpenAPI specifications to a Postman collection:

```bash
$ npm run postman:sync
```

## 📄 License

This project is [MIT licensed](LICENSE).
