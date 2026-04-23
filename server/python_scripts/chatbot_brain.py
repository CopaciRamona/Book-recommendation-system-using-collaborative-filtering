import sys
import os
import json

api_key = os.environ.get("GROQ_API_KEY")

if not api_key:
    print(json.dumps({"error": "null"}))
    sys.exit(1)

from groq import Groq
client = Groq(api_key=api_key)

def extrage_emotia_manual(mesaj):
    text = mesaj.lower()
    
    dictionar = {
        'sadness': ['plang', 'plâng', 'trist', 'sensibil', 'suferinta', 'lacrimi', 'drama', 'plange', 'durere', 'sensibilizeze'],
        'joy': ['vesel', 'fericit', 'comedie', 'rad', 'râd', 'bucurie', 'amuzant', 'dragoste', 'iubire', 'romantic'],
        'fear': ['groaza', 'frica', 'sperie', 'horror', 'monstri', 'terifiant', 'groaznic'],
        'anticipation': ['suspans', 'mister', 'actiune', 'politist', 'crima', 'detectiv', 'priza'],
        'trust': ['motivatie', 'dezvoltare', 'invat', 'inspirational', 'succes', 'cariera', 'lectii'],
        'surprise': ['surpriza', 'plot twist', 'neasteptat', 'socant']
    }

 
    for emotie, cuvinte in dictionar.items():
        for cuvant in cuvinte:
            if cuvant in text:
                return emotie 
                
    return None 


def detecteaza_emotia_si_contextul(mesaj_user, lista_genuri_din_db):
    
    emotie_gasita_manual = extrage_emotia_manual(mesaj_user)
    
    if emotie_gasita_manual:
        rezultat = {
            "emotion": emotie_gasita_manual,
            "include_genres": [],
            "exclude_genres": [],
            "keywords": []
        }
        print(json.dumps(rezultat))
        return

    prompt = f"""
    Analyze the user's message to find the emotional intent and relevant book genres.
    User Message: "{mesaj_user}"

    Available Genres in Database: {lista_genuri_din_db}

    OUTPUT MUST BE A STRICT JSON OBJECT WITH THESE KEYS:
    1. "emotion": Try to map the intent to one of these: [joy, sadness, fear, anger, anticipation, surprise, trust, disgust]. If uncertain, return "null".
    2. "keywords": Extract 1-3 core subjects or descriptive words.
    3. "include_genres": Pick 1-2 relevant genres from the Available Genres list based on context.
    4. "exclude_genres": Genres to strictly avoid based on the message.
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.3, 
            response_format={"type": "json_object"} 
        )
        
        raspuns_ai = chat_completion.choices[0].message.content.strip()
        date_parsate = json.loads(raspuns_ai)
        
        emotia = date_parsate.get("emotion", "null").lower()
        if emotia not in ['joy', 'sadness', 'fear', 'anger', 'anticipation', 'surprise', 'trust', 'disgust']:
            date_parsate["emotion"] = "null"

        print(json.dumps(date_parsate))

    except Exception as e:
        print(json.dumps({"emotion": "null", "include_genres": [], "exclude_genres": [], "keywords": []}))

if __name__ == "__main__":
    if len(sys.argv) > 2:
        mesaj = sys.argv[1]
        genuri = sys.argv[2]
        detecteaza_emotia_si_contextul(mesaj, genuri)
    else:
        print(json.dumps({"emotion": "null", "include_genres": [], "exclude_genres": [], "keywords": []}))