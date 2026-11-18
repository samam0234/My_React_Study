package com.example.board.ai;

import java.util.List;
import java.util.function.BooleanSupplier;
import java.util.function.Consumer;

/** 실제 모델을 호출하지 않는 모의 구현. 입력 길이에 따라 결정적인 응답을 돌려준다(테스트·키 없는 개발용). */
public class MockAiProvider implements AiProvider {

    private static String answer(List<Message> messages) {
        String last = messages.get(messages.size() - 1).content();
        if (last.contains("REFUSE_ME")) return null; // 거절 시뮬레이션
        return "모의 응답입니다. 입력 " + last.length() + "자를 받았습니다. (실제 모델을 호출하지 않았습니다)";
    }

    private static int tokens(String s) {
        return Math.max(1, s.length() / 4);
    }

    private static int inputTokens(List<Message> messages) {
        return messages.stream().mapToInt(m -> tokens(m.content())).sum();
    }

    @Override
    public Result chat(List<Message> messages) {
        String text = answer(messages);
        if (text == null) return new Result("", inputTokens(messages), 0, true, false);
        return new Result(text, inputTokens(messages), tokens(text), false, false);
    }

    @Override
    public Result stream(List<Message> messages, Consumer<String> onText, BooleanSupplier cancelled) {
        String text = answer(messages);
        if (text == null) return new Result("", inputTokens(messages), 0, true, false);
        StringBuilder sent = new StringBuilder();
        for (String word : text.split("(?<= )")) { // 공백 단위로 조각내어 스트리밍을 흉내 낸다
            if (cancelled.getAsBoolean()) break;
            onText.accept(word);
            sent.append(word);
        }
        return new Result(sent.toString(), inputTokens(messages), tokens(sent.toString()), false, false);
    }
}
