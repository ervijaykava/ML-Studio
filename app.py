# ML Studio - run with:  python app.py   (locally open http://localhost:8000)
import io
import os
import json
import base64
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from http.server import BaseHTTPRequestHandler, HTTPServer

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, r2_score, mean_absolute_error, mean_squared_error

df = None


def get_image():
    # turn the current matplotlib plot into text so the browser can show it
    img = io.BytesIO()
    plt.savefig(img, format="png", bbox_inches="tight")
    plt.close()
    return base64.b64encode(img.getvalue()).decode()


def train(info):
    features = info["features"]
    target = info["target"]

    X = df[features]
    X = pd.get_dummies(X)
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=info["test"], random_state=42
    )

    name = info["model"]
    if info["problem"] == "Classification":
        if name == "Logistic Regression":
            model = LogisticRegression(max_iter=1000)
        elif name == "Decision Tree":
            model = DecisionTreeClassifier()
        elif name == "Random Forest":
            model = RandomForestClassifier()
        elif name == "KNN":
            model = KNeighborsClassifier()
        else:
            model = SVC()
    else:
        if name == "Linear Regression":
            model = LinearRegression()
        elif name == "Decision Tree":
            model = DecisionTreeRegressor()
        elif name == "Random Forest":
            model = RandomForestRegressor()
        else:
            model = KNeighborsRegressor()

    model.fit(X_train, y_train)
    pred = model.predict(X_test)

    images = []
    if info["problem"] == "Classification":
        acc = accuracy_score(y_test, pred) * 100
        prec = precision_score(y_test, pred, average="weighted", zero_division=0) * 100
        rec = recall_score(y_test, pred, average="weighted", zero_division=0) * 100
        f1 = f1_score(y_test, pred, average="weighted", zero_division=0) * 100
        metrics = [["Accuracy", "%.1f%%" % acc], ["Precision", "%.1f%%" % prec],
                   ["Recall", "%.1f%%" % rec], ["F1 Score", "%.1f%%" % f1]]

        cm = confusion_matrix(y_test, pred)
        plt.imshow(cm, cmap="Blues")
        for i in range(len(cm)):
            for j in range(len(cm)):
                plt.text(j, i, cm[i][j], ha="center", va="center")
        plt.xticks(range(len(cm)), model.classes_)
        plt.yticks(range(len(cm)), model.classes_)
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
        plt.title("Confusion Matrix")
        images.append(get_image())

        plt.bar(["Accuracy", "Precision", "Recall", "F1"], [acc, prec, rec, f1], color="#3b5bdb")
        plt.ylim(0, 100)
        plt.ylabel("Score (%)")
        plt.title("Model Performance")
        images.append(get_image())
    else:
        r2 = r2_score(y_test, pred)
        mae = mean_absolute_error(y_test, pred)
        mse = mean_squared_error(y_test, pred)
        rmse = np.sqrt(mse)
        metrics = [["R² Score", "%.2f" % r2], ["MAE", "%.2f" % mae],
                   ["MSE", "%.2f" % mse], ["RMSE", "%.2f" % rmse]]

        plt.scatter(y_test, pred, color="#3b5bdb")
        plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], color="gray")
        plt.xlabel("Actual")
        plt.ylabel("Predicted")
        plt.title("Actual vs Predicted")
        images.append(get_image())

    return {"metrics": metrics, "images": images}


class Handler(BaseHTTPRequestHandler):
    def send(self, data, kind):
        self.send_response(200)
        self.send_header("Content-Type", kind)
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        page = self.path.split("?")[0].strip("/")
        if page == "":
            page = "index.html"
        types = {"html": "text/html", "css": "text/css", "js": "text/javascript"}
        ext = page.split(".")[-1]
        if page in ["index.html", "upload.html", "train.html", "result.html", "style.css", "script.js"]:
            self.send(open(page, "rb").read(), types[ext] + "; charset=utf-8")
        else:
            self.send_error(404)

    def do_POST(self):
        global df
        size = int(self.headers["Content-Length"])
        data = json.loads(self.rfile.read(size))
        try:
            if self.path == "/upload":
                df = pd.read_csv(io.StringIO(data["text"]))
                head = df.head().fillna("").astype(str).values.tolist()
                out = {"rows": len(df), "columns": df.columns.tolist(), "head": head}
            else:
                out = train(data)
        except Exception as e:
            out = {"error": str(e)}
        self.send(json.dumps(out).encode(), "application/json")


port = int(os.environ.get("PORT", 8000))   # the hosting site gives the port
print("ML Studio running on port", port)
HTTPServer(("0.0.0.0", port), Handler).serve_forever()
