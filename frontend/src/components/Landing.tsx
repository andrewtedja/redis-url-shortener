import { useNavigate } from "react-router-dom";

export default function Landing() {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-indigo-100 flex items-center justify-center p-6">
			<div className="text-center space-y-10 max-w-2xl">
				{/* ================== TITLE ================== */}
				<div className="space-y-6 animate-fadeInUp">
					<h1 className="text-3xl md:text-4xl font-normal text-gray-900 tracking-wide">
						Shortify
					</h1>
					<h2 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
						Shorten your{" "}
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">
							URL
						</span>
					</h2>
					<p className="text-2xl md:text-2xl text-gray-600 font-medium">
						Long URLs? Let's make them short.
					</p>
				</div>

				<button
					onClick={() => navigate("/app")}
					className="mt-12 px-14 py-5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl font-bold text-xl shadow-lg transition-all duration-300 ease-out transform-gpu hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:from-indigo-600 hover:to-indigo-700 active:scale-95 active:translate-y-0"
				>
					Get Started
				</button>
			</div>
		</div>
	);
}
