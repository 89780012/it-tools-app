import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


RUNNER = Path(__file__).resolve().parents[1] / "daily-tool-codex.py"
spec = importlib.util.spec_from_file_location("daily_tool_codex", RUNNER)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
SESSION = "01a21732-ecb1-78a1-a622-3e32dc0a6299"


class CodexRecoveryTests(unittest.TestCase):
    def test_only_transient_errors_are_retried(self):
        for message in ["Concurrency limit exceeded for account", "429 Too Many Requests", "502 Bad Gateway", "stream disconnected before completion"]:
            self.assertTrue(runner.failure_kind(message)[1])
        for message in ["401 Unauthorized", "insufficient_quota 429", "invalid model"]:
            self.assertFalse(runner.failure_kind(message)[1])

    def run_fixture(self, scenario, attempts=2):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        (root / "prompt.md").write_text("Complete one tool")
        mock = root / "codex"
        mock.write_text('''#!/usr/bin/env python3
import json,sys
from pathlib import Path
root=Path.cwd()
calls=root/'calls.jsonl'
with calls.open('a') as f:f.write(json.dumps(sys.argv[1:])+'\\n')
count=len(calls.read_text().splitlines())
scenario=(root/'scenario').read_text()
print(json.dumps({'type':'thread.started','thread_id':'01a21732-ecb1-78a1-a622-3e32dc0a6299'}))
if count==1:
    (root/'partial.txt').write_text('preserve progress')
if scenario=='recover' and count>1:
    assert sys.argv[1:3]==['exec','resume']
    assert '01a21732-ecb1-78a1-a622-3e32dc0a6299' in sys.argv
    assert (root/'partial.txt').read_text()=='preserve progress'
    Path(sys.argv[sys.argv.index('--output-last-message')+1]).write_text('complete')
    print(json.dumps({'type':'turn.completed'}))
else:
    error='401 Unauthorized' if scenario=='auth' else '429 Too Many Requests: Concurrency limit exceeded for account'
    print(json.dumps({'type':'turn.failed','error':{'message':error}}))
    sys.exit(1)
''')
        mock.chmod(0o755)
        (root / "scenario").write_text(scenario)
        env = dict(os.environ, DAILY_TOOL_CODEX_ATTEMPTS=str(attempts), DAILY_TOOL_RETRY_DELAY_SECONDS="1", DAILY_TOOL_AGENT_TIMEOUT="20s")
        result = subprocess.run(["python3", str(RUNNER), "--codex", str(mock), "--work-dir", str(root), "--run-dir", str(root), "--session-file", str(root / "session")], env=env, capture_output=True, text=True, timeout=25)
        calls = [json.loads(line) for line in (root / "calls.jsonl").read_text().splitlines()]
        return root, result, calls

    def test_429_resumes_same_session_and_preserves_progress(self):
        root, result, calls = self.run_fixture("recover")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(len(calls), 2)
        self.assertEqual((root / "session").read_text().strip(), SESSION)
        self.assertEqual((root / "summary.md").read_text(), "complete")
        self.assertTrue((root / "events.attempt-1.jsonl").exists())
        self.assertIn("并发数超限", result.stdout)

    def test_permanent_error_does_not_retry(self):
        _, result, calls = self.run_fixture("auth")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(len(calls), 1)

    def test_retry_limit_does_not_report_success(self):
        root, result, calls = self.run_fixture("limited", attempts=2)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(len(calls), 2)
        self.assertFalse((root / "summary.md").exists())

    def test_hourly_runs_resume_deduplicate_and_publish_next_hour(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            repo, remote, binary = root / "repo", root / "remote.git", root / "bin"
            repo.mkdir()
            binary.mkdir()

            def git(location, *arguments):
                return subprocess.check_output(["git", "-C", str(location), *arguments], stderr=subprocess.DEVNULL, text=True).strip()

            subprocess.run(["git", "init", "--bare", str(remote)], check=True, capture_output=True)
            subprocess.run(["git", "init", "-b", "main", str(repo)], check=True, capture_output=True)
            git(repo, "config", "user.name", "Fixture")
            git(repo, "config", "user.email", "fixture@example.invalid")
            (repo / "script").mkdir()
            for name in ["daily-tool.sh", "daily-tool-codex.py", "daily-tool-prompt.md"]:
                shutil.copyfile(RUNNER.parent / name, repo / "script" / name)
            page = repo / "src/app/[locale]/tools/existing/page.tsx"
            page.parent.mkdir(parents=True)
            page.write_text("existing")
            (repo / "deploy.sh").write_text('printf "deploy\\n" >> "$FIXTURE_EVENTS"\n')
            git(repo, "add", ".")
            git(repo, "commit", "-m", "fixture")
            git(repo, "remote", "add", "origin", str(remote))
            git(repo, "push", "-u", "origin", "main")
            initial = git(repo, "rev-parse", "HEAD")
            for name in ["npm", "docker"]:
                mock = binary / name
                mock.write_text('#!/bin/sh\nprintf "%s\\n" "$0 $*" >> "$FIXTURE_EVENTS"\n')
                mock.chmod(0o755)
            mock_date = binary / "date"
            mock_date.write_text('#!/bin/sh\n[ "$1" = "+%F-%H" ] || exit 1\nprintf "%s\\n" "$FIXTURE_SLOT"\n')
            mock_date.chmod(0o755)
            mock = binary / "codex"
            mock.write_text('''#!/usr/bin/env python3
import json,os,sys
from pathlib import Path
count=Path(os.environ['FIXTURE_COUNT'])
value=int(count.read_text())+1 if count.exists() else 1
count.write_text(str(value))
print(json.dumps({'type':'thread.started','thread_id':'01a21732-ecb1-78a1-a622-3e32dc0a6299'}))
tool='fixture-tool' if value<=2 else 'fixture-tool-next-hour'
page=Path('src/app/[locale]/tools')/tool/'page.tsx'
if value==1:
    page.parent.mkdir(parents=True)
    page.write_text('partial')
    print(json.dumps({'type':'turn.failed','error':{'message':'Concurrency limit exceeded for account'}}))
    sys.exit(1)
if value==2:
    assert sys.argv[1:3]==['exec','resume']
    assert page.read_text()=='partial'
else:
    assert sys.argv[1]=='exec' and sys.argv[2]!='resume'
    page.parent.mkdir(parents=True)
page.write_text('complete')
Path(sys.argv[sys.argv.index('--output-last-message')+1]).write_text('complete')
print(json.dumps({'type':'turn.completed'}))
''')
            mock.chmod(0o755)
            state = root / "state"
            state.mkdir()
            (state / "2026-11-28.done").write_text("legacy daily completion")
            env = dict(os.environ, PATH=str(binary) + ":" + os.environ["PATH"], DAILY_TOOL_CODEX_BIN=str(mock), DAILY_TOOL_STATE_DIR=str(state), DAILY_TOOL_MODE="deploy", DAILY_TOOL_CODEX_ATTEMPTS="1", DAILY_TOOL_AGENT_TIMEOUT="20s", FIXTURE_EVENTS=str(root / "events"), FIXTURE_COUNT=str(root / "count"), FIXTURE_SLOT="2026-11-28-12")
            command = ["bash", str(repo / "script/daily-tool.sh")]
            first = subprocess.run(command, env=env, capture_output=True, text=True, timeout=30)
            self.assertNotEqual(first.returncode, 0)
            self.assertEqual(git(remote, "rev-parse", "main"), initial)
            self.assertNotIn("deploy\n", (root / "events").read_text())
            second = subprocess.run(command, env=env, capture_output=True, text=True, timeout=30)
            self.assertEqual(second.returncode, 0, second.stdout + second.stderr)
            self.assertIn("继续本小时已有工作目录", second.stdout)
            self.assertEqual(git(remote, "rev-parse", "main"), git(repo, "rev-parse", "HEAD"))
            self.assertNotEqual(git(repo, "rev-parse", "HEAD"), initial)
            self.assertTrue(git(repo, "log", "-1", "--format=%s").startswith("新增工具：fixture-tool"))
            self.assertEqual((root / "events").read_text().count("deploy\n"), 1)
            third = subprocess.run(command, env=env, capture_output=True, text=True, timeout=10)
            self.assertEqual(third.returncode, 0)
            self.assertIn("本小时任务已完成", third.stdout)
            self.assertEqual((root / "count").read_text(), "2")
            self.assertTrue((state / "2026-11-28-12.done").exists())
            env["FIXTURE_SLOT"] = "2026-11-28-13"
            fourth = subprocess.run(command, env=env, capture_output=True, text=True, timeout=30)
            self.assertEqual(fourth.returncode, 0, fourth.stdout + fourth.stderr)
            self.assertEqual((root / "count").read_text(), "3")
            self.assertEqual((root / "events").read_text().count("deploy\n"), 2)
            self.assertEqual(git(remote, "rev-parse", "main"), git(repo, "rev-parse", "HEAD"))
            self.assertTrue((state / "2026-11-28-13.done").exists())
            self.assertTrue((state / "worktrees/2026-11-28-12").is_dir())
            self.assertTrue((state / "worktrees/2026-11-28-13").is_dir())
            fifth = subprocess.run(command, env=env, capture_output=True, text=True, timeout=10)
            self.assertEqual(fifth.returncode, 0)
            self.assertEqual((root / "count").read_text(), "3")


if __name__ == "__main__":
    unittest.main()
