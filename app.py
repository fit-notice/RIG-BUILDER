from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

# Function to load data from JSON files
def load_json_data(filename):
    file_path = os.path.join("data", filename)
    try:
        if not os.path.exists(file_path):
            print(f"Warning: File {filename} does not exist in path {os.path.abspath(file_path)}")
            return []
        with open(file_path, "r", encoding='utf-8') as f:
            data = json.load(f)
            return data
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {filename}: {str(e)}")
        return []
    except Exception as e:
        print(f"Error loading {filename}: {str(e)}")
        return []

@app.route('/')
def index():
    if not os.path.exists('templates/index.html'):
        print("Error: 'templates/index.html' not found.")
        return "Error: index.html template not found!", 404
    return render_template('index.html')

@app.route('/api/components/<component_type>')
def get_components(component_type):
    component_files = {
        'cpu': 'cpus.json',
        'motherboard': 'motherboards.json',
        'gpu': 'gpus.json',
        'ram': 'ram.json',
        'storage': 'storage.json',
        'psu': 'psu.json',
        'case': 'cases.json'
    }
    if component_type in component_files:
        components = load_json_data(component_files[component_type])
        return jsonify(components)
    else:
        print(f"Warning: Unknown component type requested: {component_type}")
        return jsonify([])

# --- NEW ROUTE FOR SETTINGS PAGE ---
@app.route('/settings')
def settings_page():
    if not os.path.exists('templates/settings.html'):
        print("Error: 'templates/settings.html' not found.")
        return "Error: settings.html template not found!", 404
    return render_template('settings.html')
# --- END NEW ROUTE ---

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, 'data')
    template_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')

    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    required_files = [
        'cpus.json', 'motherboards.json', 'gpus.json',
        'ram.json', 'storage.json', 'psu.json', 'cases.json'
    ]
    for filename in required_files:
        file_path = os.path.join(data_dir, filename)
        if not os.path.exists(file_path):
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump([], f)

    if not os.path.exists(template_dir) or \
       not os.path.exists(os.path.join(template_dir, 'index.html')): # Also check for settings.html later
        print(f"Warning: Templates directory or essential HTML files might be missing in '{template_dir}'.")

    if not os.path.exists(static_dir):
         print(f"Warning: Static directory '{static_dir}' does not exist.")

    app.template_folder = template_dir
    app.static_folder = static_dir
    app.run(debug=True)