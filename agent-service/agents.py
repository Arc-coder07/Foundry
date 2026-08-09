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
"""
    
    async with Agent(config) as agent:
        response = await agent.chat(agent_prompt)
        content = await response.text()
        return content
