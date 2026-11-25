#!/usr/bin/env python3
"""
App Store 6.9" 스크린샷 합성기.

raw/ 의 디자인 시안 내보내기(393pt 화면 3배, 1179x2556, 상태바 포함)를 배경 + 캡션 + 아이폰 프레임 안에 넣어
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
    ("01.png", "home.png", "폰을 바닥에 두고,\n푸쉬업만 하세요", "오늘 할 운동은 매일 앱이 정해 드려요"),
    ("02.png", "counting.png", "한 개, 한 개\n자동으로 세어요", "얼굴 추적으로 내려갔다 올라오는 동작을 인식해요"),
    ("03.png", "rest.png", "휴식도 다음 세트도\n알아서", "휴식이 끝나면 바로 다음 세트를 세기 시작해요"),
    ("04.png", "result.png", "어제의 나보다\n조금 더", "지난번 대비 기록과 한 세트 최고를 한눈에"),
    ("05.png", "history.png", "하루하루\n기록이 쌓여요", "달력과 주간 흐름으로 보는 나의 꾸준함"),
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
  .screen{position:absolute;inset:22px;border-radius:128px;overflow:hidden;background:#0B0D10}
  /* 시안 내보내기는 상태바(9:41)까지 들어 있어 그대로 맨 위에 붙인다 */
  .screen img{display:block;width:100%%;height:auto}
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
