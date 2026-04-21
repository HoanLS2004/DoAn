// app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { HomeComponent } from './pages/home/home';

// ADMIN
import { UserManagementComponent }     from './pages/users/user-management.component';
import { ProductComponent }            from './pages/products/products.component';
import { ProductImagesComponent }      from './pages/product-images/product-images.component';
import { OrdersComponent }             from './pages/orders/orders.component';
import { PromotionManagementComponent} from './pages/promotion/promotion.component';
import { BrandComponent }              from './pages/brands/brand.component';
import { RevenueComponent }            from './pages/revenue/revenue.component';
import { CategoryComponent }           from './pages/category/category.component';
import { ReviewAdminComponent }        from './pages/reviews/reviews.component';
import { ProductDetailuserComponent }  from './pages/products/product-detailuser.component';
import { ProductConfigComponent }      from './pages/products/productconfig.component';
import { PaymentComponent }            from './pages/payment/payment.component';

// USER
import { HomeUserComponent }           from './pages/home/home-user.component';
import { ProductListComponent }        from './pages/products/product-list.component';
import { ProductDetailComponent }      from './pages/products/product-detail.component';
import { ShoppingCartComponent }       from './pages/shoppingcart/shoppingcart.component';
import { CheckoutComponent }           from './pages/checkout/checkout.component';
import { ChatbotComponent }            from './pages/chatbot/chatbot.component';
import { OrdersUsersComponent }        from './pages/orders/odersusers.component';   // ← THÊM

// GUARDS
import { AdminGuard }     from './guards/admin.guard';
import { AdminOnlyGuard } from './guards/adminonly.guard';
import { AuthGuard }      from './guards/auth.guard';

export const routes: Routes = [
  // ===== PUBLIC =====
  { path: '',              component: HomeUserComponent },
  { path: 'products',      component: ProductListComponent },
  { path: 'productss/:id', component: ProductDetailuserComponent },
  { path: 'products/:id',  component: ProductDetailComponent },
  { path: 'cart',          component: ShoppingCartComponent },
  { path: 'checkout',      component: CheckoutComponent },
  { path: 'chatbot',       component: ChatbotComponent },

  // ===== USER — cần đăng nhập =====
  {
    path: 'ordersusers',
    component: OrdersUsersComponent,
    canActivate: [AuthGuard],   // chỉ cần đăng nhập, không cần admin
  },

  // ===== AUTH =====
  { path: 'login', component: LoginComponent },

  // ===== ADMIN =====
  {
    path: 'admin',
    component: HomeComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', component: HomeComponent },

      // ── Staff + Admin ──────────────────────────────────────────
      { path: 'orders',         component: OrdersComponent },
      { path: 'payments',       component: PaymentComponent },
      { path: 'products',       component: ProductComponent },
      { path: 'product-images', component: ProductImagesComponent },
      { path: 'productconfig',  component: ProductConfigComponent },
      { path: 'category',       component: CategoryComponent },
       { path: 'reviews',    component: ReviewAdminComponent },
      // ── Chỉ Admin ──────────────────────────────────────────────
      { path: 'users',      component: UserManagementComponent,      canActivate: [AdminOnlyGuard] },
      { path: 'promotions', component: PromotionManagementComponent,  canActivate: [AdminOnlyGuard] },
      { path: 'brands',     component: BrandComponent,               canActivate: [AdminOnlyGuard] },
      { path: 'revenue',    component: RevenueComponent,             canActivate: [AdminOnlyGuard] },
     
    ]
  },

  { path: '**', redirectTo: '' }
];