"""In-process job store for async multi-page OMR.

Per-page oemer can take minutes, so `/omr/song` returns a jobId immediately and
the client polls `/omr/song/{jobId}`. State lives in memory (a dict) for now;
Phase 3 swaps this for Firestore (`users/{uid}/library/{itemId}` per SCHEMA.md).

Status values mirror SCHEMA.md `library.status`: processing | ready | failed.
"""
import threading
import time
import uuid
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Job:
    id: str
    status: str = "processing"          # processing | ready | failed
    title: str = "Imported song"
    total_pages: int = 0
    done_pages: int = 0
    result_xml: Optional[str] = None    # merged MusicXML when status == ready
    error: Optional[str] = None         # populated when status == failed
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._lock = threading.Lock()

    def create(self, title: str, total_pages: int) -> Job:
        job = Job(id=uuid.uuid4().hex, title=title, total_pages=total_pages)
        with self._lock:
            self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> Optional[Job]:
        with self._lock:
            return self._jobs.get(job_id)

    def update(self, job_id: str, **fields) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return
            for k, v in fields.items():
                setattr(job, k, v)
            job.updated_at = time.time()


# Module-level singleton used by app.py.
STORE = JobStore()
