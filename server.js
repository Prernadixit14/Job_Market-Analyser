const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

/* =========================
   🔥 JOB DATABASE
========================= */
const jobs = [
  {
    title: "Data Analyst",
    company: "TCS",
    location: "Delhi",
    skills: ["python", "sql", "excel"],
    salary: 500000
  },
  {
    title: "ML Engineer",
    company: "Infosys",
    location: "Bangalore",
    skills: ["python", "machine learning", "deep learning"],
    salary: 1200000
  },
  {
    title: "Frontend Developer",
    company: "HCL",
    location: "Noida",
    skills: ["html", "css", "javascript"],
    salary: 550000
  },
  {
    title: "HR Manager",
    company: "Deloitte",
    location: "Mumbai",
    skills: ["communication", "management", "recruitment"],
    salary: 600000
  },
  {
    title: "Technical Trainer",
    company: "NIIT",
    location: "Delhi",
    skills: ["python", "teaching", "communication"],
    salary: 400000
  }
];

/* =========================
   🔥 CAREER PATH MAP
========================= */
const careerPath = {
  "data analyst": "Senior Analyst → Data Scientist",
  "ml engineer": "Senior ML Engineer → AI Architect",
  "frontend developer": "Senior Developer → Tech Lead",
  "hr manager": "Senior HR → HR Director",
  "technical trainer": "Senior Trainer → Program Head"
};

/* =========================
   🔥 SKILL SYNONYMS
========================= */
const skillMap = {
  ml: "machine learning",
  js: "javascript",
  py: "python"
};

/* =========================
   🔥 NORMALIZE SKILLS
========================= */
function normalizeSkills(text) {
  return text
    .toLowerCase()
    .split(/,|\s+/)
    .map(s => skillMap[s.trim()] || s.trim())
    .filter(Boolean);
}

/* =========================
   🔥 DEMAND CALCULATION
========================= */
function getDemand() {
  const demand = {};

  jobs.forEach(job => {
    job.skills.forEach(skill => {
      demand[skill] = (demand[skill] || 0) + 1;
    });
  });

  return demand;
}

/* =========================
   🔥 MATCHING LOGIC
========================= */
function getRecommendations(userText) {
  const userSkills = normalizeSkills(userText);

  let results = jobs.map(job => {
    const matched = job.skills.filter(skill =>
      userSkills.includes(skill.toLowerCase())
    );

    const score = Math.round((matched.length / job.skills.length) * 100);

    const missingSkills = job.skills.filter(
      skill => !userSkills.includes(skill.toLowerCase())
    );

    return {
      ...job,
      score,
      missingSkills,
      careerPath: careerPath[job.title.toLowerCase()] || "Growth available"
    };
  });

  return results.sort((a, b) => b.score - a.score);
}

/* =========================
   🔥 API: SKILL INPUT
========================= */
app.post("/recommend", (req, res) => {
  const { skills } = req.body;

  const results = getRecommendations(skills || "");

  res.json({
    jobs: results,
    demand: getDemand()
  });
});

/* =========================
   🔥 API: RESUME UPLOAD
========================= */
app.post("/resume", upload.single("resume"), async (req, res) => {
  try {
    const filePath = req.file.path;
    let text = "";

    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(fs.readFileSync(filePath));
      text = data.text;
    } else {
      text = fs.readFileSync(filePath, "utf-8");
    }

    const results = getRecommendations(text);

    fs.unlinkSync(filePath); // delete uploaded file

    res.json({
      jobs: results,
      demand: getDemand()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Resume processing failed" });
  }
});

/* =========================
   🚀 SERVER START
========================= */
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});