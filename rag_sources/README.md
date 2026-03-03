# FitChat Custom Sources

Put your custom knowledge files for FitChat in this folder.

## Supported file types

- `.md`
- `.txt`
- `.csv`
- `.json`

## Exact workflow

1. Copy your files into `rag_sources/`.
2. Trigger reindex:
   - `POST /chat/rag/reindex`
3. Check what is loaded:
   - `GET /chat/rag/sources`
4. Ask questions:
   - `POST /chat/rag`

## Free non-limited generation mode (local)

FitChat supports local generation through **Ollama** (no external API quota).

- Docker service: `fitpredict_ollama` (port `11434`)
- Default model in compose: `llama3.2:3b`

After starting compose, pull the model once inside the Ollama container.
Then FitChat will automatically use generation mode `ollama`.

If Ollama/model is not available, FitChat falls back to extractive RAG mode (still stable and in English).

## Tips for best quality

- Keep files focused by topic (nutrition, workouts, diseases, recipes, etc.).
- Prefer UTF-8 encoding.
- Avoid adding meta/instruction files as knowledge content.
- Large files are automatically chunked.
