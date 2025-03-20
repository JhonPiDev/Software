import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { UserComponent } from './user/user.component';
import { RegistroPruebasComponent } from './user/registro-pruebas/registro-pruebas.component';
import { HistorialPruebasComponent } from './user/historial-pruebas/historial-pruebas.component'; 
import { ExportacionInformesComponent } from './user/exportacion-informes/exportacion-informes.component';
import { NotificacionesComponent } from './user/notificaciones/notificaciones.component';
import { ATSComponent } from './user/ats/ats.component';
import { AdminComponent } from './admin/admin.component';
import { HomeComponent } from './admin/home/home.component';
import { AuthComponent } from './admin/auth/auth.component';
import { UsersComponent } from './admin/users/users.component';
import { CommercesComponent } from './admin/commerces/commerces.component';
import { TeamComponent } from './admin/team/team.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Ruta por defecto
  { path: 'login', component: LoginComponent }, 
  {
    path: 'user',// Ruta para la página de usuario // Ruta para el login
    component: UserComponent,
    children: [
      { path: 'registro-pruebas', component: RegistroPruebasComponent },
      { path: 'historial-pruebas', component: HistorialPruebasComponent },
      { path: 'exportacion-informes', component: ExportacionInformesComponent },
      { path: 'notificaciones', component: NotificacionesComponent },
      { path: 'ats', component: ATSComponent },
      { path: '', redirectTo: 'registro-pruebas', pathMatch: 'full' }, // Ruta por defecto
    ],
  },
  {
    path: 'admin', // Ruta principal del panel de administración
    component: AdminComponent, // Componente principal
    children: [ // Rutas hijas
      { path: 'home', component: HomeComponent }, // Ruta para Inicio
      { path: 'auth', component: AuthComponent }, // Ruta para Autorizaciones
      { path: 'users', component: UsersComponent }, // Ruta para Usuarios
      { path: 'commerces', component: CommercesComponent }, // Ruta para Comercios
      { path: 'team', component: TeamComponent }, // Ruta para Transacciones
      { path: '', redirectTo: 'home', pathMatch: 'full' }, // Ruta por defecto dentro de admin
    ],
  },
  { path: '**', redirectTo: '/login' }, // Ruta comodín para redirigir a login si no existe la ruta
];