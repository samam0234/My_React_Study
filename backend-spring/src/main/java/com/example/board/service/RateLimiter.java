package com.example.board.service;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** 키(사용자·IP 등)별 슬라이딩 윈도 카운터. 단일 인스턴스용 메모리 구현 (여러 인스턴스면 Redis 등이 필요). */
public class RateLimiter {

    private final int max;
    private final Duration window;
    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    public RateLimiter(int max, Duration window) {
        this.max = max;
        this.window = window;
    }

    /** 한도 안이면 기록하고 true, 넘으면 false. */
    public boolean tryAcquire(String key) {
        long now = System.currentTimeMillis();
        Deque<Long> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > window.toMillis()) q.pollFirst();
            if (q.size() >= max) return false;
            q.addLast(now);
            return true;
        }
    }

    public boolean isBlocked(String key) {
        long now = System.currentTimeMillis();
        Deque<Long> q = hits.get(key);
        if (q == null) return false;
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > window.toMillis()) q.pollFirst();
            return q.size() >= max;
        }
    }

    public void reset(String key) {
        hits.remove(key);
    }
}
