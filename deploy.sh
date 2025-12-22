#!/bin/bash
set -e

echo "🚀 Nav-CF Cloudflare 一键部署"

# 检查 wrangler
if ! command -v wrangler &> /dev/null; then
  echo "📦 未检测到 wrangler，正在安装..."
  npm install -g wrangler
fi

# 登录 CF
wrangler login

# ✅ 默认固化一个参数（你把这里替换成你自己的 key）
DEFAULT_AI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 如果外部没有传 AI_API_KEY，就用默认的
AI_API_KEY="${AI_API_KEY:-$DEFAULT_AI_API_KEY}"

# 写入 Cloudflare Secret（固化到 Worker 环境变量里）
echo "🔐 正在写入 Cloudflare Secret: AI_API_KEY ..."
printf "%s" "$AI_API_KEY" | wrangler secret put AI_API_KEY

# 创建 KV（如果不存在）
echo "📦 创建 KV Namespace..."
wrangler kv:namespace create CARD_ORDER || true
wrangler kv:namespace create CARD_ORDER --preview || true

# 部署
echo "🚀 开始部署..."
wrangler deploy

echo "✅ 部署完成！"
