from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Halo! FastAPI saya sudah menyala."}