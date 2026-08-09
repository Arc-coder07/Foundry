import os
import logging
from pydantic import BaseModel
from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig, types

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Web Research and SWOT analysis logic
async def run_research_and_swot(request_data: AgentRequest) -> str:
    # Enable Web Search and Web Content Reading
    config = LocalAgentConfig(
        capabilities=CapabilitiesConfig(
            enabled_tools=[
                types.BuiltinTools.SEARCH_WEB,
                types.BuiltinTools.READ_URL_CONTENT,
                types.BuiltinTools.VIEW_FILE,
            ]
        ),
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

Please perform the following steps:
1. Search the web for competitors and similar products.
2. Search for the actual market size and relevant market trends.
3. Perform an advanced SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) based on your findings.
4. Output a comprehensive Markdown report of your findings. DO NOT include any preamble, only the markdown report. Use headings (###) to separate sections.
5. If a tool fails (e.g. rate limit or quota exceeded), gracefully note the limitation in your report and continue. DO NOT output raw error strings like "GenerateContent failed".
6. Use Mermaid.js (```mermaid) syntax to generate beautiful diagrams for market mapping or architecture whenever possible. Use Markdown Tables for competitor feature comparisons.
"""
    
    try:
        async with Agent(config) as agent:
            response = await agent.chat(agent_prompt)
            content = await response.text()
            
            # Fetch token usage for observability
            usage = agent.conversation.total_usage
            if usage:
                token_report = f"\n\n---\n### 📊 AI Compute Metrics\n- **Prompt Tokens**: `{usage.prompt_token_count}`\n- **Candidate Tokens**: `{usage.candidates_token_count}`\n- **Reasoning Tokens**: `{usage.thoughts_token_count}`\n- **Total Session Tokens**: `{usage.total_token_count}`\n"
                content += token_report
                
            return content
    except Exception as e:
        logger.error(f"Agent execution failed: {e}")
        return f"### Research Failed\n\nThe agent encountered an unexpected error:\n```\n{e}\n```\nPlease ensure your API limits are sufficient and try again."
