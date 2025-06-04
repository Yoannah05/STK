import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import MemberForm from "./MemberForm";
import PersonForm from "./PersonForm";
import ActivityForm from "./ActivityForm";
import ActivityPresenceForm from "./ActivityPresenceForm";
import ActivityPaymentForm from "./ActivityPaymentForm";
import ActivityStates from "./ActivityStates";
import SPActivityStates from "./SPActivityStates";
import MemberStates from "./MemberStates";
import MemberWithPersonsReport from "./MemberWithPersonsReport";
import ParametreRemise from "./ParametreRemise";
import ActivitySituation from './ActivitySG';
import "./Navbar.css"; // Import the CSS file


function App() {
  return (
    <Router>
      <div className="navbar-container">
        <h2 className="navbar-header">Navigation</h2>
        <div className="nav-links">
          <Link className="nav-link" to="/member-form">Member Form</Link>
          <Link className="nav-link" to="/person-form">Person Form</Link>
          <Link className="nav-link" to="/activity-form">Activity Form</Link>
          <Link className="nav-link" to="/activity-presence-form">Presence Form</Link>
          <Link className="nav-link" to="/activity-payment-form">Payment Form</Link>
          <Link className="nav-link" to="/activity-states">Activity States</Link>
          <Link className="nav-link" to="/sp-activity-states">SP Activity States</Link>
          <Link className="nav-link" to="/member-states">Member States</Link>
          <Link className="nav-link" to="/member-persons-report">Member & Persons Report</Link>
          <Link className="nav-link" to="/parametre-remise">Parametre Remise</Link>
          <Link className="nav-link" to="/activities-situation">Activity SG</Link>
          
        </div>
      </div>

      <div className="main-content">
        <Routes>
          <Route path="/" element={<ActivityForm />} />
          <Route path="/member-form" element={<MemberForm />} />
          <Route path="/person-form" element={<PersonForm />} />
          <Route path="/activity-form" element={<ActivityForm />} />
          <Route path="/activity-presence-form" element={<ActivityPresenceForm />} />
          <Route path="/activity-payment-form" element={<ActivityPaymentForm />} />
          <Route path="/activity-states" element={<ActivityStates />} />
          <Route path="/sp-activity-states" element={<SPActivityStates />} />
          <Route path="/member-states" element={<MemberStates />} />
          <Route path="/member-persons-report" element={<MemberWithPersonsReport />} />
          <Route path="/parametre-remise" element={<ParametreRemise />} />
          <Route path="/activities-situation" element={<ActivitySituation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;