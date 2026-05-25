export const SocketEvents = {
  // Client → Server
  ORDER_SUBSCRIBE: 'order:subscribe',
  ORDER_UNSUBSCRIBE: 'order:unsubscribe',
  DRIVER_LOCATION: 'driver:location',

  // Server → Client
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ORDER_NEW_BID: 'order:new_bid',
  ORDER_BID_ACCEPTED: 'order:bid_accepted',
  TRACKING_LOCATION_UPDATE: 'tracking:location_update',
  NOTIFICATION_NEW: 'notification:new',
  DASHBOARD_STATS_UPDATE: 'dashboard:stats_update',
} as const;

export interface OrderStatusChangedPayload {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  changedAt: string;
}

export interface NewBidPayload {
  orderId: string;
  bidId: string;
  carrierId: string;
  carrierName: string;
  amount: number;
  createdAt: string;
}

export interface LocationUpdatePayload {
  orderId: string;
  driverId: string;
  lat: number;
  lng: number;
  speed: number | null;
  recordedAt: string;
}
