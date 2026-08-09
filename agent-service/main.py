from fastapi import FastAPI, BackgroundTasks, HTTPException
import httpx
import uvicorn
from pydantic import BaseModel
import logging
import asyncio
from dotenv import load_dotenv

load_dotenv()

from agents import run_research_and_swot, AgentRequest

app = FastAPI()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResearchJob(BaseModel):
    item_id: str
    title: str
    summary: str
    problem: str
    proposed_solution: str
    unique_insight: str
    target_audience: str
    prompt: str = ""
    callback_url: str
    progress_url: str

async def process_research_job(job: ResearchJob):
    logger.info(f"Starting research for item {job.item_id}")
    try:
        # Construct the request data
        request_data = AgentRequest(
            item_id=job.item_id,
            title=job.title,
            summary=job.summary,
            problem=job.problem,
            proposed_solution=job.proposed_solution,
            unique_insight=job.unique_insight,
            target_audience=job.target_audience,
            prompt=job.prompt,
            progress_url=job.progress_url
        )
        
        # Notify progress: Agent started
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(job.progress_url, json={
                    "item_id": job.item_id,
                    "progress": "Agent started: Searching web and synthesizing data..."
                })
        except Exception as e:
            logger.warning(f"Could not send progress update: {e}")

        # Run the agent
        result_markdown = await run_research_and_swot(request_data)
        
        logger.info(f"Research complete for {job.item_id}, sending callback")
        
        # Post the result back to the Node.js backend
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.post(job.callback_url, json={
                "item_id": job.item_id,
                "status": "completed",
                "result": result_markdown
            })
            
    except Exception as e:
        logger.error(f"Error processing research for {job.item_id}: {str(e)}")
        # Send error callback
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(job.callback_url, json={
                "item_id": job.item_id,
                "status": "error",
                "error": str(e)
            })

@app.post("/api/research")
async def start_research(job: ResearchJob, background_tasks: BackgroundTasks):
    # Enqueue the background task
    background_tasks.add_task(process_research_job, job)
    return {"status": "accepted", "message": "Research job started in background"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
