// Shapes returned by the Python (FastAPI) backend. Amounts are integer cents (USD).

export type Role = "USER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  productCount: number;
};

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price: number;
  compareAtPrice: number | null;
  image: string;
  stock: number;
  featured: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  concerns: string[];
};

export type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  approved: boolean;
  createdAt: string;
  userName: string;
};

export type ProductDetail = ProductCardData & {
  description: string;
  gallery: string[];
  ingredients: { name: string; detail: string }[];
  benefits: string[];
  howToUse: string[];
  faqs: { q: string; a: string }[];
  size: string | null;
  categories: { id: string; name: string; slug: string }[];
  reviews: Review[];
};

export type AddressInput = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

export type Address = AddressInput & { id: string; isDefault: boolean };

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type OrderItem = {
  id: string;
  productId: string | null;
  name: string;
  slug: string | null;
  image: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: "CARD" | "COD";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  /** Amounts are USD cents; the customer paid in `currency` at `fxRate`. */
  currency: string;
  fxRate: number;
  couponCode: string | null;
  address: AddressInput;
  notes: string | null;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  customer: { id: string; name: string; email: string } | null;
};

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrder: number;
  usageLimit: number | null;
  usedCount: number;
  firstOrderOnly: boolean;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type Message = {
  id: string;
  type: "CONTACT" | "CONSULTATION";
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  skinType: string | null;
  concern: string | null;
  message: string;
  details: {
    dateOfBirth: string;
    gender: string | null;
    address: string | null;
    preferredDate: string | null;
    preferredTime: string | null;
    previousConsultation: string | null;
    medications: string | null;
    recentTreatments: string | null;
  } | null;
  status: "NEW" | "READ" | "RESOLVED";
  createdAt: string;
};

export type Customer = User & { orderCount: number; totalSpent: number };

export type AdminReview = Review & { productName: string; productSlug: string };

export type Stats = {
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  avgOrderValue: number;
  pendingOrders: number;
  lowStock: ProductCardData[];
  newMessages: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  statusBreakdown: Partial<Record<OrderStatus, number>>;
  topProducts: { name: string; units: number; revenue: number }[];
  recentOrders: Order[];
};

export type BlogCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  authorName: string;
  featured: boolean;
  status: "DRAFT" | "PUBLISHED";
  views: number;
  readingTime: number;
  publishedAt: string | null;
  updatedAt: string;
};

export type BlogPost = BlogCard & {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  schemaMarkup: string | null;
  productIds: string[];
};

export type BlogDetail = BlogPost & { related: BlogCard[]; products: ProductCardData[] };
