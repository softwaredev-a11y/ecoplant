import { BrowserRouter} from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
function App() {
  return (
    <BrowserRouter basename={import.meta.env.PROD ? "/apps/ecoplant/" : "/"}>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App
