# Piano Professor OMR service — homr engine (transformer-based OMR, ONNX
# runtime, CPU-friendly). Set OMR_ENGINE=oemer at runtime only if you build
# oemer into the image too.
FROM python:3.12-slim

# System libs: OpenCV runtime (libgl/glib), PDF rasterizing (poppler)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# homr = the OMR engine (brings onnxruntime + opencv); music21 = the musical
# sanity pass (postprocess.py); plus the web wrapper.
RUN pip install --no-cache-dir \
        homr \
        music21 \
        fastapi \
        "uvicorn[standard]" \
        python-multipart

# Bake the model weights into the image so the first request is fast.
RUN homr --init

COPY app.py preprocess.py /app/

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
