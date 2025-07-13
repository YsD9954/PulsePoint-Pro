from flask import Flask, render_template, request, jsonify
import pandas as pd
import joblib
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['PROPAGATE_EXCEPTIONS'] = True  # Show internal errors if any

# Load model once
model = joblib.load('ml/team_risk_model.pkl')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # File check
        if 'csv_file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['csv_file']
        filename = secure_filename(file.filename)
        filepath = os.path.join('data', filename)
        file.save(filepath)

        # Load CSV
        df = pd.read_csv(filepath)

        # Feature check
        required_cols = ['commits', 'messages', 'tickets_closed']
        for col in required_cols:
            if col not in df.columns:
                return jsonify({'error': f'Missing column: {col}'}), 400

        # Optional: handle missing 'date'
        if 'date' in df.columns:
            df['date'] = df['date'].astype(str)

        # Predict
        X = df[['commits', 'messages', 'tickets_closed']]
        predictions = model.predict(X)
        df['at_risk'] = predictions

        # Return JSON
        result = df.to_dict(orient='records')
        print("✅ Prediction result:", result)  # for debugging
        return jsonify(result)

    except Exception as e:
        print("🔥 Server error:", str(e))
        return jsonify({'error': str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
