from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import os
import sys
import warnings
import mysql.connector
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import numpy as np
from nrclex import NRCLex

warnings.filterwarnings('ignore')

env_path = os.fspath(os.path.join(os.path.dirname(__file__), '..','.env'))
load_dotenv(env_path)

app = FastAPI()

df_global = None # variabila globala cu tabelul principal de carti
tfidf_matrix_global = None # variabila globala cu matricea matematica a tuturor cartilor
reviews_global = None # variabila globala cu tabelul cu recenzii pentru recomandarile colaborative


#Modelul pentru preluarea listei de carti de la proiectu node.js
class RecommendRequest(BaseModel):
    book_titles: List[str]
    top_n: int = 30

# Functia simplă pentru a face legătura la baza de date MYSQL
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME")
    )


# Partea asta se executa o singura data, odata ce pornim serverul,
# inainte sa se conecteze vreun user ceva


@app.on_event("startup")
def load_ai_brain():
    #Acum se modifica variabilele globale definite anterior
    global df_global, tfidf_matrix_global, reviews_global
    print("⏳ Încărcăm AI-ul HIBRID și citim baza de date. Te rog așteaptă...")

    try:
        # Conectare la baza de date si extragere date
        conn = get_db_connection()
        query_books = "SELECT id, titlu, autor, genuri, descriere, coperta_url, rating_mediu, numar_voturi, book_id_original FROM books_goodreads_incercare"
        df = pd.read_sql(query_books, conn) # Punem toate datele intr un data frame ca sa ne putem folosii de ele 
        

        df.fillna('', inplace=True)

        # Calculele matematice pentru agasii cartile cu adevarat bune
        df['rating_mediu'] = pd.to_numeric(df['rating_mediu'], errors='coerce').fillna(0)
        df['numar_voturi'] = pd.to_numeric(df['numar_voturi'], errors='coerce').fillna(0)

        C = df['rating_mediu'].mean() # Media notelor tuturor cartilor
        m = df['numar_voturi'].quantile(0.60) #Numarul minim de voturi pentru ca o carte sa fie considerata populara

        #Functia Bayesiana: Balanseaza nota in functie de numarul de voturi
        def bayesian_rating(x):
            v = x['numar_voturi']
            R = x['rating_mediu']
            if v + m == 0: return 0
            return (v / (v + m) * R) + (m / (m+v) * C)
        
        df['scor_calitate'] = df.apply(bayesian_rating, axis=1)
        max_calitate = df['scor_calitate'].max()
        df['scor_calitate_norm'] = df['scor_calitate'] / max_calitate if max_calitate > 0 else 0

        #Similaritatea de text care gen efectiv gaseste cartile cele mai similare
        df['features'] = (df['genuri'] + " ") * 3 + (df['autor'] + " ") * 2 + df['descriere']

        #TfidfVectorizer: Transforma cuvintele din textul mare intr o matrice imensa de numere sau vectori
        tfidf = TfidfVectorizer(stop_words='english', max_df=0.85)
        tfidf_matrix = tfidf.fit_transform(df['features'])

        print("⏳ Încărcăm recenziile pentru Collaborative Filtering...")
        query_reviews = "SELECT book_id_original, user_id, rating FROM reviews_goodreads_incercare"
        reviews_df = pd.read_sql(query_reviews, conn) # Salvam inregistrarile intr o tabela separata
        reviews_df['rating_cifra'] = reviews_df['rating'].str.extract(r'(\d+)').astype(float) # luam dar cifra de la rating ul user ului fara textul de pe langa
        reviews_df = reviews_df[reviews_df['rating_cifra'] >=4] # pastram doar randurile unde recenziile sunt de 4 sau 5 stele
        
        conn.close()

        #Salvarea in RAM - salvam tabelul curatat si matricea matematica in
        # variabilele globale, si asa ele sunt deja calculate cand cere userul recomandari
        df_global = df
        tfidf_matrix_global = tfidf_matrix
        reviews_global = reviews_df

        print("✅ AI-ul este GATA! Serverul ascultă comenzi pe portul 8000.")

    except Exception as e:
        print(f"❌ Eroare critică la pornirea AI-ului: {str(e)}")



#Partea a doua se refera la cererile node.js - adica endpoint ul api
# functia se axecuta doar cand node.js trimite cerere de post pentru recomandari
# =========================================================
# ETAPA 2: RĂSPUNDE INSTANT LA CERERILE NODE.JS 
# =========================================================
@app.post("/recomanda")
def get_recommendations(req: RecommendRequest):
    global df_global, tfidf_matrix_global, reviews_global
    
    if df_global is None or tfidf_matrix_global is None or reviews_global is None:
        raise HTTPException(status_code=500, detail="Creierul AI nu s-a putut încărca.")

    book_titles_lower = [t.lower() for t in req.book_titles]
    user_books = df_global[df_global['titlu'].str.lower().isin(book_titles_lower)]
    indices = user_books.index.tolist()

    user_book_ids_original = user_books['book_id_original'].tolist()
    if not indices:
        raise HTTPException(status_code=404, detail="Niciuna din cărțile trimise nu a fost găsită în baza de date.")
    
    #PARTEA CONTENT-BASED
    # 1. Calculăm Profilul
    user_vectors = tfidf_matrix_global[indices]
    user_profile_vector = np.asarray(user_vectors.mean(axis=0)) 
    cosine_sim = cosine_similarity(user_profile_vector, tfidf_matrix_global).flatten()

    # 2. VITEZA LUMINII: Calculăm scorul suprem pe toate cărțile DEODATĂ (Vectorizare)
    calitate_array = df_global['scor_calitate_norm'].values
    scor_content = (cosine_sim * 0.60) + (calitate_array * 0.40)

    # PARTEA COLLABORATIVE 
    scor_colaborativ = np.zeros(len(df_global))
    
    # verificam daca id urile pentru cartile citite de utilizator sunt valabile
    if len(user_book_ids_original) > 0:
        #cautam id urile acelor utilizatori care au citit aceleasi carti ca si utilizatorul pentru care facem recomandarile
        count = reviews_global[reviews_global['book_id_original'].isin(user_book_ids_original)]['user_id'].unique()
        if len(count) > 0:
            # pastram doar recenziile care apartin utilizatorilor cu gusturile la fel
            carti_recomandate_count = reviews_global[reviews_global['user_id'].isin(count)]
            # numaramm de cate ori apare fiecare carte in lista obtinuta cu cartile la fel
            top_carti = carti_recomandate_count['book_id_original'].value_counts()

            #parcurgem lista de carti 
            for book_id_orig, numar_voturi in top_carti.items():
                # gasim indexul carti unde se gaseste in tabelul df_global
                idx_carte_in_df = df_global.index[df_global['book_id_original'] == str(book_id_orig)].tolist()

                #daca am gasit cartea pe un rand
                if idx_carte_in_df:
                    # punem un bonus la numarul de voturi primite
                    scor_colaborativ[idx_carte_in_df[0]] = min(numar_voturi * 0.05, 0.4)
            
    scor_suprem = scor_content + scor_colaborativ
    # 3. Sortăm automat indicii descrescător după scor
    # argsort() este o funcție NumPy instantanee
    top_indices = scor_suprem.argsort()[::-1]
    
    # Tăiem lista la top 150 cărți, ca să avem de unde filtra
    top_indices = top_indices[:req.top_n * 5]

    recomandari = []
    autori_vazuti = set() 
    
    # 4. Acum iterăm DOAR prin top 150 de cărți, NU prin 10.000!
    for idx_carte in top_indices:
        if idx_carte in indices:
            continue
            
        carte = df_global.iloc[idx_carte]
        autor_carte = str(carte['autor']).strip()
        
        if autor_carte in autori_vazuti:
            continue
            
        autori_vazuti.add(autor_carte)
        
        recomandari.append({
            "id": int(carte['id']),
            "titlu": str(carte['titlu']),
            "autor": autor_carte,
            "coperta_url": str(carte['coperta_url']),
            "scor_ai": round(float(scor_suprem[idx_carte]), 3)
        })
        
        if len(recomandari) >= req.top_n:
            break
            
    return recomandari


    # Aceasta este funcția de care are nevoie Node.js după o recenzie nouă
@app.post("/update-emotie/{book_id}")
def trigger_update_emotie(book_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Extragem recenziile vechi (Goodreads)
        query_goodreads = "SELECT text_recenzie FROM reviews_goodreads_incercare WHERE book_id_original = %s AND text_recenzie IS NOT NULL"
        df_goodreads = pd.read_sql(query_goodreads, conn, params=(book_id,))

        # 2. Extragem recenziile NOI (Aplicația ta)
        query_app = "SELECT text_recenzie FROM app_reviews WHERE bookId = %s AND text_recenzie IS NOT NULL"
        df_app = pd.read_sql(query_app, conn, params=(book_id,))

        # 3. Combinăm textele
        toate_textele = pd.concat([df_goodreads['text_recenzie'], df_app['text_recenzie']]).astype(str).tolist()
        text_complet = ' '.join(toate_textele)

        if not text_complet.strip():
            return {"status": "ok", "mesaj": "Fără recenzii, nicio modificare."}

        # 4. Calculăm emoția cu NRCLex
        emotii = NRCLex(text_complet)
        frecvente = emotii.affect_frequencies
        emotii_curate = {k: v for k, v in frecvente.items() if k not in ['positive', 'negative'] and v > 0}
        
        emotie_principala = max(emotii_curate, key=emotii_curate.get) if emotii_curate else "neutral"

        # 5. Salvăm în baza de date
        update_query = "UPDATE books_goodreads_incercare SET emotie_dominanta = %s WHERE book_id_original = %s"
        cursor.execute(update_query, (emotie_principala, book_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"status": "ok", "mesaj": f"Emoția a fost actualizată la {emotie_principala}."}
        
    except Exception as e:
        return {"status": "eroare", "mesaj": str(e)}