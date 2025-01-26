# node-commerce-api  

A **modern e-commerce backend** using **Node.js, Express, and PostgreSQL**, with JWT auth, product management, shopping cart, and orders. Built for scalability with **Docker & CI/CD**.  

## Features  
- **Auth**: JWT-based login & roles  
- **Products & Categories**: CRUD operations  
- **Cart & Orders**: Add to cart, checkout, and track orders  
- **Filtering & Sorting**: By category, price, and date  
- **Caching & Performance**: Optimized API responses  
- **Docker & CI/CD**: Containerized with automated deployments  

## Setup  

```bash
git clone https://github.com/yourusername/node-commerce-api.git  
cd node-commerce-api  
npm install  
npx knex migrate:latest  
npm start  
```

**Or with Docker:**  

```bash
docker-compose up --build -d  
```

## API (Examples)  

| Method | Endpoint         | Description |
|--------|-----------------|-------------|
| POST   | `/auth/login`   | User login (JWT) |
| GET    | `/products`     | Get all products (filter & sort) |
| POST   | `/cart`         | Add to cart |
| POST   | `/orders`       | Place an order |


## Testing  
```bash
npm test  
```

## Deployment
```bash
docker-compose up --build -d  
```