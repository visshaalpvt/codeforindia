const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'src', 'data', 'knowledge');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateDataset() {
  const dataset = [];
  let idCounter = 1;

  const categories = [
    { name: "Autopsy & Postmortem", target: 300 },
    { name: "Toxicology", target: 200 },
    { name: "Digital Forensics", target: 300 },
    { name: "Evidence Handling", target: 200 },
    { name: "Investigation Workflows", target: 300 },
    { name: "Behavioral Analysis", target: 200 },
    { name: "Sensor & Environmental Analysis", target: 200 },
    { name: "Legal & Ethical Forensics", target: 300 }
  ];

  const templates = {
    "Autopsy & Postmortem": [
      { q: "What does [COND] indicate?", a: "[COND] typically indicates [REASON] and helps establish [OUTCOME].", k: ["[COND]", "indicator", "autopsy"] },
      { q: "How is [TECHNIQUE] performed during an autopsy?", a: "[TECHNIQUE] is performed by [STEP1], followed by [STEP2], to assess [TARGET].", k: ["[TECHNIQUE]", "procedure", "examination"] },
      { q: "What is the significance of finding [FINDING] in the [ORGAN]?", a: "Finding [FINDING] in the [ORGAN] suggests [PATHOLOGY], which is often consistent with [CAUSE].", k: ["[FINDING]", "[ORGAN]", "pathology"] }
    ],
    "Toxicology": [
      { q: "What is the detection window for [SUBSTANCE] in blood?", a: "The detection window for [SUBSTANCE] in blood is typically [TIME], depending on [FACTOR].", k: ["[SUBSTANCE]", "blood", "detection window"] },
      { q: "How does [SUBSTANCE] interact with [OTHER_SUBSTANCE]?", a: "When [SUBSTANCE] interacts with [OTHER_SUBSTANCE], it can cause [EFFECT], complicating the toxicological profile.", k: ["[SUBSTANCE]", "interaction", "toxicology"] }
    ],
    "Digital Forensics": [
      { q: "How can you extract metadata from a [FILE_TYPE] file?", a: "Extracting metadata from a [FILE_TYPE] involves using tools like [TOOL] to analyze [ATTRIBUTE].", k: ["metadata", "[FILE_TYPE]", "extraction"] },
      { q: "What does a [NETWORK_EVENT] in the firewall logs suggest?", a: "A [NETWORK_EVENT] often suggests [ATTACK_TYPE] or [ANOMALY], requiring further investigation of [SYSTEM].", k: ["[NETWORK_EVENT]", "firewall", "logs"] }
    ],
    "Evidence Handling": [
      { q: "What is the proper procedure for packaging [EVIDENCE_TYPE]?", a: "[EVIDENCE_TYPE] must be packaged in [CONTAINER_TYPE] to prevent [RISK] and preserve the chain of custody.", k: ["packaging", "[EVIDENCE_TYPE]", "chain of custody"] },
      { q: "How do you avoid contamination when collecting [TRACE_TYPE]?", a: "To avoid contamination, investigators should use [TOOL] and wear [PPE] while collecting [TRACE_TYPE].", k: ["contamination", "[TRACE_TYPE]", "collection"] }
    ],
    "Investigation Workflows": [
      { q: "What is the first step when interviewing a [WITNESS_TYPE]?", a: "The first step is to establish rapport and ensure the [WITNESS_TYPE] feels [STATE], then ask open-ended questions.", k: ["interview", "[WITNESS_TYPE]", "workflow"] },
      { q: "How should a crime scene investigator document a [SCENE_TYPE] scene?", a: "A [SCENE_TYPE] scene should be documented using [METHOD1] and [METHOD2] before any evidence is moved.", k: ["documentation", "[SCENE_TYPE]", "crime scene"] }
    ],
    "Behavioral Analysis": [
      { q: "What behavior pattern is typical of a [OFFENDER_TYPE] offender?", a: "A [OFFENDER_TYPE] offender typically exhibits [BEHAVIOR1] and [BEHAVIOR2] during the commission of a crime.", k: ["behavior", "[OFFENDER_TYPE]", "pattern"] },
      { q: "How does [PSYCH_FACTOR] influence suspect behavior?", a: "[PSYCH_FACTOR] often leads to [REACTION] under stress, which can be observed during interrogation.", k: ["[PSYCH_FACTOR]", "stress", "interrogation"] }
    ],
    "Sensor & Environmental Analysis": [
      { q: "What does a sudden spike in [SENSOR_TYPE] readings indicate?", a: "A spike in [SENSOR_TYPE] usually indicates [EVENT], which correlates with [ENVIRONMENTAL_FACTOR].", k: ["[SENSOR_TYPE]", "spike", "environment"] },
      { q: "How does ambient temperature affect [FORENSIC_PROCESS]?", a: "Ambient temperature affects [FORENSIC_PROCESS] by altering the rate of [CHEMICAL_PROCESS].", k: ["temperature", "[FORENSIC_PROCESS]", "environment"] }
    ],
    "Legal & Ethical Forensics": [
      { q: "Under what conditions is [EVIDENCE_TYPE] admissible in court?", a: "[EVIDENCE_TYPE] is admissible if it satisfies the [LEGAL_STANDARD] standard and the chain of custody is intact.", k: ["admissibility", "[EVIDENCE_TYPE]", "court"] },
      { q: "What are the ethical concerns regarding the use of [TECH_TYPE]?", a: "Using [TECH_TYPE] raises ethical concerns related to [CONCERN1] and [CONCERN2], requiring careful oversight.", k: ["ethics", "[TECH_TYPE]", "oversight"] }
    ]
  };

  const variables = {
    "[COND]": ["fixed lividity", "rigor mortis", "algor mortis", "tardieu spots", "petechial hemorrhaging", "cherry-red skin", "marbling"],
    "[REASON]": ["the passage of several hours since death", "positioning of the body post-mortem", "asphyxiation", "carbon monoxide poisoning", "early decomposition"],
    "[OUTCOME]": ["time of death", "whether the body was moved", "cause of asphyxia", "the primary mechanism of death"],
    "[TECHNIQUE]": ["the Y-incision", "the Virchow method", "the Letulle method", "toxicological screening", "histological sampling"],
    "[STEP1]": ["making an incision from shoulders to sternum", "removing organs one by one", "removing organs en masse", "drawing blood from the femoral vein"],
    "[STEP2]": ["extending the cut to the pubis", "examining the cranial cavity", "sectioning the heart", "preserving samples in formalin"],
    "[TARGET]": ["internal organ trauma", "disease pathology", "cause of death", "toxicological presence"],
    "[FINDING]": ["soot in the airway", "water in the lungs", "petechiae", "hypertrophy", "ischemic damage"],
    "[ORGAN]": ["trachea", "lungs", "conjunctiva", "heart", "liver", "kidneys", "brain"],
    "[PATHOLOGY]": ["smoke inhalation", "drowning", "strangulation", "chronic hypertension", "myocardial infarction"],
    "[CAUSE]": ["fire-related fatalities", "immersion deaths", "asphyxial deaths", "natural cardiovascular disease"],
    "[SUBSTANCE]": ["cocaine", "fentanyl", "ethanol", "cyanide", "arsenic", "benzodiazepines", "methamphetamine"],
    "[TIME]": ["12-24 hours", "2-4 days", "up to 30 days", "several months in hair", "rapidly due to short half-life"],
    "[FACTOR]": ["metabolism rate", "dosage", "frequency of use", "hydration levels", "sample matrix (blood vs urine)"],
    "[OTHER_SUBSTANCE]": ["alcohol", "opiates", "stimulants", "antidepressants"],
    "[EFFECT]": ["synergistic CNS depression", "cardiotoxicity", "respiratory arrest", "metabolic competition"],
    "[FILE_TYPE]": ["JPEG", "PDF", "DOCX", "MP4", "ZIP"],
    "[TOOL]": ["ExifTool", "Autopsy", "EnCase", "Cellebrite", "Wireshark"],
    "[ATTRIBUTE]": ["creation dates", "GPS coordinates", "author information", "modification history", "hidden streams"],
    "[NETWORK_EVENT]": ["port scan", "large outbound data transfer", "repeated failed logins", "unusual protocol usage"],
    "[ATTACK_TYPE]": ["reconnaissance", "data exfiltration", "brute force attack", "malware beaconing"],
    "[ANOMALY]": ["insider threat activity", "misconfiguration", "compromised credentials"],
    "[SYSTEM]": ["the perimeter router", "the active directory server", "the internal database", "the affected endpoint"],
    "[EVIDENCE_TYPE]": ["blood-stained clothing", "firearms", "digital devices", "hair samples", "accelerant evidence", "biological swabs"],
    "[CONTAINER_TYPE]": ["breathable paper bags", "rigid cardboard boxes", "Faraday bags", "bindle paper", "airtight metal cans", "sterile plastic tubes"],
    "[RISK]": ["bacterial degradation", "accidental discharge", "remote wiping", "cross-contamination", "evaporation"],
    "[TRACE_TYPE]": ["gunshot residue", "touch DNA", "fibers", "paint chips", "soil samples"],
    "[PPE]": ["nitrile gloves", "face masks", "Tyvek suits", "hairnets"],
    "[WITNESS_TYPE]": ["cooperative witness", "hostile witness", "traumatized victim", "expert witness", "child witness"],
    "[STATE]": ["safe", "understood", "calm", "respected"],
    "[SCENE_TYPE]": ["homicide", "burglary", "arson", "traffic collision", "cyber incident"],
    "[METHOD1]": ["wide-angle photography", "3D laser scanning", "sketches with measurements", "video walk-throughs"],
    "[METHOD2]": ["close-up photography with scales", "detailed notes", "evidence placarding", "log sheets"],
    "[OFFENDER_TYPE]": ["organized", "disorganized", "serial", "opportunistic", "financial"],
    "[BEHAVIOR1]": ["careful planning", "leaving the weapon at the scene", "stalking the victim", "impulsive actions"],
    "[BEHAVIOR2]": ["bringing their own weapons", "depersonalizing the victim", "taking souvenirs", "fleeing immediately"],
    "[PSYCH_FACTOR]": ["guilt", "narcissism", "paranoia", "psychopathy", "substance withdrawal"],
    "[REACTION]": ["defensive posturing", "grandiosity", "hypervigilance", "lack of empathy", "erratic outbursts"],
    "[SENSOR_TYPE]": ["CO2", "temperature", "motion", "acoustic", "humidity", "volatile organic compounds (VOC)"],
    "[EVENT]": ["human presence", "a fire starting", "forced entry", "a struggle", "decomposition changes"],
    "[ENVIRONMENTAL_FACTOR]": ["HVAC activity", "weather patterns", "time of day", "occupancy levels"],
    "[FORENSIC_PROCESS]": ["algor mortis", "entomological development", "blood drying", "chemical decomposition"],
    "[CHEMICAL_PROCESS]": ["cellular autolysis", "putrefaction", "oxidation", "bacterial growth"],
    "[LEGAL_STANDARD]": ["Daubert", "Frye", "Federal Rules of Evidence", "beyond a reasonable doubt"],
    "[TECH_TYPE]": ["facial recognition", "rapid DNA analysis", "predictive policing algorithms", "cell-site simulators"],
    "[CONCERN1]": ["bias", "privacy violations", "false positives", "lack of transparency"],
    "[CONCERN2]": ["civil liberties", "data security", "unlawful search", "discrimination"]
  };

  function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function resolveTemplate(str) {
    let resolved = str;
    for (const key in variables) {
      if (resolved.includes(key)) {
        // Need to replace all instances, but we'll re-roll randoms for variance if we want, or just simple replace
        // For simplicity, just replace one instance at a time until none left
        while (resolved.includes(key)) {
           resolved = resolved.replace(key, getRandom(variables[key]));
        }
      }
    }
    return resolved;
  }

  const difficulties = ["easy", "medium", "hard"];

  for (const cat of categories) {
    const catTemplates = templates[cat.name] || templates["Autopsy & Postmortem"];
    
    // Generate until we hit target
    for (let i = 0; i < cat.target; i++) {
      const template = getRandom(catTemplates);
      const question = resolveTemplate(template.q);
      const answer = resolveTemplate(template.a);
      
      // resolve keywords
      const resolvedKeywords = template.k.map(kw => resolveTemplate(kw)).map(kw => kw.toLowerCase());

      dataset.push({
        id: idCounter++,
        category: cat.name,
        question: question,
        answer: answer,
        keywords: resolvedKeywords,
        difficulty: getRandom(difficulties),
        source: "AIVENTRA Generated Forensic Dataset"
      });
    }
  }

  return dataset;
}

const dataset = generateDataset();
fs.writeFileSync(path.join(outputDir, 'forensic_qa_dataset.json'), JSON.stringify(dataset, null, 2));
console.log(`Generated forensic_qa_dataset.json with ${dataset.length} records.`);

const manuals = [
  { id: "M1", title: "Standard Autopsy Procedure", content: "The standard autopsy involves an external examination, Y-incision, organ removal (Virchow or Letulle), weighing, sectioning, and sampling for histology and toxicology." },
  { id: "M2", title: "Digital Evidence Handling SOP", content: "Devices must be isolated from networks (Faraday bags), documented, imaged using write-blockers, and hashes verified before analysis." }
];
fs.writeFileSync(path.join(outputDir, 'forensic_manuals.json'), JSON.stringify(manuals, null, 2));

const sops = [
  { id: "S1", title: "Chain of Custody Maintenance", content: "Every transfer of evidence must be logged with date, time, releasing party, receiving party, and purpose of transfer. Seals must remain intact." }
];
fs.writeFileSync(path.join(outputDir, 'investigation_sop.json'), JSON.stringify(sops, null, 2));

const patterns = [
  { id: "P1", title: "Organized vs Disorganized", content: "Organized offenders plan, target victims, and conceal evidence. Disorganized offenders act impulsively, use weapons of opportunity, and leave the scene chaotic." }
];
fs.writeFileSync(path.join(outputDir, 'criminal_patterns.json'), JSON.stringify(patterns, null, 2));

console.log("All knowledge base files generated successfully.");
