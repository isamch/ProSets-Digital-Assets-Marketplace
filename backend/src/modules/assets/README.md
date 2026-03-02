# Assets Module

This module handles digital asset management for the ProSets marketplace.

## Features

- ✅ Create assets (sellers only)
- ✅ Update own assets (sellers only)
- ✅ Soft delete assets (sellers only)
- ✅ Public asset listing with pagination and filters
- ✅ Asset search and filtering
- ✅ Role-based access control

## API Endpoints

### Public Endpoints

#### GET /assets
List all active assets with pagination and filters

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Items per page
- `search` (string) - Search in title, description, and tags
- `category` (AssetCategory) - Filter by category
- `tags` (string[]) - Filter by tags (comma-separated)
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter
- `sortBy` (string) - Sort field (createdAt, price, title, downloadCount)
- `sortOrder` (asc|desc) - Sort order

**Example:**
```
GET /assets?page=1&limit=10&category=THREE_D_MODELS&minPrice=5&maxPrice=50&sortBy=price&sortOrder=asc
```

#### GET /assets/:id
Get single asset details

### Protected Endpoints (Sellers Only)

#### POST /assets
Create new asset

**Body:**
```json
{
  "title": "3D Character Model",
  "description": "High-quality 3D character model",
  "price": 29.99,
  "previewUrl": "https://s3.amazonaws.com/previews/model.jpg",
  "fileKey": "private/assets/model.fbx",
  "fileName": "character_model.fbx",
  "fileSize": 15728640,
  "category": "THREE_D_MODELS",
  "tags": ["character", "3d", "game-ready"]
}
```

#### GET /assets/my-assets
Get seller's own assets with pagination

#### PATCH /assets/:id
Update own asset

#### DELETE /assets/:id
Soft delete own asset (sets status to INACTIVE)

## Security

- **Authentication**: JWT tokens validated via Auth0
- **Authorization**: Role-based access control
- **Ownership**: Sellers can only modify their own assets
- **Validation**: Input validation using class-validator
- **Soft Delete**: Assets are not permanently deleted

## Asset Categories

- `THREE_D_MODELS`
- `CODE_SNIPPETS`
- `NOTION_TEMPLATES`
- `GRAPHICS`
- `AUDIO`
- `VIDEO`
- `OTHER`

## Asset Status

- `ACTIVE` - Publicly visible and purchasable
- `INACTIVE` - Hidden from public (soft deleted)
- `PENDING_APPROVAL` - Awaiting admin approval
- `REJECTED` - Rejected by admin

## Usage Examples

### Create Asset (Seller)
```typescript
const asset = await assetsService.create({
  title: "React Component Library",
  description: "Reusable React components",
  price: 19.99,
  previewUrl: "https://example.com/preview.png",
  fileKey: "private/components.zip",
  fileName: "react-components.zip",
  fileSize: 1024000,
  category: AssetCategory.CODE_SNIPPETS,
  tags: ["react", "components", "ui"]
}, sellerId);
```

### List Assets with Filters
```typescript
const assets = await assetsService.findAll({
  page: 1,
  limit: 10,
  category: AssetCategory.THREE_D_MODELS,
  minPrice: 10,
  maxPrice: 100,
  search: "character",
  sortBy: "price",
  sortOrder: "asc"
});
```