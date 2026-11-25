#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ACTION="${1:-up}"

usage() {
  printf '用法: bash deploy.sh [up|down|logs|status]\n'
  printf '  up      构建镜像、后台启动，并等待健康检查通过（默认）\n'
  printf '  down    停止并移除本项目容器和网络\n'
  printf '  logs    持续查看最近 100 行日志\n'
  printf '  status  查看容器状态\n'
}

if [[ "$#" -gt 1 ]]; then
  usage >&2
  exit 2
fi
case "$ACTION" in
  -h|--help|help) usage; exit 0 ;;
  up|down|logs|status) ;;
  *) usage >&2; exit 2 ;;
esac

if ! command -v docker >/dev/null 2>&1; then
  printf '错误: 请先安装 Docker Engine 和 Docker Compose v2。\n' >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  printf '错误: 无法连接 Docker，请确认 Docker 已启动且当前用户有权限（必要时使用 sudo bash deploy.sh）。\n' >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  printf '错误: 缺少 Docker Compose v2 插件，请安装后重试。\n' >&2
  exit 1
fi

cd -- "$PROJECT_DIR"
COMPOSE=(docker compose --project-directory "$PROJECT_DIR" -f "$PROJECT_DIR/docker-compose.yml")
# Quiet validation avoids printing resolved API keys to the terminal.
"${COMPOSE[@]}" config --quiet

case "$ACTION" in
  up)
    if ! "${COMPOSE[@]}" up --help | grep -q -- '--wait-timeout'; then
      printf '错误: 当前 Compose 版本过旧，请升级至支持 --wait-timeout 的 Compose v2。\n' >&2
      exit 1
    fi
    printf '开始构建并启动 IT Tools，首次构建需要下载依赖并生成多语言页面。\n'
    if ! "${COMPOSE[@]}" up -d --build --wait --wait-timeout 120; then
      printf '启动失败，以下为容器状态与最近日志：\n' >&2
      "${COMPOSE[@]}" ps --all >&2 || true
      "${COMPOSE[@]}" logs --tail=100 app >&2 || true
      exit 1
    fi
    "${COMPOSE[@]}" ps
    printf '\n部署成功，访问地址请使用上方显示的宿主机端口。\n'
    printf '服务器 IP 或域名访问时，请在 .env 中将对应来源加入 ALLOWED_ORIGINS 后重新运行。\n'
    printf '查看日志: bash deploy.sh logs\n'
    ;;
  down) "${COMPOSE[@]}" down ;;
  logs) "${COMPOSE[@]}" logs --follow --tail=100 app ;;
  status) "${COMPOSE[@]}" ps --all ;;
esac
