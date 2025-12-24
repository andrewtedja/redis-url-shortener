export default function NotFound() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-100 flex items-center justify-center p-6">
			<div className="text-center space-y-8 max-w-md">
				<div className="space-y-4">
					<h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">
						404
					</h1>
					<h2 className="text-2xl md:text-3xl font-bold text-gray-900">
						Page Not Found
					</h2>
				</div>
				<a
					href="/"
					className="inline-block px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-indigo-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg"
				>
					Back to Home
				</a>
			</div>
		</div>
	);
}
