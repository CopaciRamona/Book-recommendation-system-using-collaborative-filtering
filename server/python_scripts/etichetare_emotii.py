import mysql.connector
import pandas as pd
from nrclex import NRCLex
import os
from dotenv import load_dotenv
import nltk

nltk.download('punkt')
nltk.download('punkt_tab')

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv(env_path)

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME")
    )

def eticheteaza_cartile():
    print("⏳ Ne conectăm la baza de date...")
    conn = get_db_connection()
    cursor = conn.cursor()

    print("⏳ Citim recenziile...")
    query = "SELECT book_id_original, text_recenzie FROM reviews_goodreads_incercare WHERE text_recenzie IS NOT NULL"
    df_reviews = pd.read_sql(query, conn)

    carti_grupate = df_reviews.groupby('book_id_original')['text_recenzie'].apply(lambda x: ' '.join(x.astype(str))).reset_index()

    print(f"📊 Am găsit {len(carti_grupate)} cărți. Începem analiza emoțională (NRCLex)...")

    for index, row in carti_grupate.iterrows():
        book_id = row['book_id_original']
        text_complet = row['text_recenzie']
        
        emotii = NRCLex(text_complet)
        frecvente = emotii.affect_frequencies
        
        emotii_curate = {k: v for k, v in frecvente.items() if k not in ['positive', 'negative'] and v > 0}
        
        if emotii_curate:
            emotie_principala = max(emotii_curate, key=emotii_curate.get)
        else:
            emotie_principala = "neutral"

        # Salvăm emoția în tabel
        update_query = "UPDATE books_goodreads_incercare SET emotie_dominanta = %s WHERE book_id_original = %s"
        cursor.execute(update_query, (emotie_principala, book_id))

        if index % 100 == 0 and index > 0:
            print(f"Am procesat {index} cărți...")

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ GATA! Toate cărțile au fost etichetate DOAR cu emoții specifice (joy, fear, etc)!")

if __name__ == "__main__":
    eticheteaza_cartile()