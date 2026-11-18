package com.example.board.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Seed seed, Limits limits, Ai ai) {

    public record Jwt(String secret, long ttlSeconds, boolean requireSecret) {}

    public record Cors(List<String> origins) {}

    public record Seed(boolean enabled) {}

    public record Limits(long maxBodyBytes, int loginAttemptsPerMinute) {}

    public record Ai(String provider, String model, int maxTokens, long dailyTokenLimit, int requestsPerMinute) {}
}
