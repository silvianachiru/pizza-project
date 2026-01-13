import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home';
import { ClientiComponent } from './pages/clienti/clienti';
import { ComandaComponent } from './pages/comanda/comanda';
import { LivratoriComponent } from './pages/livratori/livratori';
import { PizzaComponent } from './pages/pizza/pizza';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'clienti', component: ClientiComponent },
  { path: 'comenzi', component: ComandaComponent },
  { path: 'livratori', component: LivratoriComponent },
  { path: 'pizza', component: PizzaComponent }
];