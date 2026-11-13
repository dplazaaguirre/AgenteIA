const initialDocuments = [
  { name: "acceso.md", path: "./data/politicas/acceso.md", type: "MD" },
  { name: "cambios.md", path: "./data/politicas/cambios.md", type: "MD" },
  { name: "clasificacion.md", path: "./data/politicas/clasificacion.md", type: "MD" },
];

const maxFileSize = 5 * 1024 * 1024;
const allowedExtensions = new Set(["md", "markdown", "txt", "csv", "json", "pdf", "docx"]);
const docs = [];

const elements = {
  addButtons: [
    document.getElementById("add-files-button"),
    document.getElementById("viewer-add-button"),
    document.getElementById("attach-button"),
    document.getElementById("upload-card"),
  ],
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  characterCount: document.getElementById("character-count"),
  composerContext: document.getElementById("composer-context"),
  contextDialog: document.getElementById("context-dialog"),
  contextDialogList: document.getElementById("context-dialog-list"),
  connectionLabel: document.getElementById("connection-label"),
  connectionStatus: document.getElementById("connection-status"),
  contextLabel: document.getElementById("context-label"),
  documentCount: document.getElementById("document-count"),
  documentPreview: document.getElementById("document-preview"),
  documentSearch: document.getElementById("document-search"),
  fileInput: document.getElementById("file-input"),
  fileList: document.getElementById("file-list"),
  messages: document.getElementById("messages"),
  noFiles: document.getElementById("no-files"),
  sendButton: document.getElementById("send-button"),
  suggestions: document.getElementById("suggestions"),
  toast: document.getElementById("toast"),
  typingIndicator: document.getElementById("typing-indicator"),
  viewerFileIcon: document.getElementById("viewer-file-icon"),
  viewerFileName: document.getElementById("viewer-file-name"),
  viewerMeta: document.getElementById("viewer-meta"),
};

let selectedDocumentId = null;
let toastTimeout;

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extensionOf(name) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function typeLabel(name) {
  const extension = extensionOf(name);
  return extension === "markdown" ? "MD" : extension.toUpperCase();
}

function typeClass(name) {
  const extension = extensionOf(name);
  if (extension === "md" || extension === "markdown") return "markdown-icon";
  if (extension === "csv") return "csv-icon";
  if (extension === "json") return "json-icon";
  return "text-icon";
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => elements.toast.classList.remove("visible"), 4000);
}

function makeDocumentIcon(name, extraClass = "") {
  const icon = document.createElement("span");
  icon.className = `file-icon ${typeClass(name)} ${extraClass}`.trim();
  icon.textContent = typeLabel(name);
  return icon;
}

function renderDocuments() {
  const query = elements.documentSearch.value.trim().toLocaleLowerCase("es");
  const visibleDocs = docs.filter((doc) => doc.name.toLocaleLowerCase("es").includes(query));

  elements.fileList.replaceChildren();
  elements.noFiles.classList.toggle("hidden", visibleDocs.length > 0);
  elements.documentCount.textContent = `${docs.length} ${docs.length === 1 ? "documento" : "documentos"}`;

  for (const doc of visibleDocs) {
    const row = document.createElement("div");
    row.className = `file-item${doc.id === selectedDocumentId ? " selected" : ""}`;

    const selectButton = document.createElement("button");
    selectButton.className = "file-select";
    selectButton.type = "button";
    selectButton.setAttribute("aria-label", `Abrir ${doc.name}`);
    selectButton.addEventListener("click", () => selectDocument(doc.id));

    const icon = makeDocumentIcon(doc.name);
    const details = document.createElement("span");
    details.className = "file-details";
    const name = document.createElement("strong");
    name.textContent = doc.name;
    const info = document.createElement("small");
    info.textContent = `${doc.source === "local" ? "Añadido aquí" : "Markdown"}${doc.size ? ` · ${formatSize(doc.size)}` : ""}`;
    details.append(name, info);
    selectButton.append(icon, details);

    const includeButton = document.createElement("button");
    includeButton.className = "context-toggle";
    includeButton.type = "button";
    includeButton.setAttribute("aria-pressed", String(doc.included));
    includeButton.setAttribute("aria-label", `${doc.included ? "Quitar" : "Incluir"} ${doc.name} ${doc.included ? "del" : "en"} contexto del chat`);
    includeButton.title = doc.included ? "Incluido en el contexto" : "No incluido en el contexto";
    includeButton.addEventListener("click", () => {
      doc.included = !doc.included;
      renderDocuments();
      updateContext();
    });

    row.append(selectButton, includeButton);

    if (doc.source === "local") {
      const removeButton = document.createElement("button");
      removeButton.className = "remove-file";
      removeButton.type = "button";
      removeButton.setAttribute("aria-label", `Quitar ${doc.name}`);
      removeButton.title = "Quitar documento";
      removeButton.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4h10M6 4V2.5h4V4m2 0-.5 9H4.5L4 4m2.5 2v4m3-4v4" /></svg>';
      removeButton.addEventListener("click", () => removeDocument(doc.id));
      row.append(removeButton);
    } else {
      const spacer = document.createElement("span");
      spacer.setAttribute("aria-hidden", "true");
      row.append(spacer);
    }

    elements.fileList.append(row);
  }

  updateContext();
}

function updateContext() {
  const count = docs.filter((doc) => doc.included).length;
  elements.contextLabel.textContent = `${count} ${count === 1 ? "documento incluido" : "documentos incluidos"} en el contexto`;
  elements.composerContext.classList.toggle("has-context", count > 0);
}

function selectDocument(id) {
  selectedDocumentId = id;
  const doc = docs.find((item) => item.id === id);
  if (!doc) return;

  elements.viewerFileName.textContent = doc.name;
  elements.viewerFileIcon.className = `file-icon ${typeClass(doc.name)}`;
  elements.viewerFileIcon.textContent = typeLabel(doc.name);
  elements.viewerMeta.textContent = `${doc.source === "local" ? "Archivo de esta sesión" : "Documento de ejemplo"}${doc.size ? ` · ${formatSize(doc.size)}` : ""}`;

  const preview = document.createElement("pre");
  preview.textContent = doc.content;
  elements.documentPreview.replaceChildren(preview);
  renderDocuments();
}

function removeDocument(id) {
  const index = docs.findIndex((doc) => doc.id === id);
  if (index < 0) return;
  const [removed] = docs.splice(index, 1);
  if (selectedDocumentId === id) {
    selectedDocumentId = docs[0]?.id ?? null;
    if (selectedDocumentId) selectDocument(selectedDocumentId);
    else showEmptyPreview();
  }
  renderDocuments();
  showToast(`${removed.name} se quitó de esta sesión.`);
}

function showEmptyPreview() {
  elements.viewerFileName.textContent = "Selecciona un documento";
  elements.viewerFileIcon.className = "file-icon markdown-icon";
  elements.viewerFileIcon.textContent = "MD";
  elements.viewerMeta.textContent = "";

  const empty = document.createElement("div");
  empty.className = "preview-empty";
  empty.innerHTML = '<span class="preview-empty-icon" aria-hidden="true"><svg viewBox="0 0 28 28"><path d="M7 4h9l6 6v14H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M16 4v6h6M10 15h8m-8 4h8" /></svg></span><strong>Selecciona un documento</strong><span>El contenido aparecerá aquí</span>';
  elements.documentPreview.replaceChildren(empty);
}

async function loadInitialDocuments() {
  const results = await Promise.allSettled(
    initialDocuments.map(async (file) => {
      const response = await fetch(file.path);
      if (!response.ok) throw new Error(`No se pudo abrir ${file.name} (${response.status}).`);
      return {
        ...file,
        id: createId(),
        content: await response.text(),
        size: null,
        source: "sample",
        included: true,
      };
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled") docs.push(result.value);
    else console.error("No se pudo cargar un documento de ejemplo:", result.reason);
  }

  if (results.some((result) => result.status === "rejected")) {
    showToast("No se pudieron cargar algunos documentos de ejemplo. Comprueba que la interfaz se sirve desde el repositorio.");
  }

  if (docs.length > 0) selectDocument(docs[0].id);
  else showEmptyPreview();
  renderDocuments();
}

async function readLocalDocumentText(file) {
  const extension = extensionOf(file.name);

  if (["md", "markdown", "txt", "csv", "json"].includes(extension)) {
    return file.text();
  }

  if (extension === "pdf") {
    const pdfjsLib = await import("/vendor/pdf.mjs");
    if (!pdfjsLib?.getDocument) {
      throw new Error("La librería de PDF no está disponible.");
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.mjs";

    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => (typeof item?.str === "string" ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (pageText) pages.push(pageText);
    }

    const text = pages.join("\n\n");
    if (!text.trim()) {
      throw new Error("El archivo PDF no contiene texto extraíble.");
    }
    return text;
  }

  if (extension === "docx") {
    const mammoth = globalThis.mammoth;
    if (!mammoth?.extractRawText) {
      throw new Error("La librería de DOCX no está disponible.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (!result?.value?.trim()) {
      throw new Error("El archivo DOCX no contiene texto extraíble.");
    }
    return result.value;
  }

  throw new Error(`Formato no compatible: ${file.name}`);
}

async function addFiles(fileList) {
  const files = Array.from(fileList);
  for (const file of files) {
    const extension = extensionOf(file.name);
    if (!allowedExtensions.has(extension)) {
      showToast(`${file.name}: formato no compatible. Usa Markdown, TXT, CSV, JSON, PDF o DOCX.`);
      continue;
    }
    if (file.size > maxFileSize) {
      showToast(`${file.name}: supera el límite de 5 MB.`);
      continue;
    }
    if (docs.some((doc) => doc.name.toLocaleLowerCase("es") === file.name.toLocaleLowerCase("es"))) {
      showToast(`${file.name}: ya existe un documento con ese nombre.`);
      continue;
    }

    try {
      const content = await readLocalDocumentText(file);
      const doc = {
        id: createId(),
        name: file.name,
        type: typeLabel(file.name),
        size: file.size,
        content,
        source: "local",
        included: true,
      };
      docs.push(doc);
      selectedDocumentId = doc.id;
    } catch (error) {
      console.error(`No se pudo leer ${file.name}:`, error);
      const detail = error instanceof Error ? error.message : "Error desconocido.";
      showToast(`No se pudo leer ${file.name}: ${detail}`);
    }
  }

  renderDocuments();
  const selected = docs.find((doc) => doc.id === selectedDocumentId);
  if (selected) selectDocument(selected.id);
  elements.fileInput.value = "";
}

function splitMarkdownTableRow(line) {
  const cells = [];
  let cell = "";
  let escaped = false;
  const content = line.trim().replace(/^\|/, "").replace(/\|$/, "");

  for (const character of content) {
    if (escaped) {
      cell += character;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }

  if (escaped) cell += "\\";
  cells.push(cell.trim());
  return cells;
}

function isMarkdownTableSeparator(cells) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function createMarkdownTable(headers, alignments, rows) {
  const wrapper = document.createElement("div");
  wrapper.className = "message-table-wrapper";
  const table = document.createElement("table");
  table.className = "message-table";
  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");

  headers.forEach((header, index) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = header;
    cell.style.textAlign = alignments[index];
    headerRow.append(cell);
  });
  head.append(headerRow);
  table.append(head);

  const body = document.createElement("tbody");
  for (const row of rows) {
    const tableRow = document.createElement("tr");
    row.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      cell.style.textAlign = alignments[index];
      tableRow.append(cell);
    });
    body.append(tableRow);
  }
  table.append(body);
  wrapper.append(table);
  return wrapper;
}

function appendResponseContent(container, text) {
  const lines = text.split("\n");
  const plainText = [];
  const flushPlainText = () => {
    if (plainText.length === 0) return;
    container.append(document.createTextNode(plainText.join("\n")));
    plainText.length = 0;
  };

  for (let index = 0; index < lines.length;) {
    if (index + 1 < lines.length) {
      const headers = splitMarkdownTableRow(lines[index]);
      const separators = splitMarkdownTableRow(lines[index + 1]);
      if (headers.length > 1 && headers.length === separators.length && isMarkdownTableSeparator(separators)) {
        const alignments = separators.map((separator) => {
          const left = separator.startsWith(":");
          const right = separator.endsWith(":");
          return left && right ? "center" : right ? "right" : "left";
        });
        const rows = [];
        let rowIndex = index + 2;
        while (rowIndex < lines.length && lines[rowIndex].trim() !== "") {
          const row = splitMarkdownTableRow(lines[rowIndex]);
          if (row.length !== headers.length) break;
          rows.push(row);
          rowIndex += 1;
        }

        if (rows.length > 0) {
          flushPlainText();
          container.append(createMarkdownTable(headers, alignments, rows));
          index = rowIndex;
          continue;
        }
      }
    }

    plainText.push(lines[index]);
    index += 1;
  }

  flushPlainText();
}

function appendMessage(role, text, sources = [], isError = false) {
  const message = document.createElement("article");
  message.className = `chat-message ${role}`;

  if (role === "assistant") {
    const avatar = document.createElement("span");
    avatar.className = "message-avatar";
    avatar.textContent = "P";
    avatar.setAttribute("aria-label", "Policy Reviewer");
    message.append(avatar);
  }

  const body = document.createElement("div");
  body.className = `message-body${isError ? " error" : ""}`;
  if (role === "assistant" && !isError) appendResponseContent(body, text);
  else body.textContent = text;

  if (sources.length > 0) {
    const sourceList = document.createElement("div");
    sourceList.className = "message-sources";
    for (const source of sources) {
      const chip = document.createElement("span");
      chip.textContent = source;
      sourceList.append(chip);
    }
    body.append(sourceList);
  }

  message.append(body);
  elements.messages.append(message);
  elements.messages.scrollIntoView({ behavior: "smooth", block: "end" });
}

function setConnectionStatus(connected, label) {
  elements.connectionStatus.classList.toggle("connected", connected);
  elements.connectionLabel.textContent = label;
}

async function sendMessage(message) {
  const context = docs
    .filter((doc) => doc.included)
    .map(({ name, content }) => ({ name, content }));

  appendMessage("user", message);
  elements.suggestions.classList.add("hidden");
  elements.typingIndicator.classList.remove("hidden");
  elements.sendButton.disabled = true;
  setConnectionStatus(false, "Conectando...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, documents: context }),
    });

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error(`El servicio respondió con un formato inesperado (${response.status}).`);
    }

    if (payload === null || typeof payload !== "object") {
      throw new Error(`El servicio respondió con un formato inesperado (${response.status}).`);
    }

    if (!response.ok) {
      const detail = typeof payload.error === "string" ? ` ${payload.error}` : "";
      throw new Error(`El agente respondió con un error (${response.status}).${detail}`);
    }
    if (typeof payload.answer !== "string" || payload.answer.trim() === "") {
      throw new Error("La respuesta del agente no contiene el campo de texto «answer».");
    }

    appendMessage("assistant", payload.answer, Array.isArray(payload.sources) ? payload.sources : []);
    setConnectionStatus(true, "Agente conectado");
  } catch (error) {
    console.error("No se pudo completar la consulta:", error);
    const detail = error instanceof TypeError
      ? "No se pudo conectar con Policy Reviewer. Comprueba que npm start esté ejecutándose."
      : error.message;
    appendMessage("assistant", detail, [], true);
    setConnectionStatus(false, "API sin conectar");
  } finally {
    elements.typingIndicator.classList.add("hidden");
    elements.sendButton.disabled = elements.chatInput.value.trim().length === 0;
    elements.chatInput.focus();
  }
}

for (const button of elements.addButtons) {
  button.addEventListener("click", () => elements.fileInput.click());
}

elements.fileInput.addEventListener("change", (event) => addFiles(event.target.files));
elements.documentSearch.addEventListener("input", renderDocuments);

document.getElementById("manage-context").addEventListener("click", () => {
  elements.contextDialogList.replaceChildren();
  if (docs.length === 0) {
    const empty = document.createElement("span");
    empty.className = "context-dialog-empty";
    empty.textContent = "Añade documentos para incluirlos en el contexto.";
    elements.contextDialogList.append(empty);
  }

  for (const doc of docs) {
    const label = document.createElement("label");
    label.className = "context-document";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = doc.included;
    checkbox.addEventListener("change", () => {
      doc.included = checkbox.checked;
      renderDocuments();
    });
    const details = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = doc.name;
    const size = document.createElement("small");
    size.textContent = doc.size ? `${typeLabel(doc.name)} · ${formatSize(doc.size)}` : "Documento de ejemplo";
    details.append(name, size);
    label.append(checkbox, details);
    elements.contextDialogList.append(label);
  }

  elements.contextDialog.showModal();
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    elements.documentSearch.focus();
  }
});

for (const card of document.querySelectorAll(".suggestion-card")) {
  card.addEventListener("click", () => {
    elements.chatInput.value = card.dataset.prompt ?? "";
    updateComposer();
    elements.chatInput.focus();
  });
}

elements.chatInput.addEventListener("input", updateComposer);
elements.chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    elements.chatForm.requestSubmit();
  }
});

elements.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = elements.chatInput.value.trim();
  if (!message || elements.sendButton.disabled) return;
  elements.chatInput.value = "";
  updateComposer();
  void sendMessage(message);
});

function updateComposer() {
  const length = elements.chatInput.value.length;
  elements.characterCount.textContent = `${length} / 4000`;
  elements.sendButton.disabled = length === 0;
  elements.chatInput.style.height = "auto";
  elements.chatInput.style.height = `${Math.min(elements.chatInput.scrollHeight, 140)}px`;
}

async function checkAgentHealth() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error(`API respondió ${response.status}.`);
    const status = await response.json();
    setConnectionStatus(true, `${status.agent} listo`);
  } catch (error) {
    console.error("No se pudo comprobar el estado de Policy Reviewer:", error);
    setConnectionStatus(false, "API sin conectar");
  }
}

const uploadCard = document.getElementById("upload-card");
uploadCard.addEventListener("dragover", (event) => {
  event.preventDefault();
  uploadCard.classList.add("drag-over");
});
uploadCard.addEventListener("dragleave", () => uploadCard.classList.remove("drag-over"));
uploadCard.addEventListener("drop", (event) => {
  event.preventDefault();
  uploadCard.classList.remove("drag-over");
  void addFiles(event.dataTransfer?.files ?? []);
});

document.getElementById("composer-context").classList.remove("has-context");
updateComposer();
void checkAgentHealth();
void loadInitialDocuments();
