# Gunakan versi Python yang ringan
FROM python:3.10-slim

# Tentukan direktori kerja
WORKDIR /code

# Copy requirements dan install
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy semua file project
COPY . /code

# Beri tahu HF untuk menjalankan Uvicorn di Port 7860 (wajib untuk HF)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]