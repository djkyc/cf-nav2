
# cf-nav Docker

## Build

```bash
docker build -f docker/Dockerfile -t cf-nav .

Run
docker run -d -p 3000:3000 cf-nav


---



使用方式（发布后）
拉取镜像
```
docker pull ghcr.io/djkyc/cf-nav:latest

运行
docker run -d -p 3000:3000 ghcr.io/djkyc/cf-nav:latest
