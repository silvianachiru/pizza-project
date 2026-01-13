import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

type ClientUI = {
  id: number;
  name: string;
  phone: string;
  address: string;
  data_nastere: string;
  email: string;
};

@Component({
  selector: 'app-clienti',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clienti.html',
  styleUrls: ['./clienti.css']
})
export class ClientiComponent implements OnInit {
  clienti: ClientUI[] = [];

  showAddClient = false;
  newClient = { name: '', phone: '', address: '', data_nastere: '', email: '' };

  showEditClient = false;
  editId: number | null = null;
  editClient = { name: '', phone: '', address: '', data_nastere: '', email: '' };

  showDeleteConfirm = false;
  deleteId: number | null = null;

  alertMsg: string | null = null;
  alertType: 'success' | 'danger' = 'success';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadClienti();
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

    return 'A apărut o eroare. Verifică consola / backend logs.';
  }

  loadClienti() {
    this.api.getClienti().subscribe({
      next: (data: any[]) => {
        this.clienti = (data ?? []).map((c) => ({
          id: Number(c.id),
          name: `${c.nume ?? ''} ${c.prenume ?? ''}`.trim(),
          phone: String(c.nr_telefon ?? ''),
          address: String(c.adresa ?? ''),
          data_nastere: String(c.data_nastere ?? ''),
          email: String(c.email ?? '')
        }));
      },
      error: (err) => {
        this.clienti = [];
        this.showAlert('danger', this.extractErrorMessage(err));
      }
    });
  }

  validateNumbers(event: any, target: 'add' | 'edit') {
    const input = event.target as HTMLInputElement;
    const cleaned = (input.value || '').replace(/\D/g, '').slice(0, 10);
    input.value = cleaned;

    if (target === 'add') this.newClient.phone = cleaned;
    else this.editClient.phone = cleaned;
  }

  private splitName(fullName: string): { nume: string; prenume: string } {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    const nume = parts[0] ?? '';
    const prenume = parts.slice(1).join(' ') || '-';
    return { nume, prenume };
  }

  saveClient(event: Event) {
    event.preventDefault();

    if (!this.newClient.name.trim() || !this.newClient.phone.trim() || !this.newClient.address.trim()) {
      this.showAlert('danger', 'Completează nume, telefon și adresă.');
      return;
    }

    const { nume, prenume } = this.splitName(this.newClient.name);

    this.api.addClient({
      nume,
      prenume,
      data_nastere: this.newClient.data_nastere || '2000-01-01',
      adresa: this.newClient.address,
      nr_telefon: this.newClient.phone,
      email: this.newClient.email || 'test@test.com'
    } as any).subscribe({
      next: () => {
        this.newClient = { name: '', phone: '', address: '', data_nastere: '', email: '' };
        this.showAddClient = false;
        this.loadClienti();
        this.showAlert('success', 'Client adăugat cu succes.');
      },
      error: (err) => this.showAlert('danger', this.extractErrorMessage(err))
    });
  }

  openEdit(c: ClientUI) {
    this.editId = c.id;
    this.editClient = {
      name: c.name,
      phone: c.phone,
      address: c.address,
      data_nastere: c.data_nastere,
      email: c.email
    };
    this.showEditClient = true;
  }

  cancelEdit() {
    this.showEditClient = false;
    this.editId = null;
    this.editClient = { name: '', phone: '', address: '', data_nastere: '', email: '' };
  }

  saveEdit(event: Event) {
    event.preventDefault();
    if (this.editId == null) return;

    if (!this.editClient.name.trim() || !this.editClient.phone.trim() || !this.editClient.address.trim()) {
      this.showAlert('danger', 'Completează nume, telefon și adresă.');
      return;
    }

    const { nume, prenume } = this.splitName(this.editClient.name);

    this.api.updateClient(this.editId, {
      nume,
      prenume,
      data_nastere: this.editClient.data_nastere || '2000-01-01',
      adresa: this.editClient.address,
      nr_telefon: this.editClient.phone,
      email: this.editClient.email || 'test@test.com'
    } as any).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadClienti();
        this.showAlert('success', 'Client actualizat cu succes.');
      },
      error: (err) => this.showAlert('danger', this.extractErrorMessage(err))
    });
  }

  openDeleteConfirm(id: number) {
    this.deleteId = id;
    this.showDeleteConfirm = true;
  }

  cancelDeleteClient() {
    this.showDeleteConfirm = false;
    this.deleteId = null;
  }

  confirmDeleteClient() {
    if (this.deleteId == null) return;

    const id = this.deleteId;

    this.api.deleteClient(id).subscribe({
      next: () => {
        this.cancelDeleteClient();
        this.loadClienti();
        this.showAlert('success', 'Client șters cu succes.');
      },
      error: (err) => {
        this.cancelDeleteClient();
        this.showAlert('danger', this.extractErrorMessage(err));
      }
    });
  }
}