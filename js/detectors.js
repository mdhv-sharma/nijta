/*
 * Nijta: detectors.js
 * --------------------
 * Finds personal data inside chat messages.
 * No machine learning here: only patterns (regular expressions),
 * checksums (Verhoeff for Aadhaar, Luhn for cards) and context words.
 *
 * Every finding looks like:
 *   { type, category, label, value, start, end, confidence, owner, relation }
 *   - start/end: position of the match inside the message text
 *   - confidence: 0..1 (how sure we are)
 *   - owner: "self" (your data), "other" (someone else's) or "unknown"
 */
(function (root) {
  "use strict";

  // ---------------------------------------------------------------------
  // 1. CHECKSUMS
  // ---------------------------------------------------------------------

  // Verhoeff algorithm. The table D is the multiplication table of the
  // dihedral group D5 (the 10 symmetries of a pentagon).
  var VD = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]];
  // Permutation table: how each digit is "shuffled" depending on its position.
  var VP = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]];
  // Inverse of each element in D5.
  var VINV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

  function verhoeffValid(num) {
    var c = 0, digits = String(num).replace(/\D/g, "").split("").reverse();
    for (var i = 0; i < digits.length; i++) c = VD[c][VP[i % 8][+digits[i]]];
    return c === 0;
  }

  // Computes the check digit to append (used to make demo data).
  function verhoeffDigit(num) {
    var c = 0, digits = String(num).replace(/\D/g, "").split("").reverse();
    for (var i = 0; i < digits.length; i++) c = VD[c][VP[(i + 1) % 8][+digits[i]]];
    return VINV[c];
  }

  // Luhn algorithm: used by debit/credit card numbers.
  function luhnValid(num) {
    var digits = String(num).replace(/\D/g, ""), sum = 0, dbl = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var d = +digits[i];
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return digits.length >= 12 && sum % 10 === 0;
  }

  // ---------------------------------------------------------------------
  // 2. WHO DOES THE DATA BELONG TO?
  // ---------------------------------------------------------------------

  // Words that suggest the data belongs to someone else (English + Hinglish).
  var RELATIONS = [
    ["mother", "mom|mummy|mumma|mother|maa|mata ?ji|ammi"],
    ["father", "dad|daddy|papa|father|pitaji|abbu"],
    ["brother", "brother|bhaiya|elder bhai|chhota bhai|mera bhai|my bhai"],
    ["sister", "sister|didi|behen"],
    ["spouse", "wife|husband|patni|pati"],
    ["child", "son|daughter|beta|beti"],
    ["relative", "uncle|aunty|aunt|chacha|chachi|mama|mami|nana|nani|dada|dadi|cousin|grandfather|grandmother|grandma|grandpa"],
    ["friend", "friend|dost|roommate|room ?mate|classmate|batchmate"],
    ["partner", "girlfriend|boyfriend|gf|bf|fiance|fiancee"],
    ["colleague", "colleague|boss|manager|teammate|client|landlord|tenant"],
    ["someone else", "his|her|their|he|she|uska|uski|unka|unki"]
  ];
  var SELF_RE = /\b(my|mine|i|i'm|i am|me|myself|mera|meri|mere|mujhe|apna|apni)\b/gi;

  function whoseData(text, start, end) {
    // "my address is..." / "I live at..." -> clearly about the writer.
    var head = text.slice(start, Math.min(end || start, start + 12)).toLowerCase();
    if (/^(my |i |i'm |i am )/.test(head)) return { owner: "self", relation: null };
    // Look at the 60 characters before the match.
    var before = text.slice(Math.max(0, start - 60), start).toLowerCase();
    // For "my address is ..." the clue is inside the match itself.
    var selfZone = before + " " + text.slice(start, Math.min(end || start, start + 20)).toLowerCase();
    var bestRel = null, bestPos = -1;
    for (var i = 0; i < RELATIONS.length; i++) {
      var re = new RegExp("\\b(" + RELATIONS[i][1] + ")\\b", "g"), m;
      while ((m = re.exec(before))) {
        if (m.index > bestPos) { bestPos = m.index; bestRel = RELATIONS[i][0]; }
      }
    }
    // A specific relation ("my mom's") beats "someone else" (his/her).
    if (bestRel) {
      var specific = null, specificPos = -1;
      for (var j = 0; j < RELATIONS.length - 1; j++) {
        var re2 = new RegExp("\\b(" + RELATIONS[j][1] + ")\\b", "g"), m2;
        while ((m2 = re2.exec(before))) if (m2.index > specificPos) { specificPos = m2.index; specific = RELATIONS[j][0]; }
      }
      if (specific) return { owner: "other", relation: specific };
      return { owner: "other", relation: bestRel };
    }
    SELF_RE.lastIndex = 0;
    if (SELF_RE.test(selfZone)) return { owner: "self", relation: null };
    return { owner: "unknown", relation: null };
  }

  function hasContext(text, start, end, wordsRe, windowSize) {
    var w = windowSize || 50;
    var around = text.slice(Math.max(0, start - w), Math.min(text.length, end + 20)).toLowerCase();
    return wordsRe.test(around);
  }

  // ---------------------------------------------------------------------
  // 3. THE RULES
  // ---------------------------------------------------------------------
  // Each rule: id, label, category, weight (how risky), regex, and an
  // optional check(match, text) that returns a confidence (0 = reject).

  var UPI_HANDLES = "okaxis|oksbi|okhdfcbank|okicici|ybl|ibl|axl|paytm|ptyes|ptsbi|pthdfc|ptaxis|apl|yapl|upi|" +
    "waicici|wahdfcbank|waaxis|wasbi|axisbank|icici|hdfcbank|sbi|kotak|kmbl|indus|federal|fbl|idfcbank|idfc|" +
    "boi|barodampay|unionbank|cnrb|pnb|aubank|rbl|yesbank|freecharge|jupiteraxis|fam|slice|axisb|naviaxis|superyes|timecosmos|amazon|abfspay|ikwik|airtel|jio";

  var STATE_RE = /^(AN|AP|AR|AS|BR|CH|CG|DD|DL|GA|GJ|HR|HP|JK|JH|KA|KL|LA|LD|MP|MH|MN|ML|MZ|NL|OD|OR|PY|PB|RJ|SK|TN|TS|TR|UP|UK|UA|WB)$/;

  // Known places (states, UTs, big cities, J&K districts). Lowercase match.
  var PLACES_RE = new RegExp("\\b(" + [
    "india", "bharat", "jammu", "kashmir", "j&k", "jk", "srinagar", "katra", "udhampur", "kathua", "reasi", "samba", "anantnag",
    "baramulla", "poonch", "rajouri", "doda", "kishtwar", "ramban", "pulwama", "kupwara", "ganderbal", "budgam", "shopian",
    "kulgam", "bandipora", "leh", "ladakh", "kargil", "punjab", "himachal", "haryana", "delhi", "new delhi", "noida",
    "gurgaon", "gurugram", "ghaziabad", "faridabad", "chandigarh", "mohali", "ludhiana", "amritsar", "jalandhar", "pathankot",
    "shimla", "dharamshala", "dehradun", "uttarakhand", "uttar pradesh", "lucknow", "kanpur", "varanasi", "agra", "prayagraj",
    "allahabad", "meerut", "bihar", "patna", "jharkhand", "ranchi", "west bengal", "kolkata", "odisha", "bhubaneswar",
    "assam", "guwahati", "sikkim", "gangtok", "rajasthan", "jaipur", "jodhpur", "udaipur", "kota", "gujarat", "ahmedabad",
    "surat", "vadodara", "rajkot", "maharashtra", "mumbai", "pune", "nagpur", "nashik", "thane", "goa", "madhya pradesh",
    "bhopal", "indore", "gwalior", "jabalpur", "chhattisgarh", "raipur", "karnataka", "bangalore", "bengaluru", "mysore",
    "mysuru", "mangalore", "kerala", "kochi", "trivandrum", "thiruvananthapuram", "tamil nadu", "chennai", "coimbatore",
    "madurai", "telangana", "hyderabad", "andhra", "vijayawada", "visakhapatnam", "vizag", "tirupati", "puducherry",
    "nepal", "dubai", "usa", "uk", "canada", "london", "pakistan", "bangladesh"
  ].join("|") + ")\\b", "i");
  var NOT_NAME_RE = /^(the|a|an|my|your|this|that|it|python|java|code|claude|chatgpt|gemini|not|very|so|just|also|going|trying|working|student|undergraduate|confused|here|done|good|fine|ok|okay|sorry)$/i;
  var NOT_PLACE_RE = /^(the|a|an|my|our|home|work|office|college|school|hostel|scratch|here|there|now|today|tomorrow|yesterday|starting|start|beginning|zero|abroad|outside|background|family|class|batch|team|department|branch|cse|it|ece|mnc|bca|btech|mba|india's)$/i;

  function ibanValid(v) {
    var s = v.replace(/\s/g, "").toUpperCase();
    if (s.length < 15 || s.length > 34) return false;
    s = s.slice(4) + s.slice(0, 4);
    var rem = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i), n = c >= 65 ? String(c - 55) : s[i];
      for (var j = 0; j < n.length; j++) rem = (rem * 10 + +n[j]) % 97;
    }
    return rem === 1;
  }
  var PLACEHOLDER_RE = /^(your|my|xxx+|x{3,}|<|\$\{|\{\{|process\.|os\.|none|null|true|false|undefined|example|placeholder|changeme$|\*{3,}|\.{3}|enter|insert|paste|todo|string|here)/i;
  var CODE_RE = /\b(def|import|function|const|let|var|print|return|elif|while|public|class|#include|console\.log|scanf|printf|cout|cin|SELECT|INSERT)\b|[{};]\s*$/m;

  var RULES = [
    {
      id: "seed", label: "Crypto recovery phrase", category: "secret", weight: 12,
      re: /\b(?:seed phrase|recovery phrase|mnemonic|secret phrase|backup phrase)\b\s*(?:is|:|=)?\s*((?:[a-z]{3,8}\s+){11,23}[a-z]{3,8})\b/gi,
      check: function () { return 0.9; }
    },
    {
      id: "social", label: "Social profile link", category: "identity", weight: 2,
      re: /\b(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/|instagram\.com\/|facebook\.com\/|twitter\.com\/|x\.com\/|t\.me\/|snapchat\.com\/add\/|github\.com\/)@?[A-Za-z0-9_.\-]{3,40}/gi,
      check: function (m) {
        if (/\/(?:login|signup|explore|about|settings|features|pricing|home|share|p|reel|search|topics|orgs)$/i.test(m)) return 0;
        return /github\.com/i.test(m) ? 0.6 : 0.85;
      }
    },
    {
      id: "handle", label: "Username / handle", category: "identity", weight: 2,
      re: /\b(?:insta(?:gram)?|snap(?:chat)?|telegram|twitter|discord|linkedin|github|username|user ?name|user id|login id|handle)\s*(?:id|handle|username|account)?\s*(?:is|:|=|-)\s*@?([A-Za-z0-9_.]{3,30})\b/gi,
      check: function (val, text, s, e, m) {
        if (/^(the|not|my|your|and|for|input|required|invalid|wrong|same|there|here|null|none|admin|user|test|example)$/i.test(m[1]) || CODE_RE.test(text)) return 0;
        return 0.75;
      }
    },
    {
      id: "othername", label: "Name of someone you know", category: "identity", weight: 2,
      re: /\b(?:[Mm]y|[Mm]era|[Mm]eri)\s+(?:best |close |elder |younger |little |old )?(?:friend|brother|sister|mother|mom|mum|father|dad|wife|husband|girlfriend|boyfriend|fiance|fiancee|cousin|roommate|teacher|professor|boss|manager|uncle|aunt|aunty|son|daughter|classmate|colleague|neighbou?r|landlord|doctor|ex|crush|bhai|dost)(?:'s name is| is called| named| called|,)?\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\b/g,
      check: function (val, text, s, e, m) {
        return /^(And|But|Has|Had|Was|Is|Are|Said|Told|Who|Wants|Also|Just|Will|Can|Did|Does|The|This|That|From|Lives|Works|Sir|Mam|Maam|Not|Got|Gave|Asked|Called|Sent|Needs|Too|Then)$/.test(m[1].split(" ")[0]) ? 0 : 0.7;
      }
    },
    {
      id: "institution", label: "Your college / workplace", category: "identity", weight: 2,
      re: /\b(?:[Ii] work (?:at|for|in)|[Ii] am working (?:at|in|for)|[Ii]'m working (?:at|in|for)|[Ii] joined|[Mm]y company is|[Ii] am employed (?:at|by)|[Ii] intern(?:ed)? at|[Ii] study (?:at|in)|[Mm]y school is)\s+((?:the )?[A-Z][A-Za-z0-9&.]+(?:\s+[A-Z][A-Za-z0-9&.]+){0,3})/g,
      check: function () { return 0.75; }
    },
    {
      id: "institution", label: "Your college / workplace", category: "identity", weight: 2,
      re: /\b[A-Z][a-z]+(?: [A-Z][a-z]+){0,2} (?:Public School|School|Vidyalaya|Academy|Polytechnic|Convent)\b|\b(?:KV|DAV|DPS|JNV|Kendriya Vidyalaya|Army Public School)\b(?: [A-Z][a-z]+)?/g,
      check: function (val, text, s, e) {
        var around = text.slice(Math.max(0, s - 90), Math.min(text.length, e + 40)).toLowerCase();
        return /\b(i am|i'm|i study|i studied|student|my school|class \d|passed|10th|12th|schooling|alumni)\b/.test(around) ? 0.75 : 0;
      }
    },
    {
      id: "grades", label: "Marks / rank", category: "identity", weight: 1,
      re: /\b(?:cgpa|sgpa|gpa|percentage|percentile|jee rank|neet rank|gate score|gate rank|air|rank|backlogs?)\s*(?:is|was|:|=|of)?\s*\d{1,6}(?:\.\d+)?\s*%?|\b\d{1,2}(?:\.\d+)?\s*(?:cgpa|sgpa)\b|\b\d{2}(?:\.\d+)?\s*%\s*in\s*(?:10th|12th|class|boards?)\b/gi,
      check: function (m, text, s, e) {
        return /\b(my|i|i'm|i've|mera|meri|mere|got|scored)\b/i.test(text.slice(Math.max(0, s - 50), e + 10)) ? 0.65 : 0;
      }
    },
    {
      id: "ip", label: "IP address", category: "contact", weight: 2,
      re: /(?<![\d.])(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)(?![\d.])/g,
      check: function (m, text, s, e) {
        if (/^(127\.|0\.|255\.|192\.168\.|10\.|169\.254\.)/.test(m)) return 0;        // local addresses are not private data
        return hasContext(text, s, e, /\bip\b|server|ssh|host|address|vps|droplet|ec2|public/) ? 0.8 : 0;
      }
    },
    {
      id: "gps", label: "GPS location", category: "location", weight: 4,
      re: /(?<![\d.])-?\d{1,2}\.\d{4,8},\s*-?\d{1,3}\.\d{4,8}(?![\d.])/g,
      check: function () { return 0.8; }
    },
    {
      id: "imei", label: "Phone IMEI", category: "id", weight: 4,
      re: /(?<!\d)\d{15}(?!\d)/g,
      check: function (m, text, s, e) { return hasContext(text, s, e, /imei/) && luhnValid(m) ? 0.9 : 0; }
    },
    {
      id: "money", label: "Salary / loan / debt amount", category: "money", weight: 3,
      re: /\b(?:cibil|credit score|account balance|bank balance|balance|savings|net worth|pocket money|in-?hand)\b[^.\n\d]{0,25}(?:₹|rs\.?|inr)?\s?\d[\d,]{2,}(?:\.\d+)?\s?(?:lakh|lakhs|lac|k|crore|cr)?\b/gi,
      check: function (m, text, s, e) { return /\b(my|i|mera|meri|mere|our|papa|dad|father)\b/i.test(text.slice(Math.max(0, s - 40), e)) ? 0.75 : 0; }
    },
    {
      id: "shortnum", label: "Unrecognised number with a label", category: "possible", weight: 0.5,
      // "form no 458213", "code: 77120" : short labelled numbers Nijta has no rule for.
      re: /\b(?:no\.?|number|num|id|code|ref|reference|#)\s*(?:is|:|=|-)?\s*#?(\d(?:[ -]?\d){4,7})\b/gi,
      check: function (m, text, s, e) {
        if (CODE_RE.test(text) || hasContext(text, s, e, /pin ?code|question|page|chapter|step|error|line|version|problem|leetcode/, 40)) return 0;
        return 0.4;
      }
    },
    {
      id: "aadhaar", label: "Aadhaar number", category: "id", weight: 6,
      // Masked Aadhaar: XXXX XXXX 1234
      re: /(?<![\w*])[Xx*]{4}[ -]?[Xx*]{4}[ -]?\d{4}(?!\d)/g,
      check: function (m, text, s, e) {
        return hasContext(text, s, e, /(aadhaa?r|aadhar|adhar|uid|आधार)/, 80) ? { confidence: 0.65, note: "Masked Aadhaar: only the last 4 digits are visible." } : 0;
      }
    },
    {
      id: "uan", label: "PF / UAN number", category: "id", weight: 5,
      re: /(?<!\d)\d{12}(?!\d)/g,
      check: function (m, text, s, e) { return hasContext(text, s, e, /\buan\b|\bepf\b|pf (?:no|number|account)|provident fund/) ? 0.85 : 0; }
    },
    {
      id: "abha", label: "ABHA health ID", category: "id", weight: 7,
      re: /(?<!\d)\d{2}-\d{4}-\d{4}-\d{4}(?!\d)/g,
      check: function (m, text, s, e) { return hasContext(text, s, e, /abha|health id|ayushman/) ? 0.9 : 0.5; }
    },
    {
      id: "gstin", label: "GSTIN", category: "id", weight: 4,
      re: /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g,
      check: function () { return 0.9; }
    },
    {
      id: "ssn", label: "Social Security number (US)", category: "id", weight: 10,
      re: /(?<![\d-])(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}(?![\d-])/g,
      check: function (m, text, s, e) { return hasContext(text, s, e, /\bssn\b|social security/) ? 0.95 : 0.5; }
    },
    {
      id: "iban", label: "IBAN (bank account)", category: "money", weight: 8,
      re: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?\b/g,
      check: function (m) { return ibanValid(m) ? 0.95 : 0; }          // mod-97 checksum
    },
    {
      id: "crypto", label: "Crypto wallet address", category: "money", weight: 4,
      re: /\b(?:0x[a-fA-F0-9]{40}|bc1[a-z0-9]{25,59})\b/g,
      check: function () { return 0.9; }
    },
    {
      id: "pin", label: "PIN / passcode", category: "secret", weight: 9,
      re: /\b(?:upi pin|atm pin|card pin|mpin|m-pin|pin|passcode|lock code|unlock code|security code)\b\s*(?:is|was|:|=|-|hai)\s*\d{4,8}\b/gi,
      check: function (m, text, s, e) {
        if (/\d{6}$/.test(m) && /^pin\b/i.test(m) && hasContext(text, s, e, /address|postal|post office|district|city|area|pin ?code/, 60)) return 0;  // postal PIN code
        return 0.85;
      }
    },
    {
      id: "secretvar", label: "Secret in code / config", category: "secret", weight: 11,
      // .env / config lines:  DB_PASSWORD=...,  "apiKey": "...",  client_secret = '...'
      re: /\b[A-Za-z0-9_]*(?:PASSWORD|PASSWD|SECRET|TOKEN|API_?KEY|APIKEY|ACCESS_?KEY|PRIVATE_?KEY|apiKey|api_key|secret_key|access_token|auth_token|client_secret|db_password)[A-Za-z0-9_]*["']?\s*[=:]\s*["'`]?([^\s"'`,;]{8,120})/g,
      check: function (val, text, s, e, m) {
        var v = m[1];
        if (PLACEHOLDER_RE.test(v) || /[()\[\]{}<>]/.test(v) || /^[A-Za-z_]+(\.[A-Za-z_]+)+$/.test(v)) return 0;   // placeholders and code
        if (!/\d/.test(v) && v.length < 16) return 0;
        return 0.9;
      }
    },
    {
      id: "connstr", label: "Login link with password", category: "secret", weight: 12,
      re: /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqps?|ftp|sftp|https?):\/\/[^\s:@\/]+:([^\s@\/]{3,})@[^\s"'`]+/g,
      check: function (val, text, s, e, m) { return PLACEHOLDER_RE.test(m[1]) || /^(password|pass|pwd)$/i.test(m[1]) ? 0 : 0.95; }
    },
    {
      id: "genericid", label: "Other ID / reference number", category: "id", weight: 3,
      // Catch-all for labelled numbers Nijta has no special rule for.
      re: /\b(?:roll|enrol?lment|registration|reg\.?|employee|emp|student|customer|consumer|application|policy|membership|member|ration card|admit card|library card|pnr|folio|loan account|insurance|identity|id card|form|challan|receipt|transaction|txn|utr|complaint|ticket|token|seat|hall ticket|application form|abc id|apaar|samagra|kisan|ayushman|esic|cin|tan|udyam)\s*(?:no\.?|number|num|id|#|code)?\s*(?:is|:|=|-|hai)?\s*#?([A-Za-z0-9][A-Za-z0-9\/\-]{4,24})\b/gi,
      check: function (val, text, s, e, m) { return (m[1].match(/\d/g) || []).length >= 4 ? 0.7 : 0; }
    },
    {
      id: "age", label: "Your age", category: "identity", weight: 1,
      re: /\b(?:i am|i'm|im|my age is|age\s*:|meri umar)\s*(\d{1,2})\s*(years? old|yrs? old|yr old|y\/o|yo\b|saal)?/gi,
      check: function (val, text, s, e, m) {
        var n = +m[1];
        if (n < 10 || n > 99) return 0;
        return m[2] || /age|umar/i.test(val) ? 0.7 : 0;
      }
    },
    {
      id: "longnum", label: "Unrecognised long number", category: "possible", weight: 0.5,
      // Safety net: any long number no other rule recognised. Shown as "Possible".
      re: /(?<![\d.,\/:-])\d(?:[ -]?\d){8,19}(?![\d.,\/:-])/g,
      check: function (m, text, s, e) {
        if (CODE_RE.test(text)) return 0;
        if (hasContext(text, s, e, /population|rupees|\brs\b|₹|\$|km\b|bytes|views|subscribers|followers|crore|lakh|million|billion|seed|timestamp|epoch|score|marks|rank|order|invoice|tracking|isbn|doi/, 40)) return 0;
        return 0.35;
      }
    },
    {
      id: "aadhaar", label: "Aadhaar number", category: "id", weight: 10,
      re: /(?<!\d[ .-]?)[2-9]\d{3}[ .-]?\d{4}[ .-]?\d{4}(?![ .-]?\d)/g,
      check: function (m, text, s, e) {
        var ctx = hasContext(text, s, e, /(aadhaa?r|aadhar|adhar|aadhaar|uid|uidai|आधार)/);
        if (!verhoeffValid(m)) {
          // Checksum failed. If the user called it Aadhaar, it is still sensitive (maybe a typo).
          return ctx ? { confidence: 0.7, note: "Labelled as Aadhaar, but the check digit doesn't match (maybe a typo)." } : 0;
        }
        var formatted = /\d{4}[ -]\d{4}[ -]\d{4}/.test(m);
        if (ctx) return 0.97;
        if (formatted) return 0.8;
        return 0.55;                                    // valid checksum but no clue around it
      }
    },
    {
      id: "vid", label: "Aadhaar Virtual ID", category: "id", weight: 8,
      re: /(?<![\d-])\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}(?![\d-])/g,
      check: function (m, text, s, e) { return hasContext(text, s, e, /\bvid\b|virtual id/) ? 0.9 : 0; }
    },
    {
      id: "pan", label: "PAN card", category: "id", weight: 8,
      // 4th letter = holder type (P = person, C = company, H = HUF, ...)
      re: /\b[A-Za-z]{3}[PCHFATBLJGpchfatbljg][A-Za-z]\d{4}[A-Za-z]\b/g,
      check: function (m, text, s, e) {
        if (!/[A-Z]/.test(m)) return hasContext(text, s, e, /\bpan\b/) ? 0.85 : 0;
        return hasContext(text, s, e, /\bpan\b|permanent account|income tax|itr/) ? 0.97 : 0.8;
      }
    },
    {
      id: "passport", label: "Passport number", category: "id", weight: 9,
      re: /\b[A-PR-WYa-pr-wy][1-9]\d ?\d{4}[1-9]\b/g,
      check: function (m, text, s, e) {
        return hasContext(text, s, e, /passport|पासपोर्ट/) ? 0.9 : 0;
      }
    },
    {
      id: "voter", label: "Voter ID (EPIC)", category: "id", weight: 7,
      re: /\b[A-Za-z]{3}\d{7}\b/g,
      check: function (m, text, s, e) {
        return hasContext(text, s, e, /voter|epic|election card|मतदाता/) ? 0.9 : 0;
      }
    },
    {
      id: "dl", label: "Driving licence", category: "id", weight: 7,
      // New format: JK02 20190012345 / JK-0220190012345 / JK02/2019/0012345
      re: /\b[A-Za-z]{2}[ -]?\d{2}[ -\/]?(?:(?:19|20)\d{2}[ -\/]?\d{5,7}|\d{9,11})\b/g,
      check: function (m, text, s, e) {
        var ctx = hasContext(text, s, e, /licen[cs]e|\bdl\b|driving|लाइसेंस/);
        if (ctx) return 0.92;
        // Without the word "licence", the first two letters must be a real state code in capitals.
        return STATE_RE.test(m.slice(0, 2)) ? 0.55 : 0;
      }
    },
    {
      id: "dl", label: "Driving licence", category: "id", weight: 7,
      // Any other format, when clearly labelled: "my DL no is ...", "licence number: ..."
      re: /\b(?:dl|d\.l\.|driving licen[cs]e|licen[cs]e)(?: no\.?| number| num)?\s*(?:is|:|-|=|hai)?\s*[A-Za-z0-9][A-Za-z0-9&\-\/ ]{6,20}\d\b/gi,
      check: function (m) {
        var tail = m.replace(/^.*?(?:no\.?|number|num|is|:|-|=|hai|licen[cs]e|dl)\s*/i, "");
        return (tail.match(/\d/g) || []).length >= 6 ? 0.85 : 0;
      }
    },
    {
      id: "vehicle", label: "Vehicle number", category: "id", weight: 2,
      re: /\b(AN|AP|AR|AS|BR|CH|CG|DD|DL|GA|GJ|HR|HP|JK|JH|KA|KL|LA|LD|MP|MH|MN|ML|MZ|NL|OD|OR|PY|PB|RJ|SK|TN|TS|TR|UP|UK|UA|WB)[ -]?\d{1,2}[ -]?[A-Z]{1,3}[ -]?\d{4}\b/g,
      check: function () { return 0.85; }
    },
    {
      id: "card", label: "Debit/credit card", category: "money", weight: 10,
      re: /(?<!\d)(?:[2-6]\d{3}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}(?:[ -]?\d{1,3})?|3[47]\d{2}[ -]?\d{6}[ -]?\d{5})(?!\d)/g,
      check: function (m, text, s, e) {
        if (!luhnValid(m)) return 0;
        return hasContext(text, s, e, /card|debit|credit|visa|master|rupay|cvv|expiry/) ? 0.97 : 0.75;
      }
    },
    {
      id: "cvv", label: "Card CVV / PIN", category: "secret", weight: 10,
      re: /\b(?:cvv|cvc|atm pin|card pin|upi pin|mpin)\b[^\d\n]{0,15}\d{3,6}\b/gi,
      check: function () { return 0.9; }
    },
    {
      id: "ifsc", label: "Bank IFSC code", category: "money", weight: 2,
      re: /\b[A-Za-z]{4}0[A-Za-z0-9]{6}\b/g,
      check: function (m, text, s, e) {
        if (!/^[A-Z]{4}0/.test(m)) return hasContext(text, s, e, /ifsc/) ? 0.8 : 0;
        return hasContext(text, s, e, /ifsc|bank|branch|account|neft|imps|rtgs/) ? 0.95 : 0.7;
      }
    },
    {
      id: "bank", label: "Bank account number", category: "money", weight: 8,
      re: /(?<![\d-])\d{9,18}(?![\d-])/g,
      check: function (m, text, s, e) {
        // Only counts when the words around it talk about a bank account.
        return hasContext(text, s, e, /account|a\/c|acc(?:ount)? ?no|acct|khata|bank|saving|current a|neft|imps/, 45) ? 0.85 : 0;
      }
    },
    {
      id: "upi", label: "UPI ID", category: "money", weight: 4,
      re: new RegExp("\\b[a-zA-Z0-9.\\-_]{2,64}@(?:" + UPI_HANDLES + ")\\b(?!\\.[a-z])", "gi"),
      check: function () { return 0.92; }
    },
    {
      id: "money", label: "Salary / loan / debt amount", category: "money", weight: 3,
      re: /\b(?:salary|ctc|stipend|income|loan|emi|debt|owe|udhaar|udhar|karz|karza|credit card bill|overdraft)\b[^.\n]{0,40}?(?:₹|rs\.?|inr)?\s?\d[\d,]*(?:\.\d+)?\s?(?:lakh|lakhs|lac|lpa|k|crore|cr|thousand|hazaar)?\b/gi,
      check: function (m) { return /\d{3,}|\d+\s?(lakh|lac|lpa|k|crore|cr|thousand|hazaar)/i.test(m) ? 0.8 : 0; }
    },
    {
      id: "phone", label: "Phone number", category: "contact", weight: 3,
      // Indian mobile in any common style: 9876543210, 98765 43210, 987-654-3210, +91 98765-43210, (91) 9876543210
      re: /(?<![\d+])(?:(?:\+|00)91[\s.-]?|\(\+?91\)[\s.-]?|0)?[6-9]\d(?:[\s.-]?\d){8}(?![\s.-]?\d)/g,
      check: function (m, text, s, e) {
        var ctx = hasContext(text, s, e, /phone|mobile|number|call|whatsapp|contact|no\.|cell|ph\b|mob\b|फोन|नंबर/);
        var seps = (m.replace(/^(?:\+|00)?\(?\+?91\)?[\s.-]?/, "").match(/[\s.-]/g) || []).length;
        if (seps > 3) return ctx ? 0.8 : 0;                    // oddly spaced digits need a clue
        return ctx ? 0.95 : 0.8;
      }
    },
    {
      id: "phone", label: "Phone number", category: "contact", weight: 3,
      // International numbers: +1 415 555 0132, +44 20 7946 0958
      re: /(?<![\w+])\+(?!91)[1-9]\d{0,2}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,4}(?!\d)/g,
      check: function (m) { var n = m.replace(/\D/g, "").length; return n >= 8 && n <= 15 ? 0.8 : 0; }
    },
    {
      id: "email", label: "Email address", category: "contact", weight: 2,
      re: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
      check: function (m) { return /@(example|test)\./i.test(m) ? 0 : 0.95; }
    },
    {
      id: "email", label: "Email address", category: "contact", weight: 2,
      // Written to dodge filters: "aarav dot sharma at gmail dot com", "aarav[at]gmail[dot]com"
      re: /\b[A-Za-z0-9._%+\-]+(?:\s*(?:\[dot\]|\(dot\)|\bdot\b)\s*[A-Za-z0-9_%+\-]+)*\s*(?:\[at\]|\(at\)|\sat\s|@)\s*(?:gmail|yahoo|outlook|hotmail|icloud|proton(?:mail)?|rediffmail|live|smvdu|[a-z0-9\-]+)\s*(?:\[dot\]|\(dot\)|\sdot\s)\s*(?:com|in|co\.in|org|net|edu|ac\.in|ac)\b/gi,
      check: function (m, text, s, e) {
        if (/@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/.test(m)) return 0;          // a normal email: the other rule handles it
        var parts = m.split(/\s*(?:\[at\]|\(at\)|\sat\s|@)\s*/i), local = (parts[0] || "").trim(), dom = (parts[1] || "").toLowerCase();
        // "look at google dot com" is a website, not an email.
        if (/^(look|meet|me|you|is|it|this|that|be|us|him|her|them|here|there|site|website|page|go|visit|check|open|available|found|log|login|sign|signed|live|work|works|working|arrive|reach|stay|staying|study|studying)$/i.test(local)) return 0;
        var provider = /^(gmail|googlemail|yahoo|ymail|outlook|hotmail|icloud|proton|protonmail|rediffmail|live|zoho|smvdu)\b/.test(dom) || /\b(ac|edu)\b/.test(dom);
        if (!provider && !/\[at\]|\(at\)/i.test(m)) return 0;
        return hasContext(text, s, e, /mail|email|e-mail|id|contact|write to|reach/i, 60) ? 0.85 : 0.65;
      }
    },
    {
      id: "dob", label: "Date of birth", category: "contact", weight: 4,
      re: /\b(?:dob|d\.o\.b|date of birth|born on|birthday is|janam ?din)\b[^\d\n]{0,12}\d{1,2}[\/\-. ](?:\d{1,2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\/\-. ]\d{2,4}/gi,
      check: function () { return 0.9; }
    },
    {
      id: "address", label: "Home / hostel address", category: "location", weight: 5,
      re: /\b(?:my (?:home |hostel |permanent |current |office |delivery |)address(?: is|:)?|address\s*:|i live at|i stay at|i'm staying at|house no\.?|h\.? ?no\.?|flat no\.?|room no\.?|plot no\.?)[^\n]{3,100}/gi,
      check: function (m) {
        if (/^(my .*address|address\s*:)/i.test(m)) return 0.85;          // explicitly called an address
        // Otherwise it must look like a real address, not just a city.
        var markers = /\d|house|flat|plot|street|road|lane|gali|mohalla|sector|block|ward|village|vpo|tehsil|near|opp|colony|nagar|apartment|floor|hostel|pin/i;
        return markers.test(m) ? 0.8 : 0;
      }
    },
    {
      id: "name", label: "Your full name", category: "identity", weight: 3,
      re: /\b(?:[Mm]y [Nn]ame is|[Mm]y [Nn]ame's|[Nn]ame\s*:|NAME\s*:|[Ff]ull [Nn]ame\s*:|[Mm]era naam|[Tt]his is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}|[a-z]+\s+[a-z]+(?=\s+(?:hai|and|i|from)\b))/g,
      check: function (val, text, s, e, m) {
        var nm = (m[1] || "").trim(), first = nm.split(/\s+/)[0];
        if (NOT_NAME_RE.test(first)) return 0;
        if (/^this is/i.test(val) && nm.split(/\s+/).length < 2) return 0;  // "this is Python" is not a name
        return nm.split(/\s+/).length >= 2 ? 0.85 : 0.65;
      }
    },
    {
      id: "institution", label: "Your college / workplace", category: "identity", weight: 2,
      re: /\b(?:SMVDU|Shri Mata Vaishno Devi University|(?:IIT|NIT|IIIT|IIM|AIIMS)[ -]?[A-Z][a-z]+|University of [A-Z][a-z]+|[A-Z][a-z]+ University|[A-Z][a-z]+ (?:College|Institute of Technology)(?: of [A-Z][a-z]+)?)\b/g,
      check: function (val, text, s, e) {
        // Only counts when the text is about YOU being there.
        var around = text.slice(Math.max(0, s - 90), Math.min(text.length, e + 40)).toLowerCase();
        return /\b(i am|i'm|im|i study|studying|student|undergraduate|b\.?tech|semester|my college|my university|i work|working at|intern|employee|enrolled|alumni|graduat|completed|attending|joined)\b/.test(around) ? 0.8 : 0;
      }
    },
    {
      id: "city", label: "City / area you live in", category: "location", weight: 1,
      re: /\b(?:i live (?:in|at)|i stay (?:in|at)|i'm from|i am from|im from|i'm staying in|i reside in|i'm based in|based in|location\s*:|city\s*:|hometown(?: is|\s*:)|native place(?: is|\s*:)|mai .{0,10}rehta hu|main .{0,10}rehta hoon)\s*([^\n.!?]{2,40}?)(?=\s+(?:and|but|so|i|i'm|want|how|what|can|please|which|where|for|to|with|aur|par)\b|[\n.,!?]|$)/gi,
      check: function (val, text, s, e, m) {
        var place = (m[1] || "").trim();
        // Must actually be a place: a known Indian place, or a Capitalised name that isn't a normal word.
        if (PLACES_RE.test(place)) return 0.75;
        var first = place.split(/\s+/)[0];
        if (/^[A-Z]/.test(first) && !NOT_PLACE_RE.test(first) && !/ing$/i.test(first)) return 0.6;
        return 0;
      }
    },
    {
      id: "pincode", label: "PIN code", category: "location", weight: 1,
      re: /\b[1-8]\d{2} ?\d{3}\b/g,
      check: function (m, text, s, e) { return hasContext(text, s, e, /pin ?code|pin\b|postal|address|zip/) ? 0.85 : 0; }
    },
    {
      id: "password", label: "Password", category: "secret", weight: 12,
      re: /\b(wi-?fi password|password|passwd|pwd|passcode|pass ?code|pass|पासवर्ड)\b\s*(is|was|==|=|:|-|hai)?\s*(["'`]?)([^\s"'`,]{4,64})/gi,
      check: function (val, text, s, e, m) {
        var key = m[1].toLowerCase(), sep = m[2], quoted = !!m[3], v = m[4];
        if (/^(is|was|hai|the|my|for|and|reset|change|manager|word|it|of|kya|nahi|bhool|forgot|kaise|to|me|mera|meri|field|box|protected|strength|policy|hash|hashing|length|input|entered|required|incorrect|wrong|match|matches)$/i.test(v)) return 0;
        // "pass the exam" is not a password; "pass: X" or "my pass is X@12" is.
        if (key === "pass" && !(sep && /[:=]/.test(sep)) && !(/\bmy\s+pass\s*$/i.test(text.slice(Math.max(0, s - 4), s + 7).replace(/\s+is.*$/i, "")) || /\bmy\s+pass\s+is\b/i.test(text.slice(Math.max(0, s - 4), e))) ) return 0;
        if (key === "pass" && !/[:=]/.test(sep || "") && !/[\d\W_]/.test(v)) return 0;
        // Program code: password = input(...), password == confirm, self.password, etc.
        if (/[()\[\]{};<>]/.test(v) || /^(input|getpass|os\.|request|self\.|this\.|process\.|env|none|null|true|false|undefined|str|int|hash|bcrypt|md5|sha|confirm|user|form|data|args|req)/i.test(v)) return 0;
        var looksLikeCode = /\b(def|import|function|const|let|var|print|return|elif|else:|while|public|class|#include|console\.log|scanf|printf|cout|cin)\b|[{};]\s*$/m.test(text);
        if (looksLikeCode) {
          if (!quoted) return 0;                      // a variable, not a real password
          return /\d|[^A-Za-z]/.test(v) && v.length >= 6 ? { confidence: 0.6, note: "Looks like a password written inside code." } : 0;
        }
        if (!sep && !/[\d\W_]/.test(v)) return 0;
        return /[\d\W_]/.test(v) ? 0.9 : 0.65;
      }
    },
    {
      id: "otp", label: "OTP", category: "secret", weight: 6,
      re: /\b(?:otp|one[- ]time password|verification code)\b[^\d\n]{0,15}\d{4,8}\b/gi,
      check: function () { return 0.85; }
    },
    {
      id: "apikey", label: "API key / secret token", category: "secret", weight: 12,
      re: /\b(?:sk-(?:proj-|ant-)?[A-Za-z0-9_\-]{20,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AIza[0-9A-Za-z_\-]{30,}|xox[bpas]-[A-Za-z0-9\-]{10,}|eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{5,})/g,
      check: function () { return 0.97; }
    },
    {
      id: "privatekey", label: "Private key", category: "secret", weight: 12,
      re: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/g,
      check: function () { return 0.99; }
    }
  ];

  var CATEGORIES = {
    id: { label: "ID documents", icon: "🪪" },
    money: { label: "Money & bank", icon: "💳" },
    contact: { label: "Contact details", icon: "📞" },
    location: { label: "Location", icon: "📍" },
    secret: { label: "Passwords & keys", icon: "🔑" },
    identity: { label: "Who you are", icon: "🧑" },
    sensitive: { label: "Sensitive topics", icon: "💬" },
    possible: { label: "Possible (please check)", icon: "❓" }
  };

  // Rules that win when two rules match the same characters.
  var PRIORITY = { seed: 0.1, social: 9.5, handle: 20.5, othername: 21.5, grades: 22.5, ip: 14.5, gps: 14.6, imei: 2.8, shortnum: 98, privatekey: 0, crypto: 0.5, apikey: 1, connstr: 1.1, secretvar: 1.2, vid: 1.5, uan: 1.8, aadhaar: 2, card: 3, iban: 3.2, ssn: 3.4,
    abha: 3.6, cvv: 4, pin: 4.5, gstin: 4.8, pan: 5, passport: 6, voter: 7, dl: 8,
    upi: 9, email: 10, ifsc: 11, password: 12, otp: 13, dob: 14, phone: 15, bank: 16, vehicle: 17, genericid: 17.5,
    money: 18, address: 19, city: 19.5, pincode: 20, name: 21, institution: 22, age: 23, longnum: 99 };

  // ---------------------------------------------------------------------
  // 4. SCAN ONE MESSAGE
  // ---------------------------------------------------------------------
  var MIN_CONFIDENCE = 0.3;   // below 0.5 is shown as "Possible"

  // Hindi (Devanagari) and other Indian-script digits become 0-9 before matching.
  // Each digit is one character either way, so positions in the original text stay the same.
  var DIGIT_BLOCKS = [0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66, 0x0660, 0x06F0];
  function asciiDigits(t) {
    return t.replace(/[\u0660-\u0669\u06F0-\u06F9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F]/g, function (ch) {
      var c = ch.charCodeAt(0);
      for (var i = 0; i < DIGIT_BLOCKS.length; i++) if (c >= DIGIT_BLOCKS[i] && c <= DIGIT_BLOCKS[i] + 9) return String(c - DIGIT_BLOCKS[i]);
      return ch;
    });
  }

  function scanText(text) {
    if (!text || typeof text !== "string") return [];
    text = asciiDigits(text);
    var raw = [];
    for (var r = 0; r < RULES.length; r++) {
      var rule = RULES[r];
      rule.re.lastIndex = 0;
      var m;
      while ((m = rule.re.exec(text))) {
        var val = m[0], s = m.index, e = s + val.length;
        if (!val) { rule.re.lastIndex++; continue; }
        var res = rule.check ? rule.check(val, text, s, e, m) : 0.8;
        var conf = typeof res === "object" && res ? res.confidence : res, note = typeof res === "object" && res ? res.note : null;
        if (conf >= MIN_CONFIDENCE) raw.push({ rule: rule, value: val.trim(), start: s, end: e, confidence: conf, note: note });
      }
    }
    // File IDs and other machine codes (like 09332030-810a-414a-8de5-26509f037ed4) are not personal data.
    // Any number found inside such a code, or glued to letters, is dropped.
    var machine = [], mre = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\b(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{16,}\b|https?:\/\/[^\s"'<>]+/gi, mm;
    while ((mm = mre.exec(text))) machine.push([mm.index, mm.index + mm[0].length]);
    var NUMERIC = { phone: 1, aadhaar: 1, vid: 1, uan: 1, abha: 1, card: 1, bank: 1, longnum: 1, shortnum: 1, pincode: 1, ssn: 1, imei: 1, genericid: 1, dl: 1, voter: 1, passport: 1, gps: 1 };
    raw = raw.filter(function (f) {
      if (!NUMERIC[f.rule.id]) return true;
      for (var q = 0; q < machine.length; q++) if (f.start < machine[q][1] && machine[q][0] < f.end) return false;
      var before = text[f.start - 1] || "", after = text[f.end] || "";
      if (f.rule.id === "phone" || f.rule.id === "longnum" || f.rule.id === "shortnum") {
        if (/[A-Za-z]/.test(after) || /[A-Za-z_]/.test(before) || /^-[0-9a-f]/i.test(text.slice(f.end, f.end + 2)) || /[0-9a-f]-$/i.test(text.slice(Math.max(0, f.start - 2), f.start))) return false;
      }
      return true;
    });

    // Remove overlaps: keep the higher-priority rule.
    raw.sort(function (a, b) { return PRIORITY[a.rule.id] - PRIORITY[b.rule.id] || b.confidence - a.confidence; });
    var kept = [];
    for (var i = 0; i < raw.length; i++) {
      var f = raw[i], clash = false;
      for (var k = 0; k < kept.length; k++) {
        if (f.start < kept[k].end && kept[k].start < f.end) { clash = true; break; }
      }
      if (!clash) kept.push(f);
    }
    kept.sort(function (a, b) { return a.start - b.start; });
    return kept.map(function (f) {
      var who = whoseData(text, f.start, f.end);
      if (f.rule.id === "othername") { who = whoseData(text, f.end, f.end); if (who.owner !== "other") who = { owner: "other", relation: "someone else" }; }
      return {
        type: f.rule.id, label: f.rule.label, category: f.rule.category, weight: f.rule.weight,
        value: f.value, start: f.start, end: f.end, confidence: f.confidence, note: f.note || null,
        owner: who.owner, relation: who.relation
      };
    });
  }

  // ---------------------------------------------------------------------
  // 5. MASKING (for "Mask everything" mode and safe display)
  // ---------------------------------------------------------------------
  function mask(f) {
    if (f.category === "sensitive" || /^t_/.test(f.type)) return "•••••• (hidden)";
    var v = f.value, digits = v.replace(/\D/g, "");
    switch (f.type) {
      case "aadhaar": return "XXXX XXXX " + digits.slice(-4);
      case "doc_image": return v;
      case "seed": return v.replace(/((?:is|:|=)?\s*)[a-z]{3,8}(?:\s+[a-z]{3,8}){10,}$/i, "$1•••• •••• ••••");
      case "othername": return v.replace(/\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$/, " ••••••");
      case "social": case "handle": return v.replace(/[A-Za-z0-9_.\-]+$/, "••••••");
      case "ip": return v.replace(/\d+\.\d+$/, "•••.•••");
      case "gps": return "••.••••, ••.••••";
      case "shortnum": case "imei": return v.replace(/\d(?=\d{0,20}$)/g, function (c, i, str) { return i < str.length - 2 ? "•" : c; });
      case "ssn": return "XXX-XX-" + digits.slice(-4);
      case "iban": return v.slice(0, 4) + " •••• •••• " + v.replace(/\s/g, "").slice(-4);
      case "uan": case "abha": case "longnum": return "•••• •••• " + digits.slice(-3);
      case "pin": return v.replace(/\d+$/, "••••");
      case "secretvar": return v.replace(/([=:]\s*["'`]?).*$/, "$1••••••••");
      case "connstr": return v.replace(/:\/\/([^:]+):[^@]+@.*/, "://$1:••••••@••••");
      case "vid": return "XXXX XXXX XXXX " + digits.slice(-4);
      case "dl": return v.replace(/\d(?=(?:\D*\d){3})/g, "X");
      case "city": return v.replace(/^(.*?(?:\bin\b|\bat\b|\bfrom\b|:|\bis\b))\s*.*$/i, "$1 ••••");
      case "name": return v.replace(/(is|:|naam|this is)\s+(\S)\S*(.*)$/i, function (x, a, b) { return a + " " + b + "•••• ••••"; });
      case "institution": return v.slice(0, 1) + "••••••";
      case "card": return "XXXX XXXX XXXX " + digits.slice(-4);
      case "phone": return digits.slice(-10, -8) + "XXXXXX" + digits.slice(-2);
      case "email": return v.replace(/^(.).*?(@.*)$/, "$1•••$2");
      case "upi": return v.replace(/^(.).*?(@.*)$/, "$1•••$2");
      case "pan": return v.slice(0, 2).toUpperCase() + "XXXXXX" + v.slice(-2).toUpperCase();
      case "bank": return "XXXXXX" + digits.slice(-4);
      case "password": case "cvv": case "otp":
        return v.replace(/\S+$/, "••••••");
      case "apikey": return v.slice(0, 6) + "••••••••";
      case "privatekey": return "-----BEGIN PRIVATE KEY----- ••••••";
      default:
        return v.length <= 4 ? "••••" : v.slice(0, 2) + "•".repeat(Math.min(8, v.length - 4)) + v.slice(-2);
    }
  }

  // Key used to count each piece of data once even if it appears many times.
  function normalise(f) {
    if (f.type === "institution" && /smvdu|vaishno devi/i.test(f.value)) return "institution:smvdu";
    if (f.type === "dob") return "dob:" + f.value.replace(/^\D+/, "").replace(/[\s.\-]/g, "/").toLowerCase();
    if (f.type === "othername") return "othername:" + f.value.replace(/^.*\s([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/, "$1").toLowerCase();
    if (f.type === "institution") return "institution:" + f.value.replace(/^.*?(?:at|for|in|by|joined|is)\s+(?=[A-Z])/, "").toLowerCase();
    if (f.type === "name") return "name:" + f.value.replace(/^.*?(?:is|:|naam)\s+/i, "").toLowerCase();
    if (f.type === "city") return "city:" + f.value.replace(/^.*?(?:\bin\b|\bat\b|\bfrom\b|:|\bis\b)\s*/i, "").toLowerCase();
    return f.type + ":" + f.value.toLowerCase().replace(/[\s\-+.()]/g, "").replace(/^(91|0091|0)(?=[6-9]\d{9}$)/, "");
  }

  // ---------------------------------------------------------------------
  // 6. EXPOSURE SCORE (0-100)
  // ---------------------------------------------------------------------
  // Each unique item adds its weight; the score grows quickly at first and
  // then slows down (1 - e^(-x/40)), so it never goes above 100.
  function exposureScore(uniqueItems) {
    var total = 0;
    for (var i = 0; i < uniqueItems.length; i++) total += uniqueItems[i].weight * uniqueItems[i].confidence;
    var score = Math.round(100 * (1 - Math.exp(-total / 40)));
    var level = score >= 70 ? "High" : score >= 40 ? "Medium" : score > 0 ? "Low" : "None";
    return { score: score, level: level, raw: total };
  }

  // ---------------------------------------------------------------------
  // 7. "WHY WASN'T THIS FOUND?" helper
  // ---------------------------------------------------------------------
  // Turns "JK02 2019 0012345" into "AA99 9999 9999999" so the pattern can be
  // shared with the team safely (no real digits or letters).
  function shape(token) { return token.replace(/[A-Za-z]/g, "A").replace(/\d/g, "9"); }

  function explain(text) {
    var found = scanText(text), hints = [], shapes = [];
    var covered = function (s, e) { return found.some(function (f) { return s < f.end && f.start < e; }); };
    var re = /[A-Za-z&]*\d[\dA-Za-z&\-\/]*(?: \d[\dA-Za-z\-\/]*)*/g, m;
    while ((m = re.exec(text))) {
      var tok = m[0].trim(), digits = tok.replace(/\D/g, ""), s = m.index, e = s + m[0].length;
      if (digits.length < 4 || covered(s, e)) continue;
      shapes.push(shape(tok));
      if (digits.length === 12 && /^[2-9]/.test(digits) && !verhoeffValid(digits))
        hints.push("A 12-digit number was found, but its Aadhaar check digit doesn't match. Write the word “Aadhaar” next to it, or check for a typo.");
      else if (digits.length === 12 && /^[01]/.test(digits))
        hints.push("A 12-digit number starts with 0 or 1. Real Aadhaar numbers never start with 0 or 1.");
      else if (digits.length >= 13 && digits.length <= 19 && !luhnValid(digits))
        hints.push("A " + digits.length + "-digit number was found, but it fails the card (Luhn) check, so it isn't a valid bank card number.");
      else if (digits.length === 10 && !/^[6-9]/.test(digits))
        hints.push("A 10-digit number starts with " + digits[0] + ". Indian mobile numbers start with 6, 7, 8 or 9.");
      else if (digits.length >= 9)
        hints.push("A long number with the pattern " + shape(tok) + " was not recognised. If it is an ID, share this pattern (not the number) with your team so a rule can be added.");
    }
    if (/licen[cs]e|\bdl\b/i.test(text) && !found.some(function (f) { return f.type === "dl"; }))
      hints.push("You mentioned a licence, but no licence number in a known format was found next to it.");
    if (/aadhaa?r|aadhar|adhar/i.test(text) && !found.some(function (f) { return f.type === "aadhaar" || f.type === "vid"; }) &&
        !/\d{4}[ -]?\d{4}[ -]?\d{4}/.test(text))
      hints.push("You mentioned Aadhaar, but no 12-digit number was found near the word.");
    return { found: found, hints: hints.filter(function (h, i, a) { return a.indexOf(h) === i; }), shapes: shapes };
  }

  var API = {
    scanText: scanText, mask: mask, normalise: normalise, exposureScore: exposureScore,
    verhoeffValid: verhoeffValid, verhoeffDigit: verhoeffDigit, luhnValid: luhnValid,
    whoseData: whoseData, explain: explain, shape: shape, RULES: RULES, CATEGORIES: CATEGORIES
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.NijtaDetect = API;
})(typeof window !== "undefined" ? window : globalThis);
