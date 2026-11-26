# 每天自动新增一个工具：部署指南

## 自动执行的流程

1. 按北京时间确定日期，用文件锁避免重复或并发运行。
2. 检查主目录干净、main 与远端一致，建立当天的独立 Git worktree。
3. 使用本机 Codex 自定义 API 配置，全权限执行一次开发任务，新增一个实用工具并补齐 12 种语言。
4. 检查只新增一个工具页面，执行生产构建、前端测试、Go 测试和 `go vet`。
5. 创建中文提交，例如 `新增工具：url-normalizer（2026-11-27）`。
6. 推送远端 main，快进更新本机 main，运行 `bash deploy.sh` 重建 Docker 并等待健康检查。
7. 保存完成标记、执行日志及中文报告。

默认模式为 **deploy：提交、推送、部署全部自动完成**。默认定时为 **每天北京时间 03:00**，即服务器 UTC 的前一天 19:00。时间可以在启用前修改。

## 本机准备情况

- 执行脚本：`script/daily-tool.sh`。
- 开发要求：`script/daily-tool-prompt.md`，可在其中调整工具选题偏好。
- systemd 模板：`script/systemd/it-tools-daily.service` 和 `.timer`。
- 本机运行参数：`/etc/it-tools-daily.env`，权限 0600。已设置自动部署，并复制本机终端所需的 HTTP/HTTPS 代理环境；没有复制 API 密钥。
- 模型和 API 凭据继续使用 root 的 `/root/.codex/config.toml`。不要求 `codex login`，也不应把 API 密钥加入 Git。
- 定时器尚未启用；安装和启动命令如下。

验证记录：本地 CLI 和携带上述代理环境及 `CODEX_CI=1` 的临时 systemd 服务均已收到完整模型回复并正常退出。另用隔离的本地 Git 仓库验证了中文提交、main 推送、部署调用、每日去重、仅分支模式及失败停止；这些流程测试使用替身模型和 Docker，没有实际新增网站工具。

本机 Codex CLI 使用 `--dangerously-bypass-approvals-and-sandbox`，以 root 全权限执行。提示词中的项目范围约束不是操作系统隔离。systemd 使用 root 的配置和 SSH 密钥，Git 操作启用非交互模式。

## 1. 检查环境

```bash
cd /www/guhl/code/it-tools-app
bash script/daily-tool.sh --check
bash script/daily-tool.sh --check-api
```

`--check` 只检查依赖；`--check-api` 额外发送一次简短的模型请求，不开发工具、不提交、不部署。必须看到 `Codex 非交互 API 调用成功`。API 凭据可用不代表流式响应能正常结束，检查失败时不要启用每日任务。

本机终端通过代理访问 API，systemd 不继承终端环境。检查 `/etc/it-tools-daily.env` 中的 `HTTP_PROXY`、`HTTPS_PROXY` 和 `NO_PROXY` 是否适用于当前网络。不要把 shell 的 `export` 命令写进此文件。

如果需要单独复查 systemd 环境，可执行以下一次性检查；它不会新增工具或启用每日定时器：

```bash
sudo systemd-run --unit=it-tools-codex-check --collect --wait --pipe \
  --property=User=root \
  --property=WorkingDirectory=/www/guhl/code/it-tools-app \
  --property=EnvironmentFile=/etc/it-tools-daily.env \
  --property=UMask=0077 \
  --setenv=CODEX_CI=1 \
  --setenv=PATH=/root/.local/bin:/www/server/nodejs/v24.16.0/bin:/usr/local/bin:/usr/bin:/bin \
  /bin/bash /www/guhl/code/it-tools-app/script/daily-tool.sh --check-api
```

## 2. 设置运行参数和时间

本机参数文件已经准备；只需按需编辑：

```bash
sudoedit /etc/it-tools-daily.env
```

参数含义：

```dotenv
DAILY_TOOL_MODE=deploy
DAILY_TOOL_TIMEZONE=Asia/Shanghai
DAILY_TOOL_AGENT_TIMEOUT=90m
DAILY_TOOL_GOPROXY=https://goproxy.cn
```

`DAILY_TOOL_MODEL` 留空时使用 Codex 当前配置。若以后更换为从环境变量读取 API 密钥的提供商，应在此运行参数文件中配置其要求的变量，权限保持 0600。

修改 `script/systemd/it-tools-daily.timer` 的 `OnCalendar` 可以调整时间。例如每天北京时间 08:00：

```ini
OnCalendar=*-*-* 08:00:00 Asia/Shanghai
```

单次 Codex 开发最多 90 分钟，整个任务最多 2 小时。`Persistent=false` 表示关机错过的执行不会在开机后补跑。systemd 服务的 PATH 包含本机 Node.js 目录 `/www/server/nodejs/v24.16.0/bin`，更换 Node.js 安装路径时同步更新。

## 3. 安装并启用定时任务

```bash
cd /www/guhl/code/it-tools-app
sudo install -m 0644 script/systemd/it-tools-daily.service /etc/systemd/system/
sudo install -m 0644 script/systemd/it-tools-daily.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now it-tools-daily.timer
systemctl list-timers it-tools-daily.timer
```

`list-timers` 应显示下一次运行时间。启用 timer 不会立即新增工具；等待计划时间即可。不要直接把脚本复制到另一个目录运行，它通过自身路径定位项目。

如需立即执行一次完整开发、提交、推送、部署：

```bash
sudo systemctl start --no-block it-tools-daily.service
journalctl -u it-tools-daily.service -f
```

首次建议手动执行一次，确认日志、远端提交和 Docker 健康状态。当天成功后，完成标记会阻止定时器再次新增工具。

## 4. 查看结果

```bash
systemctl status it-tools-daily.service
journalctl -u it-tools-daily.service --since today --no-pager
ls -lt /var/lib/it-tools-daily/runs/
cd /www/guhl/code/it-tools-app
git log -3 --oneline
bash deploy.sh status
```

每次运行目录为 `/var/lib/it-tools-daily/runs/日期.随机后缀/`：

- `run.log`：安装依赖、测试、Git 和 Docker 部署日志。
- `events.jsonl`：Codex 的执行事件。
- `codex.stderr.log`：Codex 错误日志。
- `summary.md`：Codex 生成的中文实现说明。

执行期间可使用 `tail -f` 查看对应日志。完整任务成功会写入 `/var/lib/it-tools-daily/日期.done`；不能只根据模型报告判断部署是否成功。

## 5. 暂停、恢复和更新

暂停后续计划：

```bash
sudo systemctl disable --now it-tools-daily.timer
```

停止已经开始的任务：

```bash
sudo systemctl stop it-tools-daily.service
```

恢复计划：

```bash
sudo systemctl enable --now it-tools-daily.timer
```

修改时间后重新安装 `.timer`，执行 `systemctl daemon-reload` 和 `systemctl restart it-tools-daily.timer`。修改 `.env` 后下一次任务会读取新值。

## 失败时的行为

检查失败就停止后续发布步骤，保留分支、worktree 和日志。不强推、不重置主工作目录、不自动删除失败结果。main 在开发期间被别人更新，或出现未提交修改，也会停止自动发布。

每天的分支为 `daily/tool-日期`。失败后同名分支已存在时，重跑会停止以避免覆盖成果；先检查该分支，再决定保留修复还是归档。不要直接删除工作目录或完成标记来重跑。成功和失败的 worktree 都会保留，需定期按实际需要归档以控制磁盘占用。

如果已经推送成功但 Docker 部署失败，提交会保留在远端。解决部署错误后可在项目主目录手动执行 `bash deploy.sh`；不要反复启动完整任务来重做同一个工具。自动任务不会保证每日必定成功，API 额度、响应完整性、网络及代码测试都会影响结果。

如果临时只希望推送开发分支，不上线，把 `DAILY_TOOL_MODE` 改为 `branch`，脚本会推送当天分支后结束。

## Cloudflare 缓存

当前站点曾出现 HTML 被强制缓存 24 小时，Docker 更新后浏览器仍收到旧页面。启用自动上线前，在 Cloudflare 清除旧 HTML 缓存，并让 HTML 与 `/api/*` 遵守源站响应头或绕过缓存；带哈希的 `/assets/*` 可以继续长期缓存。

脚本会验证 Docker 健康，但没有 Cloudflare 管理凭据，不能代替你修改缓存规则或清缓存。

官方非交互运行说明：https://developers.openai.com/codex/noninteractive/
