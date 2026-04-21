export interface Payment {
  paymentMethod: string;
  paymentStatus: string;
}

export interface OrderDetail {
  productID: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  orderID: number;
  userID: number;
  orderDate: string;
  totalAmount: number;
  status: string;

  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  orderDetails: OrderDetail[];
  payment?: Payment;
}