#!/bin/bash
# 토리의 반짝 달리기 — 검증 전부 (약 15~20분)
#   bash dev/run_all.sh   →  dev/out/ 에 캡처, 끝에 요약
cd "$(dirname "$0")/.."
set -o pipefail
ok=0; bad=0
run() { echo "== $1"; if timeout 2400 "${@:2}" > "dev/out/log_$1.txt" 2>&1 && ! grep -qE "오류 [1-9]|errors \[.+\]|이상: [1-9]|Traceback" "dev/out/log_$1.txt"; then echo "   OK"; ok=$((ok+1)); else echo "   실패 → dev/out/log_$1.txt"; tail -5 "dev/out/log_$1.txt"; bad=$((bad+1)); fi; }
mkdir -p dev/out
for f in js/*.js; do node --check "$f" || bad=$((bad+1)); done
run 문제점검 node dev/q_audit.js 3000
run 여정_4월드 python3 dev/simj.py final 0.75 4
run 기본흐름 python3 dev/sim.py basic
run 막누르기 python3 dev/sim3.py
run 화면크기 python3 dev/sizes.py
run 보너스길 python3 dev/bonus_test.py
echo "요약: OK $ok, 실패 $bad"
