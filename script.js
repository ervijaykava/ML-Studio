var page = document.body.dataset.page;
var state = JSON.parse(sessionStorage.getItem("ml") || "{}");
function save() { sessionStorage.setItem("ml", JSON.stringify(state)); }
function $(id) { return document.getElementById(id); }

var links = [["index.html", "Home", "home"], ["upload.html", "Dataset", "upload"],
             ["train.html", "Train Model", "train"], ["result.html", "Results", "result"]];
var nav = "";
links.forEach(function (l) {
  nav += '<a href="' + l[0] + '"' + (l[2] == page ? ' class="on"' : "") + ">" + l[1] + "</a>";
});
$("top").innerHTML = '<header class="top"><div><a class="logo" href="index.html">ML <b>Studio</b></a><nav>' + nav + "</nav></div></header>";

function setSteps(now) {
  var names = ["Upload", "Variables", "Training", "Results"], html = "";
  names.forEach(function (n, i) {
    var cls = i < now ? "done" : (i == now ? "now" : "");
    html += '<span class="' + cls + '">' + (i < now ? "✓ " : "") + n + "</span>";
  });
  $("steps").className = "steps";
  $("steps").innerHTML = html;
}

function toggle(list, item, on) {
  var i = list.indexOf(item);
  if (on && i < 0) list.push(item);
  if (!on && i >= 0) list.splice(i, 1);
}

function post(url, data, done) {
  fetch(url, { method: "POST", body: JSON.stringify(data) })
    .then(function (r) { return r.json(); }).then(done);
}

if (page == "home") {
  var models = [["Logistic Regression", 88], ["Decision Tree", 91], ["Random Forest", 94], ["KNN", 85]];
  models.forEach(function (m) {
    $("bars").innerHTML += '<div class="bar"><span>' + m[0] + '</span><div class="t"><i style="width:' + m[1] + '%"></i></div><span>' + m[1] + "%</span></div>";
  });
  var perf = [["LR", 87, 86, 86], ["DT", 90, 91, 90], ["RF", 94, 93, 93], ["KNN", 84, 85, 84]];
  var c = "", l = "";
  perf.forEach(function (p) {
    c += '<div><p><i style="height:' + p[1] + '%"></i><i style="height:' + p[2] + '%"></i><i style="height:' + p[3] + '%"></i></p></div>';
    l += "<span>" + p[0] + "</span>";
  });
  $("cols").innerHTML = '<div class="cols">' + c + '</div><div class="lab">' + l + "</div>";
}

function showDataset() {
  $("loaded").className = "";
  $("fname").textContent = state.name;
  $("fsize").textContent = state.rows.toLocaleString() + " Rows, " + state.columns.length + " Columns";
  var t = "<table><tr>";
  state.columns.forEach(function (c) { t += "<th>" + c + "</th>"; });
  t += "</tr>";
  state.head.forEach(function (r) {
    t += "<tr>";
    r.forEach(function (v) { t += "<td>" + v + "</td>"; });
    t += "</tr>";
  });
  $("preview").innerHTML = t + "</table>";
  renderCols();
  renderXY();
  renderProblem();
  renderSplit();
  setSteps(1);
}

function renderCols() {
  var q = $("search").value.toLowerCase();
  $("cols").innerHTML = "";
  state.columns.forEach(function (c) {
    if (c.toLowerCase().indexOf(q) < 0) return;
    var lab = document.createElement("label");
    lab.className = "chip";
    lab.innerHTML = '<input type="checkbox"' + (state.cols.indexOf(c) >= 0 ? " checked" : "") + "> " + c;
    lab.firstChild.onchange = function (e) { toggle(state.cols, c, e.target.checked); renderXY(); };
    $("cols").appendChild(lab);
  });
}

function renderXY() {
  // keep X and Y only from the selected columns
  state.features = state.features.filter(function (f) { return state.cols.indexOf(f) >= 0 && f != state.target; });
  if (state.cols.indexOf(state.target) < 0) state.target = "";
  $("count").textContent = state.cols.length + " columns selected";
  $("xs").innerHTML = "";
  state.cols.forEach(function (c) {
    if (c == state.target) return;
    var lab = document.createElement("label");
    lab.className = "chip";
    lab.innerHTML = '<input type="checkbox"' + (state.features.indexOf(c) >= 0 ? " checked" : "") + "> " + c;
    lab.firstChild.onchange = function (e) { toggle(state.features, c, e.target.checked); showXY(); };
    $("xs").appendChild(lab);
  });
  var opts = '<option value="">Select target</option>';
  state.cols.forEach(function (c) {
    opts += '<option value="' + c + '"' + (c == state.target ? " selected" : "") + ">" + c + "</option>";
  });
  $("y").innerHTML = opts;
  showXY();
}

function showXY() {
  $("xy").innerHTML = "X → " + (state.features.join(", ") || "none") + "<br>Y → " + (state.target || "none");
  save();
}

function renderProblem() {
  document.querySelectorAll(".pick").forEach(function (p) {
    p.className = "pick" + (p.dataset.p == state.problem ? " on" : "");
  });
}

function renderSplit() {
  $("splits").innerHTML = "";
  [70, 75, 80, 85, 90].forEach(function (n) {
    var b = document.createElement("button");
    b.className = "btn" + (n == state.split ? "" : " light");
    b.textContent = n + " / " + (100 - n);
    b.onclick = function () { state.split = n; save(); renderSplit(); };
    $("splits").appendChild(b);
  });
  $("trainbar").style.width = state.split + "%";
  $("testbar").style.width = (100 - state.split) + "%";
  $("trainbar").textContent = "Training " + state.split + "%";
  $("testbar").textContent = "Testing " + (100 - state.split) + "%";
}

if (page == "upload") {
  setSteps(0);
  if (!state.cols) { state.cols = []; state.features = []; state.target = ""; state.problem = "Classification"; state.split = 80; }

  function upload(file) {
    $("err").textContent = "";
    if (!file || !file.name.endsWith(".csv")) { $("err").textContent = "Please choose a .csv file."; return; }
    file.text().then(function (text) {
      post("/upload", { text: text }, function (d) {
        if (d.error) { $("err").textContent = "Could not read the file: " + d.error; return; }
        state = { name: file.name, rows: d.rows, columns: d.columns, head: d.head,
                  cols: d.columns.slice(), features: [], target: "", problem: "Classification", split: 80 };
        showDataset();
      });
    });
  }

  $("drop").onclick = function () { $("file").click(); };
  $("file").onchange = function (e) { upload(e.target.files[0]); };
  $("drop").ondragover = function (e) { e.preventDefault(); $("drop").classList.add("over"); };
  $("drop").ondragleave = function () { $("drop").classList.remove("over"); };
  $("drop").ondrop = function (e) { e.preventDefault(); $("drop").classList.remove("over"); upload(e.dataTransfer.files[0]); };
  $("search").oninput = renderCols;
  $("all").onclick = function () { state.cols = state.columns.slice(); renderCols(); renderXY(); };
  $("none").onclick = function () { state.cols = []; renderCols(); renderXY(); };
  $("y").onchange = function (e) { state.target = e.target.value; renderXY(); };
  document.querySelectorAll(".pick").forEach(function (p) {
    p.onclick = function () { state.problem = p.dataset.p; save(); renderProblem(); };
  });
  $("next").onclick = function () {
    if (state.features.length == 0 || !state.target) { $("err2").textContent = "Select at least one X column and one Y column."; return; }
    save();
    location.href = "train.html";
  };
  // the server forgets the file if it restarts, so a new upload is needed then
  if (state.columns) showDataset();
}

function summary(extra) {
  var items = [["Dataset", state.name], ["Features", state.features.length + ""], ["Target", state.target],
               ["Problem Type", state.problem], ["Train/Test", state.split + " / " + (100 - state.split)]];
  if (extra) items.unshift(["Model", extra]);
  var h = "";
  items.forEach(function (i) { h += "<div><small>" + i[0] + "</small><b>" + i[1] + "</b></div>"; });
  $("sum").innerHTML = h;
}

if (page == "train") {
  setSteps(2);
  if (!state.features || state.features.length == 0) location.href = "upload.html";
  summary();
  $("sum").innerHTML += "<div><small>Feature names</small><b>" + state.features.join(", ") + "</b></div>";
  var list = state.problem == "Classification"
    ? ["Logistic Regression", "Decision Tree", "Random Forest", "KNN", "SVM"]
    : ["Linear Regression", "Decision Tree", "Random Forest", "KNN"];
  state.model = state.model && list.indexOf(state.model) >= 0 ? state.model : list[0];
  function showModels() {
    $("models").innerHTML = "";
    list.forEach(function (m) {
      var d = document.createElement("div");
      d.className = "pick" + (m == state.model ? " on" : "");
      d.innerHTML = "<b>" + m + "</b>";
      d.onclick = function () { state.model = m; save(); showModels(); };
      $("models").appendChild(d);
    });
  }
  showModels();
  $("go").onclick = function () {
    $("go").disabled = true;
    $("go").textContent = "Training...";
    $("err").textContent = "";
    post("/train", { features: state.features, target: state.target, problem: state.problem,
                     test: (100 - state.split) / 100, model: state.model }, function (d) {
      if (d.error) {
        $("err").textContent = "Training failed: " + d.error;
        $("go").disabled = false;
        $("go").textContent = "Train Model";
        return;
      }
      sessionStorage.setItem("result", JSON.stringify(d));
      location.href = "result.html";
    });
  };
}

if (page == "result") {
  var res = JSON.parse(sessionStorage.getItem("result") || "null");
  if (!res) {
    setSteps(3);
    $("none").innerHTML = 'No results yet. <a href="upload.html"><u>Start by uploading a dataset.</u></a>';
  } else {
    setSteps(4);
    $("out").className = "";
    res.metrics.forEach(function (m) {
      $("metrics").innerHTML += '<div class="card stat"><div class="l">' + m[0] + '</div><div class="n">' + m[1] + "</div></div>";
    });
    res.images.forEach(function (img) {
      $("imgs").innerHTML += '<div class="card"><img src="data:image/png;base64,' + img + '"></div>';
    });
    summary(state.model);
  }
}
