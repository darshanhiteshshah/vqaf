# VQAF

VQAF is a voice quality assurance dashboard for call recordings. It uploads audio, transcribes speakers, scores the conversation, stores the result in MongoDB, and gives QA teams history, analytics, call detail views, and semantic search.

## Architecture

- `frontend/`: React + Vite dashboard.
- `backend/`: Express API, MongoDB models, upload handling, analytics, search, and call pipeline orchestration.
- `python-stt/`: FastAPI speech-to-text service using Faster Whisper and optional pyannote diarization.
- `python-qa/`: FastAPI QA scoring service using deterministic scoring helpers, Gemini evaluation, and embeddings.
- `uploads/`: Local audio upload storage.

## Local Ports

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- STT service: `http://localhost:8000`
- QA service: `http://localhost:8001`

## Environment

Copy the example files and fill in your real values:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
Copy-Item python-stt\.env.example python-stt\.env
Copy-Item python-qa\.env.example python-qa\.env
```

Required values:

- `backend/.env`: `MONGO_URL`
- `python-stt/.env`: `HF_TOKEN` for pyannote diarization
- `python-qa/.env`: `GEMINI_API_KEY`

## Run

Install JavaScript dependencies from each app folder if needed:

```powershell
npm --prefix backend install
npm --prefix frontend install
```

Install Python dependencies in each Python service virtual environment:

```powershell
cd python-stt
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

cd ..\python-qa
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Start everything:

```powershell
npm run dev
```

## Demo Flow

1. Open `http://localhost:5173`.
2. Upload an MP3, WAV, M4A, or OGG call recording.
3. Wait for upload, transcription, QA scoring, and embedding generation.
4. Review the score, talk balance, flags, score explanations, and transcript.
5. Use History, Analytics, and Semantic Search to inspect past calls.

## Tests

Backend:

```powershell
npm --prefix backend test
```

Python QA helpers:

```powershell
cd python-qa
python -m unittest discover -s tests
```

Frontend lint:

```powershell
npm --prefix frontend run lint
```

## Notes

- The frontend API base defaults to `http://localhost:5000` and can be changed with `VITE_API_BASE_URL`.
- The backend can point to different Python services with `STT_URL` and `QA_URL`.
- Real secrets should stay in `.env` files only. Do not commit them.

## Performance Roadmap

The upload endpoint returns quickly and processes STT/QA in the background. The frontend polls `/api/calls/:callId` until the call is `scored` or `failed`.

For production speed and reliability, the next upgrade is a real queue:

- Use Redis + BullMQ in `backend/` for durable jobs instead of the current in-process background task.
- Run one or more worker processes for STT/QA orchestration, separate from the Express API.
- Keep model services warm. Do not start Python services per request.
- Run Python services without `--reload` outside development.
- Use GPU for Whisper/diarization if available.
- Use `tiny` or `base` Whisper for fast demos, and larger models only when accuracy matters more than latency.
- Cache embeddings and Gemini outputs by call ID so retries do not repeat expensive work.
- Consider skipping pyannote diarization for long calls or demo mode; diarization is often slower than transcription.
