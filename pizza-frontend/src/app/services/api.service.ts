import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type StatusComanda = 'PLASATA' | 'IN LIVRARE' | 'LIVRATA' | 'ANULATA';

export interface Client {
  id: number;
  nume: string;
  prenume: string;
  data_nastere: string;
  adresa: string;
  nr_telefon: string;
  email: string;
}

export interface ClientCreate {
  nume: string;
  prenume: string;
  data_nastere: string;
  adresa: string;
  nr_telefon: string;
  email: string;
}

export interface Livrator {
  id: number;
  nume: string;
  prenume: string;
  nr_telefon: string;
  activ: boolean;
}

export interface LivratorCreate {
  nume: string;
  prenume: string;
  nr_telefon: string;
  activ: boolean;
}

export interface Pizza {
  id: number;
  denumire: string;
  dimensiune: string;
  pret: number;
  ingrediente: string;
}

export interface PizzaCreate {
  denumire: string;
  dimensiune: string;
  pret: number;
  ingrediente: string;
}

export interface Comanda {
  id: number;
  clienti_id: number;
  livrare_id: number;
  data_comanda: string;
  status: string;
  total: number;
}

export interface ComandaCreate {
  clienti_id: number;
  livrare_id: number;
  status: StatusComanda;
  total: number;
}

export interface ContinutComanda {
  id: number;
  comanda_id: number;
  pizza_id: number;
  cantitate: number;
  subtotal: number;
}

export interface ContinutComandaCreate {
  comanda_id: number;
  pizza_id: number;
  cantitate: number;
  subtotal: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  getClienti(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/clienti`);
  }

  addClient(payload: ClientCreate): Observable<any> {
    return this.http.post(`${this.baseUrl}/clienti`, payload);
  }

  getLivratori(): Observable<Livrator[]> {
    return this.http.get<Livrator[]>(`${this.baseUrl}/livratori`);
  }

  addLivrator(payload: LivratorCreate): Observable<any> {
    return this.http.post(`${this.baseUrl}/livratori`, payload);
  }

  getPizza(): Observable<Pizza[]> {
    return this.http.get<Pizza[]>(`${this.baseUrl}/pizza`);
  }

  addPizza(payload: PizzaCreate): Observable<any> {
    return this.http.post(`${this.baseUrl}/pizza`, payload);
  }

  getComenzi(): Observable<Comanda[]> {
    return this.http.get<Comanda[]>(`${this.baseUrl}/comenzi`);
  }

  addComanda(payload: ComandaCreate): Observable<{ message: string; comanda_id: number }> {
    return this.http.post<{ message: string; comanda_id: number }>(`${this.baseUrl}/comenzi`, payload);
  }

  getContinutComenzi(): Observable<ContinutComanda[]> {
    return this.http.get<ContinutComanda[]>(`${this.baseUrl}/continut-comanda`);
  }

  addContinutComanda(payload: ContinutComandaCreate): Observable<any> {
    return this.http.post(`${this.baseUrl}/continut-comanda`, payload);
  }

  updateClient(id: number, payload: ClientCreate): Observable<any> {
    return this.http.put(`${this.baseUrl}/clienti/${id}`, payload);
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clienti/${id}`);
  }

  updatePizza(id: number, payload: PizzaCreate): Observable<any> {
    return this.http.put(`${this.baseUrl}/pizza/${id}`, payload);
  }

  deletePizza(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/pizza/${id}`);
  }

  updateLivrator(id: number, payload: LivratorCreate): Observable<any> {
    return this.http.put(`${this.baseUrl}/livratori/${id}`, payload);
  }

  deleteLivrator(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/livratori/${id}`);
  }

  updateComanda(id: number, payload: ComandaCreate): Observable<any> {
    return this.http.put(`${this.baseUrl}/comenzi/${id}`, payload);
  }

  updateStatusComanda(id: number, status: StatusComanda): Observable<any> {
    return this.http.patch(`${this.baseUrl}/comenzi/${id}/status`, { status });
  }

  deleteComanda(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/comenzi/${id}`);
  }

  updateContinutComanda(id: number, payload: ContinutComandaCreate): Observable<any> {
    return this.http.put(`${this.baseUrl}/continut-comanda/${id}`, payload);
  }

  deleteContinutComanda(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/continut-comanda/${id}`);
  }
}

  