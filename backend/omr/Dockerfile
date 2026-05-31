FROM python:3.10-slim

# System libs: OpenCV (libgl/glib), PDF rasterizing (poppler), audio dep (ffmpeg)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 poppler-utils ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# oemer = the open-source OMR engine; music21 = multi-page MusicXML merging
# (pulls numpy, so the image is a bit larger); plus the tiny web wrapper.
RUN pip install --no-cache-dir \
        oemer \
        music21 \
        fastapi \
        "uvicorn[standard]" \
        python-multipart

COPY app.py merge.py pdf.py jobs.py analyze.py instruct.py /app/
COPY static /app/static

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
