import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

type LivratorUI = { id: number; nume: string; telefon: string; status: 'Activ' | 'Ocupat' };

@Component({
  selector: 'app-livratori',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './livratori.html',
  styleUrls: ['./livratori.css']
})
export class LivratoriComponent implements OnInit {
  showAddLivrator = false;

  livratori: LivratorUI[] = [];

  newLivrator = { nume: '', telefon: '', status: 'Activ' as 'Activ' | 'Ocupat' };

  showConfirmDelete = false;
  deleteId: number | null = null;

  alertMsg = '';
  alertType: 'success' | 'danger' = 'success';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadLivratori();
  }

  private showSuccess(msg: string) {
    this.alertType = 'success';
    this.alertMsg = msg;
  }

  private showError(err: any, fallback = 'A apărut o eroare.') {
    this.alertType = 'danger';
    this.alertMsg = err?.error?.detail || err?.error?.message || fallback;
  }

  clearAlert() {
    this.alertMsg = '';
  }

  loadLivratori() {
    this.api.getLivratori().subscribe({
      next: (data: any[]) => {
        this.livratori = (data ?? []).map(l => ({
          id: Number(l.id),
          nume: `${l.nume ?? ''} ${l.prenume ?? ''}`.trim(),
          telefon: l.nr_telefon ?? '',
          status: l.activ ? 'Activ' : 'Ocupat'
        }));
      },
      error: (err) => {
        this.livratori = [];
        this.showError(err, 'Nu pot încărca livratorii.');
      }
    });
  }

  validateNumbers(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
    this.newLivrator.telefon = input.value;
  }

  adaugaLivrator() {
    this.clearAlert();

    const full = (this.newLivrator.nume || '').trim();
    const tel = (this.newLivrator.telefon || '').trim();

    if (!full) {
      this.showError({ error: { detail: 'Completează numele livratorului.' } });
      return;
    }
    if (!tel || tel.length < 10) {
      this.showError({ error: { detail: 'Completează un număr de telefon valid (10 cifre).' } });
      return;
    }

    const parts = full.split(/\s+/);
    const nume = parts[0] ?? '';
    const prenume = parts.slice(1).join(' ') || '-';

    this.api.addLivrator({
      nume,
      prenume,
      nr_telefon: tel,
      activ: this.newLivrator.status === 'Activ'
    } as any).subscribe({
      next: (res: any) => {
        this.showSuccess(res?.message || 'Livrator adăugat.');
        this.newLivrator = { nume: '', telefon: '', status: 'Activ' };
        this.showAddLivrator = false;
        this.loadLivratori();
      },
      error: (err) => this.showError(err, 'Nu s-a putut adăuga livratorul.')
    });
  }

  schimbaStatus(l: LivratorUI) {
    this.clearAlert();

    const newStatus: 'Activ' | 'Ocupat' = l.status === 'Activ' ? 'Ocupat' : 'Activ';

    const parts = (l.nume || '').trim().split(/\s+/);
    const nume = parts[0] ?? '';
    const prenume = parts.slice(1).join(' ') || '-';

    this.api.updateLivrator(l.id, {
      nume,
      prenume,
      nr_telefon: l.telefon,
      activ: newStatus === 'Activ'
    } as any).subscribe({
      next: (res: any) => {
        this.showSuccess(res?.message || 'Status livrator actualizat.');
        this.loadLivratori();
      },
      error: (err) => this.showError(err, 'Nu s-a putut schimba statusul.')
    });
  }

  cereStergere(id: number) {
    this.clearAlert();
    this.deleteId = id;
    this.showConfirmDelete = true;
  }

  anuleazaStergere() {
    this.showConfirmDelete = false;
    this.deleteId = null;
  }

  confirmaStergere() {
    if (this.deleteId == null) return;

    this.api.deleteLivrator(this.deleteId).subscribe({
      next: (res: any) => {
        this.showSuccess(res?.message || 'Livrator șters.');
        this.anuleazaStergere();
        this.loadLivratori();
      },
      error: (err) => {
        this.showError(
          err,
          'Nu se poate șterge livratorul (probabil are comenzi asociate).'
        );
        this.anuleazaStergere();
      }
    });
  }

  stergeLivrator(id: number) {
    this.cereStergere(id);
  }
}