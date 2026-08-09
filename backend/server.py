import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import JWTError, jwt
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin@divine")
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-to-a-secure-random-secret-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 12

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables missing.")

supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI(title="Divine Traders Secure Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class LoginRequest(BaseModel):
    password: str

class ProductPayload(BaseModel):
    brand: Optional[str] = ""
    name: str
    category: str
    price: Optional[float] = 0.0
    packaging: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class BrandingPayload(BaseModel):
    business_name: Optional[str] = None
    tagline: Optional[str] = None
    phone1: Optional[str] = None
    phone2: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    hero_image: Optional[str] = None

# JWT Helpers
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def verify_admin_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized: Missing or invalid token format")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Forbidden: Admin privileges required")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Unauthorized: Expired or invalid token")

# Endpoints
@app.post("/api/admin/login")
def login(body: LoginRequest):
    if body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Incorrect password")
    token = create_access_token({"role": "admin"})
    return {"token": token}

@app.post("/api/products")
def create_product(payload: ProductPayload, _admin=Depends(verify_admin_token)):
    res = supabase_admin.table("products").insert(payload.model_dump()).execute()
    return res.data

@app.put("/api/products/{product_id}")
def update_product(product_id: str, payload: ProductPayload, _admin=Depends(verify_admin_token)):
    res = supabase_admin.table("products").update(payload.model_dump()).eq("id", product_id).execute()
    return res.data

@app.delete("/api/products/{product_id}")
def delete_product(product_id: str, _admin=Depends(verify_admin_token)):
    res = supabase_admin.table("products").delete().eq("id", product_id).execute()
    return {"status": "deleted", "data": res.data}

@app.post("/api/products/reset")
def reset_catalog(_admin=Depends(verify_admin_token)):
    # Deletes current catalog items
    supabase_admin.table("products").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    return {"status": "reset_successful"}

@app.post("/api/branding")
def upsert_branding(payload: BrandingPayload, _admin=Depends(verify_admin_token)):
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    res = supabase_admin.table("branding").upsert(data).execute()
    return res.data[0] if res.data else data
