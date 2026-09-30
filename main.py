from __future__ import annotations

import asyncio
import json
from collections import OrderedDict
from pathlib import Path
from typing import Any

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from db_commands import ABPRepository
from settings import settings
from strands import Agent, tool
from strands.agent.conversation_manager.null_conversation_manager import NullConversationManager

app = BedrockAgentCoreApp()
log = app.logger

# --- SYSTEM PROMPT & ROUTING PROMPT LOADING ---
PROMPT_FILE = Path(__file__).parent / "routing_prompt.md"
DEFAULT_SYSTEM_PROMPT = (
    PROMPT_FILE.read_text(encoding="utf-8")
    if PROMPT_FILE.exists()
    else "You are a routing agent responsible for assigning healthcare cases based on assessment outcomes."
)

mcp_clients = []
tools = []
_INLINE_FUNCTION_NAMES = set()


def _make_conversation_manager():
    return NullConversationManager()


# --- AGENT FACTORY (LRU CACHE FOR SESSION ISOLATION) ---
def agent_factory():
    cache = OrderedDict()

    def get_or_create_agent(session_id: str) -> Agent:
        if session_id in cache:
            cache.move_to_end(session_id)
            return cache[session_id]
        if len(cache) >= 128:
            cache.popitem(last=False)

        cache[session_id] = Agent(
            model=settings.bedrock_model_id,
            system_prompt=DEFAULT_SYSTEM_PROMPT,
            tools=tools,
            conversation_manager=_make_conversation_manager(),
            hooks=[],
        )
        return cache[session_id]

    return get_or_create_agent


get_or_create_agent = agent_factory()


# --- PAYLOAD & PROMPT UTILITIES ---
def strip_trailing_tool_use(messages: Any) -> list[dict]:
    """Strip toolUse blocks from the tail until the last message has none."""
    if not isinstance(messages, list):
        raise ValueError("messages must be a list")

    messages = list(messages)
    while messages:
        last = messages[-1]
        if not isinstance(last, dict):
            raise ValueError("each message must be an object")
        original_content = last.get("content", [])
        if not isinstance(original_content, list) or not all(isinstance(block, dict) for block in original_content):
            raise ValueError("each message content value must be a list of content blocks")

        content = [block for block in original_content if "toolUse" not in block]
        if len(content) == len(original_content):
            break
        if content:
            messages[-1] = {**last, "content": content}
            break
        messages.pop()

    return messages


def _extract_prompt(payload: dict) -> Any:
    """Accept validated harness messages, tool results, or a plain prompt string/dict."""
    if not isinstance(payload, dict):
        raise ValueError("payload must be a JSON object")

    if "messages" in payload:
        return strip_trailing_tool_use(payload["messages"])

    if "tool_results" in payload:
        tool_results = payload["tool_results"]
        if not isinstance(tool_results, list) or not all(
            isinstance(tool_result, dict) and isinstance(tool_result.get("toolUseId"), str)
            for tool_result in tool_results
        ):
            raise ValueError("tool_results must contain objects with a toolUseId string")
        return [
            {
                "role": "user",
                "content": [
                    {
                        "toolResult": {
                            "toolUseId": tr["toolUseId"],
                            "status": tr.get("status", "success"),
                            "content": tr.get("content", []),
                        }
                    }
                    for tr in tool_results
                ],
            }
        ]

    if "prompt" in payload:
        prompt = payload["prompt"]
        if isinstance(prompt, dict):
            return json.dumps(prompt)
        return str(prompt)

    # Fallback: pass raw payload stringified if no explicit prompt key is given
    return json.dumps(payload)


# --- BUSINESS LOGIC HELPER: ROUTING DATABASE WORKFLOW ---
def _process_routing_workflow(work: dict[str, Any], llm_output: dict[str, Any]) -> dict[str, Any]:
    """
    1. Reads case_id and assessment_id.
    2. Persists assignment into MySQL via ABPRepository.save_assignment().
    3. Directs workflow output to the 'EXPLAINER' stage.
    """
    case_id = int(work["case_id"])
    assessment_id = int(work["assessment_id"])
    repository = ABPRepository()

    # Save case assignment into database
    assignment_id = repository.save_assignment(case_id, llm_output)

    return {
        "case_id": case_id,
        "assignment_id": assignment_id,
        "next_stage": "EXPLAINER",
        "repository_operations": repository.operation_count,
        **llm_output,
    }


# --- AGENTCORE ENTRYPOINT ---
@app.entrypoint
async def invoke(payload: dict, context: Any):
    log.info("Invoking Routing Agent...")

    session_id = getattr(context, "session_id", "default-session")
    agent = get_or_create_agent(session_id)
    prompt = _extract_prompt(payload)

    # Stream agent execution events back to Bedrock AgentCore
    async for event in agent.stream_async(prompt):
        if not isinstance(event, dict) or "event" not in event:
            continue
        cbs = event["event"].get("contentBlockStart")
        if cbs is not None and not cbs.get("start"):
            continue
        yield event


if __name__ == "__main__":
    app.run()