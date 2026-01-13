import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ApiService, Client, Livrator, Pizza, Comanda, ContinutComanda, StatusComanda } from '../../services/api.service';

@Component({
  selector: 'app-comanda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comanda.html',
  styleUrls: ['./comanda.css']
})
export class ComandaComponent implements OnInit {
  showCreate = false;

  clienti: string[] = [];
  livratori: string[] = [];

  pizzaList: { name: string }[] = [];
  pizzaRows: { denumire: string; dimensiune: string; pret: number }[] = [];

  marimi = [
    { name: 'Mică', coef: 1 },
    { name: 'Medie', coef: 1 },
    { name: 'Mare', coef: 1 }
  ];
  statusuri: StatusComanda[] = ['PLASATA', 'IN LIVRARE', 'LIVRATA', 'ANULATA'];

  comanda = {
    client: '',
    livrator: '',
    produse: [] as { pizza: string; marime: string; cantitate: number; pret: number }[],
    total: 0
  };

  produsNou = {
    pizza: '',
    marime: 'Mică',
    cantitate: 1
  };

  comenziSalvate: {
    id: number;
    client: string;
    livrator: string;
    status: StatusComanda;
    produse: { pizza: string; marime: string; cantitate: number; pret: number }[];
    total: number;
  }[] = [];

  showDeleteConfirm = false;
  deleteId: number | null = null;

  private clientiRows: Client[] = [];
  private livratoriRows: Livrator[] = [];
  private pizzaFullRows: Pizza[] = [];

  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadListsAndOrders();
  }

  loadListsAndOrders() {
    forkJoin({
      clienti: this.api.getClienti().pipe(catchError(() => of([] as Client[]))),
      livratori: this.api.getLivratori().pipe(catchError(() => of([] as Livrator[]))),
      pizza: this.api.getPizza().pipe(catchError(() => of([] as Pizza[]))),
      comenzi: this.api.getComenzi().pipe(catchError(() => of([] as Comanda[]))),
      continut: this.api.getContinutComenzi().pipe(catchError(() => of([] as ContinutComanda[])))
    }).subscribe(({ clienti, livratori, pizza, comenzi, continut }) => {
      this.clientiRows = clienti ?? [];
      this.livratoriRows = (livratori ?? []).filter(l => !!l.activ);
      this.pizzaFullRows = pizza ?? [];

      this.clienti = this.clientiRows.map(c => `${c.nume ?? ''} ${c.prenume ?? ''}`.trim());
      this.livratori = this.livratoriRows.map(l => `${l.nume ?? ''} ${l.prenume ?? ''}`.trim());

      this.pizzaRows = this.pizzaFullRows
        .map(p => ({
          denumire: String(p?.denumire ?? '').trim(),
          dimensiune: this.normalizeSize(String(p?.dimensiune ?? '').trim()),
          pret: Number(p?.pret ?? 0)
        }))
        .filter(p => p.denumire);

      const uniqueNames = Array.from(new Set(this.pizzaRows.map(p => p.denumire)));
      this.pizzaList = uniqueNames.map(name => ({ name }));

      const clientById = new Map<number, string>(
        this.clientiRows.map(c => [c.id, `${c.nume ?? ''} ${c.prenume ?? ''}`.trim()])
      );
      const livratorById = new Map<number, string>(
        this.livratoriRows.map(l => [l.id, `${l.nume ?? ''} ${l.prenume ?? ''}`.trim()])
      );
      const pizzaById = new Map<number, { denumire: string; dimensiune: string }>(
        this.pizzaFullRows.map(p => [
          p.id,
          {
            denumire: String(p.denumire ?? '').trim(),
            dimensiune: this.normalizeSize(String(p.dimensiune ?? '').trim())
          }
        ])
      );

      const continutByComanda = new Map<number, ContinutComanda[]>();
      (continut ?? []).forEach(cc => {
        const arr = continutByComanda.get(cc.comanda_id) ?? [];
        arr.push(cc);
        continutByComanda.set(cc.comanda_id, arr);
      });

      this.comenziSalvate = (comenzi ?? []).map(cmd => {
        const produse = (continutByComanda.get(cmd.id) ?? []).map(cc => {
          const p = pizzaById.get(cc.pizza_id);
          return {
            pizza: p?.denumire ?? 'Pizza',
            marime: p?.dimensiune ?? '',
            cantitate: Number(cc.cantitate),
            pret: Number(Number(cc.subtotal ?? 0).toFixed(2))
          };
        });

        return {
          id: cmd.id,
          client: clientById.get(cmd.clienti_id) ?? '',
          livrator: livratorById.get(cmd.livrare_id) ?? '',
          status: (cmd.status as StatusComanda) ?? 'PLASATA',
          produse,
          total: Number(Number(cmd.total ?? 0).toFixed(2))
        };
      });
    });
  }

  normalizeSize(size: string): string {
    const s = size.toLowerCase();
    if (s.startsWith('mic')) return 'Mică';
    if (s.startsWith('med')) return 'Medie';
    if (s.startsWith('mar')) return 'Mare';
    return size;
  }

  getPizzaPrice(denumire: string, marime: string): number {
    const row = this.pizzaRows.find(p => p.denumire === denumire && p.dimensiune === marime);
    return Number(row?.pret ?? 0);
  }

  getPizzaId(denumire: string, marime: string): number | null {
    const row = this.pizzaFullRows.find(p =>
      String(p.denumire ?? '').trim() === denumire &&
      this.normalizeSize(String(p.dimensiune ?? '').trim()) === marime
    );
    return row?.id ?? null;
  }

  getClientId(fullName: string): number | null {
    const row = this.clientiRows.find(c => `${c.nume ?? ''} ${c.prenume ?? ''}`.trim() === fullName);
    return row?.id ?? null;
  }

  getLivratorId(fullName: string): number | null {
    const row = this.livratoriRows.find(l => `${l.nume ?? ''} ${l.prenume ?? ''}`.trim() === fullName);
    return row?.id ?? null;
  }

  adaugaProdus() {
    this.successMessage = null;
    this.errorMessage = null;

    if (!this.produsNou.pizza) {
      this.errorMessage = 'Selectează o pizza înainte să o adaugi.';
      return;
    }

    const pretBaza = this.getPizzaPrice(this.produsNou.pizza, this.produsNou.marime);
    const pret = pretBaza * Number(this.produsNou.cantitate);

    this.comanda.produse.push({
      pizza: this.produsNou.pizza,
      marime: this.produsNou.marime,
      cantitate: Number(this.produsNou.cantitate),
      pret: Number(pret.toFixed(2))
    });

    this.recalculeazaTotal();
    this.produsNou = { pizza: '', marime: 'Mică', cantitate: 1 };
  }

  recalculeazaTotal() {
    this.comanda.total = Number(
      this.comanda.produse.reduce((s, p) => s + Number(p.pret || 0), 0).toFixed(2)
    );
  }

  salveaza() {
    this.successMessage = null;
    this.errorMessage = null;

    if (!this.comanda.client || !this.comanda.livrator) {
      this.errorMessage = 'Selectează clientul și livratorul.';
      return;
    }
    if (this.comanda.produse.length === 0) {
      this.errorMessage = 'Adaugă cel puțin un produs în comandă.';
      return;
    }

    const clienti_id = this.getClientId(this.comanda.client);
    const livrare_id = this.getLivratorId(this.comanda.livrator);

    if (!clienti_id || !livrare_id) {
      this.errorMessage = 'Clientul sau livratorul selectat nu există în listă.';
      return;
    }

    this.recalculeazaTotal();

    this.api.addComanda({
      clienti_id,
      livrare_id,
      status: 'PLASATA',
      total: Number(this.comanda.total.toFixed(2))
    }).pipe(
      switchMap(res => {
        const comanda_id = res?.comanda_id;
        if (!comanda_id) return of(null);

        const calls = this.comanda.produse
          .map(p => {
            const pizza_id = this.getPizzaId(p.pizza, p.marime);
            if (!pizza_id) return null;

            return this.api.addContinutComanda({
              comanda_id,
              pizza_id,
              cantitate: p.cantitate,
              subtotal: Number(p.pret.toFixed(2))
            });
          })
          .filter(x => x !== null) as any[];

        if (calls.length === 0) return of(null);

        return forkJoin(calls).pipe(catchError(() => of(null)));
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Comanda a fost plasată cu succes';

        this.comanda = { client: '', livrator: '', produse: [], total: 0 };
        this.produsNou = { pizza: '', marime: 'Mică', cantitate: 1 };
        this.showCreate = false;
        this.loadListsAndOrders();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Eroare la salvarea comenzii. Verifică backend-ul / baza de date.';
      }
    });
  }

  statusEdit(id: number, status: StatusComanda) {
    this.successMessage = null;
    this.errorMessage = null;

    this.api.updateStatusComanda(id, status).subscribe({
      next: () => {
        this.successMessage = 'Status actualizat';
        this.loadListsAndOrders();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Nu s-a putut actualiza statusul comenzii.';
      }
    });
  }

  openDeleteConfirm(id: number) {
    this.successMessage = null;
    this.errorMessage = null;

    this.deleteId = id;
    this.showDeleteConfirm = true;
  }

  cancelDeleteComanda() {
    this.showDeleteConfirm = false;
    this.deleteId = null;
  }

  confirmDeleteComanda() {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.deleteId == null) return;

    this.api.deleteComanda(this.deleteId).subscribe({
      next: () => {
        this.successMessage = 'Comanda a fost ștearsă';
        this.cancelDeleteComanda();
        this.loadListsAndOrders();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Eroare la ștergere. Comanda poate avea dependențe în baza de date.';
        this.cancelDeleteComanda();
      }
    });
  }
}