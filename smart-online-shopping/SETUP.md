# Smart Online Shopping - Complete Setup Guide

## Overview
A full-featured e-commerce platform with AI-powered features including virtual try-on, product management, and automated stock tracking.

## Features

### For Users:
- 🛍️ **Browse Products** - View fashion items with real-time stock levels
- 🛒 **Shopping Cart** - Add products with size and color selection
- 💳 **Complete Checkout** - Place orders with automatic stock deduction
- 📦 **Order History** - Track all your past orders
- 👗 **Virtual Try-On** - Upload your photo and try outfits virtually
- 🤖 **AI Recommendations** - Get personalized product suggestions

### For Admins:
- ➕ **Add Products** - Create new products with images, sizes, and colors
- ✏️ **Edit Products** - Update product details and stock levels
- 🗑️ **Delete Products** - Remove products from catalog
- 📊 **Analytics Dashboard** - View sales, revenue, and inventory metrics
- 📋 **Order Management** - View and manage customer orders
- 👥 **Customer Management** - Track registered users

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. **Navigate to the project directory:**
   ```bash
   cd smart-online-shopping
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Application

### Option 1: Run Both Servers Together (Recommended)
```bash
npm run dev:all
```

This will start:
- Next.js frontend on http://localhost:3000
- Express backend on http://localhost:3001

### Option 2: Run Servers Separately

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend (for Virtual Try-On):**
```bash
npm run server
```

## Demo Credentials

### User Account
- **Email:** user@demo.com
- **Password:** password

### Admin Account
- **Email:** admin@demo.com
- **Password:** password

## Project Structure

```
smart-online-shopping/
├── src/
│   ├── app/
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User and Admin dashboards
│   │   ├── components/        # React components
│   │   ├── utils/             # Utility functions
│   │   ├── styles/            # CSS modules
│   │   └── types.ts           # TypeScript types
├── server/
│   ├── index.js               # Express server
│   └── uploads/               # Image uploads directory
└── package.json
```

## API Endpoints

### Virtual Try-On API

#### POST `/api/tryon`
Upload user photo and outfit image for virtual try-on.

**Request:**
- `userImage` (file): User's photo
- `outfitImage` (file): Outfit image

**Response:**
```json
{
  "success": true,
  "message": "Try-on processed successfully",
  "data": {
    "userImageUrl": "/uploads/...",
    "outfitImageUrl": "/uploads/...",
    "resultImageUrl": "/uploads/...",
    "processedAt": "2025-10-25T..."
  }
}
```

#### GET `/api/tryon/history`
Get list of all uploaded images.

#### GET `/api/health`
Health check endpoint.

## Key Features Explained

### 1. Shopping Flow
1. Browse products by category
2. Click "Add to Cart" to select size and color
3. View cart and adjust quantities
4. Proceed to checkout
5. Enter shipping address and payment method
6. Order is created and stock is automatically reduced

### 2. Virtual Try-On
1. Navigate to "Virtual Try-On" tab
2. Upload a photo of yourself
3. Select an outfit from the product catalog
4. Click "Try It On" to see the result
5. View comparison of your photo, outfit, and result

### 3. Admin Product Management
1. Login as admin
2. Go to "Products" tab
3. Click "+ Add Product"
4. Fill in details including:
   - Name, category, brand
   - Price and stock level
   - Image URL
   - Sizes (e.g., S, M, L, XL)
   - Colors (e.g., Red, Blue, Black)
   - Description
5. Click "Add Product"

### 4. Stock Management
- Stock levels are displayed on all products
- Low stock warnings (< 10 items) shown in orange
- Out of stock products are disabled
- Automatic stock deduction when orders are placed
- Prevents over-ordering (checks stock before checkout)

## Data Storage

This demo uses **localStorage** for data persistence:
- User accounts
- Products catalog
- Shopping cart
- Orders history

**Note:** Data is stored in the browser and will persist across sessions but is tied to your browser.

## Customization

### Adding Demo Products

Products are auto-initialized on first load. To customize, edit:
```typescript
// src/app/utils/storage/localStorage.ts
export const initializeDemoData = (): void => {
  // Modify the demoProducts array
}
```

### Changing Styles

Styles are in CSS modules:
- `src/app/styles/module/Landing.module.css` - Landing page
- `src/app/styles/module/Auth.module.css` - Login/Register
- `src/app/styles/module/Dashboard.module.css` - Dashboards

### Image Upload Configuration

Edit server settings:
```javascript
// server/index.js
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Change file size limit
  }
});
```

## Troubleshooting

### Virtual Try-On Not Working
- Ensure the backend server is running on port 3001
- Check browser console for CORS errors
- Verify image file size is under 10MB

### Port Already in Use
```bash
# Change frontend port
PORT=3002 npm run dev

# Change backend port (also update in VirtualTryOn.tsx)
PORT=3002 npm run server
```

### Products Not Showing
- Clear localStorage: Open DevTools → Application → Local Storage → Clear All
- Refresh the page to reinitialize demo data

## Technologies Used

- **Frontend:** Next.js 16, React 19, TypeScript
- **Backend:** Express.js, Multer
- **Storage:** localStorage (demo), can be replaced with database
- **Styling:** CSS Modules

## Future Enhancements

- [ ] Real AI/ML model for virtual try-on
- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Advanced search and filters
- [ ] Mobile app version

## Support

For issues or questions, please check:
1. Console errors in browser DevTools
2. Server logs in terminal
3. This README for common solutions

## License

This is a demo project for educational purposes.
