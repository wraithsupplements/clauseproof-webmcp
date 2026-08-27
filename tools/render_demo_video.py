#!/usr/bin/env python3
"""Render the ClauseProof hackathon demo from verified, source-backed states."""

from __future__ import annotations

import json
import math
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "demo"
FINAL = ROOT / "artifacts" / "clauseproof-demo.mp4"
WIDTH, HEIGHT = 1920, 1080

INK = "#101719"
PANEL = "#182124"
PANEL_2 = "#202b2f"
LINE = "#334044"
MUTED = "#8e9b9c"
WHITE = "#f1f4ef"
PAPER = "#e7e7df"
PAPER_INK = "#172124"
ACID = "#b8ff45"
RED = "#ff6f61"
AMBER = "#ffc857"

SANS = "/System/Library/Fonts/Avenir Next.ttc"
SERIF = "/System/Library/Fonts/NewYork.ttf"
MONO = "/System/Library/Fonts/SFNSMono.ttf"


def font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size, index=index)


F = {
    "brand": font(SANS, 26, 5),
    "eyebrow": font(MONO, 19),
    "hero": font(SERIF, 72),
    "title": font(SERIF, 55),
    "body": font(SANS, 27),
    "body_small": font(SANS, 23),
    "label": font(MONO, 16),
    "metric": font(SERIF, 58),
    "card_title": font(SANS, 27, 5),
    "mono": font(MONO, 21),
    "mono_small": font(MONO, 17),
    "url": font(MONO, 24),
}


SCENES = [
    {
        "title": "Know before you sign.",
        "subtitle": "A shared contract decision room where AI can analyze and propose—but only a human can approve.",
        "voice": (
            "Contracts do not fail because nobody summarized them. They fail because risk, authority, and action get blurred together. "
            "ClauseProof is a shared decision room where a human and an AI agent can inspect the same evidence, but only the human can approve what happens next."
        ),
        "kind": "overview",
    },
    {
        "title": "Exact source. Bounded analysis.",
        "subtitle": "Every finding keeps the governing clause beside the explanation and recommendation.",
        "voice": (
            "The document is read locally. ClauseProof extracts material terms deterministically and keeps the exact source clause beside every finding. "
            "This synthetic agreement exposes auto renewal, exclusivity, payment, cure, and liability issues without sending uploaded document bytes to a public backend."
        ),
        "kind": "source",
    },
    {
        "title": "A narrow agent surface.",
        "subtitle": "Six WebMCP tools operate on the product's real state with closed inputs and explicit effects.",
        "voice": (
            "The page registers six narrow WebMCP tools. An agent can read the case, list risks, and propose revised language inside the product's real state. "
            "Every input schema is closed, every effect is described, and a proposal is recorded as a proposal, never as approval."
        ),
        "kind": "tools",
    },
    {
        "title": "Human authority is a product state.",
        "subtitle": "Analysis, proposal, approval, preparation, sending, and signing are deliberately separate.",
        "voice": (
            "Signature preparation is blocked while the case is unapproved. Approval requires a human to resolve or explicitly accept the critical finding, "
            "write a decision note, and type the visible case specific confirmation. Only then can ClauseProof prepare a packet, and the receipt proves it was not sent and not signed."
        ),
        "kind": "authority",
    },
    {
        "title": "Live evidence. Durable receipts.",
        "subtitle": "Xano stores the case and audit trail; SerpApi runs one bounded server-side counterparty query.",
        "voice": (
            "Xano is the durable case and receipt backend. The checked in XanoScript defines three tables, five live endpoints, an idempotent bootstrap, and a reviewable workflow test. "
            "SerpApi runs server side through Xano for one bounded counterparty query. The live proof returned nine organic results and receipt one, while the key stayed server side."
        ),
        "kind": "backend",
    },
    {
        "title": "Proof, not promises.",
        "subtitle": "A live HTTPS product, public MIT source, synthetic demonstration data, and explicit non-action receipts.",
        "voice": (
            "ClauseProof keeps raw documents local, makes agent actions visible, and separates analysis, proposal, approval, preparation, sending, and signing into verifiable states. "
            "It is open source, live on HTTPS, and built from scratch for this challenge. ClauseProof. Know before you sign."
        ),
        "kind": "close",
    },
]


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, which: str, fill: str = WHITE, anchor: str | None = None) -> None:
    draw.text(xy, value, font=F[which], fill=fill, anchor=anchor)


def wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, which: str, width: int, fill: str = WHITE, spacing: int = 8) -> int:
    avg = max(8, int(F[which].getlength("abcdefghijklmnopqrstuvwxyz") / 26))
    lines = textwrap.wrap(value, width=max(12, int(width / avg)))
    draw.multiline_text(xy, "\n".join(lines), font=F[which], fill=fill, spacing=spacing)
    bbox = draw.multiline_textbbox(xy, "\n".join(lines), font=F[which], spacing=spacing)
    return bbox[3]


def pill(draw: ImageDraw.ImageDraw, x: int, y: int, label: str, color: str = ACID, dark: bool = False) -> int:
    w = int(F["label"].getlength(label)) + 34
    rounded(draw, (x, y, x + w, y + 35), 18, color if dark else PANEL_2, color, 1)
    text(draw, (x + 17, y + 9), label, "label", INK if dark else color)
    return w


def chrome(draw: ImageDraw.ImageDraw, index: int) -> None:
    text(draw, (72, 52), "CLAUSEPROOF", "brand", ACID)
    text(draw, (1848, 58), "LIVE · OPEN SOURCE", "eyebrow", MUTED, "ra")
    draw.line((72, 96, 1848, 96), fill=LINE, width=2)
    draw.line((72, 1024, 1848, 1024), fill=LINE, width=2)
    text(draw, (72, 1044), "WEBMCP CHALLENGE · SYNTHETIC DEMO", "label", MUTED)
    text(draw, (1848, 1044), f"0{index + 1} / 06", "label", MUTED, "ra")
    progress = int((index + 1) / 6 * 1776)
    draw.rectangle((72, 1018, 72 + progress, 1025), fill=ACID)


def header(draw: ImageDraw.ImageDraw, scene: dict[str, str]) -> None:
    pill(draw, 72, 140, "DECISION INFRASTRUCTURE")
    wrapped(draw, (72, 205), scene["title"], "title", 680, WHITE, 10)
    wrapped(draw, (72, 354), scene["subtitle"], "body", 650, MUTED, 11)


def metric(draw: ImageDraw.ImageDraw, x: int, y: int, value: str, label: str, color: str = WHITE) -> None:
    text(draw, (x, y), value, "metric", color)
    text(draw, (x, y + 70), label.upper(), "label", MUTED)


def scene_overview(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (790, 140, 1848, 930), 26, PANEL, LINE, 2)
    text(draw, (840, 190), "NORTHSTAR SUPPLY AGREEMENT", "eyebrow", MUTED)
    pill(draw, 1594, 178, "IN REVIEW", AMBER)
    text(draw, (840, 255), "Northstar Components", "title", WHITE)
    draw.line((840, 338, 1798, 338), fill=LINE, width=2)
    metric(draw, 840, 385, "26", "decision score", ACID)
    metric(draw, 1110, 385, "5", "open findings")
    metric(draw, 1370, 385, "1", "critical", RED)
    rounded(draw, (840, 560, 1798, 835), 18, PAPER, None)
    pill(draw, 880, 595, "CRITICAL", RED)
    text(draw, (880, 655), "Exclusivity has no exit", "card_title", PAPER_INK)
    wrapped(draw, (880, 710), '"Customer appoints Northstar as its exclusive supplier for the Term..."', "mono_small", 820, "#455355", 8)
    rounded(draw, (72, 560, 700, 738), 18, PANEL_2, LINE, 1)
    text(draw, (106, 595), "THE CONTRACT", "label", MUTED)
    wrapped(draw, (106, 640), "AI can inspect and propose. Human approval remains a separate, visible state.", "body_small", 550, WHITE, 8)


def scene_source(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (790, 140, 1848, 930), 26, PAPER, None)
    pill(draw, 840, 190, "CRITICAL", RED)
    text(draw, (840, 255), "Exclusivity has no exit", "title", PAPER_INK)
    rounded(draw, (840, 365, 1798, 550), 14, "#d7dad4", None)
    text(draw, (875, 397), "SOURCE CLAUSE · §4.2", "label", "#627071")
    wrapped(draw, (875, 445), '"Customer appoints Northstar as its exclusive supplier for the Term and any renewal term."', "mono", 850, "#344245", 10)
    text(draw, (840, 615), "RECOMMENDATION", "label", "#6b7778")
    wrapped(draw, (840, 658), "Add performance thresholds, a cure period, and a termination right tied to repeated failure.", "body", 900, PAPER_INK, 10)
    rounded(draw, (72, 585, 700, 760), 18, PANEL_2, LINE, 1)
    text(draw, (106, 620), "LOCAL DOCUMENT BOUNDARY", "label", ACID)
    wrapped(draw, (106, 665), "Uploaded bytes stay in the browser. Only the synthetic case and bounded receipts are durable.", "body_small", 550, WHITE, 8)


def scene_tools(draw: ImageDraw.ImageDraw) -> None:
    tools = [
        "get_case_summary",
        "list_open_risks",
        "propose_risk_resolution",
        "record_human_risk_decision",
        "approve_case_decision",
        "prepare_signature_packet",
    ]
    rounded(draw, (790, 140, 1848, 930), 26, PANEL, LINE, 2)
    text(draw, (840, 185), "WEBMCP TOOL SURFACE", "eyebrow", MUTED)
    for i, tool in enumerate(tools):
        y = 245 + i * 92
        rounded(draw, (840, y, 1798, y + 66), 12, PANEL_2, LINE, 1)
        text(draw, (875, y + 21), f"0{i + 1}", "label", ACID)
        text(draw, (940, y + 18), tool, "mono", WHITE)
        pill(draw, 1655, y + 15, "READ" if i < 2 else ("PROPOSE" if i == 2 else "GATED"), ACID if i < 3 else AMBER)
    rounded(draw, (72, 590, 700, 785), 18, PANEL_2, LINE, 1)
    text(draw, (106, 625), "EFFECT CONTRACT", "label", ACID)
    wrapped(draw, (106, 670), "Closed schemas. Explicit effects. A proposal never silently becomes approval.", "body_small", 545, WHITE, 8)


def scene_authority(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (790, 140, 1848, 930), 26, PANEL, LINE, 2)
    steps = [
        ("01", "PREPARE SIGNATURE", "BLOCKED", RED, "Case is not approved"),
        ("02", "HUMAN APPROVAL", "EXACT", AMBER, "APPROVE PR-260826-01"),
        ("03", "PACKET PREPARED", "READY", ACID, "not sent · not signed"),
    ]
    for i, (num, label, status, color, note) in enumerate(steps):
        y = 205 + i * 220
        rounded(draw, (850, y, 1788, y + 165), 18, PANEL_2, color, 2)
        text(draw, (885, y + 35), num, "metric", color)
        text(draw, (1015, y + 32), label, "eyebrow", MUTED)
        text(draw, (1015, y + 76), note, "mono", WHITE)
        pill(draw, 1635, y + 30, status, color, dark=status == "READY")
        if i < 2:
            draw.line((1320, y + 165, 1320, y + 220), fill=LINE, width=4)
    rounded(draw, (72, 585, 700, 785), 18, PANEL_2, LINE, 1)
    text(draw, (106, 620), "AUTHORITY BOUNDARY", "label", ACID)
    wrapped(draw, (106, 665), "The agent can prepare work. It cannot manufacture the human decision that authorizes it.", "body_small", 545, WHITE, 8)


def scene_backend(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (790, 140, 1848, 930), 26, PANEL, LINE, 2)
    text(draw, (840, 185), "LIVE RELEASE RECEIPT", "eyebrow", MUTED)
    rounded(draw, (840, 235, 1798, 485), 14, "#101719", LINE, 1)
    receipt = [
        ('"status"', '"ok"'),
        ('"service"', '"clauseproof"'),
        ('"durable_case_store"', "true"),
        ('"live_evidence_provider"', '"serpapi"'),
    ]
    for i, (key, value) in enumerate(receipt):
        text(draw, (885, 275 + i * 48), f"{key}: {value}", "mono", ACID if i == 0 else WHITE)
    metric(draw, 840, 570, "3", "xano tables", ACID)
    metric(draw, 1080, 570, "5", "live endpoints")
    metric(draw, 1340, 570, "9", "organic results")
    metric(draw, 1600, 570, "1", "evidence receipt")
    rounded(draw, (840, 750, 1798, 840), 12, PANEL_2, LINE, 1)
    text(draw, (885, 781), "SERPAPI_API_KEY", "mono", MUTED)
    pill(draw, 1590, 775, "SERVER-SIDE", ACID, dark=True)
    rounded(draw, (72, 585, 700, 785), 18, PANEL_2, LINE, 1)
    text(draw, (106, 620), "TERMINAL PROOF", "label", ACID)
    wrapped(draw, (106, 665), "Health, idempotent bootstrap, case readback, live evidence, and audit append all passed.", "body_small", 545, WHITE, 8)


def scene_close(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (790, 140, 1848, 930), 26, PANEL, LINE, 2)
    text(draw, (840, 190), "TRY THE LIVE PRODUCT", "eyebrow", ACID)
    rounded(draw, (840, 245, 1798, 355), 14, PANEL_2, LINE, 1)
    text(draw, (880, 282), "clauseproof-webmcp.netlify.app", "url", WHITE)
    text(draw, (840, 420), "READ THE PUBLIC SOURCE", "eyebrow", MUTED)
    rounded(draw, (840, 475, 1798, 585), 14, PANEL_2, LINE, 1)
    text(draw, (880, 512), "github.com/wraithsupplements/clauseproof-webmcp", "url", WHITE)
    badges = [("MIT LICENSED", ACID), ("SYNTHETIC DATA", AMBER), ("HTTPS LIVE", ACID)]
    x = 840
    for label, color in badges:
        x += pill(draw, x, 670, label, color, dark=color == ACID) + 18
    text(draw, (840, 790), "CLAUSEPROOF", "hero", WHITE)
    text(draw, (840, 875), "Know before you sign.", "body", MUTED)
    rounded(draw, (72, 585, 700, 785), 18, PANEL_2, LINE, 1)
    text(draw, (106, 620), "THE OUTCOME", "label", ACID)
    wrapped(draw, (106, 665), "Agent speed without authority collapse. Every meaningful transition leaves a receipt.", "body_small", 545, WHITE, 8)


DRAWERS = {
    "overview": scene_overview,
    "source": scene_source,
    "tools": scene_tools,
    "authority": scene_authority,
    "backend": scene_backend,
    "close": scene_close,
}


def render_scene(index: int, scene: dict[str, str]) -> Path:
    image = Image.new("RGB", (WIDTH, HEIGHT), INK)
    draw = ImageDraw.Draw(image)
    chrome(draw, index)
    header(draw, scene)
    DRAWERS[scene["kind"]](draw)
    output = OUT / f"scene-{index + 1:02d}.png"
    image.save(output, optimize=True)
    return output


def run(command: list[str]) -> None:
    subprocess.run(command, cwd=ROOT, check=True)


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def build_clip(index: int, scene_path: Path, narration: str) -> Path:
    voice = OUT / f"voice-{index + 1:02d}.aiff"
    clip = OUT / f"clip-{index + 1:02d}.mp4"
    narration_file = OUT / f"voice-{index + 1:02d}.txt"
    narration_file.write_text(narration + "\n", encoding="utf-8")
    run(["say", "-v", "Samantha", "-r", "172", "-f", str(narration_file), "-o", str(voice)])
    duration = probe_duration(voice) + 0.55
    fade_out = max(0.5, duration - 0.35)
    video_filter = (
        "scale=1920:1080,"
        "zoompan=z='min(zoom+0.00010,1.025)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,"
        f"fade=t=in:st=0:d=0.25,fade=t=out:st={fade_out:.3f}:d=0.3,format=yuv420p"
    )
    audio_filter = f"loudnorm=I=-16:TP=-1.5:LRA=11,apad=pad_dur=0.55,afade=t=out:st={fade_out:.3f}:d=0.3"
    run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-loop", "1", "-i", str(scene_path), "-i", str(voice),
            "-vf", video_filter, "-af", audio_filter,
            "-t", f"{duration:.3f}", "-r", "30",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(clip),
        ]
    )
    return clip


def validate(path: Path) -> dict[str, object]:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height", "-of", "json", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    probe = json.loads(result.stdout)
    duration = float(probe["format"]["duration"])
    streams = probe["streams"]
    video = next(stream for stream in streams if stream["codec_type"] == "video")
    audio = next(stream for stream in streams if stream["codec_type"] == "audio")
    receipt = {
        "path": str(path),
        "duration_seconds": round(duration, 3),
        "under_three_minutes": duration < 180,
        "video": {"codec": video["codec_name"], "width": video["width"], "height": video["height"]},
        "audio": {"codec": audio["codec_name"], "present": True},
    }
    if not receipt["under_three_minutes"] or video["width"] != WIDTH or video["height"] != HEIGHT:
        raise RuntimeError(f"Video validation failed: {receipt}")
    return receipt


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    FINAL.parent.mkdir(parents=True, exist_ok=True)
    clips: list[Path] = []
    for index, scene in enumerate(SCENES):
        clips.append(build_clip(index, render_scene(index, scene), scene["voice"]))
    concat = OUT / "concat.txt"
    concat.write_text("".join(f"file '{clip.as_posix()}'\n" for clip in clips), encoding="utf-8")
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", "-movflags", "+faststart", str(FINAL)])
    print(json.dumps(validate(FINAL), indent=2))


if __name__ == "__main__":
    main()
