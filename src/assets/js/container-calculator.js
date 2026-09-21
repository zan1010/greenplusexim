/* Green Plus EXIM — container loading estimate tool. Clearly labelled as an estimate only. */
(function () {
  "use strict";
  var form = document.getElementById("container-calc");
  if (!form) return;

  /* Approx. max payload by container type (general industry figures, not product-specific) */
  var MAX_PAYLOAD_KG = { "20ft": 21000, "40ft": 26000 };

  /* Rough packing-efficiency factor by product density category (estimate only) */
  var DENSITY_FACTOR = {
    "bagged-dense": 0.97, // rice, pulses, sugar, dense grains in bags
    "bagged-light": 0.85, // spices, dehydrated products, light bagged goods
    "fresh-carton": 0.55, // fresh fruit/veg in ventilated cartons — volume-limited, not weight-limited
    "frozen-carton": 0.75, // frozen seafood in master cartons
    "jumbo-bulk": 0.98 // jumbo bags / bulk fertilizer, feed
  };

  var output = document.getElementById("container-calc-result");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var containerType = form.elements["container_type"].value;
    var density = form.elements["density_category"].value;
    var bagWeight = parseFloat(form.elements["bag_weight_kg"].value) || 0;

    var maxPayload = MAX_PAYLOAD_KG[containerType];
    var factor = DENSITY_FACTOR[density];
    var usableKg = maxPayload * factor;
    var bags = bagWeight > 0 ? Math.floor(usableKg / bagWeight) : null;
    var mt = (usableKg / 1000).toFixed(1);

    output.hidden = false;
    output.innerHTML =
      "<strong>Estimated capacity: ~" + mt + " MT</strong> in a " + containerType + " container" +
      (bags ? " (approx. " + bags.toLocaleString() + " bags at " + bagWeight + "kg each)." : ".") +
      "<br><span style='font-size:var(--fs-xs);color:var(--color-ink-muted)'>This is an estimate based on typical packing density — actual loading depends on exact product, packaging and stacking. Confirm with us before booking.</span>";
  });
})();
