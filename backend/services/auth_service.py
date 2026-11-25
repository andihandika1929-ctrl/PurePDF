# backend/services/auth_service.py
import os
from typing import Dict, Any, Optional
import httpx
from fastapi import Header, HTTPException, status


def _get_supabase_config() -> tuple[str, str, str]:
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or ""
    anon_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or ""
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
    return url.rstrip("/"), anon_key, service_key


async def verify_supabase_jwt(
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    """
    FastAPI dependency that verifies a Supabase Bearer JWT against Supabase Auth
    (/auth/v1/user) and returns the authenticated user object.
    Rejects missing, malformed, expired, or revoked tokens with HTTP 401.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase_url, anon_key, service_key = _get_supabase_config()
    api_key = service_key or anon_key
    if not supabase_url or not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server auth configuration missing (SUPABASE_URL / SUPABASE_ANON_KEY).",
        )

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={
                    "apikey": api_key,
                    "Authorization": f"Bearer {token}",
                },
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to reach Supabase Auth service: {exc}",
        )

    if res.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase JWT.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_data = res.json()
    if not user_data or not user_data.get("id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user identity missing in token.",
        )

    return user_data


async def consume_ai_quota_server(user_id: str, cost: int = 2) -> Dict[str, Any]:
    """
    Executes atomic credit/quota deduction via Supabase RPC `consume_ai_quota_atomic`
    using the server-only SUPABASE_SERVICE_ROLE_KEY.
    """
    supabase_url, _, service_key = _get_supabase_config()
    if not supabase_url or not service_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server billing configuration missing (SUPABASE_SERVICE_ROLE_KEY).",
        )

    async with httpx.AsyncClient(timeout=8.0) as client:
        res = await client.post(
            f"{supabase_url}/rest/v1/rpc/consume_ai_quota_atomic",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
            },
            json={"p_user_id": user_id, "p_cost": cost},
        )

    if res.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Atomic quota check failed: {res.text}",
        )

    result = res.json()
    if not isinstance(result, dict) or not result.get("allowed"):
        reason = result.get("error_reason", "insufficient_credits") if isinstance(result, dict) else "insufficient_credits"
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient AI quota or credits ({reason}).",
        )

    return result
