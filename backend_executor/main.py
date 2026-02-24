from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from tracer import trace_execution

app = FastAPI()

# Enable CORS since our frontend runs on ports like 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeExecutionRequest(BaseModel):
    code: str
    language: str

@app.post("/execute")
async def execute_code(req: CodeExecutionRequest):
    if req.language.lower() != 'python':
        # Currently we only actually execute Python via this native endpoint
        # For JS we still use frontend parsing. 
        # For Java/C++, we'd need more complex wrappers here.
        raise HTTPException(status_code=400, detail="Currently only Python tracing is fully supported in this native engine.")
        
    result = trace_execution(req.code)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result.get('error', 'Execution Failed'))
        
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
