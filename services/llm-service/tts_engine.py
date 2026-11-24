"""
TTS Engine for Travel Review Videos (BE2 Week 6)
Supports Microsoft Edge-TTS (vi-VN-HoaiMyNeural, vi-VN-NamMinhNeural)
with automatic fallback to Google TTS (gTTS) and exact duration measurement via mutagen.
"""

import os
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Any

try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False

try:
    from mutagen.mp3 import MP3
    MUTAGEN_AVAILABLE = True
except ImportError:
    MUTAGEN_AVAILABLE = False

# Default high-quality Vietnamese neural voices
DEFAULT_FEMALE_VOICE = "vi-VN-HoaiMyNeural"
DEFAULT_MALE_VOICE = "vi-VN-NamMinhNeural"

SUPPORTED_VOICES = {
    "female": DEFAULT_FEMALE_VOICE,
    "male": DEFAULT_MALE_VOICE,
    DEFAULT_FEMALE_VOICE: DEFAULT_FEMALE_VOICE,
    DEFAULT_MALE_VOICE: DEFAULT_MALE_VOICE,
}


def get_mp3_duration(file_path: str) -> float:
    """Measure exact duration of an MP3 file in seconds using mutagen."""
    if not os.path.exists(file_path):
        return 0.0
    if MUTAGEN_AVAILABLE:
        try:
            audio = MP3(file_path)
            return round(audio.info.length, 2)
        except Exception:
            pass
    # Fallback estimation: average 128kbps = 16KB/s
    size = os.path.getsize(file_path)
    return round(size / 16000.0, 2)


async def synthesize_speech_edge(
    text: str,
    output_path: str,
    voice: str = DEFAULT_FEMALE_VOICE,
    rate: str = "+0%",
) -> Dict[str, Any]:
    """Synthesize speech using Microsoft Edge-TTS."""
    if not EDGE_TTS_AVAILABLE:
        raise RuntimeError("edge-tts is not installed.")

    selected_voice = SUPPORTED_VOICES.get(voice, DEFAULT_FEMALE_VOICE)
    clean_text = text.strip()
    if not clean_text:
        raise ValueError("Text to synthesize cannot be empty.")

    output_file = Path(output_path).resolve()
    output_file.parent.mkdir(parents=True, exist_ok=True)

    kwargs = {"text": clean_text, "voice": selected_voice}
    if rate and rate != "+0%":
        kwargs["rate"] = rate

    communicate = edge_tts.Communicate(**kwargs)
    await communicate.save(str(output_file))

    duration = get_mp3_duration(str(output_file))
    return {
        "engine": "edge-tts",
        "voice": selected_voice,
        "filePath": str(output_file),
        "duration": duration,
        "sizeBytes": output_file.stat().st_size,
        "text": clean_text,
    }


def synthesize_speech_gtts(
    text: str,
    output_path: str,
    lang: str = "vi",
) -> Dict[str, Any]:
    """Synthesize speech using Google TTS (gTTS) as reliable fallback."""
    if not GTTS_AVAILABLE:
        raise RuntimeError("gtts is not installed.")

    clean_text = text.strip()
    if not clean_text:
        raise ValueError("Text to synthesize cannot be empty.")

    output_file = Path(output_path).resolve()
    output_file.parent.mkdir(parents=True, exist_ok=True)

    tts = gTTS(text=clean_text, lang=lang)
    tts.save(str(output_file))

    duration = get_mp3_duration(str(output_file))
    return {
        "engine": "gtts",
        "voice": f"google-{lang}",
        "filePath": str(output_file),
        "duration": duration,
        "sizeBytes": output_file.stat().st_size,
        "text": clean_text,
    }


def synthesize_speech(
    text: str,
    output_path: str,
    voice: str = DEFAULT_FEMALE_VOICE,
    rate: str = "+0%",
    prefer_engine: str = "edge-tts",
) -> Dict[str, Any]:
    """
    Robust TTS synthesis: tries Edge-TTS first, falls back to Google TTS if needed.
    """
    if prefer_engine == "edge-tts" and EDGE_TTS_AVAILABLE:
        try:
            return asyncio.run(synthesize_speech_edge(text, output_path, voice, rate))
        except Exception as e:
            # Fallback to gTTS if Edge-TTS has socket / NoAudioReceived errors
            if GTTS_AVAILABLE:
                return synthesize_speech_gtts(text, output_path, lang="vi")
            raise e
    elif GTTS_AVAILABLE:
        return synthesize_speech_gtts(text, output_path, lang="vi")
    else:
        raise RuntimeError("No available TTS engines (edge-tts and gtts are missing).")


def generate_review_audio(
    script: Dict[str, Any],
    output_dir: str,
    voice: str = DEFAULT_FEMALE_VOICE,
    rate: str = "+0%",
) -> Dict[str, Any]:
    """
    Synthesizes MP3 audio for each scene in a TikTok review script (4 scenes).
    Merges all scene audios into full_review_voiceover.mp3.
    Returns detailed audio metadata and duration report.
    """
    out_dir = Path(output_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    scenes = script.get("scenes", [])
    if not scenes:
        raise ValueError("Script must contain a non-empty list of scenes.")

    results: List[Dict[str, Any]] = []
    total_audio_bytes = bytearray()

    for idx, scene in enumerate(scenes, start=1):
        role = scene.get("role", f"scene_{idx}")
        voiceover = scene.get("voiceover", "").strip()
        scene_filename = f"scene_{idx}_{role}.mp3"
        scene_path = out_dir / scene_filename

        scene_meta = synthesize_speech(
            text=voiceover,
            output_path=str(scene_path),
            voice=voice,
            rate=rate,
        )
        scene_meta["sceneNumber"] = scene.get("sceneNumber", idx)
        scene_meta["role"] = role
        scene_meta["targetDuration"] = scene.get("duration", 0.0)
        results.append(scene_meta)

        with open(scene_path, "rb") as f:
            total_audio_bytes.extend(f.read())

    # Write merged full voiceover audio
    full_audio_path = out_dir / "full_review_voiceover.mp3"
    with open(full_audio_path, "wb") as f:
        f.write(total_audio_bytes)

    full_duration = get_mp3_duration(str(full_audio_path))

    return {
        "status": "SUCCESS",
        "voice": voice,
        "fullAudioPath": str(full_audio_path),
        "totalDuration": full_duration,
        "sceneAudios": results,
    }
