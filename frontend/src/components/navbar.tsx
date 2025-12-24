export default function Navbar() {
	return (
		<nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
			<div className="max-w-5xl mx-auto px-6 py-5">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-gray-900 tracking-tight">
							Shorten.
						</h1>
					</div>
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
						<span className="text-xs font-medium text-gray-600">
							Try shortening URLs and test it!
						</span>
					</div>
				</div>
			</div>
		</nav>
	);
}
