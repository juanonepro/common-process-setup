import { CreateFlowV3 } from "@/components/v3/CreateFlowV3";

// V3 starts as a copy of the V2 create-process flow: a self-contained path
// (empty state → create modal → guided walkthrough → dashboard) with no global
// store. V1 and V2 live in the "Process Setup V2" project, untouched.
export default function App() {
  return <CreateFlowV3 />;
}
