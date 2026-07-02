import { createBrowserRouter } from "react-router";
import { EntryPage } from "./components/entry/EntryPage";
import { PatientHome } from "./components/patient/PatientHome";
import { RehabExecution } from "./components/patient/RehabExecution";
import { FamilyDashboard } from "./components/family/FamilyDashboard";
import { DoctorPortal } from "./components/doctor/DoctorPortal";
import { Blueprint } from "./components/blueprint/Blueprint";

export const router = createBrowserRouter([
  { path: "/", Component: EntryPage },
  { path: "/patient", Component: PatientHome },
  { path: "/patient/rehab/:exerciseId", Component: RehabExecution },
  { path: "/family", Component: FamilyDashboard },
  { path: "/doctor", Component: DoctorPortal },
  { path: "/blueprint", Component: Blueprint },
]);
