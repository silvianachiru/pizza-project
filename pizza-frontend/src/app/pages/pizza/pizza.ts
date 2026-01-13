import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

type PizzaUI = {
  id: number; 
  nume: string; 
  pretMic: number;
  pretMediu: number;
  pretMare: number;
  ingrediente?: string;
};

type PizzaRow = {
  id: number;
  denumire: string;
  dimensiune: string;
  pret: number;
  ingrediente?: string;
};

@Component({
  selector: 'app-pizza',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pizza.html',
  styleUrls: ['./pizza.css']
})
export class PizzaComponent implements OnInit {
  pizzaList: PizzaUI[] = [];
  private pizzaRows: PizzaRow[] = [];

  showAddPizza = false;
  newPizza = { nume: '', pretMic: 0, pretMediu: 0, pretMare: 0, ingrediente: '' };

  showEditPizza = false;
  pizzaEditata: PizzaUI = { id: 0, nume: '', pretMic: 0, pretMediu: 0, pretMare: 0, ingrediente: '' };

  showConfirmDelete = false;
  deleteId: number | null = null;

  alertMsg: string | null = null;
  alertType: 'success' | 'danger' = 'success';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadPizza();
  }

  private showAlert(type: 'success' | 'danger', msg: string) {
    this.alertType = type;
    this.alertMsg = msg;
    setTimeout(() => (this.alertMsg = null), 4000);
  }

  private extractErrorMessage(err: any): string {
    const detail = err?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (typeof err?.message === 'string' && err.message.trim()) return err.message;
    return 'A apărut o eroare. Verifică backend logs.';
  }

  loadPizza() {
    this.api.getPizza().subscribe({
      next: (rows: any[]) => {
        this.pizzaRows = (rows ?? [])
          .map(r => ({
            id: Number(r.id),
            denumire: String(r.denumire ?? '').trim(),
            dimensiune: String(r.dimensiune ?? '').trim(),
            pret: Number(r.pret ?? 0),
            ingrediente: r.ingrediente
          }))
          .filter(r => r.denumire);

        const map = new Map<string, PizzaUI>();

        this.pizzaRows.forEach(r => {
          const key = r.denumire;
          if (!map.has(key)) {
            map.set(key, { id: r.id, nume: key, pretMic: 0, pretMediu: 0, pretMare: 0, ingrediente: r.ingrediente });
          }

          const item = map.get(key)!;
          item.id = Math.min(item.id, r.id);

          const dim = (r.dimensiune || '').toLowerCase();
          const pret = Number(r.pret ?? 0);

          if (dim.includes('mic')) item.pretMic = pret;
          else if (dim.includes('med')) item.pretMediu = pret;
          else if (dim.includes('mar')) item.pretMare = pret;
        });

        this.pizzaList = Array.from(map.values());
      },
      error: (err) => {
        this.pizzaRows = [];
        this.pizzaList = [];
        this.showAlert('danger', this.extractErrorMessage(err));
      }
    });
  }

  private getPizzaRowId(denumire: string, dimKey: 'mic' | 'med' | 'mar'): number | null {
    const row = this.pizzaRows.find(r => {
      if (r.denumire !== denumire) return false;
      const d = (r.dimensiune || '').toLowerCase();
      if (dimKey === 'mic') return d.includes('mic');
      if (dimKey === 'med') return d.includes('med');
      return d.includes('mar');
    });
    return row?.id ?? null;
  }

  adaugaPizza() {
    const denumire = this.newPizza.nume.trim();
    if (!denumire) {
      this.showAlert('danger', 'Completează numele pizzei.');
      return;
    }

    const requests = [
      this.api.addPizza({ denumire, dimensiune: 'Mica',  pret: Number(this.newPizza.pretMic),   ingrediente: this.newPizza.ingrediente } as any),
      this.api.addPizza({ denumire, dimensiune: 'Medie', pret: Number(this.newPizza.pretMediu), ingrediente: this.newPizza.ingrediente } as any),
      this.api.addPizza({ denumire, dimensiune: 'Mare',  pret: Number(this.newPizza.pretMare),  ingrediente: this.newPizza.ingrediente } as any)
    ];

    forkJoin(requests.map(r => r.pipe(catchError((err) => {
      this.showAlert('danger', this.extractErrorMessage(err));
      return of(null);
    })))).subscribe({
      next: () => {
        this.newPizza = { nume: '', pretMic: 0, pretMediu: 0, pretMare: 0, ingrediente: '' };
        this.showAddPizza = false;
        this.loadPizza();
        this.showAlert('success', 'Pizza adăugată cu succes.');
      }
    });
  }

  deschideEdit(p: PizzaUI) {
    this.pizzaEditata = { ...p };
    this.showEditPizza = true;
  }

  cancelEdit() {
    this.showEditPizza = false;
    this.pizzaEditata = { id: 0, nume: '', pretMic: 0, pretMediu: 0, pretMare: 0, ingrediente: '' };
  }

  salveazaEdit() {
    const denumire = (this.pizzaEditata.nume || '').trim();
    if (!denumire) {
      this.showAlert('danger', 'Numele pizzei nu poate fi gol.');
      return;
    }

    const idMic = this.getPizzaRowId(denumire, 'mic');
    const idMed = this.getPizzaRowId(denumire, 'med');
    const idMar = this.getPizzaRowId(denumire, 'mar');

    const calls = [
      idMic
        ? this.api.updatePizza(idMic, { denumire, dimensiune: 'Mica',  pret: Number(this.pizzaEditata.pretMic),   ingrediente: this.pizzaEditata.ingrediente } as any)
        : this.api.addPizza   ({ denumire, dimensiune: 'Mica',  pret: Number(this.pizzaEditata.pretMic),   ingrediente: this.pizzaEditata.ingrediente } as any),

      idMed
        ? this.api.updatePizza(idMed, { denumire, dimensiune: 'Medie', pret: Number(this.pizzaEditata.pretMediu), ingrediente: this.pizzaEditata.ingrediente } as any)
        : this.api.addPizza   ({ denumire, dimensiune: 'Medie', pret: Number(this.pizzaEditata.pretMediu), ingrediente: this.pizzaEditata.ingrediente } as any),

      idMar
        ? this.api.updatePizza(idMar, { denumire, dimensiune: 'Mare',  pret: Number(this.pizzaEditata.pretMare),  ingrediente: this.pizzaEditata.ingrediente } as any)
        : this.api.addPizza   ({ denumire, dimensiune: 'Mare',  pret: Number(this.pizzaEditata.pretMare),  ingrediente: this.pizzaEditata.ingrediente } as any)
    ];

    forkJoin(calls.map(c => c.pipe(catchError((err) => {
      this.showAlert('danger', this.extractErrorMessage(err));
      return of(null);
    })))).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadPizza();
        this.showAlert('success', 'Pizza actualizată cu succes.');
      }
    });
  }

  cereStergere(id: number) {
    this.deleteId = id;
    this.showConfirmDelete = true;
  }

  anuleazaStergere() {
    this.showConfirmDelete = false;
    this.deleteId = null;
  }

  confirmaStergere() {
    if (this.deleteId == null) return;

    const item = this.pizzaList.find(p => p.id === this.deleteId);
    if (!item) {
      this.anuleazaStergere();
      return;
    }

    const denumire = item.nume;

    const ids = this.pizzaRows
      .filter(r => r.denumire === denumire)
      .map(r => r.id);

    if (ids.length === 0) {
      this.anuleazaStergere();
      this.loadPizza();
      return;
    }

    forkJoin(ids.map(id =>
      this.api.deletePizza(id).pipe(
        catchError((err) => {
          this.showAlert('danger', this.extractErrorMessage(err));
          return of(null);
        })
      )
    )).subscribe({
      next: () => {
        this.anuleazaStergere();
        this.loadPizza();
        this.showAlert('success', 'Pizza ștearsă cu succes.');
      }
    });
  }

  stergePizza(id: number) {
    this.cereStergere(id);
  }
}