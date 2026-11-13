# Agente RAG para políticas internas

Agente sencillo con LangChain que consulta políticas Markdown indexadas en Chroma y responde usando solo los fragmentos recuperados. Los documentos incluidos son ejemplos ficticios: reemplázalos por la documentación aprobada de tu organización antes de usarlo para decisiones reales.

## Estructura

```text
AgenteIA/
├── .env.example
├── .gitignore
├── app.py                 # Herramienta buscar_documentos y agente
├── ingest.py              # Divide e indexa los documentos Markdown
├── requirements.txt
├── data/
│   └── politicas/          # Añade aquí tus políticas internas en .md
└── chroma_db/              # Índice local generado por ingest.py
```

## Configuración y ejecución

Requiere Python 3.10 o superior y una clave de API de OpenAI.

```bash
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Configura `OPENAI_API_KEY` en `.env`; opcionalmente, cambia `OPENAI_MODEL`. Coloca los documentos `.md` en `data/politicas/` y ejecuta:

```bash
python ingest.py
python app.py
```

La ingesta reconstruye `chroma_db/` desde los Markdown actuales. Al iniciar, el programa solicita preguntas en una consola interactiva; escribe `salir` para terminar. Se puede ajustar el número de fragmentos y el umbral mínimo de relevancia con `TOP_K` y `RELEVANCE_THRESHOLD` en `.env`.

## Comportamiento

- `buscar_documentos(consulta)` busca fragmentos relevantes en Chroma y devuelve su contenido y ruta de origen.
- El modelo decide mediante llamadas a herramientas cuándo consultar la documentación. Para preguntas del dominio, las instrucciones del agente le piden recuperar evidencia antes de contestar.
- Si no se recupera evidencia por encima del umbral, la respuesta es exactamente: `No se encontró evidencia suficiente en la documentación disponible`.
- Las respuestas con evidencia terminan con las fuentes recuperadas. El prompt limita la respuesta a dicha evidencia; como con cualquier sistema basado en LLM, valida el comportamiento con las políticas reales antes de producción.

## Ejemplo

```text
Pregunta: ¿Es obligatorio el uso de MFA?
Respuesta: El acceso remoto y las cuentas privilegiadas requieren MFA. ...
Fuentes: data/politicas/acceso.md
```

## Interfaz web

La interfaz permite conversar con Policy Reviewer mediante Copilot SDK, cargar archivos Markdown, TXT, CSV, JSON, PDF y DOCX de hasta 5 MB y consultar su contenido en el visor. La extracción de PDF y DOCX se realiza en el navegador usando librerías locales servidas por la aplicación; los archivos añadidos se conservan solo durante la sesión. Solo los documentos activados se incluyen en la consulta. Las respuestas del chat se solicitan en texto plano, permitiendo tablas Markdown cuando el usuario las pide explícitamente; estas se muestran como tablas en la interfaz. El texto enviado se procesa con Copilot y el SDK guarda el historial de sesión en `~/.copilot/policy-reviewer-sdk`.

Requiere Node.js 20.19+ o 22.12+, Copilot CLI instalado y autenticado, y el perfil `~/.copilot/agents/Policy reviewer.agent.md`. Instala el SDK e inicia la aplicación desde la raíz:

```bash
npm install
npm start
```

Visita `http://localhost:8000`. El servidor local carga las instrucciones desde el perfil de Policy Reviewer y expone `POST /api/chat`; si el perfil está en otra ubicación, configura `POLICY_REVIEWER_AGENT_FILE` antes de iniciar. El servidor escucha solo en `127.0.0.1`.
