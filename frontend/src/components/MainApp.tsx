import { useState } from "react";
import Navbar from "./navbar";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface ShortenResponse {
	shortCode: string;
	shortUrl: string;
	originalUrl: string;
	expiresIn: number | null;
	rateLimitRemaining: number;
}

interface StatsResponse {
	shortCode: string;
	originalUrl: string;
	clicks: number;
}

export default function MainApp() {
	// ================== States ==================
	const [url, setUrl] = useState("");
	const [expiresIn, setExpiresIn] = useState("");
	const [shortenResult, setShortenResult] = useState<ShortenResponse | null>(
		null
	);
	const [shortenError, setShortenError] = useState("");
	const [shortenLoading, setShortenLoading] = useState(false);
	const [copied, setCopied] = useState(false);

	// Buat stats
	const [statsCode, setStatsCode] = useState("");
	const [statsResult, setStatsResult] = useState<StatsResponse | null>(null);
	const [statsError, setStatsError] = useState("");
	const [statsLoading, setStatsLoading] = useState(false);
	const [queryTime, setQueryTime] = useState("0");

	// ================== Handlers API ==================

	// POST /shorten and update states
	const handleShorten = async (e: React.FormEvent) => {
		e.preventDefault();
		setShortenError("");
		setShortenResult(null);
		setShortenLoading(true);

		try {
			const body: { url: string; expiresIn?: number } = { url };
			if (expiresIn) body.expiresIn = parseInt(expiresIn);

			const response = await fetch(`${API_BASE}/api/shorten`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to shorten URL");
			}

			setShortenResult(data);
			setUrl("");
			setExpiresIn("");
		} catch (error) {
			setShortenError(error instanceof Error ? error.message : "Unknown error");
		} finally {
			setShortenLoading(false);
		}
	};

	const handleCopy = () => {
		if (shortenResult) {
			navigator.clipboard.writeText(shortenResult.shortUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	// ================== Stats Handler API ==================
	// GET /stats/:code
	const handleStats = async () => {
		if (!statsCode.trim()) return;

		setStatsError("");
		setStatsResult(null);
		setStatsLoading(true);

		try {
			const start = performance.now();
			const response = await fetch(`${API_BASE}/api/stats/${statsCode.trim()}`);
			const elapsed = (performance.now() - start).toFixed(2);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Short URL not found");
			}

			setStatsResult(data);
			setQueryTime(elapsed);
		} catch (error) {
			setStatsError(error instanceof Error ? error.message : "Unknown error");
		} finally {
			setStatsLoading(false);
		}
	};

	return (
		<div className="bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-100 min-h-screen">
			<Navbar />

			<div className="max-w-3xl mx-auto px-6 py-12 ">
				{/* ================== SHORTEN FORM ================== */}
				<div className="bg-white rounded-3xl  border-2 border-gray-200 p-8 mb-8 hover:shadow-md transition-shadow duration-300">
					<form onSubmit={handleShorten} className="space-y-5">
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Destination URL
							</label>
							<input
								type="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://urlpanjangbanget.com"
								required
								disabled={shortenLoading}
								className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Time to Live (optional)
							</label>
							<input
								type="number"
								value={expiresIn}
								onChange={(e) => setExpiresIn(e.target.value)}
								placeholder="3600 (seconds)"
								min="1"
								disabled={shortenLoading}
								className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
							/>
							<p className="text-xs text-gray-500 mt-2">
								Auto-expires - Redis TTL
							</p>
						</div>

						<button
							type="submit"
							disabled={shortenLoading}
							className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-600 hover:to-indigo-700 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg"
						>
							{shortenLoading ? (
								<span className="flex items-center justify-center gap-2">
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									Processing...
								</span>
							) : (
								"Generate Short URL"
							)}
						</button>
					</form>

					{/* ================== SHORTEN RESULT ================== */}
					{shortenResult && (
						<div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
							{/* URL Section */}
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1 min-w-0">
									<p className="text-sm text-gray-600 mb-2">Short URL</p>
									<a
										href={shortenResult.shortUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-lg font-mono text-blue-600 hover:text-blue-700 hover:underline break-all"
									>
										{shortenResult.shortUrl}
									</a>
								</div>

								<button
									onClick={handleCopy}
									className={`px-4 py-2 rounded-lg font-medium transition-colors ${
										copied
											? "bg-indigo-500 text-white"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									}`}
								>
									{copied ? "Copied!" : "Copy"}
								</button>
							</div>

							{/* Stats */}
							<div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
								<div>
									<p className="text-sm text-gray-600 mb-1">Short Code</p>
									<p className="text-2xl font-mono font-semibold text-gray-900">
										{shortenResult.shortCode}
									</p>
								</div>

								<div>
									<p className="text-sm text-gray-600 mb-1">
										Requests Left (Rate Limit)
									</p>
									<p className="text-2xl font-semibold text-gray-900">
										{shortenResult.rateLimitRemaining}/10
									</p>
								</div>
							</div>
						</div>
					)}

					{shortenError && (
						<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-sm text-red-700">{shortenError}</p>
						</div>
					)}
				</div>

				{/* ================== STATS VIEWER ================== */}
				<div className="bg-white rounded-3xl border-2 border-gray-200 p-8 hover:shadow-md transition-shadow duration-300">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-bold text-gray-900">Analytics</h2>
						<span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
							Intentionally decoupled from URL Creation and made for
							fetch-testing
						</span>
					</div>

					<div className="flex gap-3">
						<input
							type="text"
							value={statsCode}
							onChange={(e) => setStatsCode(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleStats();
								}
							}}
							placeholder="Enter short code"
							disabled={statsLoading}
							className="flex-1 px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
						/>
						<button
							type="button"
							onClick={handleStats}
							disabled={statsLoading || !statsCode.trim()}
							className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg"
						>
							{statsLoading ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
							) : (
								"Fetch"
							)}
						</button>
					</div>

					{statsResult && (
						<div className="mt-6 animate-fadeIn">
							<div className="p-6 bg-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
									<div>
										<p className="text-sm font-semibold text-gray-700 mb-2">
											Destination
										</p>
										<a
											href={statsResult.originalUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-indigo-600 hover:text-indigo-700 hover:underline break-all font-medium transition-colors"
										>
											{statsResult.originalUrl}
										</a>
									</div>
									<div>
										<p className="text-sm font-semibold text-gray-700 mb-2">
											Total Visits
										</p>
										<p className="text-5xl font-bold text-gray-900 tabular-nums">
											{statsResult.clicks}
										</p>
									</div>
								</div>

								{/* ================== REDIS PERFORMANCE ================== */}
								<div className="pt-6 border-t border-indigo-200  flex flex-col">
									<div className="bg-emerald-50 rounded-lg p-4 border border-green-200">
										<p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
											Redis Fetch Time
										</p>
										<p className="text-3xl font-bold text-green-600 tabular-nums">
											{queryTime}ms
										</p>
									</div>
								</div>
							</div>
						</div>
					)}

					{statsError && (
						<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
							<p className="text-sm font-medium text-red-700">{statsError}</p>
						</div>
					)}
				</div>
			</div>

			<style>{`
			@keyframes fadeIn {
				from {
					opacity: 0;
					transform: translateY(-10px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}
			.animate-fadeIn {
				animation: fadeIn 0.3s ease-out;
			}
		`}</style>
		</div>
	);
}
