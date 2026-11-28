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
RUN_SLOT="$(TZ="$RUN_TIMEZONE" date +%F-%H)"
BRANCH="hourly/tool-$RUN_SLOT"

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
flock -n 9 || fail '已有工具生成任务运行中，跳过此次执行。'
[[ ! -f "$STATE_DIR/$RUN_SLOT.done" ]] || { printf '本小时任务已完成。\n'; exit 0; }
RUN_DIR="$(mktemp -d "$STATE_DIR/runs/$RUN_SLOT.XXXXXX")"
exec > >(tee -a "$RUN_DIR/run.log") 2>&1
trap 'status=$?; if ((status != 0)); then printf "任务失败，退出码 %s。检查日志：%s\n" "$status" "$RUN_DIR"; fi' EXIT

docker info >/dev/null
[[ -z "$(git -C "$PROJECT_DIR" status --porcelain)" ]] || fail '项目存在未提交修改，停止以避免干扰人工工作。'
git -C "$PROJECT_DIR" fetch origin
BASE="$(git -C "$PROJECT_DIR" rev-parse origin/main)"
[[ "$(git -C "$PROJECT_DIR" branch --show-current)" == main ]] || fail '项目主工作目录必须位于 main。'
[[ "$(git -C "$PROJECT_DIR" rev-parse HEAD)" == "$BASE" ]] || fail '本地 main 与远端不同，请先同步。'
WORK_DIR="$STATE_DIR/worktrees/$RUN_SLOT"
BASE_FILE="$STATE_DIR/$RUN_SLOT.base"
SESSION_FILE="$STATE_DIR/$RUN_SLOT.session"
if git -C "$PROJECT_DIR" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  [[ -f "$BASE_FILE" && -d "$WORK_DIR" ]] || fail "已有分支缺少恢复记录：$BRANCH。请检查原运行后登记基线，勿删除工作目录。"
  [[ "$(git -C "$WORK_DIR" branch --show-current)" == "$BRANCH" ]] || fail '恢复目录与本小时分支不匹配。'
  [[ "$(git -C "$WORK_DIR" rev-parse HEAD)" == "$(cat "$BASE_FILE")" ]] || fail '本小时分支已有提交，请检查推送/部署阶段，停止重复开发。'
  if [[ "$(cat "$BASE_FILE")" != "$BASE" ]]; then
    [[ -z "$(git -C "$WORK_DIR" status --porcelain)" ]] || fail '主分支已更新且生成目录有修改，请先合并后再恢复。'
    git -C "$WORK_DIR" merge --ff-only "$BASE"
    printf '%s\n' "$BASE" > "$BASE_FILE"
  fi
  printf '继续本小时已有工作目录：%s\n' "$WORK_DIR"
elif git -C "$PROJECT_DIR" show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  fail "远端本小时分支已存在：$BRANCH，请先检查已发布结果。"
else
  git -C "$PROJECT_DIR" worktree add -b "$BRANCH" "$WORK_DIR" "$BASE"
  printf '%s\n' "$BASE" > "$BASE_FILE"
fi
cd "$WORK_DIR"
npm ci --no-audit --no-fund
printf '任务时段（%s，日期-小时）：%s\n工作目录：%s\n\n' "$RUN_TIMEZONE" "$RUN_SLOT" "$WORK_DIR" > "$RUN_DIR/prompt.md"
cat "$PROJECT_DIR/script/daily-tool-prompt.md" >> "$RUN_DIR/prompt.md"
python3 "$PROJECT_DIR/script/daily-tool-codex.py" --codex "$CODEX_BIN" --work-dir "$WORK_DIR" --run-dir "$RUN_DIR" --session-file "$SESSION_FILE"

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
git commit -m "新增工具：$TOOL_ID（$RUN_SLOT）"

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
git rev-parse HEAD > "$STATE_DIR/$RUN_SLOT.done"
printf '完成：%s，模式：%s，报告：%s/summary.md\n' "$TOOL_ID" "$MODE" "$RUN_DIR"
