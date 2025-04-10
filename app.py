from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

# Function to load data from JSON files
def load_json_data(filename):
    file_path = os.path.join("data", filename)
    try:
        # Ensure the file exists before trying to open
        if not os.path.exists(file_path):
            print(f"Warning: File {filename} does not exist in path {os.path.abspath(file_path)}")
            return []

        with open(file_path, "r", encoding='utf-8') as f: # Added encoding
            data = json.load(f)
            print(f"Successfully loaded {filename}. Data count: {len(data) if isinstance(data, list) else 'Not a list'}")
            return data

    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {filename}: {str(e)}")
        return []
    except Exception as e:
        print(f"Error loading {filename}: {str(e)}")
        return []

@app.route('/')
def index():
    # Ensure the templates directory exists and index.html is inside it
    if not os.path.exists('templates/index.html'):
        print("Error: 'templates/index.html' not found. Make sure the file exists.")
        # Optionally return an error page or message
        return "Error: index.html template not found!", 404
    return render_template('index.html')

@app.route('/api/components/<component_type>')
def get_components(component_type):
    # Map component types to their respective JSON files
    component_files = {
        'cpu': 'cpus.json',
        'motherboard': 'motherboards.json',
        'gpu': 'gpus.json',
        'ram': 'ram.json',
        'storage': 'storage.json',
        'psu': 'psu.json',
        'case': 'cases.json'
        # 'cooler': 'coolers.json' # --- REMOVED COOLER ---
    }

    if component_type in component_files:
        components = load_json_data(component_files[component_type])
        return jsonify(components)
    else:
        print(f"Warning: Unknown component type requested: {component_type}") # Added warning
        return jsonify([])

if __name__ == '__main__':
    # Define base directory relative to the script location
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, 'data')
    template_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')


    # Create data directory if it doesn't exist
    if not os.path.exists(data_dir):
        print(f"Creating data directory at: {data_dir}")
        os.makedirs(data_dir)

    # Check if component JSON files exist, if not create empty ones
    required_files = [
        'cpus.json',
        'motherboards.json',
        'gpus.json',
        'ram.json',
        'storage.json',
        'psu.json',
        'cases.json'
        # 'coolers.json' # --- REMOVED COOLER ---
    ]

    for filename in required_files:
        file_path = os.path.join(data_dir, filename)
        if not os.path.exists(file_path):
            print(f"Creating empty file: {filename} at {file_path}")
            # Create empty JSON list file if it doesn't exist
            try:
                with open(file_path, 'w', encoding='utf-8') as f: # Added encoding
                    json.dump([], f)
            except Exception as e:
                 print(f"Error creating file {file_path}: {e}")


    # Check if templates directory exists
    if not os.path.exists(template_dir):
         print(f"Warning: Templates directory '{template_dir}' does not exist.")
    elif not os.path.exists(os.path.join(template_dir, 'index.html')):
        print(f"Warning: 'index.html' not found inside templates directory '{template_dir}'.")

    # Check if static directory exists (optional, Flask handles it but good practice)
    if not os.path.exists(static_dir):
         print(f"Warning: Static directory '{static_dir}' does not exist. CSS/JS might not load.")


    # Set Flask static and template folder paths explicitly (optional but good practice)
    app.template_folder = template_dir
    app.static_folder = static_dir

    # Note: For production, use a proper WSGI server instead of Flask's built-in debug server
    app.run(debug=True) # debug=True helps with development