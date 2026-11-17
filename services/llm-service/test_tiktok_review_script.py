"""
Unit and integration tests for BE2 Week 6:
- TikTok review script generator (40-50s, 4 scenes)
- TTS engine (edge-tts / gTTS audio synthesis with mutagen duration)
- Semantic tag matcher for B-roll assets
"""

import sys
import os
import pytest
from pathlib import Path

# Add services/llm-service to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

import content_generator
import tts_engine
import semantic_tag_matcher


def test_be2_w6_01_deterministic_tiktok_script():
    tour = {
        "name": "Vé Cáp Treo Sun World Ba Na Hills",
        "location": "Đà Nẵng",
        "sale_price": 950000,
        "original_price": 1250000,
        "description": "Cáp treo khứ hồi Bà Nà Hills và Cầu Vàng",
    }
    script = content_generator.generate_deterministic_tiktok_script(tour)

    assert script["totalDuration"] >= 40.0 and script["totalDuration"] <= 50.0
    assert len(script["scenes"]) == 4

    roles = [s["role"] for s in script["scenes"]]
    assert roles == ["hook", "experience", "pricing", "cta"]

    sum_duration = sum(s["duration"] for s in script["scenes"])
    assert abs(sum_duration - script["totalDuration"]) <= 1.0


def test_be2_w6_01_llm_or_fallback_tiktok_script():
    tour = {
        "name": "Tour Cano Cù Lao Chàm",
        "location": "Quảng Nam",
        "sale_price": 650000,
        "original_price": 850000,
        "description": "Lặn ngắm san hô và thưởng thức hải sản",
    }
    script = content_generator.generate_tiktok_review_script(tour, use_rag=False)

    assert "scenes" in script
    assert len(script["scenes"]) == 4
    assert script["totalDuration"] >= 40.0 and script["totalDuration"] <= 50.0

    roles = [s["role"] for s in script["scenes"]]
    assert roles == ["hook", "experience", "pricing", "cta"]


def test_be2_w6_02_tts_single_synthesis(tmp_path):
    output_file = tmp_path / "test_voiceover.mp3"
    result = tts_engine.synthesize_speech(
        text="Xin chào và chào mừng bạn đến với Đà Nẵng!",
        output_path=str(output_file),
    )

    assert os.path.exists(result["filePath"])
    assert result["duration"] > 0.0
    assert result["sizeBytes"] > 0


def test_be2_w6_02_tts_full_review_audio(tmp_path):
    script = {
        "title": "Review Du Lịch Cù Lao Chàm",
        "totalDuration": 45.0,
        "scenes": [
            {"sceneNumber": 1, "role": "hook", "duration": 6.0, "voiceover": "Biển Cù Lao Chàm xanh ngắt đang vẫy gọi bạn!", "visualTag": "ocean_drone"},
            {"sceneNumber": 2, "role": "experience", "duration": 19.0, "voiceover": "Trải nghiệm lặn ngắm rạn san hô rực rỡ và lướt cano cao tốc cực đã.", "visualTag": "diving_coral_reef"},
            {"sceneNumber": 3, "role": "pricing", "duration": 12.0, "voiceover": "Chỉ với sáu trăm năm mươi nghìn đồng một vé trọn gói bao gồm bữa trưa hải sản.", "visualTag": "seafood_lunch"},
            {"sceneNumber": 4, "role": "cta", "duration": 8.0, "voiceover": "Nhấp ngay vào link bên dưới để đặt vé ngay hôm nay nhé!", "visualTag": "booking_button"},
        ]
    }

    result = tts_engine.generate_review_audio(script, str(tmp_path))
    assert result["status"] == "SUCCESS"
    assert os.path.exists(result["fullAudioPath"])
    assert result["totalDuration"] > 0.0
    assert len(result["sceneAudios"]) == 4


def test_be2_w6_03_semantic_tag_matcher():
    scenes = [
        {"sceneNumber": 1, "role": "hook", "duration": 6.0, "visualTag": "ocean_drone", "voiceover": "Biển xanh ngắt"},
        {"sceneNumber": 2, "role": "experience", "duration": 19.0, "visualTag": "diving_coral", "voiceover": "Lặn ngắm rạn san hô rực rỡ"},
        {"sceneNumber": 3, "role": "pricing", "duration": 12.0, "visualTag": "seafood_pricing", "voiceover": "Giá vé sáu trăm năm mươi nghìn"},
        {"sceneNumber": 4, "role": "cta", "duration": 8.0, "visualTag": "booking_now", "voiceover": "Nhấp ngay vào link đặt vé"},
    ]

    media_library = [
        {"id": "v1", "name": "Flycam vịnh biển", "type": "video", "tags": ["ocean_drone", "aerial"], "url": "vids/ocean.mp4"},
        {"id": "v2", "name": "Video lặn biển ngắm san hô", "type": "video", "tags": ["diving_coral", "activity"], "url": "vids/diving.mp4"},
        {"id": "i3", "name": "Bảng giá thực đơn hải sản", "type": "image", "tags": ["seafood_pricing", "pricing"], "url": "imgs/seafood.jpg"},
        {"id": "i4", "name": "Nút bấm đặt chỗ", "type": "image", "tags": ["booking_now", "cta"], "url": "imgs/cta.jpg"},
    ]

    matched = semantic_tag_matcher.match_scenes_to_broll(scenes, media_library)
    assert len(matched) == 4
    assert matched[0]["matchedAsset"]["id"] == "v1"
    assert matched[1]["matchedAsset"]["id"] == "v2"
    assert matched[2]["matchedAsset"]["id"] == "i3"
    assert matched[3]["matchedAsset"]["id"] == "i4"
    assert matched[0]["matchedAsset"]["score"] > 0.5

