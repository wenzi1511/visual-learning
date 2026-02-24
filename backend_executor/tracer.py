import sys
import io
import contextlib
import ast

def trace_execution(code_string):
    """
    Executes Python code and traces execution line-by-line,
    capturing variable states and stdout output.
    """
    trace_data = []
    
    # Store local variables for the execution context
    user_globals = {}
    user_locals = {}
    
    # Track console output line by line as it happens
    output_buffer = io.StringIO()
    
    def trace_calls(frame, event, arg):
        # We only care about line execution events inside our user code
        # We identify user code by the filename '<string>' (used by exec)
        if frame.f_code.co_filename != '<string>':
            return None
            
        if event == 'line':
            # Capture variables at this line
            current_vars = {}
            for k, v in frame.f_locals.items():
                if not k.startswith('__'):  # ignore built-ins
                    try:
                        if isinstance(v, list):
                            current_vars[k] = {"__type": "list", "val": v.copy()}
                        elif isinstance(v, dict):
                            # Ensure dict keys are strings for JSON serialization
                            safe_dict = {str(dk): dv for dk, dv in v.items()}
                            current_vars[k] = {"__type": "dict", "val": safe_dict}
                        elif isinstance(v, set):
                            current_vars[k] = {"__type": "set", "val": list(v)}
                        else:
                            current_vars[k] = repr(v)
                    except Exception:
                        current_vars[k] = "<unrepresentable>"
            
            # Record state BEFORE executing the line
            trace_data.append({
                'line': frame.f_lineno,
                'variables': current_vars,
                'output': output_buffer.getvalue() # output up to this point
            })
            
        return trace_calls

    # Parse and compile to check for syntax errors before running
    try:
        compiled_code = compile(code_string, '<string>', 'exec')
    except SyntaxError as e:
        return {'success': False, 'error': f"Syntax Error on line {e.lineno}: {e.msg}"}
    except Exception as e:
        return {'success': False, 'error': str(e)}

    # Execute with tracing
    original_trace = sys.gettrace()
    try:
        # Redirect stdout to capture print() calls
        with contextlib.redirect_stdout(output_buffer):
            sys.settrace(trace_calls)
            exec(compiled_code, user_globals, user_locals)
    except Exception as e:
        # Capture runtime errors as well
        trace_data.append({
            'line': None, # Occurred at the end or inside an un-traceable block
            'variables': {},
            'output': output_buffer.getvalue() + f"\nRuntime Error: {str(e)}"
        })
    finally:
        sys.settrace(original_trace)
        
    return {
        'success': True,
        'trace': trace_data,
        'final_output': output_buffer.getvalue()
    }

if __name__ == "__main__":
    # Test
    code = """
count = 0
for i in range(3):
    count += i
print(count)
    """
    res = trace_execution(code)
    import json
    print(json.dumps(res, indent=2))
