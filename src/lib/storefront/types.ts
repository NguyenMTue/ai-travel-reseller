export type StorefrontMerchant = {
  id: string;
  name: string;
  slug: string;
  brandTitle: string;
  tagline: string;
  logoUrl?: string;
  hotline: string;
  supportEmail: string;
  address: string;
  operatingHours: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  verified: boolean;
};

export type StorefrontPackage = {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  isPopular?: boolean;
  badge?: string;
  inclusions: string[];
};

export type StorefrontTip = {
  icon: string;
  title: string;
  tip: string;
};

export type StorefrontItineraryItem = {
  time: string;
  title: string;
  description: string;
  location?: string;
};

export type StorefrontReview = {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: string;
  tourPackage: string;
};

export type StorefrontData = {
  merchant: StorefrontMerchant;
  product: {
    id: string;
    slug: string;
    name: string;
    subtitle: string;
    category: string;
    location: string;
    originalPrice: number;
    salePrice: number;
    rating: number;
    reviewCount: number;
    soldCount: number;
    remainingToday: number;
    highlights: string[];
    authenticTips: StorefrontTip[];
    itinerary: StorefrontItineraryItem[];
    inclusions: string[];
    exclusions: string[];
    policy: {
      cancellation: string;
      ticketType: string;
      entryInstructions: string;
    };
    packages: StorefrontPackage[];
    galleryImages: Array<{
      url: string;
      title: string;
      description?: string;
    }>;
    videoUrl?: string;
    videoThumbnail?: string;
  };
  campaign?: {
    id: string;
    name: string;
    commissionRate?: number;
  };
  tracking?: {
    refCode?: string;
    resellerName?: string;
    discountPercent?: number;
  };
};

export type BookingRequest = {
  packageId: string;
  packageName: string;
  packagePrice?: number;
  travelDate: string;
  adultCount: number;
  childCount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  note?: string;
  refCode?: string;
  campaignId?: string;
  productId?: string;
  merchantSlug?: string;
};

export type StorefrontCommissionInfo = {
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  rate: number;
  status: string;
  resellerId?: string;
};

export type BookingOrderResult = {
  orderId: string;
  ticketCode: string;
  qrPayload: string;
  vietQrUrl: string;
  totalAmount: number;
  originalTotal: number;
  discountAmount: number;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  transferContent: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  travelDate: string;
  packageName: string;
  adultCount: number;
  childCount: number;
  createdAt: string;
  commission?: StorefrontCommissionInfo;
};
