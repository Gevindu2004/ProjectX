const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // allow base64 images for offers

// -----------------------------
// Hardcoded in-memory data
// -----------------------------

// Minimal products to support frontend fallback routes
let products = [
  {
    id: 1,
    name: 'Project X Printed T-Shirt',
    category: 'NewArrivals',
    image: '/limitedOffer.png',
    new_price: 999,
    old_price: 1299,
    colors: ['White', 'Jet Black'],
    description: 'Comfortable printed tee.',
  },
];

let users = [
  {
    id: 1,
    name: 'Test User',
    email: 'user@example.com',
    password: 'password123',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Admin',
    email: 'admin@projectx.com',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

let categories = [
  { id: 1, name: 'Men', slug: 'men' },
  { id: 2, name: 'Women', slug: 'women' },
  { id: 3, name: 'Kids', slug: 'kids' },
  { id: 4, name: 'New Arrivals', slug: 'newarrivals' },
];

let specialOffers = [
  {
    id: 1,
    title: 'Limited Time Offer',
    description: 'Project X Printed T-Shirt',
    image: '/limitedOffer.png',
    buttonText: 'Check Now',
    buttonLink: '/NewArrivals',
    isActive: true,
    order: 1,
  },
];

// Optional: carts/orders placeholders (not required by current frontend, but handy)
const cartsByUserId = new Map(); // userId -> [{ productId, quantity }]
const ordersByUserId = new Map(); // userId -> [{ id, trackingNumber, items, createdAt }]

// -----------------------------
// Helpers
// -----------------------------

function nextId(list) {
  return list.length > 0 ? Math.max(...list.map((x) => x.id)) + 1 : 1;
}

function safePublicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  };
}

// -----------------------------
// Health
// -----------------------------

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Backend is running',
    counts: {
      products: products.length,
      users: users.length,
      categories: categories.length,
      offers: specialOffers.length,
    },
  });
});

// -----------------------------
// Products
// -----------------------------

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.get('/api/products/category/:category', (req, res) => {
  const category = String(req.params.category || '');
  const filtered = products.filter(
    (p) => String(p.category || '').toLowerCase() === category.toLowerCase()
  );
  res.json(filtered);
});

// Admin: Products (add/delete)
app.post('/api/admin/products', (req, res) => {
  const { name, image, category, new_price, old_price } = req.body || {};

  if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
  if (!image) return res.status(400).json({ success: false, error: 'Image is required' });

  const newProduct = {
    id: nextId(products),
    name: String(name),
    category: category ? String(category) : 'NewArrivals',
    // image can be "/path.png" or "data:image/png;base64,..."
    image: String(image),
    new_price: Number.isFinite(Number(new_price)) ? Number(new_price) : 0,
    old_price: Number.isFinite(Number(old_price)) ? Number(old_price) : 0,
    colors: ['White'],
    description: 'Added from admin panel',
  };

  products.push(newProduct);
  res.json({ success: true, product: newProduct });
});

app.delete('/api/admin/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const exists = products.some((p) => p.id === id);
  if (!exists) return res.status(404).json({ success: false, error: 'Product not found' });

  products = products.filter((p) => p.id !== id);
  res.json({ success: true });
});

// -----------------------------
// Auth (single login for user/admin)
// -----------------------------

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  const exists = users.some((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(409).json({ success: false, error: 'Email already exists' });

  const newUser = {
    id: nextId(users),
    name,
    email,
    password,
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);

  res.json({
    success: true,
    user: safePublicUser(newUser),
    token: `token-${newUser.id}`,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  const user = users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password
  );
  if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

  res.json({
    success: true,
    user: safePublicUser(user),
    token: `token-${user.id}`,
  });
});

// Backwards-compat admin login endpoint (optional)
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password
  );
  if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
  if (user.role !== 'admin')
    return res.status(403).json({ success: false, error: 'Not an admin' });

  res.json({
    success: true,
    user: safePublicUser(user),
    token: `admin-token-${user.id}`,
  });
});

// -----------------------------
// Admin: Users
// -----------------------------

app.get('/api/admin/users', (req, res) => {
  res.json(users.map(safePublicUser));
});

app.put('/api/admin/users/:id/role', (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body || {};
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  if (role !== 'user' && role !== 'admin') {
    return res.status(400).json({ success: false, error: 'Role must be user or admin' });
  }

  user.role = role;
  res.json({ success: true, user: safePublicUser(user) });
});

app.delete('/api/admin/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  // Prevent deleting the only admin (simple safety)
  if (user.role === 'admin') {
    return res.status(400).json({ success: false, error: 'Cannot delete an admin user' });
  }

  users = users.filter((u) => u.id !== id);
  res.json({ success: true });
});

// -----------------------------
// Categories
// -----------------------------

app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.post('/api/admin/categories', (req, res) => {
  const { name, slug } = req.body || {};
  if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

  const computedSlug = slug || String(name).toLowerCase().replace(/\s+/g, '');
  const exists = categories.some(
    (c) => c.slug.toLowerCase() === computedSlug.toLowerCase() || c.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) return res.status(409).json({ success: false, error: 'Category already exists' });

  const newCategory = { id: nextId(categories), name, slug: computedSlug };
  categories.push(newCategory);
  res.json({ success: true, category: newCategory });
});

app.delete('/api/admin/categories/:id', (req, res) => {
  const id = Number(req.params.id);
  const exists = categories.some((c) => c.id === id);
  if (!exists) return res.status(404).json({ success: false, error: 'Category not found' });

  categories = categories.filter((c) => c.id !== id);
  res.json({ success: true });
});

// -----------------------------
// Offers (Home page banners)
// -----------------------------

app.get('/api/offers', (req, res) => {
  const active = specialOffers
    .filter((o) => o.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json(active);
});

app.post('/api/admin/offers', (req, res) => {
  const { title, description, image, buttonText, buttonLink, order } = req.body || {};
  if (!title || !description) {
    return res.status(400).json({ success: false, error: 'Title and description are required' });
  }

  const newOffer = {
    id: nextId(specialOffers),
    title,
    description,
    // image can be: "/path.png" or "data:image/png;base64,...."
    image: image || '/limitedOffer.png',
    buttonText: buttonText || 'Check Now',
    buttonLink: buttonLink || '/',
    isActive: true,
    order: Number.isFinite(Number(order)) ? Number(order) : specialOffers.length + 1,
  };
  specialOffers.push(newOffer);
  res.json({ success: true, offer: newOffer });
});

app.delete('/api/admin/offers/:id', (req, res) => {
  const id = Number(req.params.id);
  const exists = specialOffers.some((o) => o.id === id);
  if (!exists) return res.status(404).json({ success: false, error: 'Offer not found' });
  specialOffers = specialOffers.filter((o) => o.id !== id);
  res.json({ success: true });
});

// -----------------------------
// (Optional) Cart endpoints
// -----------------------------

app.get('/api/cart/:userId', (req, res) => {
  const userId = String(req.params.userId);
  res.json(cartsByUserId.get(userId) || []);
});

app.post('/api/cart/:userId/add', (req, res) => {
  const userId = String(req.params.userId);
  const { productId, quantity } = req.body || {};
  const pid = Number(productId);
  const qty = Number(quantity || 1);

  const list = cartsByUserId.get(userId) || [];
  const existing = list.find((i) => i.productId === pid);
  if (existing) existing.quantity += qty;
  else list.push({ productId: pid, quantity: qty });
  cartsByUserId.set(userId, list);
  res.json({ success: true, cart: list });
});

// -----------------------------
// Start
// -----------------------------

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on http://localhost:${PORT}`);
});

