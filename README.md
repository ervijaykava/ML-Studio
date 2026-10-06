# ML Studio

A simple web app to train machine learning models on your own CSV file.
Upload a clean CSV, pick the X and Y columns, choose classification or regression,
set the train/test split, choose a model and see the metrics and graphs.

**Note:** upload only a clean CSV file (no missing values, no junk rows).

## Files
- `app.py` - Python server (training code)
- `index.html`, `upload.html`, `train.html`, `result.html` - pages
- `style.css`, `script.js` - design and page logic
- `requirements.txt` - Python packages

## Run on your computer
```
pip install -r requirements.txt
python app.py
```
Open http://localhost:8000

## Deploy (Render.com, free)
1. Put all the files in a GitHub repository.
2. On Render: New -> Web Service -> connect the repository.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `python app.py`
5. Click Deploy. Render gives you the live link.

The app reads the `PORT` given by the host, so no other setting is needed.
(Railway, PythonAnywhere-style hosts that run `python app.py` work the same way.)

## Models
- Classification: Logistic Regression, Decision Tree, Random Forest, KNN, SVM
- Regression: Linear Regression, Decision Tree, Random Forest, KNN
