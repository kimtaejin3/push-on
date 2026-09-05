#!/usr/bin/env python3
"""
App Store 6.9" 스크린샷 합성기.

raw/ 의 시뮬레이터 캡처(1320x2868)를 배경 + 캡션 + 아이폰 프레임 안에 넣어
6.9/NN.png (1320x2868) 으로 출력한다. Chrome 헤드리스로 HTML 을 렌더한다.

실행: python3 store/appstore/screenshots/build.py
"""
import base64
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
OUT = HERE / "6.9"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
W, H = 1320, 2868

# (출력 파일명, 원본 캡처, 헤드라인, 서브라인)
SLIDES = [
    ("01.png", "home.png", "폰을 바닥에 두고,\n푸쉬업만 하세요", "횟수는 얼굴 추적으로 자동으로 세어 드려요"),
    ("02.png", "challenge.png", "한 개, 한 개\n정확하게", "내려갔다 올라올 때마다 진동으로 알려줘요"),
    ("03.png", "program.png", "연속 100개까지\n오늘 할 세트를 정해드려요", "내 수준에 맞춘 난이도로, 운동 알림까지"),
    ("04.png", "history.png", "하루하루\n기록이 쌓여요", "달력에서 날짜별 세트와 횟수를 확인"),
    ("05.png", "statistic.png", "주간 · 월간 흐름을\n한눈에", "그래프로 보는 나의 꾸준함"),
]

TEMPLATE = """<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>
  html,body{margin:0;width:%(w)dpx;height:%(h)dpx;overflow:hidden;background:#0d0d0d;
    font-family:"Apple SD Gothic Neo","Pretendard","Noto Sans KR",-apple-system,sans-serif;color:#fff}
  .bg{position:absolute;inset:0;
    background:
      radial-gradient(900px 900px at 50%% 1900px, rgba(125,95,255,.45), transparent 70%%),
      radial-gradient(700px 500px at 20%% -100px, rgba(125,95,255,.25), transparent 70%%),
      #0d0d0d}
  .copy{position:absolute;left:0;right:0;top:250px;text-align:center;padding:0 90px}
  h1{margin:0;font-size:104px;line-height:1.18;font-weight:800;letter-spacing:-2px;white-space:pre-line}
  p{margin:36px 0 0;font-size:44px;line-height:1.4;color:#b9b4d6;font-weight:500}
  .phone{position:absolute;left:50%%;top:760px;transform:translateX(-50%%);
    width:1090px;height:2368px;border-radius:150px;background:#000;
    box-shadow:0 60px 140px rgba(0,0,0,.7),0 0 0 4px #2a2a2a,0 0 0 18px #111,0 0 0 22px #3a3a3a}
  .screen{position:absolute;inset:22px;border-radius:128px;overflow:hidden;background:#0d0d0d}
  /* 캡처는 상태바 없이 잘린 화면이므로 상태바 높이(약 140px)만큼 내려서 배치 → 아일랜드가 콘텐츠를 가리지 않음 */
  .screen img{display:block;width:100%%;height:auto;margin-top:140px}
  .island{position:absolute;left:50%%;top:52px;transform:translateX(-50%%);width:300px;height:88px;border-radius:44px;background:#000}
</style></head><body>
<div class="bg"></div>
<div class="copy"><h1>%(headline)s</h1><p>%(subline)s</p></div>
<div class="phone"><div class="screen"><img src="data:image/png;base64,%(img)s"></div><div class="island"></div></div>
</body></html>"""


def render(html: str, out: Path) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html)
        path = f.name
    try:
        subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
             f"--window-size={W},{H}", f"--screenshot={out}", f"file://{path}"],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
    finally:
        os.unlink(path)


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    missing = [src for _, src, _, _ in SLIDES if not (RAW / src).exists()]
    if missing:
        print("raw/ 에 캡처가 없습니다:", ", ".join(missing), file=sys.stderr)
        return 1
    for name, src, headline, subline in SLIDES:
        img = base64.b64encode((RAW / src).read_bytes()).decode()
        render(TEMPLATE % dict(w=W, h=H, headline=headline, subline=subline, img=img), OUT / name)
        print("wrote", OUT / name)
    return 0


if __name__ == "__main__":
    sys.exit(main())
