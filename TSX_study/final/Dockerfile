# study17: 멀티 스테이지 — 빌드는 Node, 서빙은 Nginx. 최종 이미지에는 Node 도 node_modules 도 없다.
# ---------- 1) 빌드 ----------
FROM node:22-alpine AS build
WORKDIR /app

# 의존성 파일을 먼저 복사해 npm ci 결과를 레이어 캐시로 재사용한다.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# VITE_* 는 "빌드할 때" 코드에 박힌다. 빈 값 = 같은 도메인의 /api 를 쓴다(Nginx 가 프록시 → CORS 불필요).
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---------- 2) 서빙 ----------
FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
