"""楽天市場 商品検索 API。

エンドポイントは 2026 年の移行後のもの。
  https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701
バックエンドサービスとして登録した IP からのみ通る（403 CLIENT_IP_NOT_ALLOWED）。
"""
import json
import os
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701"
NG_WORDS = ("アダルト", "18禁", "成人", "中古", "ジャンク")


def _creds() -> tuple[str, str]:
    app = os.environ.get("RAKUTEN_APP_ID", "")
    key = os.environ.get("RAKUTEN_ACCESS_KEY", "")
    if not app or not key:
        try:
            import streamlit as st
            app = app or st.secrets.get("RAKUTEN_APP_ID", "")
            key = key or st.secrets.get("RAKUTEN_ACCESS_KEY", "")
        except Exception:
            pass
    return app, key


def _big(url: str) -> str:
    """サムネイル URL のサイズ指定を大きくする。"""
    return url.split("?")[0] + "?_ex=400x400" if url else ""


# 楽天 API は連続呼び出しで 429 を返す。最低間隔を空け、429 は待って 1 度だけ再試行する。
_MIN_INTERVAL = 0.85
_last_call = 0.0
_lock = threading.Lock()
_cache: dict[str, list[dict]] = {}


def _fetch(url: str):
    global _last_call
    for attempt in range(3):
        with _lock:
            wait = _MIN_INTERVAL - (time.monotonic() - _last_call)
            if wait > 0:
                time.sleep(wait)
            _last_call = time.monotonic()
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise


def search(query: str, hits: int = 20) -> list[dict]:
    if query in _cache:
        return _cache[query]
    app, key = _creds()
    if not app or not key:
        raise RuntimeError("RAKUTEN_APP_ID / RAKUTEN_ACCESS_KEY が設定されていません")
    params = {
        "applicationId": app, "accessKey": key,
        "keyword": query, "hits": hits, "imageFlag": 1, "sort": "standard",
    }
    url = ENDPOINT + "?" + urllib.parse.urlencode(params)
    data = _fetch(url)

    items = []
    for row in data.get("Items", []):
        it = row.get("Item", row)
        name = it.get("itemName", "")
        if any(w in name for w in NG_WORDS):
            continue
        imgs = it.get("mediumImageUrls") or it.get("smallImageUrls") or []
        img = imgs[0].get("imageUrl", "") if imgs and isinstance(imgs[0], dict) else ""
        if not img:
            continue
        items.append({
            "item_code": it.get("itemCode", ""),
            "name": name,
            "price": it.get("itemPrice", 0),
            "image": _big(img),
            "url": it.get("itemUrl", ""),
            "shop": it.get("shopName", ""),
        })
    _cache[query] = items
    return items


def search_any(queries: list[str], hits: int = 20) -> tuple[list[dict], str]:
    """候補の検索語を順に試し、最初に当たったものを返す。"""
    for q in queries:
        if not q.strip():
            continue
        try:
            items = search(q, hits=hits)
        except Exception:
            continue
        if items:
            return items, q
    return [], queries[0] if queries else ""
