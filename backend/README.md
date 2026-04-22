# Backend Server - Project X

Temporary hardcoded backend for Project X e-commerce project.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:category` - Get products by category

### Authentication
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
- `POST /api/auth/register` - Register new user
  - Body: `{ email, password, name }`

### Cart
- `GET /api/cart/:userId` - Get user's cart
- `POST /api/cart/:userId/add` - Add item to cart
  - Body: `{ productId, quantity }`
- `POST /api/cart/:userId/remove` - Remove item from cart
  - Body: `{ productId }`
- `POST /api/cart/:userId/update` - Update item quantity
  - Body: `{ productId, quantity }`
- `DELETE /api/cart/:userId` - Clear cart

### Orders
- `GET /api/orders/:userId` - Get user's orders
- `GET /api/orders/track/:trackingNumber` - Track order by tracking number
- `POST /api/orders/create` - Create new order
  - Body: `{ userId, shippingAddress }`

### Health Check
- `GET /api/health` - Check server status

## Hardcoded Data

### Test Users
- Email: `user@example.com`, Password: `password123`
- Email: `admin@projectx.com`, Password: `admin123`

### Test Tracking Numbers
- `TRACK-001`
- `TRACK-002`
- `TRACK-003`

## Note

This is a temporary backend with hardcoded data. For production, replace with a proper database and authentication system.
