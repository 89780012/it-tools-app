#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
export GIT_TERMINAL_PROMPT=0
export GIT_SSH_COMMAND="${GIT_SSH_COMMAND:-ssh -o BatchMode=yes}"

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="${DAILY_TOOL_STATE_DIR:-/var/lib/it-tools-daily}"
RUN_TIMEZONE="${DAILY_TOOL_TIMEZONE:-Asia/Shanghai}"
MODE="${DAILY_TOOL_MODE:-deploy}"
CODEX_BIN="${DAILY_TOOL_CODEX_BIN:-/root/.local/bin/codex}"
RUN_DATE="$(TZ="$RUN_TIMEZONE" date +%F)"
BRANCH="daily/tool-$RUN_DATE"

fail() { printf '%s\n' "$*" >&2; exit 1; }
case "$MODE" in branch|deploy) ;; *) fail 'DAILY_TOOL_MODE 必须为 branch 或 deploy。' ;; esac
case "${1:-run}" in run|--check|--check-api) ;; *) fail '用法：bash script/daily-tool.sh [run|--check|--check-api]' ;; esac

for program in git npm docker python3 flock timeout; do
  command -v "$program" >/dev/null || fail "缺少命令：$program"
done
[[ -x "$CODEX_BIN" ]] || fail "Codex 不可执行：$CODEX_BIN"
if [[ "${1:-run}" == --check || "${1:-run}" == --check-api ]]; then
  printf '项目：%s\n模式：%s\n日期时区：%s\n日志目录：%s\n' "$PROJECT_DIR" "$MODE" "$RUN_TIMEZONE" "$STATE_DIR"
  "$CODEX_BIN" --version
  docker info >/dev/null
  docker compose version
  printf '沿用 Codex 当前模型和 API 配置，不要求 codex login。\n'
  if [[ "${1:-run}" == --check-api ]]; then
    CHECK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/it-tools-codex-check.XXXXXX")"
    CHECK_ARGS=(exec --ephemeral --sandbox read-only -c 'approval_policy="never"' --cd "$PROJECT_DIR" --json --output-last-message "$CHECK_DIR/reply.txt")
    if [[ -n "${DAILY_TOOL_MODEL:-}" ]]; then CHECK_ARGS+=(--model "$DAILY_TOOL_MODEL"); fi
    if ! timeout --signal=TERM --kill-after=10s 90s "$CODEX_BIN" "${CHECK_ARGS[@]}" 'Do not use tools, read files, or modify anything. Reply with exactly CODEX_API_OK.' < /dev/null > "$CHECK_DIR/events.jsonl" 2> "$CHECK_DIR/stderr.log"; then
      fail "Codex API 调用失败，请检查现有 API 配置、网络或额度。日志：$CHECK_DIR"
    fi
    [[ -f "$CHECK_DIR/reply.txt" && "$(cat "$CHECK_DIR/reply.txt")" == CODEX_API_OK ]] || fail "Codex 未返回预期响应。日志：$CHECK_DIR"
    printf 'Codex 非交互 API 调用成功。检查日志：%s\n' "$CHECK_DIR"
  fi
  exit 0
fi

mkdir -p "$STATE_DIR/runs" "$STATE_DIR/worktrees"
exec 9>"$STATE_DIR/run.lock"
flock -n 9 || fail '已有每日任务运行中，跳过此次执行。'
[[ ! -f "$STATE_DIR/$RUN_DATE.done" ]] || { printf '今日任务已完成。\n'; exit 0; }
RUN_DIR="$(mktemp -d "$STATE_DIR/runs/$RUN_DATE.XXXXXX")"
exec > >(tee -a "$RUN_DIR/run.log") 2>&1
trap 'status=$?; if ((status != 0)); then printf "任务失败，退出码 %s。检查日志：%s\n" "$status" "$RUN_DIR"; fi' EXIT

docker info >/dev/null
[[ -z "$(git -C "$PROJECT_DIR" status --porcelain)" ]] || fail '项目存在未提交修改，停止以避免干扰人工工作。'
git -C "$PROJECT_DIR" fetch origin
BASE="$(git -C "$PROJECT_DIR" rev-parse origin/main)"
[[ "$(git -C "$PROJECT_DIR" branch --show-current)" == main ]] || fail '项目主工作目录必须位于 main。'
[[ "$(git -C "$PROJECT_DIR" rev-parse HEAD)" == "$BASE" ]] || fail '本地 main 与远端不同，请先同步。'
if git -C "$PROJECT_DIR" show-ref --verify --quiet "refs/heads/$BRANCH" || git -C "$PROJECT_DIR" show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  fail "今日分支已存在：$BRANCH。请先检查上次结果，避免重复生成。"
fi
WORK_DIR="$STATE_DIR/worktrees/$RUN_DATE"
git -C "$PROJECT_DIR" worktree add -b "$BRANCH" "$WORK_DIR" "$BASE"
cd "$WORK_DIR"
npm ci --no-audit --no-fund
printf '日期：%s\n工作目录：%s\n\n' "$RUN_DATE" "$WORK_DIR" > "$RUN_DIR/prompt.md"
cat "$PROJECT_DIR/script/daily-tool-prompt.md" >> "$RUN_DIR/prompt.md"
CODEX_ARGS=(exec --dangerously-bypass-approvals-and-sandbox --cd "$WORK_DIR" --json --output-last-message "$RUN_DIR/summary.md")
if [[ -n "${DAILY_TOOL_MODEL:-}" ]]; then CODEX_ARGS+=(--model "$DAILY_TOOL_MODEL"); fi
timeout --signal=TERM --kill-after=60s "${DAILY_TOOL_AGENT_TIMEOUT:-90m}" "$CODEX_BIN" "${CODEX_ARGS[@]}" - < "$RUN_DIR/prompt.md" > "$RUN_DIR/events.jsonl" 2> "$RUN_DIR/codex.stderr.log"

[[ "$(git rev-parse HEAD)" == "$BASE" ]] || fail '代理意外创建了提交，停止自动发布并保留现场。'
[[ -n "$(git status --porcelain)" ]] || fail '代理没有产生修改。'
git diff --check
# Check the actual new page, not the agent's completion claim.
TOOL_ID="$(python3 - "$BASE" <<'PY'
from pathlib import Path
import subprocess,sys
prefix='src/app/[locale]/tools/'
before=set(subprocess.check_output(['git','ls-tree','-r','--name-only',sys.argv[1]],text=True).splitlines())
before={p[len(prefix):].split('/')[0] for p in before if p.startswith(prefix) and p.endswith('/page.tsx')}
after={p.parent.name for p in Path(prefix).glob('*/page.tsx')}
added=after-before
if len(added)!=1 or before-after:
    raise SystemExit('必须恰好新增一个工具页面，且不能移除现有工具。')
print(added.pop())
PY
)"
npm run build
npm run test:run
docker run --rm -e GOPROXY="${DAILY_TOOL_GOPROXY:-https://goproxy.cn}" \
  -v "$WORK_DIR/backend:/src" -v it-tools-go-test-cache:/root/.cache/go-build \
  -v it-tools-go-test-modules:/go/pkg/mod -w /src golang:1.25-alpine \
  sh -c 'go test ./... && go vet ./...'
git add --all
git commit -m "新增工具：$TOOL_ID（$RUN_DATE）"

if [[ "$MODE" == branch ]]; then
  git push origin "HEAD:refs/heads/$BRANCH"
else
  # Recheck after generation so concurrent work is never overwritten.
  git -C "$PROJECT_DIR" fetch origin
  [[ "$(git -C "$PROJECT_DIR" rev-parse origin/main)" == "$BASE" ]] || fail '生成期间远端 main 已更新，保留分支等待处理。'
  [[ "$(git -C "$PROJECT_DIR" rev-parse HEAD)" == "$BASE" && -z "$(git -C "$PROJECT_DIR" status --porcelain)" ]] || fail '生成期间主工作目录已变更，停止发布。'
  git push origin HEAD:main
  git -C "$PROJECT_DIR" merge --ff-only "$BRANCH"
  (cd "$PROJECT_DIR" && bash deploy.sh)
fi
git rev-parse HEAD > "$STATE_DIR/$RUN_DATE.done"
printf '完成：%s，模式：%s，报告：%s/summary.md\n' "$TOOL_ID" "$MODE" "$RUN_DIR"
