const express = require("express");
const cors = require("cors");

// Controllers
const { insertActivity } = require("./controllers/ActivitiesController");
const { insertPerson, insertMember, getPersons, getSPs } = require("./controllers/PersonsController");
const { getMembers, getActivities, insertActivityPresence } = require("./controllers/ActivityPresenceController");
const { getActivityStates } = require("./controllers/ActivityStateController");
const { getSPActivityStates } = require("./controllers/SPActivityController");
const { getMemberStates } = require("./controllers/MemberStateController");
const { getMemberWithPersonsReport } = require("./controllers/MemberWithPersonsController");
const { getAllPresences, getPresenceBalance, insertActivityPayment } = require("./controllers/ActivityPaymentController");
const { getConstant, updateConstant } = require("./controllers/ConstantController");
const { getPaymentAmounts, getActivitySituation, getPersonPaymentSummary, refreshPaymentViews } = require("./controllers/ActivitySGController"); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post("/api/activities", insertActivity);
app.post("/api/person", insertPerson);
app.post("/api/member", insertMember);
app.get("/api/members", getMembers);
app.get("/api/persons", getPersons);
app.get("/api/activities", getActivities);
app.post("/api/activity-presence", insertActivityPresence);
app.get("/api/sp", getSPs);
app.post("/api/activity-payment", insertActivityPayment);
app.get("/api/activity-states", getActivityStates);
app.get("/api/sp-activity-states", getSPActivityStates);
app.get("/api/member-states", getMemberStates);
app.get("/api/member-persons-report", getMemberWithPersonsReport);
app.get("/api/presences", getAllPresences);
app.get("/api/presence-balance", getPresenceBalance);
app.get("/api/parametre-remise", getConstant);
app.post("/api/parametre-remise", updateConstant);
// za
app.get('/api/payments', getPaymentAmounts);
app.get('/api/activities/situation', getActivitySituation); 
app.get('/api/payments/summary', getPersonPaymentSummary);
app.post('/api/payments/refresh', refreshPaymentViews);
// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});