import { BrowserRouter, Routes, Route} from "react-router-dom";
import Landing from "./components/Landing";
import MainApp from "./components/MainApp";
import NotFound from "./components/NotFound";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route path="/app" element={<MainApp />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
