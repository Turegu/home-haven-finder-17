import { Navigate } from "react-router-dom";

// Company login is now merged into the agent login page
const CompanyLoginPage = () => {
  return <Navigate to="/agent/login" replace />;
};

export default CompanyLoginPage;
