from flask import Flask, render_template, request, jsonify
import pandas as pd
import joblib
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['PROPAGATE_EXCEPTIONS'] = True

# Load model
model = joblib.load('ml/team_risk_model.pkl')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'csv_file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['csv_file']
        filename = secure_filename(file.filename)
        filepath = os.path.join('data', filename)
        file.save(filepath)

        # Read CSV
        df = pd.read_csv(filepath)

        # Required columns
        required_cols = ['commits', 'messages', 'tickets_closed']
        for col in required_cols:
            if col not in df.columns:
                return jsonify({'error': f'Missing column: {col}'}), 400

        # Optional date column
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce').dt.strftime('%Y-%m-%d')
        else:
            df['date'] = [f'Row {i+1}' for i in range(len(df))]

        # Prediction
        X = df[['commits', 'messages', 'tickets_closed']]
        predictions = model.predict(X)
        df['at_risk'] = predictions

        # Prepare final result
        result = df[['date', 'commits', 'messages', 'tickets_closed', 'at_risk']].to_dict(orient='records')
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
