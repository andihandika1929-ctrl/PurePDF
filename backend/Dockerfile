FROM python:3.11-slim

# Install system dependencies for Ghostscript, OpenCV, Tesseract OCR (ID+EN), and standard document fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-ind \
    fonts-liberation \
    fonts-crosextra-carlito \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create deterministic backend/fonts directory containing standard document fonts
# (Liberation Serif = Times New Roman, Liberation Sans = Arial, Carlito = Calibri, Liberation Mono = Courier)
RUN mkdir -p /app/fonts && \
    ln -sf /usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf /app/fonts/LiberationSerif-Regular.ttf && \
    ln -sf /usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf /app/fonts/LiberationSerif-Bold.ttf && \
    ln -sf /usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf /app/fonts/LiberationSans-Regular.ttf && \
    ln -sf /usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf /app/fonts/LiberationSans-Bold.ttf && \
    ln -sf /usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf /app/fonts/LiberationMono-Regular.ttf && \
    ln -sf /usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf /app/fonts/LiberationMono-Bold.ttf && \
    ln -sf /usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf /app/fonts/Carlito-Regular.ttf && \
    ln -sf /usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf /app/fonts/Carlito-Bold.ttf

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
