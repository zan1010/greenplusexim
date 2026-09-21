/* Maps each region-page slug to the ISO2 codes that belong to it, so region pages can
   aggregate real per-region trade figures from countryTradeIndex.js instead of generic prose. */
module.exports = {
  "middle-east-gcc": ["AE", "SA", "OM", "KW", "QA", "BH", "IQ", "IR", "YE", "JO", "LB"],
  "south-asia": ["BD", "NP", "LK", "BT", "PK", "MV"],
  "southeast-asia": ["MY", "ID", "VN", "TH", "PH", "SG", "MM", "KH", "LA", "BN"],
  "east-asia": ["CN", "JP", "KR", "TW", "HK", "MN"],
  europe: ["NL", "GB", "DE", "IT", "FR", "ES", "BE", "RU", "PT", "NO", "SE", "CH", "PL", "AT", "IE", "DK"],
  africa: ["KE", "EG", "ZA", "NG", "MA", "DZ", "TZ", "ET", "GH", "TN", "UG", "CI", "SN", "DJ"],
  "north-america": ["US", "CA", "MX"],
  "latin-america": ["BR", "AR", "CL", "CO", "PE", "EC", "UY", "PY", "VE", "BO"],
};
