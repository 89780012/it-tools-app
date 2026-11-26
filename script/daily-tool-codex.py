#!/usr/bin/env python3
"""Run Codex with bounded retries, preserving the session and worktree."""

import argparse
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import time
import uuid


def failure_kind(message):
    text = message.lower()
    if any(value in text for value in ["insufficient_quota", "quota exceeded", "billing", "credit balance"]):
        return "API 额度或余额不足", False
    if "concurrency limit" in text:
        return "API 账号并发数超限（429）", True
    if "429" in text or "too many requests" in text or "rate limit" in text:
        return "API 请求限流（429）", True
    if re.search(r"\b(500|502|503|504)\b", text):
        return "API 上游暂时不可用（5xx）", True
    if any(value in text for value in ["stream disconnected", "timeout", "timed out", "connection reset", "connection closed"]):
        return "API 连接超时或流式响应中断", True
    if re.search(r"\b(401|403)\b", text):
        return "API 认证失败或访问被拒绝", False
    return "Codex 未正常完成，请查看本次事件日志", False


def read_events(path):
    session = None
    complete = False
    error = ""
    with path.open(errors="replace") as stream:
        for line in stream:
            try:
                event = json.loads(line)
            except ValueError:
                continue
            if event.get("type") == "thread.started":
                candidate = event.get("thread_id", "")
                try:
                    session = str(uuid.UUID(candidate))
                except (ValueError, AttributeError):
                    pass
            elif event.get("type") == "error":
                error = event.get("message", "")
            elif event.get("type") == "turn.failed":
                complete = False
                error = event.get("error", {}).get("message", "")
            elif event.get("type") == "turn.completed":
                complete = True
    return session, complete, error


def seconds(value):
    match = re.fullmatch(r"(\d+)([smh]?)", value)
    if not match or int(match[1]) <= 0:
        raise ValueError("超时必须为正整数秒或使用 s/m/h 后缀")
    return int(match[1]) * {"": 1, "s": 1, "m": 60, "h": 3600}[match[2]]


def stop_process(process):
    if process.poll() is None:
        os.killpg(process.pid, signal.SIGTERM)
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--codex", required=True)
    parser.add_argument("--work-dir", type=Path, required=True)
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--session-file", type=Path, required=True)
    args = parser.parse_args()
    attempts = int(os.environ.get("DAILY_TOOL_CODEX_ATTEMPTS", "4"))
    retry_delay = int(os.environ.get("DAILY_TOOL_RETRY_DELAY_SECONDS", "60"))
    if not 1 <= attempts <= 10 or not 1 <= retry_delay <= 600:
        raise ValueError("尝试次数须为 1–10，初始重试间隔须为 1–600 秒")
    deadline = time.monotonic() + seconds(os.environ.get("DAILY_TOOL_AGENT_TIMEOUT", "90m"))
    prompt = (args.run_dir / "prompt.md").read_text()
    session = str(uuid.UUID(args.session_file.read_text().strip())) if args.session_file.exists() else None
    for attempt in range(1, attempts + 1):
        events = args.run_dir / f"events.attempt-{attempt}.jsonl"
        stderr = args.run_dir / f"codex.attempt-{attempt}.stderr.log"
        summary = args.run_dir / "summary.md"
        command = [args.codex, "exec"]
        if session:
            command.append("resume")
        command += ["--dangerously-bypass-approvals-and-sandbox", "--json", "--output-last-message", str(summary)]
        if os.environ.get("DAILY_TOOL_MODEL"):
            command += ["--model", os.environ["DAILY_TOOL_MODEL"]]
        if session:
            command.append(session)
        command.append("-")
        attempt_prompt = args.run_dir / f"prompt.attempt-{attempt}.md"
        attempt_prompt.write_text((
            "继续同一天的工具任务。上次执行中断，请先检查当前工作目录，保留已有实现，完成同一个工具，不要再选另一个工具。工作目录可能已快进同步主分支中的自动化修复。\n\n"
            if session else ""
        ) + prompt)
        print(f"Codex 第 {attempt}/{attempts} 次尝试；{'继续原会话' if session else '创建新会话'}。", flush=True)
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            print("已达到 Codex 总时限，保留工作目录，下次可继续。", flush=True)
            return 124
        with attempt_prompt.open() as stdin, events.open("w") as stdout, stderr.open("w") as errors:
            process = subprocess.Popen(command, cwd=args.work_dir, stdin=stdin, stdout=stdout, stderr=errors, start_new_session=True)
            expired = False
            try:
                while process.poll() is None:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        expired = True
                        break
                    try:
                        process.wait(timeout=min(60, remaining))
                    except subprocess.TimeoutExpired:
                        print(f"Codex 仍在运行，事件日志：{events}", flush=True)
            finally:
                stop_process(process)
        new_session, complete, error = read_events(events)
        if new_session:
            session = new_session
            args.session_file.write_text(session + "\n")
        # Stable filenames show the most recent attempt; all attempts remain available.
        for link, target in [("events.jsonl", events), ("codex.stderr.log", stderr)]:
            destination = args.run_dir / link
            if destination.is_symlink():
                destination.unlink()
            destination.symlink_to(target.name)
        if expired:
            print("Codex 总时限已用完，停止本次任务并保留会话。", flush=True)
            return 124
        if process.returncode == 0 and complete and summary.exists():
            print("Codex 已正常完成，开始构建、测试和发布检查。", flush=True)
            return 0
        reason, retryable = failure_kind(error)
        print(f"Codex 执行失败：{reason}；退出码 {process.returncode}。详细日志：{events}", flush=True)
        if not retryable or attempt == attempts:
            print("本次停止，不提交、不推送、不部署；再次启动会继续当前工作目录。", flush=True)
            return 1
        delay = min(retry_delay * 2 ** (attempt - 1), 600)
        if time.monotonic() + delay >= deadline:
            return 124
        print(f"等待 {delay} 秒后继续同一会话，不重复创建工具。", flush=True)
        time.sleep(delay)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
