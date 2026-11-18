# study17: 멀티 스테이지 — 빌드는 JDK(Gradle), 실행은 JRE. 최종 이미지에는 빌드 도구가 없다.
# ---------- 1) 빌드 ----------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
# 의존성 정의를 먼저 복사해 레이어 캐시를 재사용한다 (소스만 바뀌면 의존성 다운로드를 건너뜀)
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true
COPY src src
RUN ./gradlew --no-daemon bootJar -x test

# ---------- 2) 실행 ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -m app          # 비 root 로 실행
COPY --from=build /app/build/libs/board-api-1.0.0.jar app.jar
USER app
EXPOSE 8080
# 컨테이너 안에서는 0.0.0.0 으로 열린다 (Spring 기본). DB/비밀은 환경 변수로만 주입한다.
ENTRYPOINT ["java", "-jar", "app.jar"]
