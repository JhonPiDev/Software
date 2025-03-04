import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminComponent } from './admin/admin.component';
import { HomeComponent } from './admin/home/home.component';
import { AuthComponent } from './admin/auth/auth.component';
import { UsersComponent } from './admin/users/users.component';
import { CommercesComponent } from './admin/commerces/commerces.component';
import { TransactionsComponent } from './admin/transactions/transactions.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Ruta por defecto
  { path: 'login', component: LoginComponent }, // Ruta para el login
  {
    path: 'admin', // Ruta principal del panel de administración
    component: AdminComponent, // Componente principal
    children: [ // Rutas hijas
      { path: 'home', component: HomeComponent }, // Ruta para Inicio
      { path: 'auth', component: AuthComponent }, // Ruta para Autorizaciones
      { path: 'users', component: UsersComponent }, // Ruta para Usuarios
      { path: 'commerces', component: CommercesComponent }, // Ruta para Comercios
      { path: 'transactions', component: TransactionsComponent }, // Ruta para Transacciones
      { path: '', redirectTo: 'home', pathMatch: 'full' }, // Ruta por defecto dentro de admin
    ],
  },
  { path: '**', redirectTo: '/login' }, // Ruta comodín para redirigir a login si no existe la ruta
];