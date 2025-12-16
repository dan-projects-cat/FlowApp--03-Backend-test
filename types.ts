



export enum UserRole {
  Consumer = 'Consumer',
  Vendor = 'Vendor',
  SuperAdmin = 'SuperAdmin',
  RestaurantAdmin = 'RestaurantAdmin',
}

export interface RestaurantPermissions {
  canViewAnalytics: boolean;
  canManageMenu: boolean;
  canManageSettings: boolean;
  canManageOrders: boolean;
}

export interface ActiveHours {
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface PermissionSchedule {
  monday: ActiveHours;
  tuesday: ActiveHours;
  wednesday: ActiveHours;
  thursday: ActiveHours;
  friday: ActiveHours;
  saturday: ActiveHours;
  sunday: ActiveHours;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string; // Optional for security, but we'll use it for our simulation
  role: UserRole;
  vendorId?: string; 
  restaurantId?: string; // For RestaurantAdmin
  linkedRestaurantIds?: string[]; // For consumers linked to restaurants
  permissions?: RestaurantPermissions;
  permissionSchedule?: PermissionSchedule;
}

export enum MediaType {
  Video = 'video',
  Audio = 'audio',
  Text = 'text',
  Link = 'link',
  Image = 'image',
}

export interface MediaContent {
  id: string;
  type: MediaType;
  title: string;
  source: string; // URL for video/audio/link/image, content for text
  description?: string;
}

export interface Allergen {
  id: string;
  name: string;
}

export interface Intolerance {
    id: string;
    name: string;
    icon: string;
}

export interface MenuItemTemplate {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  allergens?: Allergen[];
  intolerances?: Intolerance[];
  discount?: {
      percentage: number;
      showToConsumer: boolean;
  };
  composition: string[];
}

export interface MenuSection {
    id: string;
    title: string;
    itemIds: string[];
}

export interface MenuTemplate {
    id: string;
    vendorId: string;
    name:string;
    sections: MenuSection[];
}

export interface RestaurantBranding {
  primaryColor: string;
  logoUrl: string;
}

export enum PaymentMethod {
    CreditCard = 'Credit Card',
    PayPal = 'PayPal',
    Bizum = 'Bizum',
    Stripe = 'Stripe',
    Cash = 'Cash',
}

export interface OrderStatusConfig {
  id: string; // e.g., 'pending', 'baking', 'ready'
  label: string; // e.g., 'Pending', 'Baking', 'Ready for Pickup'
  color: string; // Hex color code
}

export interface RejectionReason {
  id: string;
  message: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  statusIds: string[]; // Array of OrderStatusConfig ids
  icon?: string;
  titleColor?: string;
  columnColor?: string;
}

export interface OrderManagementConfig {
  statuses: OrderStatusConfig[];
  columns: KanbanColumn[];
  rejectionReasons: RejectionReason[];
  // Key is the status ID, value is an array of allowed next status IDs
  statusTransitions: Record<string, string[]>;
}

export interface BoardTemplate {
    id: string;
    name: string;
    vendorId: string;
    config: OrderManagementConfig;
}

export interface DayOpeningHours {
  isOpen: boolean;
  open: string;
  close: string;
}

export interface Restaurant {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  bannerUrl: string;
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  openingHours: {
    monday: DayOpeningHours;
    tuesday: DayOpeningHours;
    wednesday: DayOpeningHours;
    thursday: DayOpeningHours;
    friday: DayOpeningHours;
    saturday: DayOpeningHours;
    sunday: DayOpeningHours;
  };
  paymentMethods: PaymentMethod[];
  branding: RestaurantBranding;
  media: MediaContent[];
  boardTemplateId?: string;
  assignedMenuTemplateIds?: string[];
}

export interface Vendor {
    id: string;
    name: string;
}

export interface CartItem extends MenuItemTemplate {
  cartItemId: number; // Unique identifier for this specific item in the cart
  quantity: number;
  restaurantId: string;
  course?: 'first' | 'second';
  removedIngredients?: string[];
}

export type OrderItem = Omit<CartItem, 'cartItemId'>;

export interface NotificationMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Order {
    id: string;
    restaurantId: string;
    items: OrderItem[];
    subtotal: number;
    taxes: number;
    deliveryFee: number;
    total: number;
    status: string;
    orderTime: Date;
    lastUpdateTime: Date;
    completionTime?: number; // in minutes
    rejectionReason?: string;
    processedByUserId?: string; // ID of the manager who handled the order
}

export type View = 'home' | 'restaurant' | 'checkout' | 'vendorDashboard' | 'superAdminDashboard' | 'orderStatus' | 'login';