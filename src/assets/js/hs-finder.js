/* Green Plus EXIM — client-side filter for the HS code finder table */
(function () {
  "use strict";
  var input = document.getElementById("hs-search");
  var rows = document.querySelectorAll("#hs-table tbody tr");
  var empty = document.getElementById("hs-empty");
  if (!input) return;

  input.addEventListener("input", function () {
    var term = input.value.trim().toLowerCase();
    var visible = 0;
    rows.forEach(function (row) {
      var match = row.dataset.search.indexOf(term) !== -1;
      row.hidden = !match;
      if (match) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
  });
})();
