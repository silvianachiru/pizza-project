from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from datetime import date, datetime
import psycopg2
from enum import Enum
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return psycopg2.connect(
        host="localhost",
        database="proiect",
        user="postgres",
        password="Postgres",
        port=5432
    )

@app.get("/")
def root():
    return {"status": "backend running"}

class Client(BaseModel):
    nume: str
    prenume: str
    data_nastere: date
    email: EmailStr
    adresa: str
    nr_telefon: str

class Pizza(BaseModel):
    denumire: str
    dimensiune: str
    pret: float
    ingrediente: str

class Livrator(BaseModel):
    nume: str
    prenume: str
    nr_telefon: str
    activ: bool

class StatusComanda(str, Enum):
    PLASATA = "PLASATA"
    IN_LIVRARE = "IN LIVRARE"
    LIVRATA = "LIVRATA"
    ANULATA = "ANULATA"

class Comanda(BaseModel):
    clienti_id: int
    livrare_id: int
    status: StatusComanda
    total: float

class ContinutComanda(BaseModel):
    comanda_id: int
    pizza_id: int
    cantitate: int
    subtotal: float

class UpdateStatus(BaseModel):
    status: StatusComanda


# CREATE

@app.post("/clienti")
def add_client(c: Client):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO clienti (nume, prenume, data_nastere, adresa, nr_telefon, email)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (c.nume, c.prenume, c.data_nastere, c.adresa, c.nr_telefon, c.email)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Client adaugat"}

@app.post("/pizza")
def add_pizza(p: Pizza):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO pizza (denumire, dimensiune, pret, ingrediente)
        VALUES (%s, %s, %s, %s)
        """,
        (p.denumire, p.dimensiune, p.pret, p.ingrediente)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Pizza adaugata"}

@app.post("/livratori")
def add_livrator(l: Livrator):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO livrator (nume, prenume, nr_telefon, activ)
        VALUES (%s, %s, %s, %s)
        """,
        (l.nume, l.prenume, l.nr_telefon, l.activ)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Livrator adaugat"}

@app.post("/comenzi")
def add_comanda(c: Comanda):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO comanda (clienti_id, livrare_id, data_comanda, status, total)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """,
        (c.clienti_id, c.livrare_id, datetime.now(), c.status.value, c.total)
    )
    comanda_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Comanda creata", "comanda_id": comanda_id}

@app.post("/continut-comanda")
def add_continut(cc: ContinutComanda):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO continut_comanda (comanda_id, pizza_id, cantitate, subtotal)
        VALUES (%s, %s, %s, %s)
        """,
        (cc.comanda_id, cc.pizza_id, cc.cantitate, cc.subtotal)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Produs adaugat in comanda"}


# READ

@app.get("/clienti")
def get_clienti():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, nume, prenume, data_nastere, adresa, nr_telefon, email
        FROM clienti
        ORDER BY id
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            "id": r[0],
            "nume": r[1],
            "prenume": r[2],
            "data_nastere": r[3],
            "adresa": r[4],
            "nr_telefon": r[5],
            "email": r[6]
        } for r in rows
    ]

@app.get("/pizza")
def get_pizza():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, denumire, dimensiune, pret, ingrediente FROM pizza ORDER BY id")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            "id": r[0],
            "denumire": r[1],
            "dimensiune": r[2],
            "pret": float(r[3]),
            "ingrediente": r[4]
        } for r in rows
    ]

@app.get("/livratori")
def get_livratori():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, nume, prenume, nr_telefon, activ FROM livrator ORDER BY id")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            "id": r[0],
            "nume": r[1],
            "prenume": r[2],
            "nr_telefon": r[3],
            "activ": r[4]
        } for r in rows
    ]

@app.get("/comenzi")
def get_comenzi():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, clienti_id, livrare_id, data_comanda, status, total
        FROM comanda
        ORDER BY id
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            "id": r[0],
            "clienti_id": r[1],
            "livrare_id": r[2],
            "data_comanda": r[3],
            "status": r[4],
            "total": float(r[5])
        } for r in rows
    ]

@app.get("/continut-comanda")
def get_continut():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, comanda_id, pizza_id, cantitate, subtotal
        FROM continut_comanda
        ORDER BY id
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            "id": r[0],
            "comanda_id": r[1],
            "pizza_id": r[2],
            "cantitate": r[3],
            "subtotal": float(r[4])
        } for r in rows
    ]


# UPDATE 

@app.put("/clienti/{client_id}")
def update_client(client_id: int, c: Client):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE clienti
        SET nume=%s, prenume=%s, data_nastere=%s, adresa=%s, nr_telefon=%s, email=%s
        WHERE id=%s
        """,
        (c.nume, c.prenume, c.data_nastere, c.adresa, c.nr_telefon, c.email, client_id)
    )
    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Client inexistent")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Client actualizat"}

@app.put("/pizza/{pizza_id}")
def update_pizza(pizza_id: int, p: Pizza):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE pizza
        SET denumire=%s, dimensiune=%s, pret=%s, ingrediente=%s
        WHERE id=%s
        """,
        (p.denumire, p.dimensiune, p.pret, p.ingrediente, pizza_id)
    )
    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Pizza inexistenta")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Pizza actualizata"}

@app.put("/livratori/{livrator_id}")
def update_livrator(livrator_id: int, l: Livrator):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE livrator
        SET nume=%s, prenume=%s, nr_telefon=%s, activ=%s
        WHERE id=%s
        """,
        (l.nume, l.prenume, l.nr_telefon, l.activ, livrator_id)
    )
    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Livrator inexistent")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Livrator actualizat"}

@app.put("/comenzi/{comanda_id}")
def update_comanda(comanda_id: int, c: Comanda):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE comanda
        SET clienti_id=%s, livrare_id=%s, status=%s, total=%s
        WHERE id=%s
        """,
        (c.clienti_id, c.livrare_id, c.status.value, c.total, comanda_id)
    )
    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Comanda inexistenta")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Comanda actualizata"}

@app.patch("/comenzi/{comanda_id}/status")
def update_status(comanda_id: int, payload: UpdateStatus):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "UPDATE comanda SET status=%s WHERE id=%s",
        (payload.status.value, comanda_id)
    )
    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Comanda inexistenta")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Status actualizat"}

@app.put("/continut-comanda/{item_id}")
def update_continut(item_id: int, cc: ContinutComanda):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE continut_comanda
        SET comanda_id=%s, pizza_id=%s, cantitate=%s, subtotal=%s
        WHERE id=%s
        """,
        (cc.comanda_id, cc.pizza_id, cc.cantitate, cc.subtotal, item_id)
    )
    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Produs comanda inexistent")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Continut comanda actualizat"}


# DELETE 

@app.delete("/clienti/{client_id}")
def delete_client(client_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM clienti WHERE id=%s", (client_id,))
    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Client inexistent")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Client sters"}

@app.delete("/pizza/{pizza_id}")
def delete_pizza(pizza_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM pizza WHERE id=%s", (pizza_id,))
    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Pizza inexistenta")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Pizza stearsa"}

@app.delete("/livratori/{livrator_id}")
def delete_livrator(livrator_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM livrator WHERE id=%s", (livrator_id,))
    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Livrator inexistent")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Livrator sters"}

@app.delete("/comenzi/{comanda_id}")
def delete_comanda(comanda_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM continut_comanda WHERE comanda_id=%s", (comanda_id,))
    cur.execute("DELETE FROM comanda WHERE id=%s", (comanda_id,))
    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Comanda inexistenta")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Comanda stearsa"}

@app.delete("/continut-comanda/{item_id}")
def delete_continut(item_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM continut_comanda WHERE id=%s", (item_id,))
    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Produs comanda inexistent")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Produs sters din comanda"}