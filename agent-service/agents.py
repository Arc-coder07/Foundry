import os
import sys
import time
import logging
import httpx
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig, types
from google.antigravity.hooks import hooks

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic model for an external MCP server config
class McpServerEntry(BaseModel):
    id: str
    name: str
    type: str = "stdio"  # "stdio" or "http"
    command: Optional[str] = None
    args: Optional[str] = None
    url: Optional[str] = None
    api_token: Optional[str] = None
    env_key: Optional[str] = None

# Basic Pydantic model for input
class AgentRequest(BaseModel):
    item_id: str
    title: str
    summary: str
    problem: str
    proposed_solution: str
    unique_insight: str
    target_audience: str
    prompt: str = ""
    progress_url: str
    trace_url: str = ""
    mcp_servers: list[McpServerEntry] = []

# Web Research and SWOT analysis logic
async def run_research_and_swot(request_data: AgentRequest) -> str:
    
    # Mutable list to collect trace events during the agent run
    trace_events: list[dict] = []
    # Track start times for tool calls to calculate duration
    tool_start_times: dict[str, float] = {}
    
    @hooks.pre_tool_call_decide
    async def report_telemetry(tool_call: types.ToolCall) -> types.HookResult:
        tool_name = tool_call.name
        event_id = f"trace-{int(time.time() * 1000)}"
        
        # Record start time for duration calculation
        tool_start_times[event_id] = time.time()
        
        # Build the trace event
        tool_args = {}
        if hasattr(tool_call, 'args') and tool_call.args:
            try:
                # Serialize args, truncating very large values
                for k, v in tool_call.args.items():
                    str_v = str(v)
                    tool_args[k] = str_v[:500] if len(str_v) > 500 else str_v
            except Exception:
                tool_args = {"raw": str(tool_call.args)[:500]}
        
        event = {
            "id": event_id,
            "timestamp": datetime.now().isoformat(),
            "type": "tool_call",
            "content": f"Calling {tool_name}",
            "toolName": tool_name,
            "toolArgs": tool_args,
        }
        trace_events.append(event)
        
        # Send live progress + trace event
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Progress update
                await client.post(request_data.progress_url, json={
                    "item_id": request_data.item_id,
                    "progress": f"Agent thinking: Investigating via {tool_name}..."
                })
                # Trace event update (if trace_url is provided)
                if request_data.trace_url:
                    await client.post(request_data.trace_url, json={
                        "item_id": request_data.item_id,
                        "trace_event": event
                    })
        except Exception as e:
            logger.warning(f"Could not send telemetry update: {e}")
            
        return types.HookResult(allow=True)

    @hooks.post_tool_call
    async def capture_tool_result(tool_call: types.ToolCall, result) -> types.HookResult:
        event_id = f"trace-result-{int(time.time() * 1000)}"
        
        # Calculate duration from the most recent tool_call event
        duration_ms = None
        # Find the matching pre-call event to calculate duration
        for tid, start_time in list(tool_start_times.items()):
            duration_ms = int((time.time() - start_time) * 1000)
            del tool_start_times[tid]
            break
        
        # Truncate result for storage
        result_str = str(result) if result else "No output"
        if len(result_str) > 3000:
            result_str = result_str[:3000] + "\n... [truncated]"
        
        event = {
            "id": event_id,
            "timestamp": datetime.now().isoformat(),
            "type": "tool_result",
            "content": result_str,
            "toolName": tool_call.name,
            "durationMs": duration_ms,
        }
        trace_events.append(event)
        
        # Send live trace event
        try:
            if request_data.trace_url:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    await client.post(request_data.trace_url, json={
                        "item_id": request_data.item_id,
                        "trace_event": event
                    })
        except Exception as e:
            logger.warning(f"Could not send trace result update: {e}")
        
        return types.HookResult(allow=True)

    # Path to the Foundry MCP server
    mcp_server_path = os.path.join(os.path.dirname(__file__), "foundry_mcp_server.py")
    
    # Path to the Python interpreter in the venv
    if sys.platform == "win32":
        venv_python = os.path.join(os.path.dirname(__file__), "venv", "Scripts", "python.exe")
    else:
        venv_python = os.path.join(os.path.dirname(__file__), "venv", "bin", "python3")
    
    # Build MCP servers list: always include built-in Foundry server
    mcp_server_list = [
        types.McpStdioServer(
            name="foundry",
            command=venv_python,
            args=[mcp_server_path],
        )
    ]
    
    # Add user-configured external MCP servers
    external_names = []
    for srv in request_data.mcp_servers:
        try:
            if srv.type == "stdio" and srv.command:
                # Build args list from space-separated string
                args_list = srv.args.split() if srv.args else []
                
                # If the server has an env_key and api_token, set it in the environment
                env_vars = None
                if srv.env_key and srv.api_token:
                    env_vars = {srv.env_key: srv.api_token}
                    os.environ[srv.env_key] = srv.api_token
                
                mcp_server_list.append(
                    types.McpStdioServer(
                        name=srv.name.lower().replace(" ", "_"),
                        command=srv.command,
                        args=args_list,
                    )
                )
                external_names.append(srv.name)
            elif srv.type == "http" and srv.url:
                headers = {}
                if srv.api_token:
                    headers["Authorization"] = f"Bearer {srv.api_token}"
                
                mcp_server_list.append(
                    types.McpStreamableHttpServer(
                        name=srv.name.lower().replace(" ", "_"),
                        url=srv.url,
                        headers=headers if headers else None,
                    )
                )
                external_names.append(srv.name)
        except Exception as e:
            logger.warning(f"Failed to configure MCP server '{srv.name}': {e}")
    
    if external_names:
        logger.info(f"External MCP servers connected: {', '.join(external_names)}")
    
    # Enable Web Search, URL Reading, and all MCP tools
    config = LocalAgentConfig(
        hooks=[report_telemetry, capture_tool_result],
        capabilities=CapabilitiesConfig(
            enabled_tools=[
                types.BuiltinTools.SEARCH_WEB,
                types.BuiltinTools.READ_URL_CONTENT,
                types.BuiltinTools.VIEW_FILE,
            ]
        ),
        mcp_servers=mcp_server_list,
        # Ensure GEMINI_API_KEY is available in the environment
        api_key=os.environ.get("GEMINI_API_KEY")
    )
    
    agent_prompt = f"""
You are an elite Autonomous Product Researcher and VC Analyst.
You are tasked with researching a product idea and performing a SWOT analysis.

Product Title: {request_data.title}
Summary: {request_data.summary}
Problem: {request_data.problem}
Solution: {request_data.proposed_solution}
Target Audience: {request_data.target_audience}

User Request: {request_data.prompt}

You have access to these capabilities:
- Web search and URL reading for live market research.
- Foundry workspace tools (foundry_list_items, foundry_search_items, foundry_get_item, etc.) to read other product ideas in the user's workspace for cross-referencing and context.

Please perform the following steps:
1. Optionally use foundry_list_items or foundry_search_items to see if the user has related ideas in their workspace that provide additional context.
2. Search the web for competitors and similar products.
3. Search for the actual market size and relevant market trends.
4. Perform an advanced SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) based on your findings.
5. Output a comprehensive Markdown report of your findings. DO NOT include any preamble, only the markdown report. Use headings (###) to separate sections.
6. If a tool fails (e.g. rate limit or quota exceeded), gracefully note the limitation in your report and continue. DO NOT output raw error strings like "GenerateContent failed".
7. Use Mermaid.js (```mermaid) syntax to generate beautiful diagrams for market mapping or architecture whenever possible. Use Markdown Tables for competitor feature comparisons.
"""
    
    try:
        async with Agent(config) as agent:
            response = await agent.chat(agent_prompt)
            content = await response.text()
            
            # Add a final_response trace event
            trace_events.append({
                "id": f"trace-final-{int(time.time() * 1000)}",
                "timestamp": datetime.now().isoformat(),
                "type": "final_response",
                "content": "Agent completed research and generated final report.",
            })
            
            usage = agent.conversation.total_usage
            usage_dict = None
            if usage:
                usage_dict = {
                    "prompt": usage.prompt_token_count,
                    "candidate": usage.candidates_token_count,
                    "total": usage.total_token_count
                }
                
            return content, usage_dict, trace_events
    except Exception as e:
        logger.error(f"Agent execution failed: {e}")
        trace_events.append({
            "id": f"trace-error-{int(time.time() * 1000)}",
            "timestamp": datetime.now().isoformat(),
            "type": "error",
            "content": str(e),
        })
        return f"### Research Failed\n\nThe agent encountered an unexpected error:\n```\n{e}\n```\nPlease ensure your API limits are sufficient and try again.", None, trace_events

