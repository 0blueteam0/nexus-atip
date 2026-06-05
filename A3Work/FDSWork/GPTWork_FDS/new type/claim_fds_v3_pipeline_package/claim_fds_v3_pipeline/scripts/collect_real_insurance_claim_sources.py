from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import mimetypes
import random
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageOps


USER_AGENT = "Mozilla/5.0 (compatible; InsuranceFDSResearchBot/0.1; defensive-public-source-catalog; rate-limited)"

# 실손보험 청구서류 FDS용 실제 웹 원본 후보 수집 쿼리입니다.
# 검색 엔진 차단을 피하기 위해 동시 요청을 하지 않고, 쿼리 사이 sleep/jitter를 둡니다.
# 사람이 보는 이미지/contact sheet/파일명에는 영문 field/doc_type 토큰을 쓰지 않습니다.
DOCUMENT_TYPE_KO = {
    "medical_receipt": "진료비계산서영수증",
    "medical_detail_statement": "진료비세부산정내역서",
    "pharmacy_receipt": "약제비영수증",
    "prescription": "처방전",
    "claim_application": "보험금청구서",
    "diagnosis_certificate": "진단서",
    "hospitalization_confirmation": "입퇴원확인서",
    "outpatient_confirmation": "통원확인서",
    "treatment_confirmation": "진료확인서",
    "medical_opinion": "소견서",
    "medical_chart": "진료차트",
    "camera_submission": "모바일촬영제출",
    "forgery_news_case": "위변조뉴스사례",
    "regulator_case_release": "감독수사기관사례",
    "court_case": "판결사례",
}

QUERY_BANK: dict[str, list[str]] = {
    "medical_receipt": [
        '"진료비 계산서 영수증" 이미지',
        '"진료비계산서·영수증" "실손"',
        '"진료비 계산서" "영수증" "샘플"',
        '"진료비 영수증" "보험금 청구"',
        '"진료비 계산서 영수증" "jpg"',
        '"진료비 계산서 영수증" "png"',
        '"진료비 계산서 영수증" "카메라"',
        '"진료비 계산서 영수증" "사진"',
        '"진료비 계산서 영수증" "스캔"',
        'site:blog.naver.com "진료비 영수증" "실비"',
        'site:tistory.com "진료비 영수증" "실손"',
        'site:kin.naver.com "진료비 영수증" "실손보험"',
    ],
    "medical_detail_statement": [
        '"진료비 세부산정내역서" 이미지',
        '"진료비 세부내역서" "실손"',
        '"진료비 세부산정내역서" "보험금 청구"',
        '"진료비 세부산정내역서" "jpg"',
        '"진료비 세부내역서" "png"',
        'site:blog.naver.com "진료비 세부내역서" "실비"',
        'site:tistory.com "진료비 세부산정내역서"',
        '"진료비 세부산정내역서" "사진"',
        '"진료비 세부산정내역서" "스캔"',
    ],
    "pharmacy_receipt": [
        '"약제비 영수증" 이미지',
        '"약제비 계산서 영수증" "실손"',
        '"약국 영수증" "실비 청구"',
        '"약제비 영수증" "보험금 청구"',
        'site:blog.naver.com "약제비 영수증" "실비"',
    ],
    "prescription": [
        '"처방전" "실손보험" "이미지"',
        '"처방전" "보험금 청구" "질병분류기호"',
        '"처방전" "실비" "영수증"',
        'site:blog.naver.com "처방전" "실비 청구"',
    ],
    "claim_application": [
        '"실손보험" "보험금 청구서" "양식"',
        '"실비보험" "보험금 청구서" "이미지"',
        '"보험금 청구서" "실손의료비" "pdf"',
        '"보험금 청구서" "구비서류" "실손"',
        'site:*.co.kr "보험금 청구서" "실손의료비" "PDF"',
    ],
    "diagnosis_certificate": [
        '"진단서" "실손보험" "질병분류기호"',
        '"진단서" "보험금 청구" "이미지"',
        '"진단서" "실비" "청구"',
    ],
    "hospitalization_confirmation": [
        '"입퇴원확인서" "실손보험"',
        '"입퇴원확인서" "보험금 청구" "이미지"',
        '"입원확인서" "실비 청구"',
        '"입퇴원확인서" "실비보험" "양식"',
        '"입퇴원확인서" "보험금" "제출서류"',
    ],
    "outpatient_confirmation": [
        '"통원확인서" "실손보험"',
        '"통원확인서" "보험금 청구"',
        '"통원확인서" "실비 청구" "이미지"',
        '"외래진료확인서" "실손보험"',
        '"외래확인서" "보험금 청구"',
    ],
    "treatment_confirmation": [
        '"진료확인서" "실손보험"',
        '"진료확인서" "보험금 청구"',
        '"진료확인서" "실비" "양식"',
        '"진료확인서" "이미지" "청구"',
    ],
    "medical_opinion": [
        '"소견서" "실손보험"',
        '"의사소견서" "보험금 청구"',
        '"진료소견서" "실비"',
        '"소견서" "청구서류" "보험"',
    ],
    "medical_chart": [
        '"진료차트" "실손보험"',
        '"진료차트" "보험금 청구"',
        '"의무기록 사본" "실손보험"',
        '"진료기록" "보험금 청구"',
        '"진료차트 사본" "발급" "보험"',
    ],
    "camera_submission": [
        '"실손보험 청구" "사진" "영수증"',
        '"실비 청구" "영수증 사진"',
        '"모바일 청구" "진료비 영수증"',
        '"보험금 청구" "카메라" "영수증"',
        '"실손24" "진료비 영수증"',
    ],
    "forgery_news_case": [
        '"실손보험" "진단서 위조" "뉴스"',
        '"실비보험" "진단서 위조" "보험사기"',
        '"보험금 청구서류" "위조" "뉴스"',
        '"보험금 청구서류" "변조" "보험사기"',
        '"진료비 영수증" "위조" "보험사기"',
        '"진료비 세부내역서" "위조" "보험사기"',
        '"약제비 영수증" "위조" "보험사기"',
        '"처방전" "위조" "보험사기"',
        '"통원확인서" "위조" "보험금 청구"',
        '"입퇴원확인서" "위조" "보험사기"',
        '"진료확인서" "위조" "보험사기"',
        '"소견서" "위조" "보험금 청구"',
        '"진료차트" "조작" "보험사기"',
        '"의무기록" "조작" "보험사기"',
        'site:yna.co.kr "실손보험" "보험사기" "진단서"',
        'site:newsis.com "실손보험" "허위청구"',
        'site:ytn.co.kr "보험사기" "진단서 위조"',
        'site:news.kbs.co.kr "보험사기" "허위 진단서"',
        'site:imnews.imbc.com "실손보험" "보험사기"',
    ],
    "regulator_case_release": [
        'site:fss.or.kr "실손보험" "보험사기" "허위청구"',
        'site:fss.or.kr "보험사기" "진단서"',
        'site:police.go.kr "보험사기" "진단서 위조"',
        'site:spo.go.kr "보험사기" "진료기록"',
        'site:kidi.or.kr "실손보험" "보험사기"',
        'site:knia.or.kr "실손보험" "보험사기"',
    ],
    "court_case": [
        '"보험사기" "진단서 위조" "판결"',
        '"보험사기" "허위 진단서" "판례"',
        '"위조사문서행사" "보험금 청구" "진단서"',
        '"사문서위조" "보험금 청구" "영수증"',
        '"보험사기" "진료기록 조작" "판결"',
    ],
}

POSITIVE_TERMS = [
    "진료비", "영수증", "세부", "산정", "약제비", "처방전", "보험금", "청구", "실손", "실비", "진단서", "입퇴원", "확인서",
    "통원", "진료확인", "소견서", "진료차트", "의무기록", "진료기록", "보험사기", "위조", "변조", "허위청구", "판결", "보도자료"
]
NEGATIVE_TERMS = [
    "soto", "recipe", "ppt", "slideshare", "delicatessen", "kusama", "草間", "tanda terima", "food", "아트", "미술",
    "위조 방법", "만드는 법", "포토샵 방법", "위조 대행", "가짜 진단서", "가짜 처방전"
]

# 검색 결과 페이지가 보험/실손 키워드를 포함하더라도 실제 이미지가 기본 썸네일, 프로필 배경,
# 기관 로고, stock photo이면 FDS 원본 문서 후보가 아닙니다. 이전 넓은 수집 run에서
# default_L.png, no-image-v1.png, homeimg.png, AdobeStock 계열이 중요 후보로 잘못 올라온
# 것이 확인되어 URL 레벨에서 선제 제외합니다.
NEGATIVE_ASSET_PATTERNS = [
    "default_l",
    "no-image",
    "no_image",
    "homeimg",
    "dropdown-profile",
    "profile_bg",
    "profile-bg",
    "/logo",
    "logo_",
    "_logo",
    "/icon",
    "icon_",
    "sprite",
    "avatar",
    "newimg/",
    "/main/nav/",
    "ic_search",
    "call_code",
    "kpubpop",
    "pop02",
    "img_d1_comp",
    "/writer/",
    "kb%20think",
    "banner-npay",
    "actual-cost-insurance/img-",
    "adobestock",
    "shutterstock",
    "gettyimages",
    "istockphoto",
]

# raw_images가 너무 넓게 채워지는 것을 막기 위한 선다운로드 노이즈 차단어입니다.
# 실제 보험/의료 청구 문서가 아니라 판다·인물·프로필·상담 배너·동물/음식/스톡 사진으로
# 보이는 후보는 OCR까지 가지 않고 카탈로그 단계에서 제외합니다.
NON_DOCUMENT_VISUAL_NOISE_TERMS = [
    "판다", "panda", "푸바오", "fubao", "동물", "animal", "cat", "dog", "pet",
    "인물", "사람", "people", "person", "portrait", "face", "프로필", "profile", "avatar",
    "상담사", "설계사", "doctor_people", "staff", "team", "banner", "배너", "main_visual",
    "gpu", "rtx", "geforce", "显卡", "天梯图", "allevents", "events in", "travel", "tour",
    "나무위키", "namu.wiki", "한국민족문화대백과사전", "encykorea", "설문", "survey",
    "food", "recipe", "요리", "맛집", "stock", "adobestock", "shutterstock", "gettyimages", "istockphoto",
]

# OCR에서 확인해야 하는 한국어 실손/의료 청구 문서 필드 신호입니다. 단순 블로그 본문이나
# 귀여운 동물 이미지 텍스트는 한국어가 있어도 이 필드 신호가 부족하므로 rejected가 됩니다.
OCR_FIELD_GROUPS_KO: dict[str, list[str]] = {
    "document_title": ["진료비계산서", "진료비 계산서", "영수증", "세부산정내역서", "세부내역서", "처방전", "진단서", "확인서", "청구서"],
    "amount": ["총진료비", "진료비총액", "본인부담", "환자부담", "비급여", "급여", "청구금액", "납부", "수납", "원"],
    "date": ["진료일", "발급일", "발행일", "처방일", "입원일", "퇴원일", "내원일", "통원일"],
    "issuer": ["의료기관", "요양기관", "병원", "의원", "약국", "사업자등록", "대표자"],
    "patient_or_code": ["환자", "성명", "등록번호", "영수증번호", "질병분류", "상병", "진단명"],
}

TRUSTED_SEED_URLS = [
    "https://www.hira.or.kr/",
    "https://www.nhis.or.kr/",
    "https://www.mohw.go.kr/",
    "https://www.law.go.kr/",
    "https://www.fss.or.kr/",
    "https://www.knia.or.kr/",
    "https://www.kidi.or.kr/",
]


@dataclass
class Candidate:
    candidate_id: str
    document_type_guess: str
    document_type_label_ko: str
    source_kind: str
    query: str
    title: str
    page_url: str
    image_url: str
    local_path: str
    width: int | None
    height: int | None
    sha256: str | None
    relevance_score: int
    privacy_review_status: str
    license_status: str
    collection_status: str
    rejection_reason: str
    verification_evidence_json: str
    collected_at_epoch: float


def safe_name(value: str, limit: int = 120) -> str:
    text = re.sub(r"[\\/:*?\"<>|\r\n\t]+", "-", value).strip("-_. ")
    text = re.sub(r"\s+", "_", text)
    return (text or "NA")[:limit]


def document_type_label(doc_type: str) -> str:
    """Return a Korean/non-English visual label for contact sheets and review paths."""

    return DOCUMENT_TYPE_KO.get(doc_type, "문서유형미분류")


def pre_download_candidate_gate(title: str, page_url: str, image_url: str) -> tuple[bool, str]:
    """Reject obvious non-document visual noise before writing broad raw_images files.

    이 함수는 OCR 이전의 저비용 방어선입니다. 검색 결과 제목/페이지/이미지 URL만 보고
    판다, 인물 프로필, 배너, 스톡 사진처럼 실제 영수증·처방전·청구서 원본 가능성이 낮은
    이미지를 raw_images에 저장하지 않도록 막습니다.
    """

    hay = (title + " " + page_url + " " + image_url).lower()
    if any(pattern in hay for pattern in NEGATIVE_ASSET_PATTERNS):
        return False, "non_document_or_placeholder_asset"
    if any(term.lower() in hay for term in NON_DOCUMENT_VISUAL_NOISE_TERMS):
        return False, "non_document_visual_noise"
    return True, ""


def score_ocr_document_signal(tokens: list[str]) -> dict[str, Any]:
    """Score whether OCR text looks like a Korean insurance/medical claim document.

    원문 OCR은 저장하지 않아도 되므로, 게이트에서는 토큰 문자열을 즉시 점수화한 뒤
    필드 그룹 수와 문서성 여부만 manifest에 남깁니다.
    """

    joined = re.sub(r"\s+", "", " ".join(tokens))
    has_korean = bool(re.search(r"[가-힣]", joined))
    matched_groups: list[str] = []
    matched_terms: list[str] = []
    for group, terms in OCR_FIELD_GROUPS_KO.items():
        compact_terms = [term.replace(" ", "") for term in terms]
        hits = [term for term in compact_terms if term and term in joined]
        if hits:
            matched_groups.append(group)
            matched_terms.extend(hits[:3])
    amount_like = bool(re.search(r"\d{1,3}(,\d{3})+원?|\d+원", joined))
    date_like = bool(re.search(r"\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}", joined))
    field_hint_count = len(set(matched_groups))
    is_document = has_korean and (field_hint_count >= 2 or (field_hint_count >= 1 and amount_like and date_like))
    return {
        "is_korean_claim_document": is_document,
        "has_korean": has_korean,
        "field_hint_count": field_hint_count,
        "matched_groups": sorted(set(matched_groups)),
        "matched_terms_sample": sorted(set(matched_terms))[:12],
        "amount_like": amount_like,
        "date_like": date_like,
    }


def extract_ocr_texts_for_gate(image_path: Path, max_tokens: int = 120) -> list[str]:
    """Run lightweight RapidOCR for collection gating without storing raw OCR text."""

    try:
        from rapidocr_onnxruntime import RapidOCR

        result, _ = RapidOCR()(str(image_path))
    except Exception:
        return []
    texts: list[str] = []
    for item in result or []:
        if len(item) >= 2:
            texts.append(str(item[1]))
        if len(texts) >= max_tokens:
            break
    return texts


def image_shape_document_signal(width: int | None, height: int | None) -> bool:
    """Very small vision heuristic: real document photos/scans are usually rectangular and large enough."""

    if not width or not height:
        return False
    if min(width, height) < 260 or max(width, height) < 520:
        return False
    ratio = max(width, height) / max(1, min(width, height))
    return 1.1 <= ratio <= 3.2


def should_accept_downloaded_image(
    title: str,
    page_url: str,
    image_url: str,
    image_path: Path,
    width: int | None,
    height: int | None,
    relevance: int,
    verification_mode: str,
) -> tuple[bool, str, dict[str, Any]]:
    """Combine keyword, vision-shape, and OCR signals before moving an image into raw_images."""

    ok, reason = pre_download_candidate_gate(title, page_url, image_url)
    if not ok:
        return False, reason, {"pre_download_gate": reason}
    if verification_mode == "keyword_only":
        return True, "", {"verification_mode": "keyword_only"}
    tokens = extract_ocr_texts_for_gate(image_path)
    ocr_signal = score_ocr_document_signal(tokens)
    shape_ok = image_shape_document_signal(width, height)
    strong_keyword_context = relevance >= 8 and any(term in (title + " " + page_url + " " + image_url) for term in POSITIVE_TERMS)
    accepted = bool(ocr_signal["is_korean_claim_document"] and shape_ok) or bool(strong_keyword_context and shape_ok and ocr_signal["has_korean"])
    evidence = {
        "verification_mode": verification_mode,
        "ocr_signal": ocr_signal,
        "vision_shape_document_signal": shape_ok,
        "strong_keyword_context": strong_keyword_context,
        "raw_ocr_text_stored": False,
    }
    return accepted, "" if accepted else "ocr_vision_gate_failed", evidence


def quote_url_for_request(url: str) -> str:
    """Percent-encode non-ASCII URL parts before urllib Request.

    검색 결과에는 한글 경로가 그대로 들어간 image URL이 섞입니다. urllib Request는 이런 URL을
    ASCII로 인코딩하려다 UnicodeEncodeError를 낼 수 있으므로, scheme/netloc은 보존하고 path,
    query, fragment만 안전하게 quote합니다.
    """

    parts = urllib.parse.urlsplit(url)
    path = urllib.parse.quote(parts.path, safe="/%:@")
    query = urllib.parse.quote(parts.query, safe="=&?/:+,%@")
    fragment = urllib.parse.quote(parts.fragment, safe="=&?/:+,%@")
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, path, query, fragment))


def fetch_text(url: str, timeout: int = 20) -> str:
    req = urllib.request.Request(quote_url_for_request(url), headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read(2_000_000)
    return raw.decode("utf-8", "ignore")


def fetch_bytes(url: str, timeout: int = 25, max_bytes: int = 8_000_000) -> bytes:
    req = urllib.request.Request(quote_url_for_request(url), headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise ValueError("too_large")
    return data


def bing_rss_search(query: str, limit: int) -> list[dict[str, str]]:
    url = "https://www.bing.com/search?format=rss&q=" + urllib.parse.quote(query)
    out: list[dict[str, str]] = []
    try:
        root = ET.fromstring(fetch_text(url))
        for item in root.findall(".//item")[:limit]:
            out.append({
                "title": item.findtext("title") or "",
                "page_url": item.findtext("link") or "",
                "snippet": item.findtext("description") or "",
            })
    except Exception as exc:
        out.append({"title": "ERROR", "page_url": "", "snippet": f"bing_rss_error:{type(exc).__name__}:{exc}"})
    return out


def duckduckgo_lite_search(query: str, limit: int) -> list[dict[str, str]]:
    url = "https://duckduckgo.com/html/?q=" + urllib.parse.quote(query)
    out: list[dict[str, str]] = []
    try:
        data = fetch_text(url)
        for href, title_html in re.findall(r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>', data)[:limit]:
            title = re.sub("<.*?>", "", html.unescape(title_html))
            href = html.unescape(href)
            out.append({"title": title, "page_url": href, "snippet": ""})
    except Exception as exc:
        out.append({"title": "ERROR", "page_url": "", "snippet": f"duckduckgo_error:{type(exc).__name__}:{exc}"})
    return out


def bing_image_search(query: str, limit: int) -> list[dict[str, str]]:
    url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query) + "&form=HDRSC2"
    out: list[dict[str, str]] = []
    try:
        data = fetch_text(url)
        for match in re.finditer(r'm="({.*?})"', data):
            try:
                meta = json.loads(html.unescape(match.group(1)))
            except Exception:
                continue
            image_url = meta.get("murl") or ""
            if not image_url:
                continue
            out.append({
                "title": meta.get("t") or "",
                "page_url": meta.get("purl") or "",
                "image_url": image_url,
            })
            if len(out) >= limit:
                break
    except Exception as exc:
        out.append({"title": "ERROR", "page_url": "", "image_url": "", "snippet": f"bing_image_error:{type(exc).__name__}:{exc}"})
    return out


def firecrawl_search(query: str, limit: int) -> list[dict[str, str]]:
    # Firecrawl self-host 배포마다 엔드포인트가 조금 다릅니다. 동작하는 경우만 사용하고 실패는 증거로 남깁니다.
    endpoints = [
        ("http://localhost:3002/v1/search", {"query": query, "limit": limit}),
        ("http://localhost:3002/search", {"query": query, "limit": limit}),
    ]
    out: list[dict[str, str]] = []
    for endpoint, payload in endpoints:
        try:
            body = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(endpoint, data=body, headers={"Content-Type": "application/json", "User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=20) as resp:
                parsed = json.loads(resp.read().decode("utf-8", "ignore"))
            data = parsed.get("data") if isinstance(parsed, dict) else parsed
            if isinstance(data, list):
                for item in data[:limit]:
                    if isinstance(item, dict):
                        out.append({"title": str(item.get("title") or ""), "page_url": str(item.get("url") or item.get("page_url") or ""), "snippet": str(item.get("description") or item.get("markdown") or "")[:400]})
                if out:
                    return out
        except Exception as exc:
            out.append({"title": "ERROR", "page_url": endpoint, "snippet": f"firecrawl_error:{type(exc).__name__}:{exc}"})
    return out



def absolutize_url(base_url: str, maybe_url: str) -> str:
    maybe_url = html.unescape(maybe_url or "").strip()
    if not maybe_url or maybe_url.startswith("data:"):
        return ""
    return urllib.parse.urljoin(base_url, maybe_url)


def extract_page_assets(page_url: str, query: str, doc_type: str, limit: int = 8) -> list[dict[str, str]]:
    """Extract image/PDF candidates from a search-result page.

    실제 청구서류 후보는 검색엔진 image 탭보다 블로그/보험사/병원 안내 페이지 내부에
    첨부된 사진·스캔 이미지인 경우가 많으므로 page-first 추출을 우선합니다.
    """

    out: list[dict[str, str]] = []
    if not page_url.startswith(("http://", "https://")):
        return out
    try:
        data = fetch_text(page_url, timeout=18)
    except Exception:
        return out
    title_match = re.search(r"<title[^>]*>(.*?)</title>", data, flags=re.I | re.S)
    page_title = re.sub(r"\s+", " ", html.unescape(title_match.group(1))).strip() if title_match else ""
    patterns = [
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'<img[^>]+(?:src|data-src|data-original)=["\']([^"\']+)["\']',
        r'<a[^>]+href=["\']([^"\']+\.(?:jpg|jpeg|png|webp|pdf)(?:\?[^"\']*)?)["\']',
    ]
    seen: set[str] = set()
    for pat in patterns:
        for m in re.finditer(pat, data, flags=re.I | re.S):
            asset = absolutize_url(page_url, m.group(1))
            if not asset or asset in seen:
                continue
            seen.add(asset)
            low = asset.lower()
            is_doc_asset = any(ext in low for ext in [".jpg", ".jpeg", ".png", ".webp", ".pdf"])
            if not is_doc_asset:
                continue
            score, reject = relevance_score(page_title + " " + query, page_url, asset)
            # 페이지 자체가 강하게 관련 있으면 파일명에 키워드가 없어도 후보로 둡니다.
            if score <= 0 and any(term in (page_title + query) for term in POSITIVE_TERMS):
                score = 1
            out.append({
                "title": page_title,
                "page_url": page_url,
                "image_url": asset if not low.endswith(".pdf") else "",
                "pdf_url": asset if low.endswith(".pdf") else "",
                "snippet": f"page_asset_score={score}; reject={reject}",
            })
            if len(out) >= limit:
                return out
    return out

def relevance_score(title: str, page_url: str, image_url: str = "") -> tuple[int, str]:
    hay = (title + " " + page_url + " " + image_url).lower()
    score = 0
    reject_reasons: list[str] = []
    for term in POSITIVE_TERMS:
        if term.lower() in hay:
            score += 2
    for term in NEGATIVE_TERMS:
        if term.lower() in hay:
            score -= 8
    image_low = image_url.lower()
    if image_low and any(pattern in image_low for pattern in NEGATIVE_ASSET_PATTERNS):
        score -= 14
        reject_reasons.append("non_document_or_placeholder_asset")
    if re.search(r"\.(jpg|jpeg|png|webp)(\?|$)", image_url.lower()):
        score += 2
    if re.search(r"\.(pdf)(\?|$)", page_url.lower()):
        score += 1
    reason = "" if score > 0 else "low_keyword_relevance_or_negative_terms"
    if reject_reasons:
        reason = ";".join(reject_reasons + ([reason] if reason else []))
    return score, reason


def infer_ext(url: str, data: bytes) -> str:
    lower = urllib.parse.urlparse(url).path.lower()
    for ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"]:
        if lower.endswith(ext):
            return ".jpg" if ext == ".jpeg" else ext
    guessed = mimetypes.guess_extension("image/jpeg") or ".jpg"
    if data[:8].startswith(b"\x89PNG"):
        return ".png"
    if data[:4] == b"RIFF":
        return ".webp"
    return guessed


def save_image_candidate(
    out_dir: Path,
    doc_type: str,
    idx: int,
    image_url: str,
    title: str,
    page_url: str,
    relevance: int,
    verification_mode: str,
) -> tuple[str, int | None, int | None, str | None, str, dict[str, Any]]:
    """Download to staging first, then move only OCR/vision-passed images to raw_images."""

    gate_ok, gate_reason = pre_download_candidate_gate(title, page_url, image_url)
    if not gate_ok:
        return "", None, None, None, f"rejected_pre_download:{gate_reason}", {"pre_download_gate": gate_reason}
    try:
        data = fetch_bytes(image_url)
        digest = hashlib.sha256(data).hexdigest()
        ext = infer_ext(image_url, data)
        # 사람이 직접 여는 파일명에는 medical_receipt 같은 영문 doc_type 토큰을 넣지 않습니다.
        # 세부 문서유형은 manifest의 document_type_guess/document_type_label_ko에서만 확인합니다.
        staged = out_dir / "staging_images" / f"문서후보검증중_{idx:05d}_{digest[:10]}{ext}"
        staged.parent.mkdir(parents=True, exist_ok=True)
        staged.write_bytes(data)
        try:
            with Image.open(staged) as img:
                img.verify()
            with Image.open(staged) as img:
                w, h = img.size
                if min(w, h) < 180:
                    staged.unlink(missing_ok=True)
                    return "", w, h, digest, "rejected_too_small_non_document_asset", {"min_dimension": min(w, h)}
        except Exception as exc:
            staged.unlink(missing_ok=True)
            return "", None, None, digest, f"downloaded_but_not_valid_image:{type(exc).__name__}", {
                "image_validation_error_type": type(exc).__name__,
                "image_validation_error_message": str(exc),
            }
        accepted, reject_reason, evidence = should_accept_downloaded_image(title, page_url, image_url, staged, w, h, relevance, verification_mode)
        if not accepted:
            rejected = out_dir / "rejected_images" / f"거절_{idx:05d}_{digest[:10]}{ext}"
            rejected.parent.mkdir(parents=True, exist_ok=True)
            staged.replace(rejected)
            evidence["rejected_image_path"] = str(rejected.as_posix())
            return "", w, h, digest, f"rejected_after_ocr_vision:{reject_reason}", evidence
        path = out_dir / "raw_images" / f"문서후보_{idx:05d}_{digest[:10]}{ext}"
        path.parent.mkdir(parents=True, exist_ok=True)
        staged.replace(path)
        evidence["accepted_image_path"] = str(path.as_posix())
        return str(path.as_posix()), w, h, digest, "downloaded_quarantine_ocr_vision_pass", evidence
    except Exception as exc:
        return "", None, None, None, f"download_error:{type(exc).__name__}:{exc}", {}


def make_contact_sheet(manifest_rows: list[Candidate], output_dir: Path, max_items: int = 60) -> None:
    downloaded = [r for r in manifest_rows if r.local_path and Path(r.local_path).exists() and r.collection_status.startswith("downloaded_quarantine")]
    thumbs = []
    for row in downloaded[:max_items]:
        try:
            img = Image.open(row.local_path).convert("RGB")
            img.thumbnail((220, 180))
            canvas = Image.new("RGB", (240, 230), "white")
            canvas.paste(img, ((240 - img.width) // 2, 5))
            draw = ImageDraw.Draw(canvas)
            draw.text((5, 188), row.candidate_id[-18:], fill=(0, 0, 0))
            draw.text((5, 204), row.document_type_label_ko[:28], fill=(0, 0, 0))
            thumbs.append(canvas)
        except Exception:
            continue
    if not thumbs:
        return
    cols = 4
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 240, rows * 230), "white")
    for i, thumb in enumerate(thumbs):
        sheet.paste(thumb, ((i % cols) * 240, (i // cols) * 230))
    out = output_dir / "contact_sheets" / "real_web_candidate_contact_sheet.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=88)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output-dir", required=True)
    ap.add_argument("--max-queries", type=int, default=30)
    ap.add_argument("--per-query", type=int, default=8)
    ap.add_argument("--download-images", action="store_true")
    ap.add_argument("--sleep-min", type=float, default=2.0)
    ap.add_argument("--sleep-max", type=float, default=5.0)
    ap.add_argument("--source-mode", choices=["balanced", "focused"], default="focused")
    ap.add_argument("--firecrawl-mode", choices=["off", "trusted_seed", "query"], default="trusted_seed")
    ap.add_argument("--verification-mode", choices=["ocr_vision", "keyword_only"], default="ocr_vision")
    args = ap.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    events_dir = output_dir / "events"
    events_dir.mkdir(exist_ok=True)
    manifest_path = output_dir / "real_web_source_candidates.manifest.jsonl"
    query_log_path = output_dir / "query_log.jsonl"
    csv_path = output_dir / "real_web_source_candidates.index.csv"

    all_queries: list[tuple[str, str]] = []
    for doc_type, qs in QUERY_BANK.items():
        for q in qs:
            all_queries.append((doc_type, q))
    random.Random(20260605).shuffle(all_queries)
    all_queries = all_queries[: args.max_queries]

    seen_keys: set[str] = set()
    candidates: list[Candidate] = []
    idx = 0

    for doc_type, query in all_queries:
        sources: list[tuple[str, list[dict[str, str]]]] = []
        sources.append(("bing_rss", bing_rss_search(query, args.per_query)))
        time.sleep(random.uniform(args.sleep_min, args.sleep_max))
        if args.source_mode == "balanced":
            sources.append(("bing_images", bing_image_search(query, args.per_query)))
            time.sleep(random.uniform(args.sleep_min, args.sleep_max))
        sources.append(("duckduckgo_lite", duckduckgo_lite_search(query, min(4, args.per_query))))
        time.sleep(random.uniform(args.sleep_min, args.sleep_max))
        if args.firecrawl_mode == "query":
            # Firecrawl query search is intentionally opt-in because broad search created noisy/failed collection.
            sources.append(("firecrawl_query_opt_in", firecrawl_search(query, min(5, args.per_query))))
        elif args.firecrawl_mode == "trusted_seed":
            # 기본 Firecrawl/페이지 수집은 신뢰 도메인 seed에서만 asset을 좁게 추출합니다.
            trusted_assets: list[dict[str, str]] = []
            for seed_url in TRUSTED_SEED_URLS[:3]:
                trusted_assets.extend(extract_page_assets(seed_url, query, doc_type, limit=2))
                time.sleep(random.uniform(args.sleep_min, args.sleep_max))
            if trusted_assets:
                sources.append(("trusted_seed_asset_extractor", trusted_assets))
        page_sources: list[dict[str, str]] = []
        for _, page_rows in sources:
            for page_row in page_rows[:3]:
                page_url = page_row.get("page_url", "")
                if page_url and page_url.startswith(("http://", "https://")):
                    page_sources.extend(extract_page_assets(page_url, query, doc_type, limit=4))
                    time.sleep(random.uniform(args.sleep_min, args.sleep_max))
        if page_sources:
            sources.append(("page_asset_extractor", page_sources[: args.per_query * 3]))

        with query_log_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps({"document_type": doc_type, "query": query, "sources": sources, "ts": time.time()}, ensure_ascii=False) + "\n")

        for source_kind, rows in sources:
            for row in rows:
                title = row.get("title", "")
                page_url = row.get("page_url", "")
                image_url = row.get("image_url", "")
                pdf_url = row.get("pdf_url", "")
                key = image_url or pdf_url or page_url
                if not key or key in seen_keys:
                    continue
                seen_keys.add(key)
                score, reject = relevance_score(title, page_url, image_url)
                verification_evidence: dict[str, Any] = {}
                if image_url:
                    gate_ok, gate_reason = pre_download_candidate_gate(title, page_url, image_url)
                    if not gate_ok:
                        reject = ";".join([x for x in [gate_reason, reject] if x])
                        verification_evidence["pre_download_gate"] = gate_reason
                idx += 1
                local_path = ""
                width = height = None
                digest = None
                status = "cataloged_page_candidate"
                if pdf_url and score > 0:
                    status = "cataloged_pdf_candidate_quarantine"
                if image_url and args.download_images and score >= 4 and not reject:
                    local_path, width, height, digest, status, verification_evidence = save_image_candidate(
                        output_dir, doc_type, idx, image_url, title, page_url, score, args.verification_mode
                    )
                    if status.startswith("downloaded_quarantine") and score >= 4:
                        alert = events_dir / f"important_candidate_{idx:05d}.txt"
                        alert.write_text(f"important_candidate\nquery={query}\ndocument_type_label_ko={document_type_label(doc_type)}\ntitle={title}\npage_url={page_url}\nimage_url={image_url}\nlocal_path={local_path}\nscore={score}\n", encoding="utf-8")
                c = Candidate(
                    candidate_id=f"NO_REAL_WEB_CANDIDATE_{idx:05d}",
                    document_type_guess=doc_type,
                    document_type_label_ko=document_type_label(doc_type),
                    source_kind=source_kind,
                    query=query,
                    title=title,
                    page_url=page_url,
                    image_url=image_url,
                    local_path=local_path,
                    width=width,
                    height=height,
                    sha256=digest,
                    relevance_score=score,
                    privacy_review_status="quarantine_requires_manual_pii_review",
                    license_status="unverified",
                    collection_status=status if not reject else f"rejected_or_low_priority:{reject}",
                    rejection_reason=reject,
                    verification_evidence_json=json.dumps(verification_evidence, ensure_ascii=False, sort_keys=True),
                    collected_at_epoch=time.time(),
                )
                candidates.append(c)
                with manifest_path.open("a", encoding="utf-8") as f:
                    f.write(json.dumps(asdict(c), ensure_ascii=False) + "\n")
        print(f"[progress] query={query} candidates={len(candidates)} downloaded={sum(1 for c in candidates if c.local_path)}", flush=True)
        time.sleep(random.uniform(args.sleep_min, args.sleep_max))

    make_contact_sheet(candidates, output_dir)
    with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(asdict(candidates[0]).keys()) if candidates else ["candidate_id"])
        writer.writeheader()
        for c in candidates:
            writer.writerow(asdict(c))

    summary = {
        "ok": True,
        "query_count": len(all_queries),
        "candidate_count": len(candidates),
        "downloaded_count": sum(1 for c in candidates if c.local_path),
        "important_event_count": len(list(events_dir.glob("important_candidate_*.txt"))),
        "verification_mode": args.verification_mode,
        "pre_download_reject_count": sum(1 for c in candidates if "pre_download_gate" in c.verification_evidence_json),
        "rejected_after_ocr_vision_count": sum(1 for c in candidates if c.collection_status.startswith("rejected_after_ocr_vision")),
        "manifest": str(manifest_path.as_posix()),
        "csv": str(csv_path.as_posix()),
        "contact_sheet": str((output_dir / "contact_sheets" / "real_web_candidate_contact_sheet.jpg").as_posix()),
        "safety": "All downloaded files are quarantined candidates; do not train or redistribute before PII/license review.",
    }
    (output_dir / "collection_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
