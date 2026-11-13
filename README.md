# Policy Reviewer

Policy Reviewer es una aplicación web local para revisar políticas internas con ayuda de Copilot. La interfaz permite cargar documentos, elegir qué archivos forman parte del contexto y hacer preguntas en lenguaje natural sobre su contenido. Las respuestas se basan únicamente en los documentos seleccionados en esa sesión.

Es una herramienta orientada a la validación y la evidencia: no reemplaza la revisión humana, sino que ayuda a localizar requisitos, riesgos, brechas y contradicciones en documentación operativa o regulatoria.

## Características

- Chat orientado a políticas con Copilot SDK.
- Carga de documentos en formato Markdown, TXT, CSV, JSON, PDF y DOCX.
- Selección granular del contexto: solo los documentos activados se envían al agente.
- Vista previa del contenido del archivo en un panel lateral.
- Soporte para documentos de ejemplo y archivos locales de la sesión.
- Servidor local que escucha solo en 127.0.0.1.
- Validación básica de tamaño y formato para cada archivo.

## Requisitos

- Node.js 20.19+ o 22.12+
- GitHub Copilot CLI instalado y autenticado
- Perfil del agente en `~/.copilot/agents/Policy reviewer.agent.md`
- Un terminal con acceso a tu cuenta de GitHub Copilot

## Estructura del proyecto

```text
AgenteIA/
├── app.js                # Lógica del cliente web
├── index.html            # Interfaz principal
├── server.js             # Servidor HTTP y conexión con Copilot
├── styles.css            # Estilos de la aplicación
├── package.json          # Dependencias y scripts
├── package-lock.json     # Lockfile de npm
├── data/
│   └── politicas/        # Archivos de ejemplo si quieres servir documentos estáticos
├── node_modules/         # Dependencias instaladas
└── README.md
```

> El repositorio no incluye un conjunto de políticas pre-cargadas por defecto; puedes añadir tus propios documentos desde la interfaz, o preparar archivos bajo `data/politicas/` para usarlos como ejemplos.

## Instalación

Desde la raíz del proyecto:

```bash
npm install
```

## Ejecución

```bash
npm start
```

La aplicación quedará disponible en:

```text
http://127.0.0.1:8000
```

También puedes comprobar la sintaxis del servidor y del cliente con:

```bash
npm run check
```

## Configuración del agente

El servidor carga la definición del agente desde `~/.copilot/agents/Policy reviewer.agent.md` y exige un frontmatter válido con `name`, `description` e instrucciones.

Ejemplo mínimo:

```yaml
---
name: Policy Reviewer
description: Revisa políticas internas con evidencia documental.
---
Eres un analista de cumplimiento y seguridad.
Basas tus respuestas solo en los documentos incluidos en la consulta actual.
Si la evidencia es insuficiente, dilo explícitamente.
Responde en texto plano y cita la fuente documental.
```

Si guardas el perfil en otra ruta, define la variable de entorno antes de arrancar:

```bash
export POLICY_REVIEWER_AGENT_FILE="/ruta/a/tu/agente/Policy reviewer.agent.md"
npm start
```

## Cómo funciona

1. El usuario carga documentos o usa los que se sirven como ejemplo.
2. Selecciona qué archivos activan el contexto del chat.
3. Envía una pregunta en la interfaz.
4. El servidor construye un prompt con esos documentos y se conecta a Copilot usando el SDK.
5. La respuesta debe verificarse con la fuente original del documento.

La app restringe la consulta a la evidencia visible en esa conversación; no lee archivos fuera del contexto actual y no usa documentos de sesiones anteriores si no han sido incluidos.

## APIs y comportamiento

El servidor expone dos endpoints principales:

- `GET /api/health`: devuelve un estado básico de salud.
- `POST /api/chat`: recibe el mensaje y la lista de documentos seleccionados para responder.

Las solicitudes tienen límites de seguridad:

- Máximo 20 MB por petición.
- Máximo 5 MB por archivo.
- Extensiones permitidas: `.md`, `.markdown`, `.txt`, `.csv`, `.json`, `.pdf`, `.docx`.

## Seguridad y uso responsable

- El servicio solo escucha en localhost.
- Los archivos de la sesión no se persisten como documentos del proyecto; se usan solo durante la consulta actual.
- La aplicación ayuda a revisar políticas, pero la decisión final debe validarse con la normativa o la documentación oficial de la organización.
- No uses este sistema como sustituto del juicio humano ni como fuente autoritativa sin una revisión adicional.

## Licencia

Este proyecto no incluye una licencia específica en el repositorio. Si vas a reutilizarlo en un entorno real, revisa primero la política de uso y distribución de tu organización.
