# Specifiche Funzionali: Calorie Menu App

## 1. Introduzione ed Obiettivi
L'applicazione ha lo scopo di estrarre quotidianamente il menu del giorno dal sito ufficiale di "Menu Angelini" (https://menuangelini.ear-srl.com/), analizzare la descrizione testuale di ciascun piatto e stimare i valori nutrizionali completi (Calorie, Carboidrati, Grassi, Proteine) attraverso l'integrazione con i modelli linguistici di Anthropic (Claude API). Il menu finale viene riproposto all'utente nello stesso ordine originale, arricchito dai dati macro-nutrizionali in una veste grafica super dinamica e accattivante.

## 2. Architettura del Sistema e Flusso dei Dati

### 2.1 Componenti Principali
* **Web Scraper / Fetcher Module:** Componente in esecuzione sul server che esegue lo scraping del sito del menu una volta al giorno (es. alle ore 08:00 del mattino).
* **LLM Nutrition Engine:** Modulo di integrazione con le API Anthropic (`claude-3-5-sonnet`) che mappa i piatti estratti, richiedendo i dati nutrizionali calcolati su porzioni standard da ristorazione.
* **Database & Cache Layer:** Mantiene in persistenza il menu elaborato della giornata. Tutte le successive richieste degli utenti caricheranno i dati direttamente dalla cache, azzerando i costi di scraping e di API.
* **Frontend UI/UX (Web App Mobile-First):** Interfaccia utente web accessibile da browser, ottimizzata per smartphone, con un design moderno basato su toni pastello.

### 2.2 Diagramma di Flusso
```
[Richiesta Utente] 
       |
       v
[Backend Cache] --(Dati presenti?)--> [Sì] --> [Render Frontend]
       |
      [No / Primo Accesso del Mattino]
       v
[Web Scraper] -> [Sito Menu Angelini] -> [Anthropic API] -> [Salvataggio Cache] -> [Render Frontend]
```

## 3. Specifiche Tecniche e Dettaglio Funzionale

### 3.1 Scraping del Menu
* L'applicazione interroga l'URL `https://menuangelini.ear-srl.com/`.
* Mantiene rigorosamente l'ordine sequenziale originario delle portate presenti sulla pagina web.

### 3.2 Integrazione Anthropic (Claude API)
* **Formato Output:** Richiesta JSON con la struttura:
    ```json
    {
      "piatto": "Nome Piatto",
      "calorie": 450,
      "carboidrati_g": 45,
      "proteine_g": 20,
      "grassi_g": 15
    }
    ```
* I valori non sono modificabili dall'utente finale e fanno riferimento alla porzione fissa standard definita dall'intelligenza artificiale.

### 3.3 Interfaccia Utente (UI/UX) - Stile Healthy Pastello
* **Layout:** Web App ottimizzata per schermi mobile (Mobile-First).
* **UI/UX Design:** Stile "Healthy & Wellness" con sfondo chiaro, angoli smussati e palette di colori pastello (verde salvia per le calorie e i piatti leggeri, arancione tenue/pesca per i carboidrati, azzurro carta da zucchero per le proteine).
* **Elementi Dinamici:** Card interattive che mostrano istantaneamente la ripartizione dei macro-nutrienti (tramite micro-grafici o indicatori di percentuale visivi) ed animazioni fluide di caricamento/scorrimento.

### 3.4 Gestione Errori e Fallback
* Se il sito originale non è raggiungibile o l'API di Anthropic fallisce la generazione a inizio giornata (e non è presente una cache valida per il giorno corrente), l'applicazione mostra una schermata dedicata di **Errore di connessione**, invitando l'utente a riprovare più tardi, evitando di mostrare dati parziali o incorretti.
