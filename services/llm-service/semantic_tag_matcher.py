"""
Semantic Tag Matcher for B-roll Assets (BE2 Week 6)
Matches review script scenes (visualTag, voiceover, role) against available B-roll video/image assets.
Prioritizes dynamic MP4 video over static images for TikTok review format.
"""

import re
from typing import Dict, List, Optional, Any


# Standard role-specific default tags for fallback matching
ROLE_TAG_MAPPING = {
    "hook": ["scenic", "aerial", "drone", "overview", "highlight", "breathtaking", "checkin"],
    "experience": ["activity", "attraction", "ride", "explore", "cable_car", "landscape", "vlog"],
    "pricing": ["pricing", "overview", "entrance", "ticket", "gate", "landmark", "park"],
    "cta": ["logo", "action", "booking", "summary", "invitation", "cta"],
}


def normalize_token(text: str) -> str:
    """Normalize text into lowercase alphanumeric tokens."""
    if not text:
        return ""
    return re.sub(r"[^\w\s]", " ", text.lower()).strip()


def extract_keywords(text: str) -> set:
    """Extract set of normalized words from text, ignoring short stopwords."""
    norm = normalize_token(text)
    words = norm.split()
    stopwords = {"la", "va", "cua", "cho", "voi", "o", "trong", "tai", "nhung", "cac", "mot", "duoc", "nay", "den"}
    return {w for w in words if len(w) > 2 and w not in stopwords}


def calculate_match_score(
    scene: Dict[str, Any],
    asset: Dict[str, Any]
) -> float:
    """
    Calculate semantic match score between a scene and a media asset.
    Score range: 0.0 to 1.0 (with bonuses up to 1.2 for MP4 videos).
    """
    visual_tag = normalize_token(scene.get("visualTag", ""))
    role = scene.get("role", "experience").lower()
    voiceover = scene.get("voiceover", "")

    asset_name = normalize_token(asset.get("name", ""))
    asset_desc = normalize_token(asset.get("description", ""))
    asset_tags = [normalize_token(t) for t in asset.get("tags", [])]
    media_type = asset.get("type", "image").lower()

    score = 0.0

    # 1. Direct Visual Tag Match
    scene_tag_tokens = set(visual_tag.split("_")) | set(visual_tag.split())
    for tag in asset_tags:
        asset_tag_tokens = set(tag.split("_")) | set(tag.split())
        overlap = scene_tag_tokens & asset_tag_tokens
        if overlap:
            score += 0.5 * (len(overlap) / max(len(scene_tag_tokens), 1))
            break
        if visual_tag and (visual_tag in tag or tag in visual_tag):
            score += 0.45
            break

    # 2. Role Alignment Match
    preferred_role_tags = ROLE_TAG_MAPPING.get(role, [])
    for pr_tag in preferred_role_tags:
        if any(pr_tag in t for t in asset_tags) or pr_tag in asset_name:
            score += 0.25
            break

    # 3. Voiceover keyword overlap with asset name & description
    voice_keywords = extract_keywords(voiceover)
    asset_text_tokens = extract_keywords(asset_name + " " + asset_desc)
    keyword_overlap = voice_keywords & asset_text_tokens
    if keyword_overlap:
        score += min(0.3, len(keyword_overlap) * 0.1)

    # 4. Media Type Priority: MP4 Video gets +0.2 bonus for TikTok dynamic review
    if media_type in ("video", "mp4") or asset.get("url", "").endswith((".mp4", ".mov")):
        score += 0.2

    return round(score, 3)


def match_scenes_to_broll(
    scenes: List[Dict[str, Any]],
    media_library: List[Dict[str, Any]],
    default_asset: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Assign the best matching B-roll asset for each scene in the review script.
    Avoids duplicate reuse across consecutive scenes when alternatives are available.
    """
    if not media_library and not default_asset:
        raise ValueError("Media library cannot be empty without a default asset.")

    used_asset_ids = set()
    matched_scenes = []

    for scene in scenes:
        scored_assets = []
        for asset in media_library:
            score = calculate_match_score(scene, asset)
            # Penalize slightly if already used in a previous scene
            if asset.get("id") in used_asset_ids:
                score *= 0.6
            scored_assets.append((score, asset))

        scored_assets.sort(key=lambda x: x[0], reverse=True)

        best_score, best_asset = scored_assets[0] if scored_assets else (0.0, default_asset)

        # If score is too low and fallback default is provided, use default
        if best_score < 0.15 and default_asset:
            selected_asset = default_asset
            final_score = 0.1
        else:
            selected_asset = best_asset
            final_score = best_score

        if selected_asset and "id" in selected_asset:
            used_asset_ids.add(selected_asset["id"])

        matched_scenes.append({
            "sceneNumber": scene.get("sceneNumber"),
            "role": scene.get("role"),
            "duration": scene.get("duration"),
            "voiceover": scene.get("voiceover"),
            "visualTag": scene.get("visualTag"),
            "matchedAsset": {
                "id": selected_asset.get("id"),
                "name": selected_asset.get("name"),
                "type": selected_asset.get("type", "video"),
                "url": selected_asset.get("url"),
                "score": final_score,
            } if selected_asset else None,
        })

    return matched_scenes

